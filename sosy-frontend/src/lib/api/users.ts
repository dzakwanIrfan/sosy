import { api } from '@/lib/api';
import { API_CONFIG } from '@/constants/config';

export interface SosyUser {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export const usersApi = {
  // Get all users (admin only)
  getUsers: async (params?: {
    skip?: number;
    limit?: number;
  }): Promise<SosyUser[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_CONFIG.ENDPOINTS.USERS}?${queryParams}`;
    return api.get<SosyUser[]>(url);
  },

  // Get user by ID
  getUserById: async (id: number): Promise<SosyUser> => {
    return api.get<SosyUser>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`);
  },

  // Create new user (admin only)
  createUser: async (userData: CreateUserRequest): Promise<SosyUser> => {
    return api.post<SosyUser>(API_CONFIG.ENDPOINTS.USERS, userData);
  },

  // Update user (admin only)
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<SosyUser> => {
    return api.put<SosyUser>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`, userData);
  },

  // Delete user (admin only)
  deleteUser: async (id: number): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`${API_CONFIG.ENDPOINTS.USERS}/${id}`);
  },

  // Get current user profile
  getCurrentUser: async (): Promise<SosyUser> => {
    return api.get<SosyUser>(`${API_CONFIG.ENDPOINTS.USERS}/me`);
  },

  // Update current user profile
  updateCurrentUser: async (userData: UpdateUserRequest): Promise<SosyUser> => {
    return api.put<SosyUser>(`${API_CONFIG.ENDPOINTS.USERS}/me`, userData);
  },
};