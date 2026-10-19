import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const SocietyCardSkeleton: React.FC = memo(() => {
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
      {/* Top Row: Icon + Title/Booth + Badge */}
      <View style={styles.topRow}>
        <Skeleton width={38} height={38} borderRadius={10} />
        <View style={styles.headerInfo}>
          <Skeleton width={140} height={15} borderRadius={4} />
          <Skeleton width={90} height={11} borderRadius={4} style={styles.spacingTop} />
        </View>
        <Skeleton width={55} height={24} borderRadius={20} />
      </View>

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border || '#F1F5F9' },
        ]}
      />

      {/* Bottom Row: Metrics & CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.metricsGroup}>
          <Skeleton width={100} height={12} borderRadius={4} />
          <View style={styles.genderRow}>
            <Skeleton width={45} height={16} borderRadius={4} />
            <Skeleton width={45} height={16} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={65} height={26} borderRadius={8} />
      </View>
    </View>
  );
});

export default SocietyCardSkeleton;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  spacingTop: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricsGroup: {
    flex: 1,
    gap: 4,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
