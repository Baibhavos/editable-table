import * as React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EditableTable } from './editable-table'

type Person = Record<string, unknown> & { name: string; age: string }

const columns = ['name', 'age'] as const satisfies readonly (keyof Person & string)[]

const sampleRows: Person[] = [
  { name: 'Ada', age: '36' },
  { name: 'Grace', age: '85' },
]

function getDataRowByName(name: string) {
  const table = screen.getByRole('table')
  const rows = within(table).getAllByRole('row').slice(1)
  const row = rows.find((r) => within(r).queryByText(name))
  expect(row).toBeTruthy()
  return row as HTMLElement
}

describe('EditableTable', () => {
  it('shows a message when there are no columns', () => {
    render(
      <EditableTable<Person>
        allColumns={[]}
        tableData={sampleRows}
        isEditable={false}
      />,
    )
    expect(screen.getByText('No columns available.')).toBeInTheDocument()
  })

  it('shows a message when tableData is null', () => {
    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={null}
        isEditable={false}
      />,
    )
    expect(screen.getByText('No data available.')).toBeInTheDocument()
  })

  it('shows the empty state when there are zero rows', () => {
    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={[]}
        isEditable={false}
      />,
    )
    expect(screen.getByText('No rows to display.')).toBeInTheDocument()
  })

  it('renders read-only cells when isEditable is false', () => {
    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={sampleRows}
        isEditable={false}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Edit row' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Ada').length).toBeGreaterThanOrEqual(1)
    const tbody = screen.getByRole('table').querySelector('tbody')
    expect(tbody).toBeTruthy()
    expect(within(tbody as HTMLElement).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('persists edits after Save and calls onDataChange', async () => {
    const user = userEvent.setup()
    const onDataChange = vi.fn()

    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={sampleRows}
        isEditable
        canAddRow
        onDataChange={onDataChange}
      />,
    )

    const row = getDataRowByName('Ada')
    await user.click(within(row).getByRole('button', { name: 'Edit row' }))

    const input = within(row).getByDisplayValue('Ada')
    await user.clear(input)
    await user.type(input, 'Augusta')
    await user.tab()

    await user.click(within(row).getByRole('button', { name: 'Save row edits' }))

    expect(onDataChange).toHaveBeenCalledTimes(1)
    expect(onDataChange.mock.calls[0][0][0]).toMatchObject({ name: 'Augusta', age: '36' })
  })

  it('discards edits on Cancel', async () => {
    const user = userEvent.setup()
    const onDataChange = vi.fn()

    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={sampleRows}
        isEditable
        onDataChange={onDataChange}
      />,
    )

    const row = getDataRowByName('Ada')
    await user.click(within(row).getByRole('button', { name: 'Edit row' }))

    const input = within(row).getByDisplayValue('Ada')
    await user.clear(input)
    await user.type(input, 'Draft')
    await user.click(within(row).getByRole('button', { name: 'Cancel row edits' }))

    expect(onDataChange).not.toHaveBeenCalled()
    expect(within(row).getByText('Ada')).toBeInTheDocument()
  })

  it('opens a new row in edit mode after Add row', async () => {
    const user = userEvent.setup()
    const onDataChange = vi.fn()

    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={sampleRows}
        isEditable
        canAddRow
        onDataChange={onDataChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add row' }))

    expect(onDataChange).toHaveBeenCalled()
    const table = screen.getByRole('table')
    const bodyRows = within(table)
      .getAllByRole('row')
      .slice(1)
      .filter((r) => r.querySelector('.ert-cell-input'))
    expect(bodyRows.length).toBeGreaterThanOrEqual(1)
    const lastRow = bodyRows[bodyRows.length - 1]
    expect(lastRow.querySelectorAll('.ert-cell-input')).toHaveLength(2)
  })

  it('blocks Save when cellValidation fails', async () => {
    const user = userEvent.setup()
    const onDataChange = vi.fn()

    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={sampleRows}
        isEditable
        onDataChange={onDataChange}
        cellValidation={(_col, value) => (value.trim() === '' ? 'Required' : null)}
      />,
    )

    const row = getDataRowByName('Ada')
    await user.click(within(row).getByRole('button', { name: 'Edit row' }))

    const nameInput = within(row).getByDisplayValue('Ada')
    await user.clear(nameInput)
    await user.tab()

    await user.click(within(row).getByRole('button', { name: 'Save row edits' }))

    expect(onDataChange).not.toHaveBeenCalled()
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows pagination controls when pagination is enabled', async () => {
    const user = userEvent.setup()
    const manyRows: Person[] = Array.from({ length: 12 }, (_, i) => ({
      name: `User ${i}`,
      age: String(20 + i),
    }))

    render(
      <EditableTable<Person>
        allColumns={[...columns]}
        tableData={manyRows}
        isEditable={false}
        pagination
      />,
    )

    expect(await screen.findByRole('navigation', { name: 'Table pagination' })).toBeInTheDocument()

    const next = screen.getByRole('button', { name: 'Next page' })
    expect(next).toBeEnabled()
    await user.click(next)

    const table = screen.getByRole('table')
    expect(within(table).getByText('User 10')).toBeInTheDocument()
  })
})
