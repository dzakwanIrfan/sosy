'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Users, TrendingUp, Clock, 
  ArrowRight, CheckCircle2, Play, Brain, GitCompare
} from 'lucide-react';
import { daylightApi, PersonalityTestResult, MatchingSessionSummary } from '@/lib/api/daylight';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDateTime } from '@/lib/table-utils';

export default function DaylightDashboardPage() {
  const router = useRouter();
  const [myTest, setMyTest] = useState<PersonalityTestResult | null>(null);
  const [sessions, setSessions] = useState<MatchingSessionSummary[]>([]);
  const [isLoadingTest, setIsLoadingTest] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    fetchMyTest();
    fetchSessions();
  }, []);

  const fetchMyTest = async () => {
    try {
      const data = await daylightApi.getMyTest();
      setMyTest(data);
    } catch (error: any) {
      console.error('Failed to fetch test:', error);
    } finally {
      setIsLoadingTest(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await daylightApi.getAllMatchingSessions({ limit: 10 });
      setSessions(data);
    } catch (error: any) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load matching sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Daylight Personality
        </h2>
        <p className="text-muted-foreground mt-1">
          Discover your personality type and find your perfect match
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Matching sessions created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully matched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.length > 0
                ? (
                    sessions
                      .filter(s => s.average_match_score !== null)
                      .reduce((acc, s) => acc + (s.average_match_score || 0), 0) /
                    sessions.filter(s => s.average_match_score !== null).length
                  ).toFixed(1)
                : '0.0'}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Average compatibility
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Status</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingTest ? '...' : myTest ? '✓' : '✗'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingTest ? 'Loading...' : myTest ? 'Test completed' : 'Not tested'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Test Status */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Your Personality Test
          </CardTitle>
          <CardDescription>
            Take the Daylight Assessment to discover your personality type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTest ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : myTest ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{myTest.archetype_symbol}</div>
                <div>
                  <div className="font-semibold text-lg">{myTest.archetype}</div>
                  <div className="text-sm text-gray-600">
                    Score: {myTest.profile_score.toFixed(0)}/100
                  </div>
                  <div className="text-xs text-gray-500">
                    Completed: {formatDateTime(myTest.test_date)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/daylight/result/${myTest.id}`}>
                  <Button variant="outline">
                    View Results
                  </Button>
                </Link>
                <Link href="/dashboard/daylight/test">
                  <Button variant="outline">
                    Retake Test
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-600">
                You haven't taken the personality test yet
              </p>
              <Link href="/dashboard/daylight/test">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Play className="mr-2 h-5 w-5" />
                  Start Assessment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/daylight/test')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Take Personality Test
            </CardTitle>
            <CardDescription>
              15 questions • 5 minutes • Discover your archetype
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              {myTest ? 'Retake Test' : 'Start Test'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/daylight/matching/new')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-600" />
              Create Matching Session
            </CardTitle>
            <CardDescription>
              SMART algorithm automatically determines optimal groups (3-5 people)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              New Session
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Matching Sessions</CardTitle>
              <CardDescription>
                View and manage your matching sessions
              </CardDescription>
            </div>
            <Link href="/dashboard/daylight/matching">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No matching sessions yet</p>
              <Link href="/dashboard/daylight/matching/new">
                <Button className="mt-4" variant="outline">
                  Create First Session
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <Link key={session.id} href={`/dashboard/daylight/matching/${session.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium">{session.session_name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {session.total_participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {session.total_tables} tables
                        </span>
                        {session.average_match_score && (
                          <span>
                            Avg: {session.average_match_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'default'
                            : session.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {session.status}
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
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