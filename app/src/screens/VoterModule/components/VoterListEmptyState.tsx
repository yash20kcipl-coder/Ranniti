import React from 'react';
import { useLanguage } from '../../../languages';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface VoterListEmptyStateProps {
  hasActiveFilters: boolean;
  searchQuery?: string;
  onClearFilters: () => void;
  onOpenFilterModal?: () => void;
  onRefresh?: () => void;
  t?: (key: any) => string;
}

export const VoterListEmptyState: React.FC<VoterListEmptyStateProps> = ({
  hasActiveFilters,
  searchQuery,
  onClearFilters,
  onOpenFilterModal,
  onRefresh,
  t,
}) => {
  const { theme } = useAppTheme();
  const { t: hookT } = useLanguage();
  const translate = t || hookT;

  const isSearchOnly = Boolean(searchQuery && !hasActiveFilters);

  return (
    <View style={styles.container}>
      {/* Visual Illustration Badge Container */}
      <View style={styles.illustrationWrapper}>
        <View
          style={[
            styles.outerCircle,
            {
              backgroundColor: hasActiveFilters
                ? `${theme.colors.primary}10`
                : `${theme.colors.subtleSurface || '#F1F5F9'}`,
              borderColor: hasActiveFilters
                ? `${theme.colors.primary}25`
                : `${theme.colors.border || '#E2E8F0'}`,
            },
          ]}
        >
          <View
            style={[
              styles.innerCircle,
              {
                backgroundColor: hasActiveFilters
                  ? `${theme.colors.primary}18`
                  : '#FFFFFF',
              },
            ]}
          >
            <MaterialDesignIcons
              name={
                hasActiveFilters
                  ? 'filter-remove-outline'
                  : isSearchOnly
                    ? 'account-search-outline'
                    : 'account-group-outline'
              }
              size={30}
              color={hasActiveFilters ? theme.colors.primary : '#64748B'}
            />
          </View>
        </View>

        {/* Floating Mini Decorative Badge */}
        {hasActiveFilters && (
          <View style={[styles.floatingBadge, { backgroundColor: '#EF4444' }]}>
            <MaterialDesignIcons name="close" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text || '#0F172A' }]}>
        {hasActiveFilters
          ? translate('noMatchingVoters')
          : isSearchOnly
            ? translate('noSearchResults')
            : translate('noVotersAvailable')}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: theme.colors.textSecondary || '#64748B' }]}>
        {hasActiveFilters
          ? translate('noMatchingVotersDesc')
          : isSearchOnly
            ? (searchQuery
              ? `${translate('noSearchResultsDesc')} ("${searchQuery}")`
              : translate('noSearchResultsDesc'))
            : translate('noVotersAvailableDesc')}
      </Text>

      {/* Action Buttons Row */}
      <View style={styles.actionsContainer}>
        {hasActiveFilters ? (
          <>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={onClearFilters}
              activeOpacity={0.8}
            >
              <MaterialDesignIcons name="filter-off-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {translate('clearAllFilters')}
              </Text>
            </TouchableOpacity>

            {onOpenFilterModal && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.border || '#CBD5E1',
                    backgroundColor: theme.colors.surface || '#FFFFFF',
                  },
                ]}
                onPress={onOpenFilterModal}
                activeOpacity={0.7}
              >
                <MaterialDesignIcons
                  name="tune-vertical"
                  size={16}
                  color={theme.colors.text || '#1E293B'}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.colors.text || '#1E293B' },
                  ]}
                >
                  {translate('adjustFilters')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onRefresh || onClearFilters}
            activeOpacity={0.8}
          >
            <MaterialDesignIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {translate('refreshDirectory')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default VoterListEmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  illustrationWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  outerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    // ...getShadow(2, '#000000', 0.05),
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    // ...getShadow(1, '#000000', 0.04),
  },
  floatingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(17),
    lineHeight: rfValue(22),
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    lineHeight: rfValue(18),
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    ...getShadow(2, '#000000', 0.1),
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12.5),
  },
});
