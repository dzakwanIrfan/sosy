'use client';

import { useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ServerDataTable } from '@/components/table/ServerDataTable';
import { DataTableColumnHeader } from '@/components/table/DataTableColumnHeader';
import { formatDateTime } from '@/lib/table-utils';
import { MoreHorizontal, Eye, Globe, ExternalLink, Award } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { WordPressUser, wpUsersApi, WordPressUserListResponse, GetWordPressUsersParams } from '@/lib/api/wp-users';
import { toast } from 'sonner';
import { DataTableSearchableColumn, DataTableFilterableColumn } from '@/lib/table-utils';
import { useServerTable } from '@/hooks/useServerTable';
import { ViewWordPressUserDialog } from '@/components/wp-users/ViewWordPressUserDialog';
import { PersonalityTestModal } from '@/components/personality-test/PersonalityTestModal';

export default function WordPressUsersPage() {
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Personality Test Modal states
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTestUserId, setSelectedTestUserId] = useState<number | null>(null);
  const [selectedTestUserName, setSelectedTestUserName] = useState<string>('');

  // Server table hook
  const fetchUsers = useCallback(async (params: GetWordPressUsersParams): Promise<WordPressUserListResponse> => {
    try {
      return await wpUsersApi.getUsers(params);
    } catch (error: any) {
      console.error('Failed to fetch WordPress users:', error);
      toast.error('Failed to fetch WordPress users');
      throw error;
    }
  }, []);

  const {
    data: users,
    loading,
    totalCount,
    state,
    setPagination,
    setSorting,
    setGlobalFilter,
    setColumnFilters,
    refetch,
  } = useServerTable({
    fetchData: fetchUsers,
    initialPageSize: 10,
  });

  // Dialog handlers
  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setViewDialogOpen(true);
  };

  const handleVisitWebsite = (url: string) => {
    window.open(url, '_blank');
  };

  const handleViewPersonalityTest = (userId: number, userName: string) => {
    setSelectedTestUserId(userId);
    setSelectedTestUserName(userName);
    setTestModalOpen(true);
  };

  // Define searchable columns
  const searchableColumns: DataTableSearchableColumn<WordPressUser>[] = [
    {
      id: 'user_login',
      title: 'usernames',
    },
  ];

  // Define filterable columns
  const filterableColumns: DataTableFilterableColumn<WordPressUser>[] = [
    {
      id: 'user_status',
      title: 'Status',
      options: [
        {
          label: 'Active',
          value: '0',
        },
        {
          label: 'Inactive',
          value: '1',
        },
        {
          label: 'Suspended',
          value: '2',
        },
      ],
    },
  ];

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="default">Active</Badge>;
      case 1:
        return <Badge variant="secondary">Inactive</Badge>;
      case 2:
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const columns: ColumnDef<WordPressUser>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'user_login',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : user.user_login.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.user_login}</div>
              <div className="text-sm text-muted-foreground">{user.user_email}</div>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: 'display_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Display Name" />
      ),
      cell: ({ row }) => (
        <div>{row.getValue('display_name') || '-'}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'user_nicename',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nice Name" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('user_nicename')}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'user_status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('user_status') as number;
        return getStatusBadge(status);
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: (row, id, value) => {
        // Handle array of selected values
        if (Array.isArray(value)) {
          return value.includes(String(row.getValue(id)));
        }
        return String(row.getValue(id)) === String(value);
      },
    },
    {
      accessorKey: 'user_url',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ row }) => {
        const url = row.getValue('user_url') as string;
        if (!url) return '-';
        
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
            onClick={() => handleVisitWebsite(url)}
          >
            <Globe className="mr-1 h-3 w-3" />
            <span className="text-xs">Visit</span>
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'user_registered',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Registered" />
      ),
      cell: ({ row }) => {
        const registered = row.getValue('user_registered') as string;
        if (!registered) return '-';
        
        return (
          <div className="text-sm">
            {formatDateTime(registered)}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewUser(user.ID)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleViewPersonalityTest(
                  user.ID, 
                  user.display_name || user.user_login
                )}
              >
                <Award className="mr-2 h-4 w-4" />
                View Personality Test
              </DropdownMenuItem>
              {user.user_url && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleVisitWebsite(user.user_url!)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit website
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">WordPress Users</h1>
            <p className="text-muted-foreground">
              View WordPress users from the connected database ({totalCount} total)
            </p>
          </div>
        </div>

        <ServerDataTable
          columns={columns}
          data={users}
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
          searchableColumns={searchableColumns}
          filterableColumns={filterableColumns}
        />
      </div>

      {/* View Dialog */}
      {selectedUserId && (
        <ViewWordPressUserDialog
          userId={selectedUserId}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}

      {/* Personality Test Modal */}
      {selectedTestUserId && (
        <PersonalityTestModal
          open={testModalOpen}
          onOpenChange={setTestModalOpen}
          wpUserId={selectedTestUserId}
          userName={selectedTestUserName}
        />
      )}
    </>
  );
}