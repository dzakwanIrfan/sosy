import { api } from '@/lib/api';
import { API_CONFIG } from '@/constants/config';

export interface WordPressUser {
  ID: number;
  user_login: string;
  user_nicename: string;
  user_email: string;
  display_name?: string;
  user_url?: string;
  user_registered?: string;
  user_status: number;
  has_personality_test?: boolean; 
}

export interface WordPressUserListResponse {
  data: WordPressUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GetWordPressUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  user_status?: number;
}

export const wpUsersApi = {
  // Get all WordPress users with server-side pagination, sorting, filtering
  getUsers: async (params: GetWordPressUsersParams = {}): Promise<WordPressUserListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.user_status !== undefined) queryParams.append('user_status', params.user_status.toString());
    
    const url = `${API_CONFIG.ENDPOINTS.WP_USERS}?${queryParams}`;
    console.info('WordPress users API call:', url); // Debug log
    return api.get<WordPressUserListResponse>(url);
  },

  // Get WordPress user by ID
  getUserById: async (id: number): Promise<WordPressUser> => {
    return api.get<WordPressUser>(`${API_CONFIG.ENDPOINTS.WP_USERS}/${id}`);
  },
};