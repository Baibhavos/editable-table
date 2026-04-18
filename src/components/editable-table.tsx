import * as React from 'react'
import {
    type CellContext,
    type Column,
    type ColumnDef,
    type HeaderContext,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type Table,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { CaretSortIcon, CheckIcon, Cross2Icon, Pencil1Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'

import { Checkbox } from './ui/checkbox'
import { cn } from '../lib/utils'

import './editable-table.css'

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void
        addRow: () => void
        removeSelectedRows: (selectedRows: number[]) => void
    }
}

/** Built-in color mode for the table chrome. */
export type EditableTableTheme = 'light' | 'dark' | 'system'

/** Validates a single cell after edit; return `null` when valid. */
export type EditableTableCellValidation = (column: string, value: string) => string | null

type ValidationContextValue = {
    cellValidation?: EditableTableCellValidation
    fieldErrors: Readonly<Record<string, string>>
    setFieldError: (rowIndex: number, columnId: string, message: string | null) => void
}

const ValidationContext = React.createContext<ValidationContextValue | null>(null)

type RowEditContextValue = {
    isEditable: boolean
    editingRowIndex: number | null
    beginRowEdit: (rowIndex: number) => void
    cancelRowEdit: () => void
    saveRowEdit: () => void
}

const RowEditContext = React.createContext<RowEditContextValue | null>(null)

function fieldErrorKey(rowIndex: number, columnId: string) {
    return `${rowIndex}::${columnId}`
}

function cloneRow<T extends Record<string, unknown>>(row: T): T {
    return JSON.parse(JSON.stringify(row)) as T
}

/**
 * Props for {@link EditableTable}.
 *
 * @typeParam T - Row shape; keys should align with `allColumns`.
 */
export interface EditableTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
    /** Column keys rendered as editable accessors, in display order. */
    allColumns: readonly (keyof T & string)[]
    /** Current table rows. Pass `null` to show the empty-data message without rendering a grid. */
    tableData: T[] | null
    /** When true, an empty row can be appended via footer controls. */
    canAddRow?: boolean
    /** When true, selected rows can be removed via footer controls. */
    canRemoveRow?: boolean
    /**
     * When true, cells are edited only after **Edit** on that row; **Save** pushes the row to `onDataChange`,
     * **Cancel** discards unsaved changes for that row. When false, data columns are read-only.
     */
    isEditable: boolean
    /** Enables client-side pagination using TanStack's pagination row model. */
    pagination?: boolean
    /** Optional class name applied to the outer wrapper. */
    className?: string
    /** Called when the parent should accept persisted data: after **Save**, and for add/remove row. Not called for each keystroke while a row is being edited. */
    onDataChange?: (updatedData: T[]) => void
    /** Alternating row backgrounds for readability. */
    stripedRows?: boolean
    /** Keeps the header row visible while scrolling inside the scroll container. */
    stickyHeader?: boolean
    /** Max height of the scrollable table body area (for example `"420px"` or `"50vh"`). */
    tableHeight?: string
    /** Message or element shown when `tableData` is an empty array (not when it is `null`). */
    emptyStateMessage?: React.ReactNode
    /** Renders skeleton rows instead of data rows while data is loading. */
    loadingState?: boolean
    /** Validates edited cell text on blur; invalid cells are highlighted and show the message as a native tooltip. */
    cellValidation?: EditableTableCellValidation
    /** Controls light, dark, or system-themed chrome via `data-theme` on the root element. */
    theme?: EditableTableTheme
}

function ReadonlyCell({ value }: { value: unknown }) {
    const text = value === null || value === undefined ? '' : String(value)
    return (
        <span className="ert-cell-readonly" title={text}>
            {text}
        </span>
    )
}

type EditableCellProps<T extends Record<string, unknown>> = {
    initialValue: unknown
    rowIndex: number
    columnId: string
    table: Table<T>
}

function EditableCell<T extends Record<string, unknown>>({
    initialValue,
    rowIndex,
    columnId,
    table,
}: EditableCellProps<T>) {
    const validation = React.useContext(ValidationContext)
    const [value, setValue] = React.useState(() => String(initialValue ?? ''))

    React.useEffect(() => {
        setValue(String(initialValue ?? ''))
    }, [initialValue])

    const errorMessage = validation?.fieldErrors[fieldErrorKey(rowIndex, columnId)] ?? null

    const onBlur = () => {
        const message = validation?.cellValidation?.(columnId, value) ?? null
        validation?.setFieldError(rowIndex, columnId, message)
        table.options.meta?.updateData(rowIndex, columnId, value)
    }

    return (
        <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            title={errorMessage ?? undefined}
            aria-invalid={errorMessage ? true : undefined}
            className={cn('ert-cell-input', errorMessage && 'ert-cell-input--invalid')}
        />
    )
}

