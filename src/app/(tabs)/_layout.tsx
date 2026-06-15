import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none', height: 0 },
      }}
    >
      <Tabs.Screen name="counter" />
      <Tabs.Screen name="dhikrs" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
