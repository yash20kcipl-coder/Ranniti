import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { Theme } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const { theme, styles } = useAppTheme((t) => getStyles(t, variant, disabled));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : theme.colors.primary} />
      ) : (
        <>
          {icon ? icon : null}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (theme: Theme, variant: string, disabled: boolean) => StyleSheet.create({
  button: {
    gap: 8,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor:
      variant === 'primary'
        ? disabled
          ? theme.colors.border
          : theme.colors.primary
        : 'transparent',
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: variant === 'outline' ? theme.colors.border : theme.colors.primary,
    paddingHorizontal: theme.space.lg,
  },
  text: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(14.5),
    color:
      disabled
        ? theme.colors.textSecondary + '80'
        : variant === 'primary'
          ? isDarkColor(theme.colors.primary) ? '#FFF' : theme.colors.text
          : theme.colors.textSecondary,
  },
});

// Simple helper to determine if text should be white or black based on bg color
const isDarkColor = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 155;
};
