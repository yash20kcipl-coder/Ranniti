import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const FamilyCardSkeleton: React.FC = memo(() => {
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
      {/* Head Header Row */}
      <View style={styles.headRow}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={styles.headInfo}>
          <View style={styles.badgeRow}>
            <Skeleton width={72} height={18} borderRadius={6} />
            <Skeleton width={60} height={18} borderRadius={6} />
          </View>
          <Skeleton width={140} height={15} borderRadius={4} style={styles.mt4} />
          <Skeleton width={110} height={12} borderRadius={4} style={styles.mt3} />
        </View>
        <Skeleton width={22} height={22} borderRadius={11} />
      </View>

      {/* Address Row */}
      <View style={styles.addressRow}>
        <Skeleton width={16} height={16} borderRadius={4} />
        <Skeleton width={180} height={11} borderRadius={4} />
      </View>
    </View>
  );
});

export default FamilyCardSkeleton;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mt4: { marginTop: 4 },
  mt3: { marginTop: 3 },
});
