import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { getShadow } from '../utils/shadow';
import { Theme } from '../constants/theme';

interface FabProps {
  icon?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
  iconColor?: string;
  size?: number;
}

export const Fab: React.FC<FabProps> = ({
  icon = 'plus',
  onPress,
  style,
  color,
  iconColor = '#FFFFFF',
  size = 25,
}) => {
  const { styles } = useAppTheme((t) => getStyles(t, color));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.fab, style]}
    >
      <MaterialDesignIcons name={icon as any} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const getStyles = (theme: Theme, color?: string) =>
  StyleSheet.create({
    fab: {
      right: 20,
      bottom: 30,
      position: 'absolute',
      padding: 12,
      borderRadius: 28,
      backgroundColor: color || theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...getShadow(5, color || theme.colors.primary, 0.4),
      zIndex: 10,
      elevation: 8,
    },
  });

export default Fab;
