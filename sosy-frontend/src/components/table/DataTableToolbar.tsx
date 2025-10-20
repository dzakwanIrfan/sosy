'use client';

import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './DataTableViewOptions';
import { DataTableFacetedFilter } from './DataTableFacetedFilter';
import { DataTableSearchableColumn, DataTableFilterableColumn } from '@/lib/table-utils';
import { useCallback, useState, useEffect } from 'react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  searchableColumns?: DataTableSearchableColumn<TData>[];
  newRowLink?: string;
  deleteRowsAction?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
  newRowLink,
  deleteRowsAction,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter;
  const [searchableColumn] = searchableColumns;
  
  // Local state for search input to handle debouncing
  const [searchValue, setSearchValue] = useState(table.getState().globalFilter ?? '');

  // Update local state when global filter changes externally
  useEffect(() => {
    setSearchValue(table.getState().globalFilter ?? '');
  }, [table.getState().globalFilter]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Debounce the actual filter update
    const timeoutId = setTimeout(() => {
      table.setGlobalFilter(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [table]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    table.resetColumnFilters();
    table.setGlobalFilter('');
    setSearchValue('');
  }, [table]);

  return (
    <div className="flex w-full items-center justify-between space-x-2 overflow-auto p-1">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumn && (
          <Input
            placeholder={`Search ${searchableColumn.title}...`}
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {filterableColumns.length > 0 &&
          filterableColumns.map(
            (column) =>
              table.getColumn(String(column.id)) && (
                <DataTableFacetedFilter
                  key={String(column.id)}
                  column={table.getColumn(String(column.id))}
                  title={column.title}
                  options={column.options}
                />
              )
          )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {deleteRowsAction}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}