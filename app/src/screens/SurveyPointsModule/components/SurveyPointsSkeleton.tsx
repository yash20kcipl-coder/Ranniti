import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';

export const SurveyPointsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={156} borderRadius={20} style={styles.mb16} />
      <View style={styles.row}>
        <Skeleton width="23%" height={36} borderRadius={18} />
        <Skeleton width="23%" height={36} borderRadius={18} />
        <Skeleton width="23%" height={36} borderRadius={18} />
        <Skeleton width="23%" height={36} borderRadius={18} />
      </View>
      <Skeleton width="100%" height={44} borderRadius={14} style={styles.mb16} />
      <View style={styles.grid}>
        <Skeleton width="48%" height={86} borderRadius={14} />
        <Skeleton width="48%" height={86} borderRadius={14} />
        <Skeleton width="48%" height={86} borderRadius={14} />
        <Skeleton width="48%" height={86} borderRadius={14} />
      </View>
      <Skeleton width="100%" height={120} borderRadius={16} style={styles.mt16} />
      <Skeleton width="100%" height={120} borderRadius={16} style={styles.mt12} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  mb16: {
    marginBottom: 16,
  },
  mt16: {
    marginTop: 16,
  },
  mt12: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
