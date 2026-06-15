import React from 'react';
import { Image, StyleSheet, Platform } from 'react-native';

interface FlagIconProps {
  countryCode: string; // ISO 3166-1 alpha-2 code (e.g., 'gb', 'de')
  size?: number;
}

/**
 * Renders a country flag as an image using flagcdn.com.
 * This avoids the issue of emoji flags rendering as individual letters
 * on Windows and some web browsers.
 */
export default function FlagIcon({ countryCode, size = 20 }: FlagIconProps) {
  const code = countryCode.toLowerCase();
  // flagcdn provides PNG flags in various sizes
  // Use w40 (40px width) for crisp 2x rendering at size=20
  const pxSize = Math.round(size * 2);
  const uri = `https://flagcdn.com/w${Math.min(pxSize, 80)}/${code}.png`;

  return (
    <Image
      source={{ uri }}
      style={[
        styles.flag,
        {
          width: Math.round(size * 1.4), // flags are wider than tall
          height: size,
        },
      ]}
      resizeMode="contain"
      accessibilityLabel={`${countryCode.toUpperCase()} flag`}
    />
  );
}

const styles = StyleSheet.create({
  flag: {
    borderRadius: 2,
  },
});
