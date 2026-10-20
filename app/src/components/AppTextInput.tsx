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
import { Theme } from '../constants/theme';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from './MaterialDesignIcons';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  icon?: string;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  locked?: boolean;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  labelStyle,
  error,
  containerStyle,
  inputStyle,
  icon,
  rightIcon,
  disabled,
  locked,
  onFocus,
  onBlur,
  editable,
  ...rest
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const isNonEditable = disabled || editable === false;

  const handleFocus = (e: any) => {
    if (isNonEditable) return;
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
          isNonEditable && styles.inputContainerDisabled,
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
          style={[
            styles.input,
            isNonEditable && { color: theme.colors.textSecondary },
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.textSecondary + '99'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.colors.primary}
          underlineColorAndroid="transparent"
          editable={!isNonEditable}
          {...rest}
        />
        {rightIcon ? (
          rightIcon
        ) : locked ? (
          <View style={styles.lockIconContainer}>
            <MaterialDesignIcons name="lock-outline" size={16} color={theme.colors.textSecondary} />
          </View>
        ) : null}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: rfValue(13.5),
    color: theme.colors.text,
    marginBottom: 6,
    fontFamily: FontFamily.bold,
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
  inputContainerDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  lockIconContainer: {
    marginLeft: 6,
    paddingRight: 2,
  },
  iconContainer: {
    marginRight: theme.space.sm,
  },
  input: {
    flex: 1,
    fontSize: rfValue(15),
    color: theme.colors.text,
    fontFamily: FontFamily.medium,
    paddingVertical: theme.space.sm,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: theme.colors.error,
    marginTop: theme.space.xs,
  },
});
