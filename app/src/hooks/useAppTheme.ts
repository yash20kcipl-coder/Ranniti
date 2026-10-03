import { Theme } from '../constants/theme';
import { useMemo, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function useAppTheme<T extends Record<string, any> = Record<string, any>>(
  styleFactory?: (theme: Theme, insets?: any) => T
): { theme: Theme; styles: T } {
  const { getTheme, insets } = useContext(ThemeContext);
  const theme = getTheme();

  const styles = useMemo(() => {
    if (!styleFactory) return {} as T;
    return styleFactory(theme, insets);
  }, [theme, styleFactory, insets]);

  return {
    theme,
    styles,
  };
}
