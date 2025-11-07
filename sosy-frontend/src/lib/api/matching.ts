import { apiClient } from '../api';

export interface UserProfile {
  id: number;
  wp_user_id: number;
  social_energy: string | null;
  conversation_style: string | null;
  social_goal: string | null;
  group_size_preference: number | null;
  gender: string | null;
  gender_preference: string | null;
  activity_types: string[] | null;
  discussion_topics: string[] | null;
  life_stage: string | null;
  cultural_background: string | null;
  price_tier: string | null;
  reliability_score: number;
  attendance_rate: number;
  created_at: string;
  updated_at: string | null;
}

export interface UserProfileCreate {
  wp_user_id: number;
  social_energy?: string;
  conversation_style?: string;
  social_goal?: string;
  group_size_preference?: number;
  gender?: string;
  gender_preference?: string;
  activity_types?: string[];
  discussion_topics?: string[];
  life_stage?: string;
  cultural_background?: string;
  price_tier?: string;
}

export interface UserProfileUpdate {
  social_energy?: string;
  conversation_style?: string;
  social_goal?: string;
  group_size_preference?: number;
  gender?: string;
  gender_preference?: string;
  activity_types?: string[];
  discussion_topics?: string[];
  life_stage?: string;
  cultural_background?: string;
  price_tier?: string;
  reliability_score?: number;
  attendance_rate?: number;
}

export interface MatchingSession {
  id: number;
  event_id: number;
  event_name: string | null;
  session_date: string | null;
  status: string;
  target_group_size: number;
  conversation_style: string;
  created_at: string;
}

export interface GroupMember {
  user_id: number;
  username: string;
  email: string;
  display_name: string | null;
  social_energy: string | null;
  match_score: number | null;
  has_personality_test: boolean;
}

export interface MatchingGroup {
  id: number;
  session_id: number;
  group_number: number;
  group_size: number;
  average_match_score: number;
  members: GroupMember[];
  created_at: string;
}

export interface MatchingResult {
  session: MatchingSession;
  groups: MatchingGroup[];
  total_users: number;
  matched_users: number;
  unmatched_users: number;
  average_group_score: number;
}

export interface MatchScoreDetail {
  user1_id: number;
  user1_name: string;
  user2_id: number;
  user2_name: string;
  social_energy_score: number;
  conversation_style_score: number;
  social_goal_score: number;
  group_size_score: number;
  gender_comfort_score: number;
  interest_score: number;
  life_context_score: number;
  cultural_score: number;
  financial_score: number;
  reliability_score: number;
  total_match_score: number;
  matching_criteria_count: number;
}

export interface EnergyFeedbackCreate {
  group_id: number;
  user_id: number;
  rated_user_id: number;
  energy_impact: 'energized' | 'neutral' | 'drained';
  rating: number;
  feedback_text?: string;
}

export interface EnergyFeedback {
  id: number;
  group_id: number;
  user_id: number;
  rated_user_id: number;
  energy_impact: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
}

// ==================== API Functions ====================

export const matchingApi = {
  // User Profile APIs
  async getUserProfile(wpUserId: number): Promise<UserProfile> {
    const response = await apiClient.get(`/matching/profiles/${wpUserId}`);
    return response.data;
  },

  async createUserProfile(data: UserProfileCreate): Promise<UserProfile> {
    const response = await apiClient.post('/matching/profiles', data);
    return response.data;
  },

  async updateUserProfile(
    wpUserId: number,
    data: UserProfileUpdate
  ): Promise<UserProfile> {
    const response = await apiClient.put(`/matching/profiles/${wpUserId}`, data);
    return response.data;
  },

  // Matching APIs
  async createMatching(
    eventId: number,
    targetGroupSize: number = 4,
    conversationStyle: 'deep' | 'casual' = 'deep'
  ): Promise<MatchingResult> {
    const response = await apiClient.post(
      `/matching/events/${eventId}/match`,
      null,
      {
        params: {
          target_group_size: targetGroupSize,
          conversation_style: conversationStyle,
        },
      }
    );
    return response.data;
  },

  async getMatchingSession(sessionId: number): Promise<MatchingResult> {
    const response = await apiClient.get(`/matching/sessions/${sessionId}`);
    return response.data;
  },

  async getEventSessions(eventId: number): Promise<MatchingSession[]> {
    const response = await apiClient.get(`/matching/events/${eventId}/sessions`);
    return response.data;
  },

  async getGroupMatchScores(groupId: number): Promise<MatchScoreDetail[]> {
    const response = await apiClient.get(`/matching/groups/${groupId}/scores`);
    return response.data;
  },

  // Energy Feedback APIs
  async createEnergyFeedback(data: EnergyFeedbackCreate): Promise<EnergyFeedback> {
    const response = await apiClient.post('/matching/feedback', data);
    return response.data;
  },
};