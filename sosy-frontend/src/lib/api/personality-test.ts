import { apiClient } from '@/lib/api';

export interface PersonalityTestAnswer {
  question_id: number;
  question_text: string;
  question_description: string | null;
  answer_id: number;
  answer_text: string;
  answer_points: number | null;
  answer_feedback: string | null;
  custom_answer_text: string | null;
}

export interface PersonalityTestResult {
  quiz_id: number;
  date_started: string | null;
  date_finished: string | null;
  total_points: number;
  answers: PersonalityTestAnswer[];
}

export interface PersonalityTestStatus {
  has_completed: boolean;
  latest_test_id: number | null;
  date_finished: string | null;
  total_answers: number;
}

export const personalityTestApi = {
  // Check if user has completed test
  checkStatus: async (wpUserId: number): Promise<PersonalityTestStatus> => {
    const response = await apiClient.get(`/personality-test/status/${wpUserId}`);
    return response.data;
  },

  // Get full test result
  getTestResult: async (wpUserId: number): Promise<PersonalityTestResult> => {
    const response = await apiClient.get(`/personality-test/${wpUserId}`);
    return response.data;
  },

  // Get test by TQB User ID
  getTestByTqbId: async (tqbUserId: number): Promise<PersonalityTestResult> => {
    const response = await apiClient.get(`/personality-test/by-tqb-id/${tqbUserId}`);
    return response.data;
  },
};