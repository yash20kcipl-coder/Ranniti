import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const TeamSkeleton: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.infoCol}>
            <Skeleton width={100} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={160} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={120} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
});