function DataCell<T extends Record<string, unknown>>({
    rowIndex,
    columnId,
    getValue,
    table,
}: {
    rowIndex: number
    columnId: string
    getValue: () => unknown
    table: Table<T>
}) {
    const rowEdit = React.useContext(RowEditContext)
    if (!rowEdit?.isEditable) {
        return <ReadonlyCell value={getValue()} />
    }
    const isEditing = rowEdit.editingRowIndex === rowIndex
    if (isEditing) {
        return (
            <EditableCell<T>
                initialValue={getValue()}
                rowIndex={rowIndex}
                columnId={columnId}
                table={table}
            />
        )
    }
    return <ReadonlyCell value={getValue()} />
}

function RowActionCell({ rowIndex }: { rowIndex: number }) {
    const ctx = React.useContext(RowEditContext)
    if (!ctx?.isEditable) return null

    const { editingRowIndex, beginRowEdit, cancelRowEdit, saveRowEdit } = ctx
    const isThis = editingRowIndex === rowIndex
    const locked = editingRowIndex !== null && !isThis

    if (isThis) {
        return (
            <div className="ert-action-group ert-action-group--edit-actions">
                <button
                    type="button"
                    className="ert-btn-compact ert-btn-compact--ghost ert-btn-compact--icon"
                    onClick={cancelRowEdit}
                    aria-label="Cancel row edits"
                >
                    <Cross2Icon width={18} height={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="ert-btn-compact ert-btn-compact--success ert-btn-compact--icon"
                    onClick={saveRowEdit}
                    aria-label="Save row edits"
                >
                    <CheckIcon width={18} height={18} aria-hidden />
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            className="ert-btn-compact ert-btn-compact--icon"
            disabled={locked}
            title={locked ? 'Finish editing another row first' : 'Edit row'}
            aria-label="Edit row"
            onClick={() => beginRowEdit(rowIndex)}
        >
            <Pencil1Icon width={18} height={18} aria-hidden />
        </button>
    )
}

function useSkipper() {
    const shouldSkipRef = React.useRef(true)
    const shouldSkip = shouldSkipRef.current

    const skip = React.useCallback(() => {
        shouldSkipRef.current = false
    }, [])

    React.useEffect(() => {
        shouldSkipRef.current = true
    })

    return [shouldSkip, skip] as const
}

function useEditableTableColumns<T extends Record<string, unknown>>(
    allColumns: readonly (keyof T & string)[],
    isEditable: boolean,
): ColumnDef<T, unknown>[] {
    return React.useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <span className="ert-touch-target">
                        <Checkbox
                            className="h-6 w-6"
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && 'indeterminate')
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </span>
                ),
                cell: ({ row }) => (
                    <span className="ert-touch-target">
                        <Checkbox
                            className="h-6 w-6"
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </span>
                ),
            },
            ...allColumns.map((columnHeader) => ({
                accessorKey: columnHeader,
                header: ({ column }: HeaderContext<T, unknown>) => (
                    <button
                        type="button"
                        className="ert-sort-btn"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {columnHeader}
                        <CaretSortIcon width={16} height={16} />
                    </button>
                ),
                cell: (info: CellContext<T, unknown>) => (
                    <DataCell<T>
                        rowIndex={info.row.index}
                        columnId={info.column.id}
                        getValue={info.getValue}
                        table={info.table}
                    />
                ),
            })),
            ...(isEditable
                ? ([
                      {
                          id: 'actions',
                          header: () => <span className="ert-th-actions">Actions</span>,
                          cell: ({ row }: CellContext<T, unknown>) => <RowActionCell rowIndex={row.index} />,
                      },
                  ] satisfies ColumnDef<T, unknown>[])
                : []),
        ],
        [allColumns, isEditable],
    )
}

