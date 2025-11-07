'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { matchingApi, MatchingResult, MatchScoreDetail } from '@/lib/api/matching';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

export default function MatchingResultPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMatchingResult = async () => {
      try {
        setLoading(true);
        const response = await matchingApi.getMatchingSession(parseInt(sessionId));
        setData(response);
        
        // Expand first group by default
        if (response.groups.length > 0) {
          setExpandedGroups({ [response.groups[0].id]: true });
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch matching results');
        console.error('Error fetching matching result:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMatchingResult();
    }
  }, [sessionId]);

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center space-y-4">
        <p className="text-red-500">{error || 'Matching result not found'}</p>
        <Button onClick={() => router.push(`/dashboard/events/${eventId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Button>
      </div>
    );
  }

  const { session, groups, total_users, matched_users, unmatched_users, average_group_score } =
    data;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/events/${eventId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Matching Results</h2>
            <p className="text-muted-foreground">{session.event_name}</p>
          </div>
        </div>
        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
          {session.status}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_users}</div>
            <p className="text-xs text-muted-foreground">
              {session.conversation_style === 'deep' ? '4-person groups' : '6-person groups'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched Users</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matched_users}</div>
            <p className="text-xs text-muted-foreground">
              {((matched_users / total_users) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmatched Users</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unmatched_users}</div>
            <p className="text-xs text-muted-foreground">
              {((unmatched_users / total_users) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(average_group_score)}`}>
              {average_group_score.toFixed(1)}%
            </div>
            <Progress value={average_group_score} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Conversation Style</p>
              <p className="font-medium capitalize">{session.conversation_style}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Group Size</p>
              <p className="font-medium">{session.target_group_size} people</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">
                {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for unmatched users */}
      {unmatched_users > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {unmatched_users} user{unmatched_users > 1 ? 's' : ''} could not be matched into groups.
            This typically happens when the number of users is not divisible by the group size, or
            when users don't meet the minimum matching criteria (3+ similarities).
          </AlertDescription>
        </Alert>
      )}

      {/* Matched Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Matched Groups ({groups.length})</CardTitle>
          <CardDescription>
            Click on each group to see detailed member information and match scores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groups.length > 0 ? (
            groups.map((group) => (
              <Collapsible
                key={group.id}
                open={expandedGroups[group.id]}
                onOpenChange={() => toggleGroup(group.id)}
              >
                <div className="rounded-lg border bg-card">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          #{group.group_number}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Group {group.group_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.group_size} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Match Score</p>
                          <Badge variant={getScoreVariant(group.average_match_score)}>
                            {group.average_match_score.toFixed(1)}%
                          </Badge>
                        </div>
                        {expandedGroups[group.id] ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 space-y-4">
                      {/* Members List */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Members</h4>
                        <div className="grid gap-2">
                          {group.members.map((member) => (
                            <div
                              key={member.user_id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {member.display_name || member.username}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {member.social_energy && (
                                  <Badge variant="outline" className="capitalize">
                                    {member.social_energy}
                                  </Badge>
                                )}
                                {member.has_personality_test ? (
                                  <Badge variant="default" className="text-xs">
                                    Test Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    No Test
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* View Detailed Scores Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/events/${eventId}/matching/${sessionId}/group/${group.id}`
                          );
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Detailed Match Scores
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No groups were created. Please check the matching criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}