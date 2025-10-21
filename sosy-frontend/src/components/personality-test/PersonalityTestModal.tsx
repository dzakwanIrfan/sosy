'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { personalityTestApi, PersonalityTestResult } from '@/lib/api/personality-test';
import { format } from 'date-fns';
import { 
  User,
  CalendarDays, 
  AlertCircle,
  Info,
  Sparkles,
  Award
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PersonalityTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wpUserId: number;
  userName?: string;
}

export function PersonalityTestModal({
  open,
  onOpenChange,
  wpUserId,
  userName,
}: PersonalityTestModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<PersonalityTestResult | null>(null);

  useEffect(() => {
    if (open && wpUserId) {
      fetchTestResult();
    }
  }, [open, wpUserId]);

  const fetchTestResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await personalityTestApi.getTestResult(wpUserId);
      setTestResult(result);
    } catch (err: any) {
      console.error('Error fetching personality test:', err);
      setError(err.response?.data?.detail || 'Failed to load personality test results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="text-xl">Personality Assessment</DialogTitle>
              {userName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{userName}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="px-6 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : testResult ? (
          <ScrollArea className="h-[calc(85vh-140px)]">
            <div className="px-6 pb-6 space-y-6">
              {/* Personality Type Card */}
              {testResult.personality_type && (
                <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Personality Type</p>
                      <p className="text-2xl font-semibold">{testResult.personality_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Completed on{' '}
                    {testResult.date_finished
                      ? format(new Date(testResult.date_finished), 'MMMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <Badge variant="outline">{testResult.answers.length} Questions</Badge>
              </div>

              <Separator />

              {/* Responses Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Assessment Responses</h3>
                
                <div className="space-y-3">
                  {testResult.answers.map((answer, index) => (
                    <div
                      key={`${answer.question_id}-${answer.answer_id}`}
                      className="group rounded-lg border bg-card transition-colors hover:border-primary/50"
                    >
                      <div className="p-4 space-y-3">
                        {/* Question */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-relaxed">
                              {answer.question_text}
                            </p>
                            {answer.question_description && (
                              <p className="text-xs text-muted-foreground">
                                {answer.question_description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Answer */}
                        <div className="ml-9 space-y-2">
                          <div className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                            <span className="text-sm">{answer.answer_text}</span>
                            {answer.answer_points !== null && answer.answer_points !== undefined && (
                              <div className="flex items-center gap-1 ml-1 pl-2 border-l">
                                <Award className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                  {answer.answer_points} {answer.answer_points === 1 ? 'pt' : 'pts'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {answer.custom_answer_text && (
                            <div className="rounded-md bg-accent/50 px-3 py-2">
                              <p className="text-xs text-muted-foreground italic">
                                "{answer.custom_answer_text}"
                              </p>
                            </div>
                          )}
                          
                          {answer.answer_feedback && (
                            <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
                              <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-blue-900 dark:text-blue-300">
                                {answer.answer_feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}