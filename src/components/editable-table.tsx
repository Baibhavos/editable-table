import React from 'react'
import {
    Column,
    Table,
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    RowData,
    SortingState,
    getSortedRowModel,
} from '@tanstack/react-table';

import {
    ShadCnTable,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";

import { Checkbox } from "./ui/checkbox";
import { Button } from './ui/button';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

type txnData = {
    [key: string]: string | number | Date | any;
}

export interface EditableTableProps {
    allColumns: string[],
    tableData: txnData[],
    canAddRow?: boolean,
    canRemoveRow?: boolean,
    isEditable: boolean,
    pagination?: boolean,
    className?: string,
    onDataChange?: (updatedData: txnData[]) => void;
}

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void
    }

    interface TableMeta<TData extends RowData> {
        addRow: () => void;
    }

    interface TableMeta<TData extends RowData> {
        removeSelectedRows: (selectedRows: number[]) => void;
    }
}

// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<any>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
        const initialValue = getValue()

        const [value, setValue] = React.useState(initialValue)

        const onBlur = () => {
            table.options.meta?.updateData(index, id, value)
        }

        React.useEffect(() => {
            setValue(initialValue)
        }, [initialValue])

        return (
            <input
                value={value as string}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                className='text-center h-16'
            />
        )
    },
}

function useSkipper() {
    const shouldSkipRef = React.useRef(true)
    const shouldSkip = shouldSkipRef.current

    // Wrap a function with this to skip a pagination reset temporarily
    const skip = React.useCallback(() => {
        shouldSkipRef.current = false
    }, [])

    React.useEffect(() => {
        shouldSkipRef.current = true
    })

    return [shouldSkip, skip] as const
}

function EditableTable({ allColumns, tableData, canAddRow, canRemoveRow, isEditable, pagination, className, onDataChange }: EditableTableProps) {

    // const rerender = React.useReducer(() => ({}), {})[1];    


    if (allColumns.length == 0) {
        return <div>No columns available.</div>
    }

    if (tableData == null) {
        return <div>No data available.</div>
    }

    const columns = React.useMemo<ColumnDef<any>[]>(() =>
        [
            {
                id: "select",
                header: ({ table }) => (
                    <div>
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && "indeterminate")
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div >
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                ),
            },
            ...allColumns.map((columnHeader: string) => {
                return {
                    accessorKey: columnHeader,
                    header: ({ column }: { column: Column<any, any> }) => {
                        return (
                            <Button
                                variant="secondary"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            >
                                {columnHeader}
                                <CaretSortIcon />
                            </Button>
                        )
                    },
                }
            })
        ], []);

    const removeRows = () => {
        table.options.meta?.removeSelectedRows(
            table.getSelectedRowModel().rows.map(row => row.index)
        )
        table.resetRowSelection()
    }

    const [data, setData] = React.useState(tableData);
    const refreshData = () => setData(tableData);
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

    const updateData = (rowIndex: number, columnId: string, value: unknown) => {
        const newData = data.map((row, index) => {
            if (index === rowIndex) {
                return {
                    ...row,
                    [columnId]: value,
                };
            }
            return row;
        });

        setData(newData);

        if (onDataChange) {
            onDataChange(newData); // Call the callback with updated data
        }
    };

    const addRow = () => {
        const newRow = allColumns.reduce((acc, column) => ({ ...acc, [column]: '' }), {});
        const newData = [...data, newRow];
        setData(newData);

        if (onDataChange) {
            onDataChange(newData); // Call the callback with updated data
        }
    };

    const removeSelectedRows = (selectedRows: number[]) => {
        const newData = data.filter((_row, index) => !selectedRows.includes(index));
        setData(newData);

        if (onDataChange) {
            onDataChange(newData); // Call the callback with updated data
        }
    };


    let table: Table<any>;
    table = useReactTable({
        data,
        columns,
        defaultColumn: isEditable ? defaultColumn : undefined,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
        autoResetPageIndex,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),

        meta: {
            updateData,
            addRow,
            removeSelectedRows,
        },
        debugTable: true,
        state: {
            rowSelection,
            sorting,
        }
    });

    return (
        <div className={cn("w-full h-full", className)}>
            <ScrollArea >
                <ShadCnTable >
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    <Separator orientation="horizontal" />
                                                    {header.column.getCanFilter() ? (
                                                        <div >
                                                            <Filter column={header.column} table={table} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map(row => {
                            return (
                                <TableRow key={row.id}>
                                    {row.getAllCells().map(cell => {
                                        return (
                                            <TableCell key={cell.id} className='text-xl '>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    {(canAddRow || canRemoveRow) && <TableFooter>
                        <TableRow>
                            <TableCell colSpan={table.getCenterLeafColumns().length} align="right">
                                {canRemoveRow && <Button variant="outline" onClick={removeRows}>Remove Row</Button>}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={table.getCenterLeafColumns().length} align="right">
                                {canAddRow && <Button variant="outline" onClick={table.options.meta?.addRow}>Add Row</Button>}
                            </TableCell>
                        </TableRow>
                    </TableFooter>}
                </ShadCnTable>
                <div className="h-2" />
                <ScrollBar orientation='horizontal' />
            </ScrollArea>
            <div className="flex flex-row">
                <div className="flex-1 text-lg text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div>Total: {table.getRowModel().rows.length} Rows</div>
                {/* <div>
                <button onClick={() => rerender()}>Force Rerender</button>
            </div> */}
            </div>
            <div>
                <button onClick={() => refreshData()}>Refresh Data</button>
            </div>
        </div>
    )
}
function Filter({
    column,
    table,
}: {
    column: Column<any, any>
    table: Table<any>
}) {
    const firstValue = table
        .getPreFilteredRowModel()
        .flatRows[0]?.getValue(column.id)

    const columnFilterValue = column.getFilterValue()

    return typeof firstValue === 'number' ? (
        <div className="flex">
            <input
                type="number"
                value={(columnFilterValue as [number, number])?.[0] ?? ''}
                onChange={e =>
                    column.setFilterValue((old: [number, number]) => [
                        e.target.value,
                        old?.[1],
                    ])
                }
                placeholder={`Min`}
                className=" border shadow rounded h-8 w-2/3 mb-6 placeholder:text-center"
            />
            <input
                type="number"
                value={(columnFilterValue as [number, number])?.[1] ?? ''}
                onChange={e =>
                    column.setFilterValue((old: [number, number]) => [
                        old?.[0],
                        e.target.value,
                    ])
                }
                placeholder={`Max`}
                className=" border shadow rounded h-8 w-2/3 mb-6 placeholder:text-center"
            />
        </div>
    ) :
        (
            <input
                type="text"
                value={(columnFilterValue ?? '') as string}
                onChange={e => column.setFilterValue(e.target.value)}
                // placeholder={`Search...`}
                className="border rounded-2xl shadow h-8 w-2/3 mb-6 placeholder:text-center"
            />
        )
}

export default EditableTable;
