import React from 'react';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

export interface GridItem {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  fullWidth?: boolean;
}

interface DetailGridProps {
  title?: string;
  items: GridItem[];
}

export const DetailGrid: React.FC<DetailGridProps> = ({ title, items }) => {
  const { styles } = useAppTheme(getStyles);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.sectionHeader}>{title}</Text>}
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={index} style={[styles.card, item.fullWidth && { minWidth: '100%' }]}>
            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
              <MaterialDesignIcons name={item.icon as any} size={18} color={item.iconColor} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value} numberOfLines={1}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: rfValue(11),
    fontFamily: FontFamily.extraBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border + '10',
    gap: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: rfValue(9),
    fontFamily: FontFamily.bodyBold,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.heading,
    color: theme.colors.text,
  },
});
