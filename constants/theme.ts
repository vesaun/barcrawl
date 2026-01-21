/**
 * Dark Bar Crawl Theme - Deep, moody colors with fiery orange/red accents
 */

import { Platform } from 'react-native';

// Dark, thirst-inducing color palette
const fireOrange = '#FF6B35'; // Primary accent - fiery orange
const deepRed = '#E74C3C'; // Secondary accent - vibrant red
const darkBrown = '#2C1810'; // Deep brown background
const charcoal = '#1A1A1A'; // Dark charcoal
const warmOrange = '#F95700'; // Bright warm orange
const burgundy = '#C0392B'; // Deep burgundy
const darkWood = '#3E2723'; // Dark wood tone
const lightCream = '#FFF8E7'; // Light cream for text
const mutedGold = '#D4A574'; // Muted gold accent

const tintColorLight = fireOrange;
const tintColorDark = warmOrange;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: lightCream,
    background: darkBrown,
    tint: tintColorDark,
    icon: mutedGold,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: warmOrange,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Theme constants for dark bar theme
export const ThemeColors = {
  // Background colors
  backgroundPrimary: darkBrown,
  backgroundSecondary: darkWood,
  backgroundCard: '#3E2F25',
  backgroundSurface: '#4A3428',
  
  // Accent colors (thirst-inducing)
  accentOrange: fireOrange,
  accentRed: deepRed,
  accentWarmOrange: warmOrange,
  accentBurgundy: burgundy,
  
  // Text colors
  textPrimary: lightCream,
  textSecondary: '#C4A87C',
  textMuted: '#8B7355',
  
  // Border & shadows
  border: '#6B5744',
  borderLight: '#5A4A38',
  shadow: 'rgba(0, 0, 0, 0.6)',
  
  // Special
  charcoal: charcoal,
  mutedGold: mutedGold,
};
