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
  const localIpUrl = 'http://192.168.101.3:3001';
  console.log('Testing connection to:', localIpUrl);
  
  if (await testConnection(localIpUrl)) {
    console.log(' Connection successful to local IP');
    return localIpUrl;
  }
  
  // If in development, try localhost as fallback
  if (__DEV__) {
    const localhostUrl = 'http://localhost:3001';
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
    android: 'http://192.168.101.3:3001',
    ios: 'http://192.168.101.3:3001',
    web: 'http://192.168.101.3:3001',
  },
  production: {
    android: 'http://192.168.101.3:3001',  // For testing, use local IP
    ios: 'http://192.168.101.3:3001',      // For testing, use local IP
    web: 'http://192.168.101.3:3001',      // For testing, use local IP
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