'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { DAYLIGHT_QUESTIONS } from '@/data/daylight-questions';
import { daylightApi, PersonalityTestAnswers } from '@/lib/api/daylight';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function PersonalityTestPage() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<PersonalityTestAnswers>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const currentQuestion = DAYLIGHT_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / DAYLIGHT_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === DAYLIGHT_QUESTIONS.length - 1;
  const isAllAnswered = Object.keys(answers).length === DAYLIGHT_QUESTIONS.length;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Auto advance after short delay
    if (currentQuestionIndex < DAYLIGHT_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < DAYLIGHT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!isAllAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await daylightApi.submitTest(answers as PersonalityTestAnswers);
      toast.success('Test submitted successfully!');
      router.push(`/dashboard/daylight/result/${result.id}`);
    } catch (error: any) {
      console.error('Failed to submit test:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Daylight Personality Assessment
              </h1>
              <p className="text-lg text-gray-600">
                Discover your unique "Day" archetype
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold text-blue-900">What you'll discover:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Your personality archetype (one of 10 unique "Day" types)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Detailed trait analysis across 6 dimensions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Insights for better social connections</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">15</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">~5</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-600">10</div>
                <div className="text-sm text-gray-600">Archetypes</div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
              onClick={() => setIsStarted(true)}
            >
              Start Assessment
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-gray-500">
              You can go back and change your answers anytime
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Personality Assessment</h2>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {DAYLIGHT_QUESTIONS.length}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {currentQuestion.section}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% Complete</p>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-8">
              {/* Question */}
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid gap-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id as keyof PersonalityTestAnswers] === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={cn(
                        'group relative p-6 rounded-xl border-2 transition-all text-left',
                        'hover:border-blue-400 hover:shadow-lg hover:scale-[1.02]',
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Radio Circle */}
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                          )}
                        >
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium text-gray-900">
                              {option.label}
                            </span>
                            {option.trait && (
                              <Badge variant="secondary" className="text-xs">
                                {option.trait}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>

          <div className="flex gap-2">
            {DAYLIGHT_QUESTIONS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentQuestionIndex
                    ? 'w-8 bg-blue-600'
                    : answers[DAYLIGHT_QUESTIONS[index].id as keyof PersonalityTestAnswers]
                    ? 'bg-blue-400'
                    : 'bg-gray-300'
                )}
              />
            ))}
          </div>

          {isLastQuestion && isAllAnswered ? (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit & See Results
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleNext}
              disabled={currentQuestionIndex === DAYLIGHT_QUESTIONS.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Answer Summary */}
        <Card className="bg-white/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Answered: {Object.keys(answers).length} / {DAYLIGHT_QUESTIONS.length}
              </span>
              {!isAllAnswered && (
                <span className="text-amber-600">
                  {DAYLIGHT_QUESTIONS.length - Object.keys(answers).length} questions remaining
                </span>
              )}
              {isAllAnswered && (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  All questions answered!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}