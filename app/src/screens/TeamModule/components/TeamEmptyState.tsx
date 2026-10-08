import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { useLanguage } from '../../../languages';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';

interface TeamEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  canCreate?: boolean;
  onAddPress?: () => void;
}

export const TeamEmptyState: React.FC<TeamEmptyStateProps> = ({
  hasFilters,
  onClearFilters,
  canCreate,
  onAddPress,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.subtleSurface || '#EFF6FF' }]}>
        <MaterialDesignIcons
          name="account-multiple-outline"
          size={36}
          color={theme.colors.primary || '#1E40AF'}
        />
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        {hasFilters ? t('noMatchingVoters') : t('noTeamMembers')}
      </Text>

      <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>
        {hasFilters
          ? t('noMatchingVotersDesc')
          : t('noTeamMembersDesc')}
      </Text>

      {hasFilters && onClearFilters && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.subtleSurface }]}
          onPress={onClearFilters}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>
            {t('clearAllFilters')}
          </Text>
        </TouchableOpacity>
      )}

      {!hasFilters && canCreate && onAddPress && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onAddPress}
          activeOpacity={0.85}
        >
          <MaterialDesignIcons name="account-plus-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>{t('onboardNewMember')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(16),
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14),
    color: '#FFFFFF',
  },
});
