'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService } from '@/lib/auth';
import { User, LoginCredentials } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const fetchUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      clearAuthState();
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      console.info('User authenticated successfully');
    } catch (error: any) {
      console.error('Authentication failed:', error.message);
      clearAuthState();
      authService.logout();
      
      // Only show error if it's not a simple unauthorized error
      if (error.response?.status !== 401) {
        toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [clearAuthState]);

  // Initialize auth state on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      console.info('Attempting login for user:', credentials.username);
      
      // Clear any existing auth state
      clearAuthState();
      
      // Perform login
      await authService.login(credentials);
      console.info('Login successful, fetching user data');
      
      // Fetch user data
      await fetchUser();
      
      console.info('User data fetched successfully');
    } catch (error: any) {
      console.error('Login failed:', error.message);
      clearAuthState();
      throw error;
    }
  };

  const logout = useCallback(() => {
    console.info('User logged out');
    clearAuthState();
    authService.logout();
    toast.success('Logged out successfully');
  }, [clearAuthState]);

  const refetchUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    refetchUser,
    clearAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}