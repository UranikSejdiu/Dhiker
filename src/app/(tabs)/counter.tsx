import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useDhikr } from '../../context/DhikrContext';
import * as Haptics from 'expo-haptics';
import Fireworks from '../../components/Fireworks';

const { width, height } = Dimensions.get('window');

export default function CounterScreen() {
  const { selectedDhikr, dhikrs, increment, decrement, selectDhikr, resetDaily } = useDhikr();
  const [mode, setMode] = useState<'increment' | 'decrement'>('increment');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const warningFadeAnim = useRef(new Animated.Value(0)).current;
  
  const [showFireworks, setShowFireworks] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Auto-select first dhikr if none selected
  useEffect(() => {
    if (!selectedDhikr && dhikrs.length > 0) {
      selectDhikr(dhikrs[0].id);
    }
  }, [dhikrs, selectedDhikr]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate warning message
  useEffect(() => {
    if (showLimitWarning) {
      Animated.timing(warningFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(warningFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showLimitWarning]);

  const clearWarning = () => {
    if (showLimitWarning) setShowLimitWarning(false);
  };

  const handleTap = async () => {
    if (!selectedDhikr) return;
    
    if (mode === 'increment') {
      // Check if already at or over limit
      if (selectedDhikr.dailyLimit !== null && selectedDhikr.dailyCount >= selectedDhikr.dailyLimit) {
        setShowLimitWarning(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return; // Block increment
      }

      // Check if this exact tap will hit the limit
      const isHittingLimit = selectedDhikr.dailyLimit !== null && (selectedDhikr.dailyCount + 1 === selectedDhikr.dailyLimit);

      const success = await increment(selectedDhikr.id);
      if (success && isHittingLimit) {
        setShowFireworks(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } else {
      clearWarning();
      if (selectedDhikr.dailyCount > 0) {
        await decrement(selectedDhikr.id);
      }
    }
  };

  const cycleDhikr = (direction: 'next' | 'prev') => {
    if (dhikrs.length === 0) return;
    clearWarning();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const currentIndex = dhikrs.findIndex(d => d.id === selectedDhikr?.id);
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % dhikrs.length;
    } else {
      newIndex = (currentIndex - 1 + dhikrs.length) % dhikrs.length;
    }
    selectDhikr(dhikrs[newIndex].id);
  };

  const toggleMode = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMode(prev => prev === 'increment' ? 'decrement' : 'increment');
  };

  const handleReset = async () => {
    if (!selectedDhikr) return;
    clearWarning();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    if (window.confirm && Platform.OS === 'web') {
       if(window.confirm('Reset this dhikr to 0?')) {
          await resetDaily(selectedDhikr.id);
       }
    } else {
       await resetDaily(selectedDhikr.id);
    }
  };

  if (!selectedDhikr) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No Dhikrs Found. Add one in the Dhikrs tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showFireworks && (
        <Fireworks onComplete={() => setShowFireworks(false)} />
      )}

      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => cycleDhikr('prev')}>
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.dhikrNameContainer}>
          <Text style={styles.dhikrName} numberOfLines={2}>
            {selectedDhikr.name}
          </Text>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={() => cycleDhikr('next')}>
          <Text style={styles.navIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Main Counter Area */}
      <TouchableOpacity 
        style={styles.mainCounterArea} 
        activeOpacity={1} 
        onPress={handleTap}
      >
        <Animated.Text style={[styles.massiveNumber, { opacity: fadeAnim }]}>
          {selectedDhikr.dailyCount}
        </Animated.Text>
        
        {/* Warning Message positioned under the massive number */}
        <Animated.View style={[styles.warningContainer, { opacity: warningFadeAnim }]}>
          <Text style={styles.warningText}>Change daily limit if you want to do more dhikr</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        {/* Mode Toggle Button */}
        <TouchableOpacity style={styles.toolButton} onPress={toggleMode}>
          <Text style={[styles.toolIcon, mode === 'decrement' && styles.toolIconActive]}>
            {mode === 'increment' ? '+' : '−'}
          </Text>
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity style={styles.toolButton} onPress={handleReset}>
          <Text style={styles.toolIcon}>↺</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60, // Avoid safe area
    paddingBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  navIcon: {
    color: '#555',
    fontSize: 50,
    fontWeight: '300',
    lineHeight: 50,
  },
  dhikrNameContainer: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dhikrName: {
    color: '#2ECC71', // Emerald Green from screenshot
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainCounterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Prevent text selection and accidental zoom on web
    userSelect: 'none',
    touchAction: 'none',
  },
  massiveNumber: {
    color: '#888',
    fontSize: 160,
    fontWeight: '200',
    letterSpacing: -5,
  },
  warningContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  warningText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingBottom: 50, // Space for tab bar
  },
  toolButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toolIcon: {
    color: '#888',
    fontSize: 28,
    fontWeight: '300',
  },
  toolIconActive: {
    color: '#E74C3C', // Red when in decrement mode
  },
});
