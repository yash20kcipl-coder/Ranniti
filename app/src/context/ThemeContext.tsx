import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { AppTheme, Theme } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  systemColorScheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  getTheme: () => Theme;
  insets: any;
}

const defaultContextValue: ThemeContextType = {
  mode: 'system',
  systemColorScheme: 'light',
  setMode: () => { },
  getTheme: () => AppTheme.light,
  insets: {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>('light');

  // useEffect(() => {
  //   const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  //     if (colorScheme) {
  //       setSystemColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
  //     }
  //   });

  //   return () => subscription.remove();
  // }, []);

  const getTheme = () => {
    const activeMode = mode === 'system' ? systemColorScheme : mode;
    return AppTheme[activeMode];
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        systemColorScheme,
        setMode,
        getTheme,
        insets
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
