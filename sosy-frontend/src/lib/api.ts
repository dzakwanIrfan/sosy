import axios, { AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { API_CONFIG, APP_CONFIG } from '@/constants/config';
import { ApiError, ApiResponse } from './types';
import { toast } from 'sonner';

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get(APP_CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    const statusCode = error.response?.status;
    const url = error.config?.url;
    
    console.error(`API Error: ${statusCode} ${url}`, {
      status: statusCode,
      message: error.message,
      data: error.response?.data,
    });

    if (statusCode === 401) {
      // Token expired atau invalid
      Cookies.remove(APP_CONFIG.TOKEN_KEY);
      
      // Only show toast if not on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (statusCode === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (statusCode === 404) {
      toast.error('Requested resource not found.');
    } else if (statusCode && statusCode >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Generic API functions
export const api = {
  get: <T>(url: string): Promise<T> =>
    apiClient.get(url).then((response) => response.data),
  
  post: <T>(url: string, data?: any): Promise<T> =>
    apiClient.post(url, data).then((response) => response.data),
  
  put: <T>(url: string, data?: any): Promise<T> =>
    apiClient.put(url, data).then((response) => response.data),
  
  delete: <T>(url: string): Promise<T> =>
    apiClient.delete(url).then((response) => response.data),
};