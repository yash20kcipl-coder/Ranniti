import React from 'react';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface ProfileInfoTileProps {
  label: string;
  value?: string | number | null;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  valueColor?: string;
  valueStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPress?: () => void;
  activeOpacity?: number;
  theme?: Theme;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
}

export const ProfileInfoTile: React.FC<ProfileInfoTileProps> = ({
  label,
  value = '—',
  icon,
  iconColor = '#2563EB',
  iconBg = '#EFF6FF',
  valueColor,
  valueStyle,
  numberOfLines = 1,
  onPress,
  activeOpacity = 0.7,
  theme,
  style,
  backgroundColor = '#F8FAFC',
  borderColor = '#E2E8F0',
}) => {
  const isPressable = Boolean(onPress);
  const Container = isPressable ? TouchableOpacity : View;
  const containerProps = isPressable ? { activeOpacity, onPress } : {};

  return (
    <Container
      {...containerProps}
      style={[
        styles.tile,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      <View style={styles.tileHeader}>
        <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
          <MaterialDesignIcons name={icon} size={14} color={iconColor} />
        </View>
        <View style={{ flex: 1, flexShrink: 1 }}>
          <Text
            style={[
              styles.label,
              { color: theme?.colors?.textSecondary || '#64748B' },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.value,
              { color: valueColor || theme?.colors?.text || '#0F172A' },
              valueStyle,
            ]}
            numberOfLines={numberOfLines}
          >
            {value ?? '—'}
          </Text>
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  tile: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11.5),
  },
  value: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13.5),
  },
});
