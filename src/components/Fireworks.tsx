import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

const PARTICLES = 50;
const EMOJIS = ['🎉', '✨', '🌟', '💫', '🎊', '💚', '🤲', '☪️', '🕌', '📿', '🌙', '⭐', '🥳', '🏆'];

export default function Fireworks({ onComplete }: { onComplete: () => void }) {
  const animations = useRef([...Array(PARTICLES)].map(() => new Animated.Value(0))).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger particle launches for a more natural burst feel
    const particleAnims = animations.map((anim, i) => {
      return Animated.sequence([
        Animated.delay(Math.random() * 300), // Random stagger up to 300ms
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800 + Math.random() * 1200,
          useNativeDriver: true,
        }),
      ]);
    });

    // Banner slides in then fades out
    const bannerSequence = Animated.sequence([
      Animated.spring(bannerAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(bannerAnim, {
        toValue: 2,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([
      Animated.stagger(30, particleAnims),
      bannerSequence,
    ]).start(() => {
      onComplete();
    });
  }, [animations, bannerAnim, onComplete]);

  // Banner interpolations
  const bannerScale = bannerAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.3, 1, 1.1],
  });
  const bannerOpacity = bannerAnim.interpolate({
    inputRange: [0, 0.5, 1, 1.8, 2],
    outputRange: [0, 1, 1, 1, 0],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Emoji particles */}
      {animations.map((anim, index) => {
        // Burst from center
        const startX = width / 2;
        const startY = height / 2;

        // Spread across the entire screen
        const angle = (index / PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const distance = (Math.random() * 0.4 + 0.3) * Math.max(width, height);
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;

        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [startX, endX],
        });

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [startY, endY],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.2, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        });

        const rotation = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${(Math.random() - 0.5) * 1080}deg`],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.15, 0.5, 1],
          outputRange: [0, Math.random() * 1.2 + 1, Math.random() * 0.8 + 0.8, 0.3],
        });

        const emoji = EMOJIS[index % EMOJIS.length];

        return (
          <Animated.Text
            key={index}
            style={[
              styles.particle,
              {
                transform: [{ translateX }, { translateY }, { rotate: rotation }, { scale }],
                opacity,
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        );
      })}

      {/* Congratulation Banner */}
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            transform: [{ scale: bannerScale }],
            opacity: bannerOpacity,
          },
        ]}
      >
        <Text style={styles.bannerEmoji}>🤲</Text>
        <Text style={styles.bannerTitle}>ما شاء الله</Text>
        <Text style={styles.bannerSubtitle}>Daily Goal Complete!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 30,
    top: 0,
    left: 0,
  },
  bannerContainer: {
    backgroundColor: 'rgba(26, 122, 82, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(201, 168, 76, 0.6)',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E8D48B',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F0E8',
    opacity: 0.9,
  },
});
