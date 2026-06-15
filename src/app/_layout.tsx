import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { DhikrProvider } from '../context/DhikrContext';
import InstallPrompt from '../components/InstallPrompt';

export default function RootLayout() {
  // Register the Service Worker for PWA offline support
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <DhikrProvider>
        <Head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#060D1B' },
              animation: 'fade',
            }}
          />
          <InstallPrompt />
        </View>
      </DhikrProvider>
    </AuthProvider>
  );
}

