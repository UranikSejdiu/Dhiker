import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

// Detects if the user is on an iOS device
function isIOS(): boolean {
  if (Platform.OS !== 'web') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Detects if the app is already running as a standalone PWA (already installed)
function isStandalone(): boolean {
  if (Platform.OS !== 'web') return false;
  return (window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true;
}

export default function InstallPrompt() {
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const slideAnim = new Animated.Value(100);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // If already installed as PWA, show nothing
    if (isStandalone()) return;

    if (isIOS()) {
      // On iOS, show the manual instructions after a short delay
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => clearTimeout(timer);
    } else {
      // On Android/Desktop Chrome, listen for the browser's native install prompt
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowAndroidBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  // Animate in when banner becomes visible
  useEffect(() => {
    if (showAndroidBanner || showIOSGuide) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [showAndroidBanner, showIOSGuide]);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroidBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowAndroidBanner(false);
    setShowIOSGuide(false);
  };

  if (!showAndroidBanner && !showIOSGuide) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      {showIOSGuide ? (
        // iOS Manual Instructions
        <View style={styles.content}>
          <Text style={styles.emoji}>📲</Text>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Install Dhikr Counter</Text>
            <Text style={styles.subtitle}>
              Tap the <Text style={styles.highlight}>Share ↑</Text> button, then{' '}
              <Text style={styles.highlight}>"Add to Home Screen"</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Android/Desktop Install Banner
        <View style={styles.content}>
          <Text style={styles.emoji}>📿</Text>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Install Dhikr Counter</Text>
            <Text style={styles.subtitle}>Add to home screen for the best experience</Text>
          </View>
          <TouchableOpacity onPress={handleAndroidInstall} style={styles.installButton}>
            <Text style={styles.installText}>Install</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80, // sits just above the tab bar
    left: 16,
    right: 16,
    backgroundColor: '#1A2744',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: '#F5F0E8',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8A94A6',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  highlight: {
    color: '#C9A84C',
    fontWeight: '600',
  },
  installButton: {
    backgroundColor: '#C9A84C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  installText: {
    color: '#060D1B',
    fontWeight: '700',
    fontSize: 13,
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '600',
  },
});
