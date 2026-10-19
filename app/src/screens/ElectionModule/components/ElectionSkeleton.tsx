import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../../../constants/theme';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const ElectionSkeleton: React.FC = () => {
  const { styles } = useAppTheme(skeletonStyles);

  return (
    <View style={styles.container}>
      {/* Header Turnout Skeleton */}
      <View style={styles.headerCard}>
        <View style={styles.rowBetween}>
          <Skeleton width={140} height={26} borderRadius={13} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
        <View style={[styles.rowBetween, { marginTop: 14 }]}>
          <Skeleton width={90} height={32} borderRadius={6} />
          <Skeleton width={110} height={18} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={10} borderRadius={5} style={{ marginTop: 10 }} />
        <View style={[styles.rowBetween, { marginTop: 14 }]}>
          <Skeleton width="22%" height={44} borderRadius={8} />
          <Skeleton width="22%" height={44} borderRadius={8} />
          <Skeleton width="22%" height={44} borderRadius={8} />
          <Skeleton width="22%" height={44} borderRadius={8} />
        </View>
      </View>

      {/* Filter Tabs Skeleton */}
      <View style={styles.tabRow}>
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={100} height={32} borderRadius={16} />
        <Skeleton width={90} height={32} borderRadius={16} />
        <Skeleton width={90} height={32} borderRadius={16} />
      </View>

      {/* Voter Cards Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.voterCard}>
          <View style={styles.rowBetween}>
            <Skeleton width={50} height={22} borderRadius={6} />
            <Skeleton width={100} height={16} borderRadius={4} />
          </View>
          <Skeleton width={180} height={20} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: 6 }} />
          <View style={[styles.row, { marginTop: 12, gap: 10 }]}>
            <Skeleton width={60} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </View>
          <View style={[styles.rowBetween, { marginTop: 14, paddingTop: 10 }]}>
            <Skeleton width="55%" height={38} borderRadius={8} />
            <Skeleton width="40%" height={38} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
};

const skeletonStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    headerCard: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    voterCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 14,
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
