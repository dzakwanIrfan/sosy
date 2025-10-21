'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ServerDataTable } from '@/components/table/ServerDataTable';
import { DataTableColumnHeader } from '@/components/table/DataTableColumnHeader';
import { useServerTable } from '@/hooks/useServerTable';
import { eventsApi, Event } from '@/lib/api/events';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function EventsPage() {
  const router = useRouter();

  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        accessorKey: 'ID',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => <div className="w-[80px]">{row.getValue('ID')}</div>,
        enableSorting: true,
      },
      {
        accessorKey: 'post_title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Event Title" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex space-x-2">
              <span className="max-w-[500px] truncate font-medium">
                {row.getValue('post_title')}
              </span>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'post_status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue('post_status') as string;
          
          // Status variant mapping
          const statusConfig: Record<string, { 
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
            icon: React.ReactNode;
            label: string;
          }> = {
            publish: {
              variant: 'default',
              icon: <FileText className="mr-1 h-3 w-3" />,
              label: 'Published'
            },
            draft: {
              variant: 'secondary',
              icon: <Edit className="mr-1 h-3 w-3" />,
              label: 'Draft'
            },
            trash: {
              variant: 'destructive',
              icon: <Trash2 className="mr-1 h-3 w-3" />,
              label: 'Trash'
            },
          };

          const config = statusConfig[status] || {
            variant: 'outline' as const,
            icon: null,
            label: status
          };

          return (
            <Badge variant={config.variant} className="flex items-center w-fit">
              {config.icon}
              {config.label}
            </Badge>
          );
        },
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'post_date',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created Date" />
        ),
        cell: ({ row }) => {
          const date = row.getValue('post_date') as string;
          if (!date) return '-';
          return format(new Date(date), 'MMM dd, yyyy HH:mm');
        },
        enableSorting: true,
      },
      {
        accessorKey: 'post_modified',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Modified Date" />
        ),
        cell: ({ row }) => {
          const date = row.getValue('post_modified') as string;
          if (!date) return '-';
          return format(new Date(date), 'MMM dd, yyyy HH:mm');
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const event = row.original;

          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/events/${event.ID}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Buyers
            </Button>
          );
        },
      },
    ],
    [router]
  );

  const {
    data,
    loading,
    totalCount,
    state,
    setPagination,
    setSorting,
    setGlobalFilter,
    setColumnFilters,
  } = useServerTable({
    fetchData: eventsApi.getEvents,
    initialPageSize: 10,
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Events</h2>
          <p className="text-muted-foreground">
            Manage and view event products and their buyers
          </p>
        </div>
      </div>

      <ServerDataTable
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        pagination={state.pagination}
        sorting={state.sorting}
        globalFilter={state.globalFilter}
        columnFilters={state.columnFilters}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onGlobalFilterChange={setGlobalFilter}
        onColumnFiltersChange={setColumnFilters}
        searchableColumns={[
          {
            id: 'post_title',
            title: 'event title',
          },
        ]}
        filterableColumns={[
          {
            id: 'post_status',
            title: 'Status',
            options: [
              { 
                label: 'Published', 
                value: 'publish',
                icon: FileText
              },
              { 
                label: 'Draft', 
                value: 'draft',
                icon: Edit
              },
              { 
                label: 'Trash', 
                value: 'trash',
                icon: Trash2
              },
            ],
          },
        ]}
      />
    </div>
  );
}