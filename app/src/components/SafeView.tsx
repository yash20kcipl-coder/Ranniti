import {
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface SafeViewProps {
  children: React.ReactNode;
  hideTop?: boolean;
  style?: StyleProp<ViewStyle>;
  statusBarColor?: string;
  barStyle?: 'light-content' | 'dark-content';
}

export const SafeView: React.FC<SafeViewProps> = ({
  children,
  hideTop = true,
  style,
  statusBarColor,
  barStyle,
  ...props
}) => {
  const { theme } = useAppTheme();

  return (
    <>
      {hideTop && (
        <StatusBar
          backgroundColor={statusBarColor || 'transparent'}
          barStyle={barStyle || (theme.colors.background === '#F9FAFB' ? 'dark-content' : 'light-content')}
          translucent
        />
      )}
      <SafeAreaView
        {...props}
        style={[{ flex: 1, backgroundColor: theme.colors.background, }, style]}
        edges={hideTop ? ['left', 'right', 'bottom'] : ['top', 'left', 'right', 'bottom']}
      >
        {children}
      </SafeAreaView>
    </>
  );
};
