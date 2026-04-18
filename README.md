# editable-table

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/editable-table.svg)](https://www.npmjs.com/package/editable-table)
[![Live demo](https://img.shields.io/badge/demo-StackBlitz-1389fd.svg)](https://stackblitz.com/github/Baibhavos/editable-table?file=src%2FApp.tsx)

React editable table built with [@tanstack/react-table](https://tanstack.com/table), Radix UI primitives, Tailwind-friendly shadcn-style building blocks, and a **scoped design system** (`editable-table.css`) using CSS variables for light, dark, and system themes.

## Installation

Install the package and its **peer dependencies** (your bundler should warn if any are missing):

```bash
npm install editable-table @tanstack/react-table tailwindcss @radix-ui/react-icons react react-dom
```

Import the bundled stylesheet once (the JS build does not embed CSS so tree-shaking stays predictable):

```ts
import "editable-table/style.css";
```

## Quick start

```tsx
import { useState } from "react";
import EditableTable from "editable-table";
import "editable-table/style.css";

type Row = { name: string; age: string };

const columns: (keyof Row & string)[] = ["name", "age"];

export function Demo() {
  const [rows, setRows] = useState<Row[]>([
    { name: "Ada", age: "36" },
    { name: "Grace", age: "85" },
  ]);

  return (
    <EditableTable<Row>
      theme="system"
      stripedRows
      stickyHeader
      tableHeight="420px"
      allColumns={columns}
      tableData={rows}
      isEditable
      canAddRow
      canRemoveRow
      pagination
      onDataChange={setRows}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `allColumns` | `readonly (keyof T & string)[]` | — | Accessor keys and header labels, in column order. |
| `tableData` | `T[] \| null` | — | Row data. Use `null` to show the “no data” placeholder instead of the grid. |
| `isEditable` | `boolean` | — | Enables per-row **Edit → Save / Cancel**: inputs only while editing; **Save** calls `onDataChange` with the full table; **Cancel** restores the row from when Edit was pressed. |
| `canAddRow` | `boolean` | — | Shows **Add row** in the footer. |
| `canRemoveRow` | `boolean` | — | Shows **Remove selected** in the footer. |
| `pagination` | `boolean` | — | Client-side pagination (page size 10). Pagination UI is lazy-loaded. |
| `onDataChange` | `(rows: T[]) => void` | — | Fires after edits, add-row, or remove-row. |
| `className` | `string` | — | Extra classes on the outer `.ert-root` wrapper. |
| `stripedRows` | `boolean` | — | Alternating row backgrounds. |
| `stickyHeader` | `boolean` | — | Sticky header cells inside the scroll container. |
| `tableHeight` | `string` | — | Sets `--ert-max-height` on the scroll area (for example `"400px"` or `"min(70vh,560px)"`). |
| `emptyStateMessage` | `React.ReactNode` | `"No rows to display."` | Shown when `tableData` is a non-null empty array. |
| `loadingState` | `boolean` | `false` | Skeleton rows instead of data rows. |
| `cellValidation` | `(column, value) => string \| null` | — | Runs on blur; non-null strings mark the cell invalid (`title` tooltip + red accent). |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Sets `data-theme` on the root for bundled CSS tokens. |

Exported types: `EditableTableProps<T>`, `EditableTableTheme`, `EditableTableCellValidation`.

## Theming

The table root has class `ert-root` and `data-theme={theme}`. Colors, radii, and shadows are driven by **RGB tokens** (space-separated) so you can override them from your app stylesheet:

```css
.my-page .ert-root {
  --ert-primary: 99 102 241;
  --ert-radius: 18px;
}
```

Use `theme="system"` to follow `prefers-color-scheme` with the bundled light/dark token sets.

## Layout notes

- From the `md` breakpoint up, the component renders a classic `<table>`. Below `md`, the same row model is shown as **stacked cards** with a `<dt>` / `<dd>` label pair per column.
- The horizontal scroll area uses a **thin styled scrollbar** on supporting browsers.
- Primary actions and pagination controls use at least **44×44px** touch targets.

## Scripts (repository)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite playground (`src/App.tsx`). |
| `npm run lint` | ESLint on `src/`. |
| `npm run typecheck` | `tsc --noEmit` against `tsconfig.json`. |
| `npm run build` | Emit declaration files to `dist/` (`tsconfig.build.json`). |
| `npm run rollup` | Clean `dist/`, bundle ESM + CJS + `editable-table.css` + `index.d.ts`. |

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Baibhavos/editable-table).

1. Fork the repository and create a branch for your change.
2. Run `npm install`, then `npm run lint` and `npm run typecheck` before opening a PR.
3. For UI changes, run `npm run dev` and exercise both wide and narrow viewports.
4. For packaging changes, run `npm run rollup` and confirm `dist/` contains `index.esm.js`, `index.cjs.js`, `index.d.ts`, and `editable-table.css`.

Please keep diffs focused and match existing formatting and TypeScript style.

## Changelog

### 1.1.0

- Theming via CSS variables and `theme` prop (`light` / `dark` / `system`).
- Responsive layout: stacked “card” rows below `md`, table with horizontal scroll and styled scrollbar from `md` up.
- New props: `stripedRows`, `stickyHeader`, `tableHeight`, `emptyStateMessage`, `loadingState`, `cellValidation`, `theme`.
- Modern toolbar, pagination (lazy-loaded UI chunk), and add/remove actions with Radix icons.
- `React.memo` on the table component; validation context to limit column-definition churn.
- **Peer dependencies:** `react`, `react-dom`, `@tanstack/react-table`, `tailwindcss`, `@radix-ui/react-icons`.
- **Exports:** conditional exports for `import` / `require` / `types`, plus `editable-table/style.css`.
- **Rollup:** `inlineDynamicImports` for a single ESM/CJS file each; extracted `dist/editable-table.css`; externals include peers and `react/jsx-runtime`.
- `sideEffects` lists `**/*.css` for correct bundler behavior when importing the stylesheet entry.

### 1.0.0

- Initial release with editable cells, selection, sorting, filtering, pagination, and add/remove rows.

## License

MIT. See [LICENSE](LICENSE) if present in the repository.

## Author

Baibhav Kumar
