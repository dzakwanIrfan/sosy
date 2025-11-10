'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Search, Plus, TrendingUp, 
  Calendar, ArrowRight, Filter
} from 'lucide-react';
import { daylightApi, MatchingSessionSummary } from '@/lib/api/daylight';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDateTime } from '@/lib/table-utils';
import { cn } from '@/lib/utils';

export default function MatchingListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MatchingSessionSummary[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<MatchingSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, statusFilter, sessions]);

  const fetchSessions = async () => {
    try {
      const data = await daylightApi.getAllMatchingSessions({ limit: 100 });
      setSessions(data);
    } catch (error: any) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load matching sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.session_name.toLowerCase().includes(query) ||
        s.creator_name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    avgScore: sessions.length > 0
      ? sessions
          .filter(s => s.average_match_score !== null)
          .reduce((acc, s) => acc + (s.average_match_score || 0), 0) /
        sessions.filter(s => s.average_match_score !== null).length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Matching Sessions</h2>
          <p className="text-muted-foreground mt-1">
            View and manage all personality matching sessions
          </p>
        </div>
        <Link href="/dashboard/daylight/matching/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average compatibility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('processing')}
              >
                Processing
              </Button>
              <Button
                variant={statusFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('failed')}
              >
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            {filteredSessions.length} session(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-gray-600 mb-2">No matching sessions found</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first matching session to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link href="/dashboard/daylight/matching/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Session
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <Link key={session.id} href={`/dashboard/daylight/matching/${session.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg truncate group-hover:text-blue-600 transition-colors">
                          {session.session_name}
                        </h4>
                        <Badge className={cn('border', getStatusColor(session.status))}>
                          {session.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.total_participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {session.total_tables} tables
                        </span>
                        {session.average_match_score && (
                          <span className="font-medium text-blue-600">
                            Avg: {session.average_match_score.toFixed(1)}%
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(session.created_at)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        Created by {session.creator_name}
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}