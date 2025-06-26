import Constants from 'expo-constants';
import { Platform } from 'react-native';

type PlatformType = 'android' | 'ios' | 'web';

// Get the Expo tunnel URL if available
const getTunnelUrl = () => {
  if (Constants.expoConfig?.extra?.expoGoConfig?.debuggerHost) {
    const hostPort = Constants.expoConfig.extra.expoGoConfig.debuggerHost.split(':')[0];
    return `http://${hostPort}:3001`;
  }
  return null;
};

// List of fallback IPs to try if primary connection fails
// This can help with the IP whitelist issue in MongoDB Atlas
const FALLBACK_IPS = [
  '0d62-203-177-60-24.ngrok-free.app', // ngrok tunnel
  '192.168.101.3',  // Your computer's IP
  '192.168.101.1',  // Your router's IP
  '10.0.2.2',       // Android emulator to host loopback
  '127.0.0.1',      // localhost
  'localhost'       // localhost name
];

// Test connection to server
const testConnection = async (url: string): Promise<boolean> => {
  try {
    console.log('Testing connection to:', url);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 3000); // 3 seconds timeout
    });
    
    // Create the fetch promise
    const fetchPromise = fetch(`${url}/health`, { method: 'GET' });
    
    // Race the promises
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    console.log(`Connection to ${url}: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    return response.ok;
  } catch (error) {
    console.log(`Connection to ${url} failed:`, error);
    return false;
  }
};

// Get best working API URL
export const getBestApiUrl = async (): Promise<string> => {
  // Always try the local IP first (192.168.101.3)
  const localIpUrl = 'https://d163-203-177-60-25.ngrok-free.app';
  console.log('Testing connection to:', localIpUrl);
  
  if (await testConnection(localIpUrl)) {
    console.log(' Connection successful to local IP');
    return localIpUrl;
  }
  
  // If in development, try localhost as fallback
  if (__DEV__) {
    const localhostUrl = 'https://d163-203-177-60-25.ngrok-free.app';
    console.log('Testing connection to:', localhostUrl);
    
    if (await testConnection(localhostUrl)) {
      console.log(' Connection successful to localhost');
      return localhostUrl;
    }
  }
  
  // Fallback to the configured URL for the current environment
  const envUrl = API_URLS[ENV][PLATFORM as PlatformType];
  console.log('Falling back to environment URL:', envUrl);
  
  return envUrl;
};

// API URLs for different environments
const API_URLS = {
  development: {
    // Use direct IP for development
    android: 'https://d163-203-177-60-25.ngrok-free.app',
    ios: 'https://d163-203-177-60-25.ngrok-free.app',
    web: 'https://d163-203-177-60-25.ngrok-free.app',
  },
  production: {
    android: 'https://d163-203-177-60-25.ngrok-free.app',  // For testing, use local IP
    ios: 'https://d163-203-177-60-25.ngrok-free.app',      // For testing, use local IP
    web: 'https://d163-203-177-60-25.ngrok-free.app',      // For testing, use local IP
  },
};

// Get the current environment
const ENV = __DEV__ ? 'development' : 'production';

// Get the current platform and ensure it's one of our supported platforms
const PLATFORM = (Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web') 
  ? Platform.OS 
  : 'web';

// Export the API URL based on environment and platform
export const API_URL = API_URLS[ENV][PLATFORM as PlatformType];

// Log API URL for debugging
console.log('Using API URL:', API_URL);

// Export other API-related configurations
export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Base API configuration
export const BASE_API_CONFIG = {
  baseURL: 'https://d163-203-177-60-25.ngrok-free.app',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
};

// Function to test API connection
export const testApiConnection = async (): Promise<string> => {
  const testUrls = [
    BASE_API_CONFIG.baseURL,
    ...FALLBACK_IPS.map(ip => `http://${ip}:3001/api`)
  ].filter(Boolean) as string[];

  for (const url of testUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return url;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Connection to ${url} failed:`, errorMessage);
    }
  }
  throw new Error('No working API endpoints found');
};