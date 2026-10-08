import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { useLanguage } from '../../../languages';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';

interface BoothEmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  onRefresh?: () => void;
}

export const BoothEmptyState: React.FC<BoothEmptyStateProps> = ({
  searchQuery,
  onClearSearch,
  onRefresh,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const hasSearch = Boolean(searchQuery && searchQuery.trim());

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.subtleSurface || '#EFF6FF' }]}>
        <MaterialDesignIcons
          name="office-building-marker"
          size={38}
          color={theme.colors.primary || '#2563EB'}
        />
      </View>

      <Text style={[styles.title, { color: theme.colors.text || '#0F172A' }]}>
        {hasSearch ? t('noBoothsFound') : t('noBoothsFound')}
      </Text>

      <Text style={[styles.desc, { color: theme.colors.textSecondary || '#64748B' }]}>
        {hasSearch
          ? `${t('noBoothsFound')} "${searchQuery}"`
          : t('noBoothsFoundDesc')}
      </Text>

      {hasSearch && onClearSearch && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.subtleSurface || '#F1F5F9' }]}
          onPress={onClearSearch}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.primary || '#2563EB' }]}>
            {t('clearSearch')}
          </Text>
        </TouchableOpacity>
      )}

      {!hasSearch && onRefresh && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary || '#2563EB' }]}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <MaterialDesignIcons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>{t('refresh' as any) || 'Refresh'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(16),
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(13),
    color: '#FFFFFF',
  },
});
