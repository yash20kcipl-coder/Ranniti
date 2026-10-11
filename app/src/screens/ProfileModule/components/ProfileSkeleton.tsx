import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';

interface ProfileSkeletonProps {
  theme: Theme;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ theme }) => {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.avatarWrap}>
          <Skeleton width={80} height={80} borderRadius={40} />
        </View>
        <Skeleton width={160} height={22} borderRadius={6} />
        <Skeleton width={100} height={18} borderRadius={10} />
        <View style={styles.row}>
          <Skeleton width={80} height={20} borderRadius={10} />
          <Skeleton width={90} height={20} borderRadius={10} />
        </View>
      </View>

      {/* Info Card Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Skeleton width={130} height={18} borderRadius={6} />
        <Skeleton width="100%" height={45} borderRadius={12} />
        <Skeleton width="100%" height={45} borderRadius={12} />
      </View>

      {/* Jurisdiction Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Skeleton width={180} height={18} borderRadius={6} />
        <Skeleton width="100%" height={45} borderRadius={12} />
        <Skeleton width="100%" height={45} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    alignItems: 'center',
    ...getShadow(2, '#000000', 0.04),
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
