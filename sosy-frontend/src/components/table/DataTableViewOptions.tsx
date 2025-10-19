'use client';

import { Settings2 } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto hidden h-8 lg:flex"
      onClick={() => {
        // For now, we'll just toggle all columns
        const allColumnsVisible = table.getAllColumns().every(column => column.getIsVisible());
        table.getAllColumns().forEach(column => {
          if (column.getCanHide()) {
            column.toggleVisibility(!allColumnsVisible);
          }
        });
      }}
    >
      <Settings2 className="mr-2 h-4 w-4" />
      View
    </Button>
  );
}