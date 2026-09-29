import React from 'react';
import { Skeleton } from '../Skeleton';
import { SafeView, AppHeader } from '..';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { View, Text, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';

interface DetailLayoutProps {
  title: string;
  bannerColor: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  topRow?: React.ReactNode;
  cardTitle?: string;
  isLoading?: boolean;
}

export const DetailLayout: React.FC<DetailLayoutProps> = ({
  title,
  bannerColor,
  children,
  footer,
  cardStyle,
  topRow,
  cardTitle,
  isLoading = false,
}) => {
  const { styles } = useAppTheme(getStyles);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Header Row Skeleton */}
      <View style={styles.skeletonHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={42} height={42} borderRadius={21} />
          <View style={{ gap: 6 }}>
            <Skeleton width={110} height={12} />
            <Skeleton width={60} height={10} />
          </View>
        </View>
        <Skeleton width={75} height={22} borderRadius={8} />
      </View>

      <View style={styles.divider} />

      {/* Title Skeleton */}
      <Skeleton width="85%" height={22} style={{ marginBottom: 10 }} />
      <Skeleton width="50%" height={14} style={{ marginBottom: 22 }} />

      {/* 2-Column Grid Card Skeletons */}
      <View style={styles.skeletonGrid}>
        <View style={styles.skeletonGridCard}>
          <Skeleton width={34} height={34} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="40%" height={8} />
            <Skeleton width="80%" height={11} />
          </View>
        </View>
        <View style={styles.skeletonGridCard}>
          <Skeleton width={34} height={34} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="40%" height={8} />
            <Skeleton width="80%" height={11} />
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />

      {/* Accented Section Header Skeleton */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Skeleton width={4} height={14} borderRadius={2} />
        <Skeleton width={110} height={11} />
      </View>

      {/* Accented Card Body Skeleton */}
      <View style={styles.skeletonMessageCard}>
        <Skeleton width="100%" height={12} style={{ marginBottom: 10 }} />
        <Skeleton width="95%" height={12} style={{ marginBottom: 10 }} />
        <Skeleton width="90%" height={12} style={{ marginBottom: 10 }} />
        <Skeleton width="60%" height={12} />
      </View>
    </View>
  );

  return (
    <SafeView style={styles.container}>
      {/* Premium Deep Color Banner */}
      <View style={[styles.headerBanner, { backgroundColor: bannerColor }]} />

      <AppHeader title={title} showBack noShadow style={styles.transparentHeader} />

      <View style={styles.content}>
        {/* Floating Card */}
        <View style={[styles.card, cardStyle]}>
          {isLoading ? (
            renderSkeleton()
          ) : (
            <>
              {topRow && <View style={styles.cardTopRow}>{topRow}</View>}
              {cardTitle && <Text style={styles.cardTitle}>{cardTitle}</Text>}

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.cardScrollContainer}
              >
                {children}
              </ScrollView>
            </>
          )}
        </View>

        {footer && <View style={styles.footerContainer}>{footer}</View>}
      </View>
    </SafeView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flex: 1,
    padding: 18,
    paddingTop: 15,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 0,
    ...getShadow(5, theme.colors.shadowColor, 0.08),
  },
  cardScrollContainer: {
    flexGrow: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: rfValue(20),
    fontFamily: FontFamily.extraBold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  footerContainer: {
    marginTop: 20,
    paddingBottom: 12,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border + '15',
    marginBottom: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonGridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border + '10',
    gap: 10,
  },
  skeletonMessageCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border + '10',
    backgroundColor: theme.colors.inputBackground + '10',
  },
});
