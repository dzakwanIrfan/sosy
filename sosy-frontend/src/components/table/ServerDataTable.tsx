'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  OnChangeFn,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableSearchableColumn, DataTableFilterableColumn } from '@/lib/table-utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  totalCount: number;
  pagination: PaginationState;
  sorting: SortingState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onSortingChange: OnChangeFn<SortingState>;
  onGlobalFilterChange: (globalFilter: string) => void;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  searchableColumns?: DataTableSearchableColumn<TData>[];
  newRowLink?: string;
  deleteRowsAction?: React.ReactNode;
}

export function ServerDataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  totalCount,
  pagination,
  sorting,
  globalFilter,
  columnFilters,
  onPaginationChange,
  onSortingChange,
  onGlobalFilterChange,
  onColumnFiltersChange,
  filterableColumns = [],
  searchableColumns = [],
  newRowLink,
  deleteRowsAction,
}: ServerDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Calculate pageCount for server-side pagination
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterableColumns={filterableColumns}
        searchableColumns={searchableColumns}
        newRowLink={newRowLink}
        deleteRowsAction={deleteRowsAction}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <LoadingSpinner size="md" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}