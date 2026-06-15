import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { DhikrProvider } from '../context/DhikrContext';
import InstallPrompt from '../components/InstallPrompt';

import { AppThemeProvider, useAppTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';

function RootContent() {
  const { colors, themeName } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={themeName === 'pure-light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
      <InstallPrompt />
    </View>
  );
}

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
    <LanguageProvider>
      <AppThemeProvider>
        <AuthProvider>
          <DhikrProvider>
            <Head>
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
              <link rel="manifest" href="/manifest.json" />
              <link rel="icon" href="/favicon.ico" />
              <link rel="apple-touch-icon" href="/icon-192.png" />
            </Head>
            <RootContent />
          </DhikrProvider>
        </AuthProvider>
      </AppThemeProvider>
    </LanguageProvider>
  );
}

