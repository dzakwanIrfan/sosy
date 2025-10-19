'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/table/DataTable';
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
import { SosyUser, usersApi } from '@/lib/api/users';
import { toast } from 'sonner';
import { DataTableSearchableColumn, DataTableFilterableColumn } from '@/lib/table-utils';

// Import dialog components
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { ViewUserDialog } from '@/components/users/ViewUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';

export default function UsersPage() {
  const [users, setUsers] = useState<SosyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<SosyUser | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await usersApi.getUsers({ limit: 100 });
      setUsers(fetchedUsers);
      console.info(`Loaded ${fetchedUsers.length} users`);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: SosyUser) => {
    try {
      const updatedUser = await usersApi.updateUser(user.id, {
        is_active: !user.is_active,
      });
      
      // Update user in local state
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      toast.success(`User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully`);
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
    },
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      cell: ({ row }) => (
        <div>{row.getValue('full_name') || '-'}</div>
      ),
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
    },
    {
      id: 'actions',
      enableHiding: false,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SOSY Users</h1>
            <p className="text-muted-foreground">
              Manage users in the SOSY platform
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div>Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SOSY Users</h1>
            <p className="text-muted-foreground">
              Manage users in the SOSY platform ({users.length} total)
            </p>
          </div>
          <CreateUserDialog onUserCreated={fetchUsers} />
        </div>

        <DataTable
          columns={columns}
          data={users}
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
          onUserUpdated={fetchUsers}
        />
      )}

      <DeleteUserDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onUserDeleted={fetchUsers}
      />
    </>
  );
}