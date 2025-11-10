'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Users, TrendingUp, CheckCircle2, 
  AlertCircle, RefreshCw, Info, Sparkles
} from 'lucide-react';
import { daylightApi, MatchingSessionResult } from '@/lib/api/daylight';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/table-utils';

export default function MatchingResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);
  
  const [result, setResult] = useState<MatchingSessionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState<number[]>([]);

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      const data = await daylightApi.getMatchingSession(sessionId);
      setResult(data);
      // Auto-expand all tables
      setExpandedTables(data.tables.map(t => t.table_number));
    } catch (error: any) {
      console.error('Failed to fetch result:', error);
      toast.error('Failed to load matching result');
      router.push('/dashboard/daylight/matching');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTable = (tableNumber: number) => {
    setExpandedTables(prev =>
      prev.includes(tableNumber)
        ? prev.filter(n => n !== tableNumber)
        : [...prev, tableNumber]
    );
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

  const getMatchQualityColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-orange-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Matching session not found</p>
            <Link href="/dashboard/daylight/matching">
              <Button className="mt-4">Back to Matching</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if match quality is lower than threshold
  const hasLowQualityMatches = result.tables.some(t => t.average_match_score < result.min_match_threshold);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/daylight/matching">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchResult()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                {result.session_name}
              </CardTitle>
              <CardDescription className="mt-2">
                Created by {result.creator_name} • {formatDateTime(result.created_at)}
              </CardDescription>
            </div>
            <Badge className={cn('border', getStatusColor(result.status))}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-gray-600">Total Participants</div>
              <div className="text-2xl font-bold">{result.total_participants}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tables Created</div>
              <div className="text-2xl font-bold">{result.total_tables}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Match Score</div>
              <div className={cn("text-2xl font-bold", getMatchQualityColor(result.average_match_score || 0))}>
                {result.average_match_score?.toFixed(1) || '0.0'}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Most Common Size</div>
              <div className="text-2xl font-bold">{result.optimal_size_used} people</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMART Algorithm Info */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-blue-900">🎯 SMART Algorithm Results</div>
            <div className="text-blue-800">
              <p className="mb-2">
                Our algorithm automatically determined the optimal group sizes based on participant compatibility:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.size_distribution).map(([size, count]) => (
                  <Badge key={size} variant="outline" className="bg-white">
                    {count} table(s) of {size} people
                  </Badge>
                ))}
              </div>
              {hasLowQualityMatches && (
                <p className="mt-2 text-xs">
                  Note: Some groups were formed with adjusted thresholds to maximize participation while maintaining reasonable compatibility.
                </p>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Match Quality Summary */}
      {result.tables.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Match Quality Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">Excellent Matches</div>
                <div className="text-2xl font-bold text-green-600">
                  {result.tables.filter(t => t.average_match_score >= 70).length}
                </div>
                <div className="text-xs text-gray-500">≥70% compatibility</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">Good Matches</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.tables.filter(t => t.average_match_score >= 60 && t.average_match_score < 70).length}
                </div>
                <div className="text-xs text-gray-500">60-69% compatibility</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-600">Fair Matches</div>
                <div className="text-2xl font-bold text-amber-600">
                  {result.tables.filter(t => t.average_match_score < 60).length}
                </div>
                <div className="text-xs text-gray-500">&lt;60% compatibility</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      {result.tables.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Matched Tables
          </h3>
          
          {result.tables.map((table) => {
            const isExpanded = expandedTables.includes(table.table_number);
            const matchQuality = 
              table.average_match_score >= 70 ? 'excellent' :
              table.average_match_score >= 60 ? 'good' : 'fair';
            
            return (
              <Card key={table.table_number} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleTable(table.table_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {table.table_number}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Table {table.table_number}
                        </CardTitle>
                        <CardDescription>
                          {table.table_size} members • {table.average_match_score.toFixed(1)}% avg match
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge 
                          variant={table.average_match_score >= 70 ? 'default' : 'secondary'}
                          className={cn(
                            "text-sm",
                            table.average_match_score >= 70 && "bg-green-100 text-green-800 border-green-200",
                            table.average_match_score >= 60 && table.average_match_score < 70 && "bg-blue-100 text-blue-800 border-blue-200",
                            table.average_match_score < 60 && "bg-amber-100 text-amber-800 border-amber-200"
                          )}
                        >
                          {table.average_match_score >= 70 ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <Info className="mr-1 h-3 w-3" />
                          )}
                          {table.average_match_score.toFixed(1)}%
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {matchQuality} match • {table.table_size} people
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    {/* Members */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-600">Members</h4>
                      <div className="grid gap-3">
                        {table.members.map((member) => (
                          <div 
                            key={member.user_id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-700 font-semibold">
                                {member.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {member.full_name || member.username}
                                </div>
                                <div className="text-sm text-gray-600">
                                  @{member.username}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {member.archetype_symbol} {member.archetype}
                              </Badge>
                              <div className="text-sm text-gray-600">
                                {member.profile_score.toFixed(0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pairwise Scores */}
                    {table.pairwise_scores && table.pairwise_scores.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4 className="font-medium text-sm text-gray-600">Match Details</h4>
                        <div className="grid gap-2">
                          {table.pairwise_scores.map((score, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{score.user1_name}</span>
                                <span className="text-gray-400">↔</span>
                                <span className="font-medium">{score.user2_name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-600">
                                  Trait: {score.trait_similarity.toFixed(1)}%
                                </span>
                                <Badge 
                                  variant={score.total_match_score >= 70 ? 'default' : 'secondary'}
                                  className={cn(
                                    "text-xs",
                                    score.total_match_score >= 70 && "bg-green-100 text-green-800",
                                    score.total_match_score < 70 && "bg-amber-100 text-amber-800"
                                  )}
                                >
                                  {score.total_match_score.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-gray-600">No tables created</p>
            <p className="text-sm text-gray-500 mt-1">
              Not enough participants or compatibility scores too low
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unmatched Participants */}
      {result.unmatched_participants.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Unmatched Participants
            </CardTitle>
            <CardDescription>
              {result.unmatched_participants.length} participant(s) couldn't be matched
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {result.unmatched_participants.map((member) => (
                <div 
                  key={member.user_id}
                  className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-900 font-semibold">
                      {member.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{member.full_name || member.username}</div>
                      <div className="text-sm text-gray-600">@{member.username}</div>
                    </div>
                  </div>
                  
                  <Badge variant="outline">
                    {member.archetype_symbol} {member.archetype}
                  </Badge>
                </div>
              ))}
            </div>
            
            {/* Enhanced Info */}
            <Alert className="mt-4 border-amber-300 bg-white">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-900">
                <div className="font-medium mb-2">Why weren't they matched?</div>
                {result.unmatched_participants.length >= 3 ? (
                  <p>
                    These {result.unmatched_participants.length} participants have significantly different personality traits that resulted in very low compatibility scores with all other participants and among themselves. 
                    The algorithm tried multiple thresholds (70% → 50%) and even attempted to force group them, but their compatibility was too low to create a meaningful connection.
                  </p>
                ) : (
                  <p>
                    Only {result.unmatched_participants.length} participant(s) remain, which is below the minimum group size of 3 people. 
                    They may have good personalities but couldn't form a complete group with the available participants.
                  </p>
                )}
                <div className="mt-2 text-xs text-amber-700">
                  <strong>Recommendation:</strong> Consider running another session with more participants, or manually review their profiles to understand compatibility issues.
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}