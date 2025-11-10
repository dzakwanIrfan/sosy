import { api } from '@/lib/api';
import { API_CONFIG } from '@/constants/config';

// ==================== Types ====================

export interface PersonalityTestAnswers {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  q11: string;
  q12: string;
  q13: string;
  q14: string;
  q15: string;
}

export interface PersonalityTestSubmission {
  answers: PersonalityTestAnswers;
}

export interface PersonalityTestResult {
  id: number;
  user_id: number;
  test_date: string;
  e_raw: number;
  o_raw: number;
  s_raw: number;
  a_raw: number;
  c_raw: number;
  l_raw: number;
  e_normalized: number;
  o_normalized: number;
  s_normalized: number;
  a_normalized: number;
  c_normalized: number;
  l_normalized: number;
  profile_score: number;
  archetype: string;
  archetype_symbol: string;
  archetype_description?: string;
  relationship_status?: string;
  looking_for?: string;
  gender_comfort?: string;
  answers: PersonalityTestAnswers;
  created_at: string;
}

export interface PersonalityTestListItem {
  id: number;
  user_id: number;
  test_date: string;
  archetype: string;
  archetype_symbol: string;
  profile_score: number;
  created_at: string;
}

export interface MatchingParticipant {
  user_id: number;
  username: string;
  full_name?: string;
  archetype: string;
  archetype_symbol: string;
  profile_score: number;
}

export interface MatchScoreDetail {
  user1_id: number;
  user1_name: string;
  user2_id: number;
  user2_name: string;
  e_diff: number;
  o_diff: number;
  s_diff: number;
  a_diff: number;
  trait_similarity: number;
  lifestyle_bonus: number;
  comfort_bonus: number;
  serendipity_bonus: number;
  total_match_score: number;
  meets_threshold: boolean;
}

export interface MatchingTableResult {
  table_number: number;
  table_size: number;
  average_match_score: number;
  members: MatchingParticipant[];
  pairwise_scores: MatchScoreDetail[];
}

export interface MatchingSessionCreate {
  session_name: string;
  participant_user_ids: number[];
  min_match_threshold?: number;
  // REMOVED: target_group_size - sistem yang tentukan otomatis
}

export interface MatchingSessionResult {
  id: number;
  session_name: string;
  created_by: number;
  creator_name: string;
  status: string;
  total_participants: number;
  total_tables: number;
  average_match_score?: number;
  min_match_threshold: number;
  tables: MatchingTableResult[];
  unmatched_participants: MatchingParticipant[];
  created_at: string;
  completed_at?: string;
  // NEW: Algorithm insights
  optimal_size_used: number;
  size_distribution: Record<number, number>;
}

export interface MatchingSessionSummary {
  id: number;
  session_name: string;
  created_by: number;
  creator_name: string;
  status: string;
  total_participants: number;
  total_tables: number;
  average_match_score?: number;
  created_at: string;
  completed_at?: string;
}

// ==================== API Methods ====================

export const daylightApi = {
  // Personality Test
  submitTest: async (answers: PersonalityTestAnswers): Promise<PersonalityTestResult> => {
    return api.post<PersonalityTestResult>(API_CONFIG.ENDPOINTS.DAYLIGHT_TEST, { answers });
  },

  getMyTest: async (): Promise<PersonalityTestResult | null> => {
    return api.get<PersonalityTestResult | null>(API_CONFIG.ENDPOINTS.DAYLIGHT_TEST_ME);
  },

  getUserTest: async (userId: number): Promise<PersonalityTestResult> => {
    return api.get<PersonalityTestResult>(`${API_CONFIG.ENDPOINTS.DAYLIGHT_TEST}/user/${userId}`);
  },

  getAllTests: async (params?: { skip?: number; limit?: number }): Promise<PersonalityTestListItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_CONFIG.ENDPOINTS.DAYLIGHT_TESTS}${queryParams.toString() ? '?' + queryParams : ''}`;
    return api.get<PersonalityTestListItem[]>(url);
  },

  // Matching
  createMatchingSession: async (data: MatchingSessionCreate): Promise<MatchingSessionResult> => {
    return api.post<MatchingSessionResult>(API_CONFIG.ENDPOINTS.DAYLIGHT_MATCHING, data);
  },

  getMatchingSession: async (sessionId: number): Promise<MatchingSessionResult> => {
    return api.get<MatchingSessionResult>(`${API_CONFIG.ENDPOINTS.DAYLIGHT_MATCHING}/${sessionId}`);
  },

  getAllMatchingSessions: async (params?: { skip?: number; limit?: number }): Promise<MatchingSessionSummary[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_CONFIG.ENDPOINTS.DAYLIGHT_MATCHING}${queryParams.toString() ? '?' + queryParams : ''}`;
    return api.get<MatchingSessionSummary[]>(url);
  },
};