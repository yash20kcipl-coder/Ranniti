import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';

export const BoothSkeleton: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View
          key={item}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface || '#FFFFFF',
              borderColor: theme.colors.border || '#E2E8F0',
            },
          ]}
        >
          {/* Top Row: Avatar Box + Identity Column + Turnout Pill */}
          <View style={styles.topRow}>
            <View style={styles.headerLeftGroup}>
              <Skeleton width={36} height={36} borderRadius={9} />
              <View style={styles.headerTextGroup}>
                <Skeleton width={110} height={13} borderRadius={4} style={{ marginBottom: 4 }} />
                <Skeleton width={140} height={10} borderRadius={3} />
              </View>
            </View>
            <Skeleton width={50} height={18} borderRadius={9} />
          </View>

          {/* Compact Stats Box */}
          <View
            style={[
              styles.statsBox,
              {
                backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
                borderColor: theme.colors.border || '#E2E8F0',
              },
            ]}
          >
            {/* 3 Count Placeholders */}
            <View style={styles.countsRow}>
              <Skeleton width="28%" height={26} borderRadius={4} />
              <Skeleton width="28%" height={26} borderRadius={4} />
              <Skeleton width="28%" height={26} borderRadius={4} />
            </View>

            {/* Gender Bar Placeholder */}
            <Skeleton width="100%" height={4} borderRadius={2} />

            {/* 3 Gender Pill Placeholders */}
            <View style={styles.genderRow}>
              <Skeleton width="31%" height={18} borderRadius={6} />
              <Skeleton width="31%" height={18} borderRadius={6} />
              <Skeleton width="31%" height={18} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 10,
  },
  card: {
    padding: 11,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  statsBox: {
    borderRadius: 10,
    borderWidth: 0.5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 6,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