function Filter<T extends Record<string, unknown>>({
    column,
    table,
}: {
    column: Column<T, unknown>
    table: Table<T>
}) {
    const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id)

    const columnFilterValue = column.getFilterValue()

    return typeof firstValue === 'number' ? (
        <div className="ert-filter-row">
            <input
                type="number"
                value={(columnFilterValue as [number, number] | undefined)?.[0] ?? ''}
                onChange={(e) =>
                    column.setFilterValue((old: [number, number] | undefined) => [
                        e.target.value,
                        old?.[1],
                    ])
                }
                placeholder="Min"
                className="ert-filter-input"
            />
            <input
                type="number"
                value={(columnFilterValue as [number, number] | undefined)?.[1] ?? ''}
                onChange={(e) =>
                    column.setFilterValue((old: [number, number] | undefined) => [
                        old?.[0],
                        e.target.value,
                    ])
                }
                placeholder="Max"
                className="ert-filter-input"
            />
        </div>
    ) : (
        <input
            type="text"
            value={(columnFilterValue ?? '') as string}
            onChange={(e) => column.setFilterValue(e.target.value)}
            className="ert-filter-input"
        />
    )
}

const PaginationControlsLazy = React.lazy(async () => import('./editable-table-pagination'))

function MobileCardRow<T extends Record<string, unknown>>({
    row,
}: {
    row: ReturnType<Table<T>['getRowModel']>['rows'][number]
}) {
    return (
        <article className="ert-card-row">
            {row.getVisibleCells().map((cell) => {
                const columnId = cell.column.id
                const label =
                    columnId === 'select' ? 'Select' : columnId === 'actions' ? 'Actions' : columnId

                return (
                    <dl key={cell.id} className="ert-field">
                        <dt>{label}</dt>
                        <dd className="ert-cell-wrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
                    </dl>
                )
            })}
        </article>
    )
}

function SkeletonRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
    return (
        <>
            {Array.from({ length: rowCount }).map((_, r) => (
                <tr key={`sk-${r}`} className="ert-skeleton-row">
                    {Array.from({ length: columnCount }).map((__, c) => (
                        <td key={`sk-${r}-${c}`} className="ert-td">
                            <div className="ert-skeleton-bar" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    )
}

/**
 * TanStack-powered editable table with row selection, sorting, optional pagination, and optional add/remove rows.
 *
 * @typeParam T - Row record type; must extend `Record<string, unknown>`.
 */
function EditableTableInner<T extends Record<string, unknown> = Record<string, unknown>>({
    allColumns,
    tableData,
    canAddRow,
    canRemoveRow,
    isEditable,
    pagination,
    className,
    onDataChange,
    stripedRows,
    stickyHeader,
    tableHeight,
    emptyStateMessage = 'No rows to display.',
    loadingState = false,
    cellValidation,
    theme = 'system',
}: EditableTableProps<T>) {
    const columns = useEditableTableColumns<T>(allColumns, isEditable)

    const [data, setData] = React.useState<T[]>(() => tableData ?? [])
    const dataRef = React.useRef(data)
    React.useEffect(() => {
        dataRef.current = data
    }, [data])

    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

    const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(null)
    const editingRowIndexRef = React.useRef<number | null>(null)
    const editingBaselineRef = React.useRef<T | null>(null)

    React.useEffect(() => {
        editingRowIndexRef.current = editingRowIndex
    }, [editingRowIndex])

    React.useLayoutEffect(() => {
        if (editingRowIndex === null) {
            editingBaselineRef.current = null
            return
        }
        const row = dataRef.current[editingRowIndex]
        editingBaselineRef.current = row ? cloneRow(row) : null
    }, [editingRowIndex])

    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

    React.useEffect(() => {
        if (tableData == null) {
            setData([])
            return
        }
        if (editingRowIndex !== null) return
        setData(tableData)
    }, [tableData, editingRowIndex])

    React.useEffect(() => {
        if (loadingState) {
            setEditingRowIndex(null)
            editingBaselineRef.current = null
        }
    }, [loadingState])

    const clearFieldErrorsForRow = React.useCallback((rowIndex: number) => {
        setFieldErrors((prev) => {
            const prefix = `${rowIndex}::`
            const next = { ...prev }
            let changed = false
            for (const k of Object.keys(next)) {
                if (k.startsWith(prefix)) {
                    delete next[k]
                    changed = true
                }
            }
            return changed ? next : prev
        })
    }, [])

    const setFieldError = React.useCallback((rowIndex: number, columnId: string, message: string | null) => {
        setFieldErrors((prev) => {
            const key = fieldErrorKey(rowIndex, columnId)
            const next = { ...prev }
            if (message) next[key] = message
            else delete next[key]
            return next
        })
    }, [])

    const validationValue = React.useMemo<ValidationContextValue>(
        () => ({
            cellValidation,
            fieldErrors,
            setFieldError,
        }),
        [cellValidation, fieldErrors, setFieldError],
    )

    const updateData = React.useCallback(
        (rowIndex: number, columnId: string, value: unknown) => {
            skipAutoResetPageIndex()
            setData((prev) => {
                const newData = prev.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...row,
                            [columnId]: value,
                        }
                    }
                    return row
                })
                const defer =
                    editingRowIndexRef.current !== null && editingRowIndexRef.current === rowIndex
                if (!defer) {
                    onDataChange?.(newData)
                }
                return newData
            })
        },
        [onDataChange, skipAutoResetPageIndex],
    )

    const beginRowEdit = React.useCallback((rowIndex: number) => {
        setEditingRowIndex((current) => {
            if (current !== null && current !== rowIndex) return current
            return rowIndex
        })
    }, [])

    const cancelRowEdit = React.useCallback(() => {
        const idx = editingRowIndexRef.current
        const baseline = editingBaselineRef.current
        setEditingRowIndex(null)
        editingBaselineRef.current = null
        if (idx === null || baseline === null) return
        setData((prev) => {
            const next = [...prev]
            if (next[idx]) next[idx] = cloneRow(baseline)
            return next
        })
        clearFieldErrorsForRow(idx)
    }, [clearFieldErrorsForRow])

    const saveRowEdit = React.useCallback(() => {
        const idx = editingRowIndexRef.current
        if (idx === null) return
        const current = dataRef.current
        const row = current[idx]
        if (!row) return

        if (cellValidation) {
            const updates: Record<string, string> = {}
            for (const col of allColumns) {
                const msg = cellValidation(col, String(row[col as keyof T] ?? ''))
                if (msg) updates[fieldErrorKey(idx, col)] = msg
            }
            if (Object.keys(updates).length > 0) {
                setFieldErrors((prev) => ({ ...prev, ...updates }))
                return
            }
        }

        onDataChange?.(current)
        setEditingRowIndex(null)
        editingBaselineRef.current = null
        clearFieldErrorsForRow(idx)
    }, [allColumns, cellValidation, clearFieldErrorsForRow, onDataChange])

    const addRow = React.useCallback(() => {
        skipAutoResetPageIndex()
        setEditingRowIndex(null)
        editingBaselineRef.current = null
        const newRow = allColumns.reduce(
            (acc, column) => ({ ...acc, [column]: '' }),
            {} as T,
        )
        setData((prev) => {
            const newData = [...prev, newRow]
            onDataChange?.(newData)
            return newData
        })
    }, [allColumns, onDataChange, skipAutoResetPageIndex])

    const removeSelectedRows = React.useCallback(
        (selectedRows: number[]) => {
            skipAutoResetPageIndex()
            setEditingRowIndex(null)
            editingBaselineRef.current = null
            setData((prev) => {
                const newData = prev.filter((_row, index) => !selectedRows.includes(index))
                onDataChange?.(newData)
                return newData
            })
        },
        [onDataChange, skipAutoResetPageIndex],
    )

    const rowEditValue = React.useMemo<RowEditContextValue>(
        () => ({
            isEditable,
            editingRowIndex,
            beginRowEdit,
            cancelRowEdit,
            saveRowEdit,
        }),
        [isEditable, editingRowIndex, beginRowEdit, cancelRowEdit, saveRowEdit],
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
        autoResetPageIndex,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        initialState: pagination
            ? {
                  pagination: {
                      pageSize: 10,
                  },
              }
            : undefined,
        meta: {
            updateData,
            addRow,
            removeSelectedRows,
        },
        state: {
            rowSelection,
            sorting,
        },
    })

    const removeRows = React.useCallback(() => {
        table.options.meta?.removeSelectedRows(table.getSelectedRowModel().rows.map((row) => row.index))
        table.resetRowSelection()
    }, [table])

    const isEmptyColumns = allColumns.length === 0
    const isNullData = tableData === null

    const shellStyle = React.useMemo(() => {
        if (!tableHeight) return undefined
        return { ['--ert-max-height' as string]: tableHeight } as React.CSSProperties
    }, [tableHeight])

    if (isEmptyColumns) {
        return <div className="text-sm text-zinc-600">No columns available.</div>
    }

    if (isNullData) {
        return <div className="text-sm text-zinc-600">No data available.</div>
    }

    const isEmpty = !loadingState && data.length === 0

    return (
        <div className={cn('ert-root w-full min-w-0', className)} data-theme={theme}>
            <RowEditContext.Provider value={rowEditValue}>
                <ValidationContext.Provider value={validationValue}>
                    <div className="ert-shell">
                        <div className={cn('ert-scroll ert-scroll--styled')} style={shellStyle}>
                            {isEmpty ? (
                                <div className="ert-empty">{emptyStateMessage}</div>
                            ) : (
                                <>
                                    <table className={cn('ert-table ert-desktop', stripedRows && 'ert-striped')}>
                                        <thead className="ert-thead">
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => (
                                                        <th
                                                            key={header.id}
                                                            className={cn(
                                                                'ert-th',
                                                                stickyHeader && 'ert-th--sticky',
                                                                header.column.id === 'actions' && 'ert-th-actions',
                                                            )}
                                                        >
                                                            {header.isPlaceholder ? null : (
                                                                <div>
                                                                    {flexRender(
                                                                        header.column.columnDef.header,
                                                                        header.getContext(),
                                                                    )}
                                                                    <div className="ert-sep" />
                                                                    {header.column.getCanFilter() ? (
                                                                        <div>
                                                                            <Filter
                                                                                column={header.column}
                                                                                table={table}
                                                                            />
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                        </th>
                                                    ))}
                                                </tr>
                                            ))}
                                        </thead>
                                        <tbody>
                                            {loadingState ? (
                                                <SkeletonRows
                                                    columnCount={table.getAllLeafColumns().length}
                                                    rowCount={6}
                                                />
                                            ) : (
                                                table.getRowModel().rows.map((row) => (
                                                    <tr
                                                        key={row.id}
                                                        className={cn(
                                                            row.getIsSelected() && 'ert-row-selected',
                                                            editingRowIndex === row.index && 'ert-row-editing',
                                                        )}
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <td
                                                                key={cell.id}
                                                                className={cn(
                                                                    'ert-td',
                                                                    cell.column.id === 'actions' && 'ert-td-actions',
                                                                )}
                                                            >
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext(),
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="ert-mobile" aria-label="Table rows (stacked layout)">
                                        {loadingState ? (
                                            <div className="ert-empty">Loading…</div>
                                        ) : (
                                            table
                                                .getRowModel()
                                                .rows.map((row) => <MobileCardRow key={row.id} row={row} />)
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {!isEmpty && (
                            <div className="ert-toolbar">
                                <div className="ert-toolbar-meta">
                                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                                    {table.getFilteredRowModel().rows.length} row(s) selected · Total{' '}
                                    {table.getFilteredRowModel().rows.length} rows
                                </div>
                                {pagination ? (
                                    <React.Suspense
                                        fallback={<div className="ert-toolbar-meta">Loading pagination…</div>}
                                    >
                                        <PaginationControlsLazy table={table as Table<Record<string, unknown>>} />
                                    </React.Suspense>
                                ) : null}
                            </div>
                        )}

                        {(canAddRow || canRemoveRow) && !isEmpty && !loadingState ? (
                            <div className="ert-footer-actions">
                                {canRemoveRow ? (
                                    <button
                                        type="button"
                                        className="ert-action-btn ert-action-btn--danger"
                                        onClick={removeRows}
                                    >
                                        <TrashIcon width={18} height={18} aria-hidden />
                                        Remove selected
                                    </button>
                                ) : null}
                                {canAddRow ? (
                                    <button
                                        type="button"
                                        className="ert-action-btn ert-action-btn--primary"
                                        onClick={() => table.options.meta?.addRow()}
                                    >
                                        <PlusIcon width={18} height={18} aria-hidden />
                                        Add row
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </ValidationContext.Provider>
            </RowEditContext.Provider>
        </div>
    )
}

const EditableTable = React.memo(EditableTableInner) as typeof EditableTableInner

export { EditableTable }
export default EditableTable
