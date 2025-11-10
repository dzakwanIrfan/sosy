'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, ArrowRight, Brain, User } from 'lucide-react';
import { daylightApi, PersonalityTestListItem } from '@/lib/api/daylight';
import { usersApi, SosyUser } from '@/lib/api/users';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDateTime } from '@/lib/table-utils';

export default function AllTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<PersonalityTestListItem[]>([]);
  const [users, setUsers] = useState<Record<number, SosyUser>>({});
  const [filteredTests, setFilteredTests] = useState<PersonalityTestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTests();
  }, [searchQuery, tests]);

  const fetchData = async () => {
    try {
      const [testsData, usersData] = await Promise.all([
        daylightApi.getAllTests({ limit: 100 }),
        usersApi.getUsers({ page_size: 100 })
      ]);
      
      setTests(testsData);
      
      // Create user map
      const userMap: Record<number, SosyUser> = {};
      usersData.data.forEach(user => {
        userMap[user.id] = user;
      });
      setUsers(userMap);
    } catch (error: any) {
      console.error('Failed to fetch tests:', error);
      toast.error('Failed to load personality tests');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTests = () => {
    if (!searchQuery) {
      setFilteredTests(tests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tests.filter(test => {
      const user = users[test.user_id];
      return (
        test.archetype.toLowerCase().includes(query) ||
        user?.username.toLowerCase().includes(query) ||
        user?.full_name?.toLowerCase().includes(query)
      );
    });
    
    setFilteredTests(filtered);
  };

  // Group tests by archetype
  const testsByArchetype = filteredTests.reduce((acc, test) => {
    if (!acc[test.archetype]) {
      acc[test.archetype] = [];
    }
    acc[test.archetype].push(test);
    return acc;
  }, {} as Record<string, PersonalityTestListItem[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          All Personality Tests
        </h2>
        <p className="text-muted-foreground mt-1">
          View all completed personality assessments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(tests.map(t => t.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Users tested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Archetypes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(testsByArchetype).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.length > 0
                ? (tests.reduce((acc, t) => acc + t.profile_score, 0) / tests.length).toFixed(0)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average profile score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by user or archetype..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredTests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-gray-600 mb-2">No personality tests found</p>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term' : 'No one has taken the test yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(testsByArchetype)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([archetype, archetypeTests]) => {
              const firstTest = archetypeTests[0];
              
              return (
                <Card key={archetype}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{firstTest.archetype_symbol}</div>
                        <div>
                          <CardTitle>{archetype}</CardTitle>
                          <CardDescription>
                            {archetypeTests.length} user(s) with this type
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {archetypeTests.map((test) => {
                        const user = users[test.user_id];
                        
                        return (
                          <Link 
                            key={test.id} 
                            href={`/dashboard/daylight/result/${test.id}`}
                          >
                            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                              <div className="flex items-center gap-4 flex-1">
                                <Avatar>
                                  <AvatarFallback>
                                    {user?.username.substring(0, 2).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {user?.full_name || user?.username || `User ${test.user_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    @{user?.username || `user${test.user_id}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-right">
                                    <div className="font-medium">
                                      Score: {test.profile_score.toFixed(0)}
                                    </div>
                                    <div className="text-gray-600 text-xs">
                                      {formatDateTime(test.test_date)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}