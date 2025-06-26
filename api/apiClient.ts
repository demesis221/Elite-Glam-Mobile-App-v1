import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Base URL configuration
const API_URL = {
  development: 'https://d163-203-177-60-25.ngrok-free.app',
  production: 'https://elite-glam-api.herokuapp.com/api',
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: __DEV__ ? API_URL.development : API_URL.production,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: any) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Handle unauthorized (e.g., redirect to login)
          break;
        case 404:
          console.error('Resource not found:', error.config?.url);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error, no response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
); 