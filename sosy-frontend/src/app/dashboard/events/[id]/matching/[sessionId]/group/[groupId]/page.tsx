'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { matchingApi, MatchScoreDetail } from '@/lib/api/matching';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const sessionId = params.sessionId as string;
  const groupId = params.groupId as string;

  const [scores, setScores] = useState<MatchScoreDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await matchingApi.getGroupMatchScores(parseInt(groupId));
        setScores(response);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch match scores');
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchScores();
    }
  }, [groupId]);

  const getCriteriaColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-blue-500';
    if (score >= 0.3) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const criteriaLabels = {
    social_energy_score: 'Social Energy Balance',
    conversation_style_score: 'Conversation Style',
    social_goal_score: 'Social Goal',
    group_size_score: 'Group Size Preference',
    gender_comfort_score: 'Gender Comfort',
    interest_score: 'Interests & Activities',
    life_context_score: 'Life Stage',
    cultural_score: 'Cultural Background',
    financial_score: 'Financial Comfort',
    reliability_score: 'Reliability & Trust',
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !scores.length) {
    return (
      <div className="flex h-[600px] flex-col items-center justify-center space-y-4">
        <p className="text-red-500">{error || 'No match scores found'}</p>
        <Button
          onClick={() =>
            router.push(`/dashboard/events/${eventId}/matching/${sessionId}`)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/events/${eventId}/matching/${sessionId}`)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Detailed Match Scores
            </h2>
            <p className="text-muted-foreground">
              Pairwise compatibility analysis for all group members
            </p>
          </div>
        </div>
      </div>

      {/* Match Scores */}
      <div className="space-y-4">
        {scores.map((score, index) => (
          <Card key={`${score.user1_id}-${score.user2_id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {score.user1_name} ↔ {score.user2_name}
                  </CardTitle>
                  <CardDescription>
                    Matched on {score.matching_criteria_count} out of 10 criteria
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="text-2xl font-bold text-primary">
                      {score.total_match_score.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={score.total_match_score} className="mt-2 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(criteriaLabels).map(([key, label]) => {
                  const scoreValue = score[key as keyof MatchScoreDetail] as number;
                  const percentage = scoreValue * 100;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all ${getCriteriaColor(
                            scoreValue
                          )}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}