import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/api';

// User interface
interface User {
  id: string;
  email: string;
  role: 'renter' | 'freelancer' | 'user'; // Now supports 'user' as well
  name?: string; // Display name
  profileImage?: string; // Avatar/profile image URL
  // Add other user fields as needed
}

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  /**
   * Merge the provided partial user object into the current user and refresh consumers.
   */
  updateUser: (data: Partial<User>) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const router = useRouter();
  const segments = useSegments();

  // Debug: log state changes
  useEffect(() => {
    // console.log('[AuthContext] State changed:', state);
  }, [state]);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (state.isLoading) {
      // console.log('[AuthContext] Still loading, navigation not triggered');
      return;
    }
    if (!Array.isArray(segments) || typeof segments[0] !== 'string') {
      // console.log('[AuthContext] Segments not ready, navigation not triggered');
      return;
    }
    // console.log('[AuthContext] Navigation logic triggered');
    if (state.isAuthenticated && state.user) {
  const inAuthGroup = segments[0] === '(auth)';
  const allowedRoles = ['renter', 'freelancer', 'user'];
  if (!allowedRoles.includes(state.user.role)) {
    console.error(`[AuthContext] Unexpected user role: ${state.user.role}. Redirecting to /error.`);
    router.replace('/error');
    return;
  }
  const inRoleGroup =
  (state.user.role === 'user' && segments[0] === '(renter)') ||
  segments[0] === `(${state.user.role})`;
  if (inAuthGroup || !inRoleGroup) {
    if (state.user.role === 'renter' || state.user.role === 'user') {
      if (state.user.role === 'user') {
        console.warn('[AuthContext] Role is "user"; redirecting to renter dashboard by default.');
      }
      router.replace('/(renter)');
    } else if (state.user.role === 'freelancer') {
      router.replace('/(freelancer)');
    } else {
      router.replace('/error');
    }
  }
} else {
  const inAuthGroup = segments[0] === '(auth)';
  if (!inAuthGroup) {
    // console.log('[AuthContext] Redirecting to /(auth)/login');
    router.replace('/(auth)/login');
  }
}
  }, [state.isAuthenticated, state.isLoading, state.user, segments, router]);

  // Function to redirect based on user role
  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'renter':
        router.replace('/(renter)');
        break;
      case 'freelancer':
        router.replace('/(freelancer)');
        break;
      default:
        router.replace('/(renter)');
        break;
    }
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
  setState(prev => ({ ...prev, isLoading: true }));

  // Create a timeout promise to prevent hanging
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Authentication check timed out')), 5000)
  );

  try {
    // Race AsyncStorage calls against the timeout
    const [token, userDataString] = await Promise.race([
      Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userData')
      ]),
      timeoutPromise
    ]) as [string | null, string | null];

    if (token && userDataString) {
      const user = JSON.parse(userDataString);
      console.log('[checkAuth] Found token and user:', { token, user });
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } else {
      console.log('[checkAuth] No token or user found. Logging out.');
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  } catch (error) {
    console.error('[checkAuth] Failed to check auth status:', error);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    return false;
  }
};

// Fallback: If loading is stuck for more than 7 seconds, force isLoading=false
useEffect(() => {
  if (!state.isLoading) return;
  const timeout = setTimeout(() => {
    console.warn('[AuthProvider] Loading stuck >7s, forcing isLoading=false');
    setState(prev => ({ ...prev, isLoading: false }));
  }, 7000);
  return () => clearTimeout(timeout);
}, [state.isLoading]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { user, token } = await authService.login(email, password);
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Register function
  const register = async (userData: any): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.register(userData);
      setState(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Registration Successful', 'You can now log in with your credentials.');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Simple helper to update the user in memory (AsyncStorage already updated by services)
  const updateUser = (data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : prev.user,
    }));
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;