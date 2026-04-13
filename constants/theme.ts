/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// ── KumiteApp design tokens ───────────────────────────────────────────────────
// Single source of truth for all inline styles across screens and components.

export const KumiteTheme = {
  colors: {
    primary:      '#6750a4',
    primaryLight: '#f3eeff',
    primaryAlt:   '#ede7f6',
    dark:         '#1a1a2e',
    success:      '#2e7d32',
    successLight: '#e8f5e9',
    error:        '#b3261e',
    errorLight:   '#fce8e6',
    background:   '#f5f5f5',
    card:         '#fff',
    border:       '#e0e0e0',
    borderLight:  '#efefef',
    muted:        '#888',
    mutedLight:   '#aaa',
    text:         '#333',
    textSub:      '#555',
    textLight:    '#666',
  },
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
  },
  radius: {
    sm:   8,
    md:   12,
    lg:   14,
    xl:   20,
    pill: 24,
  },
  shadow: {
    card:         '0 2px 8px rgba(0,0,0,0.08)',
    modal:        '0 8px 40px rgba(0,0,0,0.3)',
    input:        '0 2px 8px rgba(0,0,0,0.06)',
    hoverPrimary: '0 4px 16px rgba(103,80,164,0.2)',
  },
  font: {
    family: 'Roboto, sans-serif',
    size: {
      xs:   11,
      sm:   12,
      md:   13,
      base: 14,
      lg:   15,
      xl:   16,
      '2xl': 20,
      '3xl': 22,
      '4xl': 26,
    },
    weight: {
      normal:    400,
      medium:    500,
      semibold:  600,
      bold:      700,
      extrabold: 800,
    },
  },
} as const;

// ── Dark theme — same token shape, dark palette from AI stitch designs ────────
export const KumiteThemeDark = {
  colors: {
    primary:      '#c7bfff',
    primaryLight: '#4331a8',
    primaryAlt:   '#31353c',
    dark:         '#dfe2eb',
    success:      '#81c784',
    successLight: '#1b5e20',
    error:        '#ffb4ab',
    errorLight:   '#93000a',
    background:   '#10141a',
    card:         '#1c2026',
    border:       '#474553',
    borderLight:  '#31353c',
    muted:        '#928f9e',
    mutedLight:   '#6e6b7a',
    text:         '#dfe2eb',
    textSub:      '#c9c4d5',
    textLight:    '#a09cb0',
  },
  spacing:  KumiteTheme.spacing,
  radius:   KumiteTheme.radius,
  shadow: {
    card:         '0 2px 16px rgba(0,0,0,0.4)',
    modal:        '0 8px 40px rgba(0,0,0,0.6)',
    input:        '0 2px 8px rgba(0,0,0,0.3)',
    hoverPrimary: '0 4px 16px rgba(199,191,255,0.2)',
  },
  font:     KumiteTheme.font,
} as const;

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

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
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
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
