export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
  warning: string;
  info: string;
  loaderColor: string;
  header: string;
  headerText: string;
  headerSubtle: string;
  pagebackground: string;
  cardBorder: string;
  inputBackground: string;
  vegBackground: string;
  overlay: string;
  subtleSurface: string;
  shadowColor: string;
  glassBackground: string;
};

export type ThemeGradients = {
  primary: string[];
  glass: string[];
  surface: string[];
};

export type ThemeSpace = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

const space: ThemeSpace = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const lightColors: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  primary: '#059669', // Emerald 600
  border: '#E5E7EB',
  error: '#DC2626',
  warning: '#D97706',
  info: '#4F46E5',
  loaderColor: '#059669',
  header: '#FFFFFF',
  headerText: '#111827',
  headerSubtle: '#F3F4F6',
  pagebackground: '#F9FAFB',
  cardBorder: 'rgba(5, 150, 105, 0.1)',
  inputBackground: '#F3F4F6',
  vegBackground: 'rgba(5, 150, 105, 0.08)',
  overlay: 'rgba(17, 24, 39, 0.4)',
  subtleSurface: '#F9FAFB',
  shadowColor: '#059669',
  glassBackground: 'rgba(255, 255, 255, 0.75)',
};

export const darkColors: ThemeColors = {
  background: '#061612', // Very Dark Emerald/Slate
  surface: '#0D221E', // Dark Emerald Surface
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  primary: '#059669', // Emerald 600
  border: '#15362F',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#818CF8',
  loaderColor: '#059669',
  header: '#061612',
  headerText: '#F3F4F6',
  headerSubtle: '#0D221E',
  pagebackground: '#061612',
  cardBorder: 'rgba(5, 150, 105, 0.15)',
  inputBackground: '#15362F',
  vegBackground: 'rgba(5, 150, 105, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.85)',
  subtleSurface: '#15362F',
  shadowColor: '#000000',
  glassBackground: 'rgba(13, 34, 30, 0.75)',
};

export const AppTheme = {
  light: {
    colors: lightColors,
    gradients: {
      primary: ['#059669', '#10B981'],
      glass: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      surface: ['#FFFFFF', '#F9FAFB'],
    },
    space,
  },
  dark: {
    colors: darkColors,
    gradients: {
      primary: ['#059669', '#10B981'],
      glass: ['rgba(13, 34, 30, 0.7)', 'rgba(13, 34, 30, 0.3)'],
      surface: ['#0D221E', '#061612'],
    },
    space,
  },
};

export type Theme = typeof AppTheme.light;
