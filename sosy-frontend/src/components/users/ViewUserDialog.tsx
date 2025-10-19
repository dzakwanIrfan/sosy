'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Eye, Shield, User, Calendar, Mail, UserCheck } from 'lucide-react';
import { SosyUser, usersApi } from '@/lib/api/users';
import { formatDateTime } from '@/lib/table-utils';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ViewUserDialogProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewUserDialog({ userId, open, onOpenChange }: ViewUserDialogProps) {
  const [user, setUser] = useState<SosyUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUser();
    }
  }, [open, userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const userData = await usersApi.getUserById(userId);
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to fetch user details');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this user.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user.full_name || user.username}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    <UserCheck className="mr-1 h-3 w-3" />
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={user.is_superuser ? 'destructive' : 'outline'}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user.is_superuser ? 'Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div className="grid gap-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">User ID:</span>
                <span className="col-span-2 text-sm">{user.id}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Username:
                </span>
                <span className="col-span-2 text-sm">{user.username}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email:
                </span>
                <span className="col-span-2 text-sm">{user.email}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">Full Name:</span>
                <span className="col-span-2 text-sm">{user.full_name || 'Not provided'}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created:
                </span>
                <span className="col-span-2 text-sm">{formatDateTime(user.created_at)}</span>
              </div>

              {user.updated_at && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="col-span-2 text-sm">{formatDateTime(user.updated_at)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Account Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Account Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <Badge variant={user.is_superuser ? 'destructive' : 'outline'} className="text-xs">
                    {user.is_superuser ? 'Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Failed to load user details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}