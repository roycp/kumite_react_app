import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        router.replace('/screens/MainScreen');
      } else {
        router.replace('/screens/HomeScreen');
      }
    }
  }, [isLoading, currentUser]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <ActivityIndicator size="large" color="#6750a4" />
    </View>
  );
}
