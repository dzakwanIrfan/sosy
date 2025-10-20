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

export interface UserListResponse {
  data: SosyUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
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

export interface GetUsersParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  is_active?: boolean;
  is_superuser?: boolean;
}

export const usersApi = {
  // Get all users with server-side pagination, sorting, filtering
  getUsers: async (params: GetUsersParams = {}): Promise<UserListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.is_superuser !== undefined) queryParams.append('is_superuser', params.is_superuser.toString());
    
    const url = `${API_CONFIG.ENDPOINTS.USERS}?${queryParams}`;
    return api.get<UserListResponse>(url);
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