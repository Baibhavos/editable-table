/** Joins truthy class names — tiny replacement for `clsx` + `tailwind-merge` in this package. */
export function cx(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ')
}

/** @deprecated Use `cx`; kept for any consumer re-exports. */
export const cn = cx
