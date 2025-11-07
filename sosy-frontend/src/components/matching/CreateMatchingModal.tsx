'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, MessageCircle, Loader2 } from 'lucide-react';
import { matchingApi, MatchingResult } from '@/lib/api/matching';
import { useRouter } from 'next/navigation';

interface CreateMatchingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventName: string;
  totalBuyers: number;
}

export function CreateMatchingModal({
  open,
  onOpenChange,
  eventId,
  eventName,
  totalBuyers,
}: CreateMatchingModalProps) {
  const router = useRouter();
  const [conversationStyle, setConversationStyle] = useState<'deep' | 'casual'>('deep');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupSize = conversationStyle === 'deep' ? 4 : 6;
  const estimatedGroups = Math.floor(totalBuyers / groupSize);
  const unmatchedUsers = totalBuyers % groupSize;

  const handleCreateMatching = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await matchingApi.createMatching(
        eventId,
        groupSize,
        conversationStyle
      );

      // Redirect to matching result page
      router.push(`/dashboard/events/${eventId}/matching/${result.session.id}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error creating matching:', err);
      setError(
        err.response?.data?.detail || 'Failed to create matching. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create SOSY Matching</DialogTitle>
          <DialogDescription>
            Configure matching parameters for {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Buyers</span>
              </div>
              <span className="text-lg font-bold">{totalBuyers}</span>
            </div>
          </div>

          {/* Conversation Style Selection */}
          <div className="space-y-3">
            <Label>Conversation Style</Label>
            <RadioGroup value={conversationStyle} onValueChange={(value: any) => setConversationStyle(value)}>
              <div className="space-y-3">
                {/* Deep Option */}
                <div
                  className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-colors ${
                    conversationStyle === 'deep'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setConversationStyle('deep')}
                >
                  <RadioGroupItem value="deep" id="deep" className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="deep"
                      className="cursor-pointer font-medium text-base"
                    >
                      Deep Conversation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Intimate 4-person groups for meaningful discussions
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>4 people per group</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>2 introverts + 1 ambivert + 1 extrovert</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Casual Option */}
                <div
                  className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-colors ${
                    conversationStyle === 'casual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setConversationStyle('casual')}
                >
                  <RadioGroupItem value="casual" id="casual" className="mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="casual"
                      className="cursor-pointer font-medium text-base"
                    >
                      Casual Conversation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Relaxed 6-person groups for light interactions
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>6 people per group</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>2 extroverts + 2 ambiverts + 2 introverts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Estimation */}
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Matching Estimation
            </p>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex justify-between">
                <span>Expected groups:</span>
                <span className="font-semibold">{estimatedGroups} groups</span>
              </div>
              <div className="flex justify-between">
                <span>Matched users:</span>
                <span className="font-semibold">
                  {estimatedGroups * groupSize} users
                </span>
              </div>
              {unmatchedUsers > 0 && (
                <div className="flex justify-between text-orange-700 dark:text-orange-300">
                  <span>Unmatched users:</span>
                  <span className="font-semibold">{unmatchedUsers} users</span>
                </div>
              )}
            </div>
          </div>

          {/* Minimum Requirement Warning */}
          {totalBuyers < groupSize && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Not enough buyers for matching. Minimum {groupSize} users required for{' '}
                {conversationStyle} conversation style.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateMatching}
            disabled={loading || totalBuyers < groupSize}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Matching'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}