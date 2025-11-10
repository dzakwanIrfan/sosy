'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, ArrowLeft, Share2, Download, 
  TrendingUp, Users, Heart, Zap, Brain, Target
} from 'lucide-react';
import { daylightApi, PersonalityTestResult } from '@/lib/api/daylight';
import { ARCHETYPE_DETAILS } from '@/data/daylight-questions';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<PersonalityTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const data = await daylightApi.getMyTest();
      setResult(data);
    } catch (error: any) {
      console.error('Failed to fetch result:', error);
      toast.error('Failed to load test result');
      router.push('/dashboard/daylight/test');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && result) {
      navigator.share({
        title: `I'm a ${result.archetype}!`,
        text: `I just discovered my personality type: ${result.archetype} ${result.archetype_symbol}`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copy link
        copyLink();
      });
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No test result found</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/daylight/test')}>
              Take Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const archetypeDetail = ARCHETYPE_DETAILS[result.archetype];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/daylight">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Result Card */}
        <Card className="shadow-2xl border-2 border-blue-200">
          <CardContent className="p-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-6xl">
              {result.archetype_symbol}
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">
                Your Personality Type
              </Badge>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {result.archetype}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {archetypeDetail?.description || result.archetype_description}
              </p>
            </div>

            {archetypeDetail?.traits && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {archetypeDetail.traits.map((trait, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {trait}
                  </Badge>
                ))}
              </div>
            )}

            <Separator className="my-6" />

            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {result.profile_score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-3xl font-bold text-purple-600">15</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div>
                <div className="text-3xl font-bold text-pink-600">
                  {new Date(result.test_date).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trait Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Your Personality Traits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TraitBar
              icon={Zap}
              label="Social Energy"
              value={result.e_normalized}
              leftLabel="Introvert"
              rightLabel="Extrovert"
              color="blue"
            />
            <TraitBar
              icon={Sparkles}
              label="Openness"
              value={result.o_normalized}
              leftLabel="Practical"
              rightLabel="Abstract"
              color="purple"
            />
            <TraitBar
              icon={Target}
              label="Structure"
              value={result.s_normalized}
              leftLabel="Structured"
              rightLabel="Flexible"
              color="pink"
            />
            <TraitBar
              icon={Heart}
              label="Decision Style"
              value={result.a_normalized}
              leftLabel="Thinking"
              rightLabel="Feeling"
              color="red"
            />
            <TraitBar
              icon={Users}
              label="Social Comfort"
              value={result.c_normalized}
              leftLabel="Reserved"
              rightLabel="Outgoing"
              color="green"
            />
            <TraitBar
              icon={TrendingUp}
              label="Lifestyle"
              value={result.l_normalized}
              leftLabel="Budget"
              rightLabel="Premium"
              color="amber"
            />
          </CardContent>
        </Card>

        {/* Context Information */}
        {(result.relationship_status || result.looking_for || result.gender_comfort) && (
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {result.relationship_status && (
                <div>
                  <div className="text-sm text-gray-600">Relationship Status</div>
                  <div className="font-medium capitalize">
                    {result.relationship_status === 'A' && 'Single'}
                    {result.relationship_status === 'B' && 'In a Relationship'}
                    {result.relationship_status === 'C' && 'Prefer not to say'}
                  </div>
                </div>
              )}
              {result.looking_for && (
                <div>
                  <div className="text-sm text-gray-600">Looking For</div>
                  <div className="font-medium capitalize">
                    {result.looking_for === 'A' && 'New Friends'}
                    {result.looking_for === 'B' && 'Networking'}
                    {result.looking_for === 'C' && 'Shared Hobbies'}
                    {result.looking_for === 'D' && 'Open to Anything'}
                  </div>
                </div>
              )}
              {result.gender_comfort && (
                <div>
                  <div className="text-sm text-gray-600">Group Preference</div>
                  <div className="font-medium capitalize">
                    {result.gender_comfort === 'A' && 'Mixed Gender OK'}
                    {result.gender_comfort === 'B' && 'Same Gender Preferred'}
                    {result.gender_comfort === 'C' && 'Depends on Vibe'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Ready to find your perfect match?
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/dashboard/daylight/test')}>
                  Retake Test
                </Button>
                <Link href="/dashboard/daylight/matching">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Users className="mr-2 h-4 w-4" />
                    Create Matching
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TraitBarProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
  color: 'blue' | 'purple' | 'pink' | 'red' | 'green' | 'amber';
}

function TraitBar({ icon: Icon, label, value, leftLabel, rightLabel, color }: TraitBarProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    pink: 'bg-pink-600',
    red: 'bg-red-600',
    green: 'bg-green-600',
    amber: 'bg-amber-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', `text-${color}-600`)} />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-sm font-medium">{value.toFixed(0)}%</span>
      </div>
      <div className="relative">
        <Progress value={value} className="h-3" />
        <div
          className={cn('absolute top-0 left-0 h-full rounded-full transition-all', colorClasses[color])}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}