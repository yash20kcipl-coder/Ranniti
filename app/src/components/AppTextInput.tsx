import {
  View,
  TextInput,
  Text,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import {
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import React, { useState } from 'react';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { useAppTheme } from '../hooks/useAppTheme';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { Theme } from '../constants/theme';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  icon?: string;
  rightIcon?: React.ReactNode;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  labelStyle,
  error,
  containerStyle,
  inputStyle,
  icon,
  rightIcon,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withSpring(1);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withSpring(0);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
        ]}
      >
        {!!icon && (
          <View style={styles.iconContainer}>
            <MaterialDesignIcons
              name={icon as any}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        )}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.textSecondary + '99'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.colors.primary}
          underlineColorAndroid="transparent"
          {...rest}
        />
        {rightIcon}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.space.md,
  },
  label: {
    fontSize: rfValue(15),
    color: theme.colors.text,
    marginBottom: theme.space.xs,
    fontFamily: FontFamily.bodyBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    minHeight: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '05',
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  iconContainer: {
    marginRight: theme.space.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: rfValue(13.5),
    color: theme.colors.text,
    paddingVertical: theme.space.sm,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: theme.colors.error,
    marginTop: theme.space.xs,
  },
});
