import { StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';
import { useMemo, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function useAppTheme<T>(
  styleFactory: (theme: Theme, insets: any) => T | StyleSheet.NamedStyles<T>
): { theme: Theme; styles: T };

export function useAppTheme(): { theme: Theme; styles: undefined };

export function useAppTheme<T>(
  styleFactory?: (theme: Theme, insets: any) => T | StyleSheet.NamedStyles<T>
) {
  const { getTheme, insets } = useContext(ThemeContext);
  const theme = getTheme();

  const styles = useMemo(() => {
    if (!styleFactory) return undefined;
    return StyleSheet.create(styleFactory(theme, insets) as any) as T;
  }, [theme, styleFactory, insets]);

  return {
    theme,
    styles,
  };
}
