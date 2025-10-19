import Cookies from 'js-cookie';
import { api, apiClient } from './api';
import { API_CONFIG, APP_CONFIG } from '@/constants/config';
import { LoginCredentials, Token, User } from './types';

export const authService = {
  // Login function - sesuaikan dengan backend
  async login(credentials: LoginCredentials): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const tokenData: Token = await response.json();
      
      // Store token in cookie
      Cookies.set(APP_CONFIG.TOKEN_KEY, tokenData.access_token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return tokenData;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout function
  logout(): void {
    Cookies.remove(APP_CONFIG.TOKEN_KEY);
    // Don't redirect immediately, let the component handle it
  },

  // Get current user - fix endpoint sesuai backend
  async getCurrentUser(): Promise<User> {
    try {
      return await api.post<User>(API_CONFIG.ENDPOINTS.TEST_TOKEN);
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = Cookies.get(APP_CONFIG.TOKEN_KEY);
    return !!token;
  },

  // Get token
  getToken(): string | undefined {
    return Cookies.get(APP_CONFIG.TOKEN_KEY);
  },

  // Validate token
  async validateToken(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },
};