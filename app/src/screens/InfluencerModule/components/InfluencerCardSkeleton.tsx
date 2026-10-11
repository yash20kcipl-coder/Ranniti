import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const InfluencerCardSkeleton: React.FC = memo(() => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderColor: theme.colors.border || '#E2E8F0',
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <Skeleton width={52} height={52} borderRadius={26} />
        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <Skeleton width={80} height={18} borderRadius={6} />
            <Skeleton width={60} height={18} borderRadius={6} />
          </View>
          <Skeleton width={140} height={16} borderRadius={4} style={styles.mt4} />
          <Skeleton width={110} height={12} borderRadius={4} style={styles.mt3} />
          <Skeleton width={90} height={12} borderRadius={4} style={styles.mt3} />
        </View>
        <View style={styles.actionCol}>
          <Skeleton width={34} height={34} borderRadius={17} />
          <Skeleton width={34} height={34} borderRadius={17} style={styles.mt6} />
        </View>
      </View>

      {/* Accordion Bar Shimmer */}
      <View style={styles.accordionBar}>
        <Skeleton width={150} height={16} borderRadius={4} />
        <Skeleton width={18} height={18} borderRadius={9} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mt3: {
    marginTop: 3,
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
});
