import * as React from 'react'
import EditableTable, { type EditableTableTheme } from './components/editable-table'

type DemoRow = Record<string, unknown> & {
    name: string
    role: string
    email: string
}

const initialData: DemoRow[] = [
    { name: 'Ada', role: 'Engineer', email: 'ada@example.com' },
    { name: 'Grace', role: 'Mathematician', email: 'grace@example.com' },
]

export default function App() {
    const [rows, setRows] = React.useState<DemoRow[]>(initialData)
    const [theme, setTheme] = React.useState<EditableTableTheme>('system')
    const [striped, setStriped] = React.useState(true)
    const [loading, setLoading] = React.useState(false)

    return (
        <div className="min-h-screen p-6">
            <h1 className="mb-4 text-2xl font-semibold">editable-table playground</h1>
            <p className="mb-4 max-w-prose text-sm text-muted-foreground">
                Use <strong>Edit</strong> on a row to change cells, then <strong>Save</strong> to push changes to state or{' '}
                <strong>Cancel</strong> to discard. Resize the window to see the table vs. stacked cards. Theme, stripes,
                and loading are toggled below.
            </p>

            <div className="mb-6 flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                    <span className="text-muted-foreground">Theme</span>
                    <select
                        className="rounded-md border border-input bg-background px-2 py-2"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as EditableTableTheme)}
                    >
                        <option value="light">light</option>
                        <option value="dark">dark</option>
                        <option value="system">system</option>
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={striped} onChange={(e) => setStriped(e.target.checked)} />
                    Striped rows
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
                    Loading state
                </label>
            </div>

            <EditableTable<DemoRow>
                theme={theme}
                stripedRows={striped}
                stickyHeader
                tableHeight="min(70vh, 560px)"
                allColumns={['name', 'role', 'email']}
                tableData={rows}
                isEditable
                canAddRow
                canRemoveRow
                pagination
                loadingState={loading}
                emptyStateMessage="Add a row or refresh sample data — the table is empty."
                cellValidation={(column, value) => {
                    if (column === 'email' && value.trim() && !value.includes('@')) {
                        return 'Email should contain @'
                    }
                    return null
                }}
                onDataChange={setRows}
                className="max-w-5xl"
            />
            <pre className="mt-8 max-h-64 overflow-auto rounded-md border bg-muted/40 p-4 text-xs">
                {JSON.stringify(rows, null, 2)}
            </pre>
        </div>
    )
}
