import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { currentUser } = useApp();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give AppContext time to check for existing session
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking for existing session
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
