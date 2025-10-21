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
  personality_type: string | null; 
  answers: PersonalityTestAnswer[];
}

export interface PersonalityTestStatus {
  has_completed: boolean;
  latest_test_id: number | null;
  date_finished: string | null;
  total_answers: number;
}

export const personalityTestApi = {
  checkStatus: async (wpUserId: number): Promise<PersonalityTestStatus> => {
    const response = await apiClient.get(`/personality-test/status/${wpUserId}`);
    return response.data;
  },

  getTestResult: async (wpUserId: number): Promise<PersonalityTestResult> => {
    const response = await apiClient.get(`/personality-test/${wpUserId}`);
    return response.data;
  },

  getTestByTqbId: async (tqbUserId: number): Promise<PersonalityTestResult> => {
    const response = await apiClient.get(`/personality-test/by-tqb-id/${tqbUserId}`);
    return response.data;
  },
};