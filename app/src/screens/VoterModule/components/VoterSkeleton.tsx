import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const VoterSkeleton: React.FC = memo(() => {
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
      <View style={styles.header}>
        {/* Voter Photo Skeleton */}
        <Skeleton width={38} height={38} borderRadius={19} />

        {/* Voter Info Skeleton */}
        <View style={styles.infoCol}>
          <Skeleton width={120} height={14} borderRadius={4} />
          <Skeleton width={90} height={11} borderRadius={4} style={styles.spacingTop} />
          <View style={styles.badgeRow}>
            <Skeleton width={65} height={14} borderRadius={4} />
            <Skeleton width={55} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Supporting Party Button Skeleton */}
        <Skeleton width={60} height={22} borderRadius={5} />
      </View>

      {/* Bottom Row: Location Left & Actions Right */}
      <View style={styles.bottomRow}>
        <Skeleton width={120} height={11} borderRadius={4} />
        <View style={styles.actionsBar}>
          <Skeleton width={45} height={22} borderRadius={5} />
          <Skeleton width={55} height={22} borderRadius={5} />
          <Skeleton width={65} height={22} borderRadius={5} />
        </View>
      </View>
    </View>
  );
});

export default VoterSkeleton;

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCol: {
    flex: 1,
    gap: 1,
  },
  spacingTop: {
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
