# Editable Table Component

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Editable Table is a powerful React component designed for creating dynamic, editable tables with advanced features like row selection, pagination, and custom cell rendering. It is built using `@tanstack/react-table` and integrates seamlessly with your React projects.

This is the first version, so there may be somethings which I missed out which will be added in later updates.

Also will be reducing the number of dependencies. If you want please feel free to contribute in this project.

## Features

-  **Editable Cells**: Inline editing of table cells with automatic state management.
-  **Row Selection**: Built-in support for row selection with custom checkboxes.
-  **Add/Remove Rows**: Easily add or remove rows with customizable buttons.
-  **Pagination Support**: Optional pagination feature for large datasets.
-  **Sorting**: All rows can be sorted in ascending or descending order by clicking on column headers.
-  **Tailwind CSS Integration**: Styled using Tailwind CSS for easy customization.
-  **Filtering**: Supports filtering in columns.

## Installation

```bash
npm install editable-table
```

or

```bash
yarn add editable-table
```

## Usage

```tsx
import React, { useState } from "react";
import EditableTable from "editable-table";

const Example = () => {
   const columns = ["Name", "Age", "Occupation"];
   const data = [
      { Name: "John Doe", Age: 28, Occupation: "Engineer" },
      { Name: "Jane Smith", Age: 34, Occupation: "Designer" },
   ];

   const handleDataChange = (newData) => {
      console.log("Updated Data:", newData);
   };

   return (
      <EditableTable
         allColumns={columns}
         tableData={data}
         canAddRow={true}
         canRemoveRow={true}
         isEditable={true}
         pagination={true}
         onDataChange={handleDataChange}
      />
   );
};

export default Example;
```

## Props

-  **`allColumns: string[]`** (required)  
   Array of column headers.

-  **`tableData: txnData[]`** (required)  
   Array of data objects to populate the table.

-  **`canAddRow: boolean`** (optional)  
   Enables the "Add Row" functionality.

-  **`canRemoveRow: boolean`** (optional)  
   Enables the "Remove Row" functionality.

-  **`isEditable: boolean`** (required)  
   Enables inline editing of table cells.

-  **`pagination: boolean`** (optional)  
   Enables pagination.

-  **`className: string`** (optional)  
   Additional classes for custom styling.

-  **`onDataChange: (newData: txnData[]) => void`** (optional)  
   Callback function to handle changes in table data.

## Customization

The table component is designed with flexibility in mind, allowing you to easily customize its appearance and behavior:

-  **Styling**: Use Tailwind CSS classes to style the table and its elements.
-  **Cell Rendering**: Override default cell rendering to add custom input elements or formatting.
-  **Sorting**: Built-in sorting for each column header, toggling between ascending and descending order.

## Dependencies

This component relies on the following dependencies:

-  **`react`**: ^18.3.1
-  **`@tanstack/react-table`**: ^8.20.1
-  **`@radix-ui/react-icons`**: ^1.3.0
-  **`tailwindcss`**: ^3.4.9

Ensure these dependencies are installed in your project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Baibhav Kumar
