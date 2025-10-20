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
import { Eye, Calendar, Mail, User, Globe, Hash } from 'lucide-react';
import { WordPressUser, wpUsersApi } from '@/lib/api/wp-users';
import { formatDateTime } from '@/lib/table-utils';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ViewWordPressUserDialogProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewWordPressUserDialog({ userId, open, onOpenChange }: ViewWordPressUserDialogProps) {
  const [user, setUser] = useState<WordPressUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUser();
    }
  }, [open, userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const userData = await wpUsersApi.getUserById(userId);
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to fetch WordPress user:', error);
      toast.error('Failed to fetch user details');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            WordPress User Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this WordPress user.
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
                  {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : user.user_login.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user.display_name || user.user_nicename}</h3>
                <p className="text-sm text-muted-foreground">@{user.user_login}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(user.user_status)}
                </div>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div className="grid gap-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  User ID:
                </span>
                <span className="col-span-2 text-sm">{user.ID}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Username:
                </span>
                <span className="col-span-2 text-sm">{user.user_login}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email:
                </span>
                <span className="col-span-2 text-sm">{user.user_email}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">Display Name:</span>
                <span className="col-span-2 text-sm">{user.display_name || 'Not provided'}</span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">Nice Name:</span>
                <span className="col-span-2 text-sm">{user.user_nicename}</span>
              </div>

              {user.user_url && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Website:
                  </span>
                  <span className="col-span-2 text-sm">
                    <a 
                      href={user.user_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.user_url}
                    </a>
                  </span>
                </div>
              )}

              {user.user_registered && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Registered:
                  </span>
                  <span className="col-span-2 text-sm">{formatDateTime(user.user_registered)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Account Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Account Status</h4>
              <div className="flex justify-between items-center text-sm">
                <span>Status:</span>
                {getStatusBadge(user.user_status)}
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