'use client';

import { useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ServerDataTable } from '@/components/table/ServerDataTable';
import { DataTableColumnHeader } from '@/components/table/DataTableColumnHeader';
import { formatDateTime } from '@/lib/table-utils';
import { MoreHorizontal, Eye, Edit, Trash2, Shield, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SosyUser, usersApi, UserListResponse, GetUsersParams } from '@/lib/api/users';
import { toast } from 'sonner';
import { DataTableSearchableColumn, DataTableFilterableColumn } from '@/lib/table-utils';
import { useServerTable } from '@/hooks/useServerTable';

// Import dialog components
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { ViewUserDialog } from '@/components/users/ViewUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';

export default function UsersPage() {
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<SosyUser | null>(null);

  // Server table hook
  const fetchUsers = useCallback(async (params: GetUsersParams): Promise<UserListResponse> => {
    try {
      return await usersApi.getUsers(params);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
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

  const handleToggleUserStatus = async (user: SosyUser) => {
    try {
      const updatedUser = await usersApi.updateUser(user.id, {
        is_active: !user.is_active,
      });
      
      toast.success(`User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`);
      refetch(); // Refetch data from server
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Dialog handlers
  const handleViewUser = (userId: number) => {
    setSelectedUserId(userId);
    setViewDialogOpen(true);
  };

  const handleEditUser = (userId: number) => {
    setSelectedUserId(userId);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: SosyUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleUserCreated = () => {
    refetch();
  };

  const handleUserUpdated = () => {
    refetch();
  };

  const handleUserDeleted = () => {
    refetch();
  };

  // Define searchable columns
  const searchableColumns: DataTableSearchableColumn<SosyUser>[] = [
    {
      id: 'username',
      title: 'usernames',
    },
  ];

  // Define filterable columns
  const filterableColumns: DataTableFilterableColumn<SosyUser>[] = [
    {
      id: 'is_active',
      title: 'Status',
      options: [
        {
          label: 'Active',
          value: 'true',
          icon: User,
        },
        {
          label: 'Inactive',
          value: 'false',
        },
      ],
    },
    {
      id: 'is_superuser',
      title: 'Role',
      options: [
        {
          label: 'Admin',
          value: 'true',
          icon: Shield,
        },
        {
          label: 'User',
          value: 'false',
          icon: User,
        },
      ],
    },
  ];

  const columns: ColumnDef<SosyUser>[] = [
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
      accessorKey: 'username',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.username}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false, // Always show username
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => (
        <div>{row.getValue('full_name') || '-'}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)));
      },
    },
    {
      accessorKey: 'is_superuser',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const isSuperuser = row.getValue('is_superuser') as boolean;
        return (
          <Badge variant={isSuperuser ? 'destructive' : 'outline'}>
            <Shield className="mr-1 h-3 w-3" />
            {isSuperuser ? 'Admin' : 'User'}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)));
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDateTime(row.getValue('created_at'))}
        </div>
      ),
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
              <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleToggleUserStatus(user)}
              >
                {user.is_active ? 'Deactivate' : 'Activate'} user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDeleteUser(user)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropdownMenuItem>
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
            <h1 className="text-3xl font-bold tracking-tight">SOSY Users</h1>
            <p className="text-muted-foreground">
              Manage users in the SOSY platform ({totalCount} total)
            </p>
          </div>
          <CreateUserDialog onUserCreated={handleUserCreated} />
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

      {/* Dialogs */}
      {selectedUserId && (
        <ViewUserDialog
          userId={selectedUserId}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}

      {selectedUserId && (
        <EditUserDialog
          userId={selectedUserId}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onUserDeleted={handleUserDeleted}
      />
    </>
  );
}