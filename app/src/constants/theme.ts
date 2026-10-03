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
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#1E40AF', // Ranniti Royal Blue
  border: '#E2E8F0',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  loaderColor: '#1E40AF',
  header: '#1E40AF',
  headerText: '#0F172A',
  headerSubtle: '#ffffffff',
  pagebackground: '#F8FAFC',
  cardBorder: 'rgba(30, 64, 175, 0.1)',
  inputBackground: '#F1F5F9',
  vegBackground: 'rgba(30, 64, 175, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  subtleSurface: '#F8FAFC',
  shadowColor: '#1E40AF',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export const darkColors: ThemeColors = {
  background: '#0F172A', // Dark Navy / Slate
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  border: '#334155',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  loaderColor: '#3B82F6',
  header: '#0F172A',
  headerText: '#F8FAFC',
  headerSubtle: '#1E293B',
  pagebackground: '#0F172A',
  cardBorder: 'rgba(59, 130, 246, 0.15)',
  inputBackground: '#1E293B',
  vegBackground: 'rgba(59, 130, 246, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.85)',
  subtleSurface: '#1E293B',
  shadowColor: '#000000',
  glassBackground: 'rgba(30, 41, 59, 0.85)',
};

export const AppTheme = {
  light: {
    colors: lightColors,
    gradients: {
      primary: ['#1E40AF', '#3B82F6'],
      glass: ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.5)'],
      surface: ['#FFFFFF', '#F8FAFC'],
    },
    space,
  },
  dark: {
    colors: darkColors,
    gradients: {
      primary: ['#1E40AF', '#3B82F6'],
      glass: ['rgba(30, 41, 59, 0.85)', 'rgba(30, 41, 59, 0.5)'],
      surface: ['#1E293B', '#0F172A'],
    },
    space,
  },
};

export type Theme = typeof AppTheme.light;
