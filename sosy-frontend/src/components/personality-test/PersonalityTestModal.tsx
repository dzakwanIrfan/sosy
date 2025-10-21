'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { personalityTestApi, PersonalityTestResult } from '@/lib/api/personality-test';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Award, 
  CheckCircle2, 
  MessageSquare,
  AlertCircle 
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Personality Test Results
          </DialogTitle>
          <DialogDescription>
            {userName ? `Test results for ${userName}` : 'View personality test answers and scores'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : testResult ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Total Points</p>
                        <p className="font-semibold">{testResult.total_points}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Total Answers</p>
                        <p className="font-semibold">{testResult.answers.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-semibold">
                          {testResult.date_started
                            ? format(new Date(testResult.date_started), 'MMM dd, yyyy')
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold">
                          {testResult.date_finished
                            ? format(new Date(testResult.date_finished), 'MMM dd, yyyy')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions and Answers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Questions & Answers
                </h3>

                {testResult.answers.map((answer, index) => (
                  <Card key={`${answer.question_id}-${answer.answer_id}`} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            {answer.answer_points !== null && (
                              <Badge variant="secondary" className="text-xs">
                                {answer.answer_points} pts
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-medium">
                            {answer.question_text}
                          </CardTitle>
                          {answer.question_description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {answer.question_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              {answer.answer_text}
                            </p>
                            {answer.custom_answer_text && (
                              <p className="text-sm text-green-700 mt-1 italic">
                                "{answer.custom_answer_text}"
                              </p>
                            )}
                            {answer.answer_feedback && (
                              <p className="text-xs text-green-600 mt-2">
                                💡 {answer.answer_feedback}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}