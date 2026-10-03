import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components';

export const DashboardSkeleton: React.FC = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card Skeleton */}
      <View style={styles.cardSkeleton}>
        <View style={styles.row}>
          <Skeleton width={58} height={58} borderRadius={29} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={18} borderRadius={6} />
            <Skeleton width="40%" height={14} borderRadius={6} />
            <Skeleton width="75%" height={14} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Metrics 2x2 Grid Skeleton */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCardSkeleton}>
          <Skeleton width={38} height={38} borderRadius={12} />
          <Skeleton width="50%" height={24} borderRadius={6} />
          <Skeleton width="75%" height={14} borderRadius={6} />
        </View>
        <View style={styles.metricCardSkeleton}>
          <Skeleton width={38} height={38} borderRadius={12} />
          <Skeleton width="50%" height={24} borderRadius={6} />
          <Skeleton width="75%" height={14} borderRadius={6} />
        </View>
      </View>

      {/* Role Hierarchy Card Skeleton */}
      <View style={styles.cardSkeleton}>
        <Skeleton width={140} height={18} borderRadius={6} />
        <View style={styles.hierarchyRow}>
          <Skeleton width="30%" height={45} borderRadius={10} />
          <Skeleton width="30%" height={45} borderRadius={10} />
          <Skeleton width="30%" height={45} borderRadius={10} />
        </View>
      </View>

      {/* Influencers Card Skeleton */}
      <View style={styles.cardSkeleton}>
        <Skeleton width={160} height={18} borderRadius={6} />
        <View style={styles.influencerGrid}>
          <Skeleton width="30%" height={52} borderRadius={12} />
          <Skeleton width="30%" height={52} borderRadius={12} />
          <Skeleton width="30%" height={52} borderRadius={12} />
        </View>
      </View>

      {/* Political Views Skeleton */}
      <View style={styles.cardSkeleton}>
        <Skeleton width={180} height={18} borderRadius={6} />
        <Skeleton width="100%" height={10} borderRadius={5} />
        <View style={styles.grid2x2}>
          <Skeleton width="48%" height={36} borderRadius={10} />
          <Skeleton width="48%" height={36} borderRadius={10} />
          <Skeleton width="48%" height={36} borderRadius={10} />
          <Skeleton width="48%" height={36} borderRadius={10} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 14,
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCardSkeleton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  hierarchyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  influencerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
