import LoadingScreen from '../components/LoadingScreen';

/**
 * This is the root entry point of the app.
 * It simply renders a loading screen.
 * The actual navigation logic (auth check and redirect)
 * is handled by the AuthProvider, which wraps the entire app
 * in the root _layout.tsx file.
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (user.role === 'renter') router.replace('/(renter)');
      else if (user.role === 'freelancer') router.replace('/(freelancer)');
      else router.replace('/error');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, user]);

  return <LoadingScreen />;
}

