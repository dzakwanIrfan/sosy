'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Search, ArrowLeft, Loader2, 
  CheckCircle2, XCircle, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { daylightApi, PersonalityTestListItem, MatchingSessionCreate } from '@/lib/api/daylight';
import { usersApi, SosyUser } from '@/lib/api/users';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function NewMatchingSessionPage() {
  const router = useRouter();
  const [sessionName, setSessionName] = useState('');
  const [minMatchThreshold, setMinMatchThreshold] = useState(70.0);
  
  const [users, setUsers] = useState<SosyUser[]>([]);
  const [tests, setTests] = useState<PersonalityTestListItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoadingUsers(true);
    try {
      const [usersData, testsData] = await Promise.all([
        usersApi.getUsers({ page_size: 100 }),
        daylightApi.getAllTests({ limit: 100 })
      ]);
      
      setUsers(usersData.data);
      setTests(testsData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const getUserTest = (userId: number) => {
    return tests.find(t => t.user_id === userId);
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    const usersWithTests = users.filter(u => getUserTest(u.id)).map(u => u.id);
    setSelectedUserIds(usersWithTests);
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.full_name?.toLowerCase().includes(query) || false)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    if (selectedUserIds.length < 3) {
      toast.error('Please select at least 3 participants');
      return;
    }

    // Check if all selected users have tests
    const usersWithoutTests = selectedUserIds.filter(id => !getUserTest(id));
    if (usersWithoutTests.length > 0) {
      toast.error('All selected participants must have completed the personality test');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: MatchingSessionCreate = {
        session_name: sessionName,
        participant_user_ids: selectedUserIds,
        min_match_threshold: minMatchThreshold
      };

      const result = await daylightApi.createMatchingSession(data);
      toast.success('Matching session created successfully!');
      router.push(`/dashboard/daylight/matching/${result.id}`);
    } catch (error: any) {
      console.error('Failed to create matching session:', error);
      toast.error(error.response?.data?.detail || 'Failed to create matching session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const usersWithTests = users.filter(u => getUserTest(u.id)).length;
  const selectedWithTests = selectedUserIds.filter(id => getUserTest(id)).length;

  // Estimate tables
  const estimatedTables = Math.floor(selectedUserIds.length / 5) || 0;
  const remainingUsers = selectedUserIds.length % 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/daylight">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Create Matching Session
        </h2>
        <p className="text-muted-foreground mt-1">
          Select participants and let our SMART algorithm create optimal groups
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {usersWithTests} with test completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedUserIds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedWithTests} ready for matching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Est. Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedTables}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ~{remainingUsers} person remainder
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Group Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">3-5</div>
            <p className="text-xs text-blue-700 mt-1">
              Auto-determined
            </p>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Session Configuration</CardTitle>
            <CardDescription>
              Configure the matching parameters for this session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name *</Label>
                <Input
                  id="sessionName"
                  placeholder="e.g., December 2025 Matching"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minMatchThreshold">Min Match Threshold (%)</Label>
                <Input
                  id="minMatchThreshold"
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={minMatchThreshold}
                  onChange={(e) => setMinMatchThreshold(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Target: 70% compatibility (adaptive if needed)
                </p>
              </div>
            </div>

            {/* SMART Algorithm Info */}
            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <div className="font-semibold text-blue-900">🎯 SMART Matching Algorithm</div>
                  <ul className="space-y-1 text-blue-800 text-xs">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span><strong>Automatic group sizing:</strong> System determines optimal size (3-5 people) based on compatibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span><strong>Quality over quantity:</strong> Prioritizes match quality over fixed group size</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span><strong>Adaptive threshold:</strong> If 70% isn't achievable, will try 65%, 60%, 55%, 50% progressively</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span><strong>No one left behind:</strong> Maximizes participation while maintaining reasonable compatibility</span>
                    </li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Participant Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Participants</CardTitle>
                <CardDescription>
                  Choose users to include in the matching
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={isLoadingUsers}
                >
                  Select All Tested
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={isLoadingUsers}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User List */}
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => {
                  const test = getUserTest(user.id);
                  const isSelected = selectedUserIds.includes(user.id);
                  const hasTest = !!test;

                  return (
                    <div
                      key={user.id}
                      className={cn(
                        'flex items-center justify-between p-4 border rounded-lg transition-colors',
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50',
                        !hasTest && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUser(user.id)}
                          disabled={!hasTest}
                        />
                        
                        <div className="flex-1">
                          <div className="font-medium">{user.full_name || user.username}</div>
                          <div className="text-sm text-gray-600">@{user.username}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasTest ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {test.archetype_symbol} {test.archetype}
                              </Badge>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </>
                          ) : (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                No Test
                              </Badge>
                              <XCircle className="h-5 w-5 text-red-400" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Warning */}
            {selectedUserIds.length > 0 && selectedWithTests < selectedUserIds.length && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800">
                  <div className="font-medium">Warning</div>
                  <div>
                    {selectedUserIds.length - selectedWithTests} selected user(s) haven't completed the personality test
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedUserIds.length} participant(s) selected
            {estimatedTables > 0 && (
              <span className="ml-2 text-blue-600">
                • Est. {estimatedTables} table(s) of {remainingUsers > 0 ? '3-5' : '~5'} people
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/daylight">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedUserIds.length < 3 || selectedWithTests < selectedUserIds.length}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Smart Matching
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}