import { API_URL, getBestApiUrl } from '@/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug log for API URL configuration
console.log('API Configuration - Initial API_URL:', API_URL);
console.log('Environment API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set in environment');

// Create a singleton config object to hold the dynamic URL
const ApiConfig = {
  BASE_URL: 'http://192.168.101.3:3001', // Hardcoded for reliability
};

// Log the final API URL being used
console.log('Final API URL:', ApiConfig.BASE_URL);

// Function to initialize the API with the best available URL
export const initializeApi = async () => {
  try {
    const bestUrl = await getBestApiUrl();
    ApiConfig.BASE_URL = bestUrl;
    console.log('API initialized with URL:', ApiConfig.BASE_URL);

    // Verify the API is actually reachable by making a health check
    try {
      const healthPromise = fetch(`${ApiConfig.BASE_URL}/health`, { method: 'GET' });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timed out')), 3000));
      const response = await Promise.race([healthPromise, timeoutPromise]) as Response;

      if (response.ok) {
        console.log('API health check successful');
      } else {
        console.warn('API health check failed with status:', response.status);
      }
    } catch (healthError) {
      console.warn('API health check failed:', healthError);
    }
  } catch (error) {
    console.error('Failed to initialize API URL, using default:', ApiConfig.BASE_URL);
  }
};

// Initialize on import
initializeApi().catch(console.error);

// Log the environment
console.log('Environment:', __DEV__ ? 'Development' : 'Production');
// Note: This log might show the default URL initially due to the async initialization
console.log('Initial API URL:', ApiConfig.BASE_URL);

// Create a simple axios-like API client
export const api = {
  async get(endpoint: string, options = {}) {
    const { params } = options as any;
    const requestUrl = `${ApiConfig.BASE_URL}${endpoint}`;
    console.log(`🌐 GET ${requestUrl}`);
    
    if (params) {
      console.log('Query params:', params);
    }
    
    let finalEndpoint = endpoint;
        if (!endpoint.startsWith('/products') && !endpoint.startsWith('/auth') && !endpoint.startsWith('/api') && !endpoint.startsWith('/bookings')) {
      finalEndpoint = `/api${endpoint}`;
    }
        let url = `${ApiConfig.BASE_URL}${finalEndpoint}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      url = queryString ? `${url}?${queryString}` : url;
    }
    
    const token = await AsyncStorage.getItem('userToken');
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error: any) {
      console.error(`API GET error (${finalEndpoint}):`, error.message);
      throw error;
    }
  },
  
  async post(endpoint: string, data: any, options: any = {}) {
    const { headers = {} } = options;
    const requestUrl = `${ApiConfig.BASE_URL}${endpoint}`;
    console.log(`📤 POST ${requestUrl}`, data);
    
    if (Object.keys(headers).length > 0) {
      console.log('Request headers:', headers);
    }
    let finalEndpoint = endpoint;
        if (!endpoint.startsWith('/products') && !endpoint.startsWith('/auth') && !endpoint.startsWith('/api') && !endpoint.startsWith('/bookings')) {
      finalEndpoint = `/api${endpoint}`;
    }
        const url = `${ApiConfig.BASE_URL}${finalEndpoint}`;
    
    const token = await AsyncStorage.getItem('userToken');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const responseData = await response.json().catch(() => ({ success: true }));
      return { data: responseData };
    } catch (error: any) {
      console.error(`API POST error (${finalEndpoint}):`, error.message);
      throw error;
    }
  },
  
  async put(endpoint: string, data: any, options: any = {}) {
    const { headers = {} } = options;
    const requestUrl = `${ApiConfig.BASE_URL}${endpoint}`;
    console.log(`✏️ PUT ${requestUrl}`, data);
    
    if (Object.keys(headers).length > 0) {
      console.log('Request headers:', headers);
    }
    let finalEndpoint = endpoint;
        if (!endpoint.startsWith('/products') && !endpoint.startsWith('/auth') && !endpoint.startsWith('/api') && !endpoint.startsWith('/bookings')) {
      finalEndpoint = `/api${endpoint}`;
    }
        const url = `${ApiConfig.BASE_URL}${finalEndpoint}`;
    
    const token = await AsyncStorage.getItem('userToken');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const responseData = await response.json().catch(() => ({ success: true }));
      return { data: responseData };
    } catch (error: any) {
      console.error(`API PUT error (${finalEndpoint}):`, error.message);
      throw error;
    }
  },
  
  async delete(endpoint: string, options: any = {}) {
    let finalEndpoint = endpoint;
    if (!endpoint.startsWith('/products') && !endpoint.startsWith('/auth') && !endpoint.startsWith('/api') && !endpoint.startsWith('/bookings')) {
      finalEndpoint = `/api${endpoint}`;
    }
    const requestUrl = `${ApiConfig.BASE_URL}${finalEndpoint}`;
    console.log(`🗑️ DELETE ${requestUrl}`);
    
    if (options && Object.keys(options).length > 0) {
      console.log('Request options:', options);
    }
    
    const token = await AsyncStorage.getItem('userToken');
    
    try {
      const response = await fetch(requestUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json().catch(() => ({ success: true }));
      return { data };
    } catch (error: any) {
      console.error(`API DELETE error (${finalEndpoint}):`, error.message);
      throw error;
    }
  }
};

// Auth service methods
export const authService = {
  async login(email: string, password: string) {
    try {
      const loginUrl = `${ApiConfig.BASE_URL}/auth/login`;
      console.log('🔑 Attempting login to:', loginUrl);
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response);
      
      if (response.data && response.data.token && response.data.user) {
        // Flatten profile.profileImage to profileImage for easier access in app
        const normalizedUser = {
          ...response.data.user,
          profileImage: (response.data.user as any).profile?.profileImage || response.data.user.profileImage,
        };
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(normalizedUser));
        return { token: response.data.token, user: normalizedUser };
      }
      
      throw new Error('Invalid login response from server');
    } catch (error: any) {
      console.error('Login service error:', error.message);
      throw error;
    }
  },
  
  async register(userData: any) {
    const { username, email, password, passwordConfirm, role, firstName, lastName } = userData;
    const userDataToSend = {
      username,
      email,
      password,
      passwordConfirm,
      role: role || 'user',
      firstName: firstName || username,
      lastName: lastName || ''
    };
    
    try {
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 Registration attempt ${attempt}/3`);
          
          const registerUrl = `${ApiConfig.BASE_URL}/auth/register`;
          console.log('📝 Registration URL:', registerUrl);
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), attempt * 5000);
          });
          
          const fetchPromise = fetch(registerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(userDataToSend)
          });
          
          const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Registration API error:', {
              status: response.status,
              statusText: response.statusText,
              data
            });
            
            if (data.message && data.message.toLowerCase().includes('already exists')) {
              throw new Error(data.message || 'User already exists');
            }
            
            if (response.status >= 500) {
              lastError = new Error(data.message || 'Registration failed');
              continue;
            }
            
            throw new Error(data.message || 'Registration failed');
          }
          
          console.log('Registration successful:', data);
          return data;
        } catch (error: any) {
          lastError = error;
          
          if (error.message && (
              error.message.includes('Network request failed') ||
              error.message.includes('already exists')
          )) {
            throw error;
          }
          
          console.log(`Attempt ${attempt} failed, ${attempt < 3 ? 'retrying...' : 'giving up.'}`);
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      throw lastError || new Error('Registration failed after multiple attempts');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },
  
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  async updateProfile(profileData: any) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data) {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const updatedUserData = { ...parsedUserData, ...response.data };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}; 

export default authService; 