import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

export type PaginationControlsProps = {
    /** TanStack table instance (typed loosely so this lazy chunk works with generic row types). */
    table: Table<Record<string, unknown>>
}

/**
 * Client-side pagination controls for {@link EditableTable} when `pagination` is enabled.
 */
export function PaginationControls({ table }: PaginationControlsProps) {
    const pageIndex = table.getState().pagination.pageIndex
    const pageSize = table.getState().pagination.pageSize
    const pageCount = table.getPageCount()

    return (
        <div className="ert-pagination" role="navigation" aria-label="Table pagination">
            <div className="ert-toolbar-meta" style={{ alignSelf: 'center' }}>
                Page <strong>{pageIndex + 1}</strong> of <strong>{Math.max(pageCount, 1)}</strong>
                <span style={{ margin: '0 0.35rem', opacity: 0.45 }}>·</span>
                {pageSize} rows / page
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    className="ert-page-btn"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="First page"
                >
                    «
                </button>
                <button
                    type="button"
                    className="ert-page-btn"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Previous page"
                >
                    <ChevronLeftIcon width={18} height={18} />
                    <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                    type="button"
                    className="ert-page-btn ert-page-btn--primary"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Next page"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRightIcon width={18} height={18} />
                </button>
                <button
                    type="button"
                    className="ert-page-btn"
                    onClick={() => table.setPageIndex(Math.max(pageCount - 1, 0))}
                    disabled={!table.getCanNextPage()}
                    aria-label="Last page"
                >
                    »
                </button>
            </div>
        </div>
    )
}

export default PaginationControls
