import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const dashboardStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    // Top App Bar Header
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: '#F1F5F9',
    },
    logoImage: {
      width: 110,
      height: 32,
    },
    brandTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(18),
      color: theme.colors.primary || '#1E40AF',
      letterSpacing: 0.5,
    },
    contentContainer: {
      padding: 16,
      gap: 14,
    },
    // Skeleton Placeholder Base
    skeletonPulse: {
      backgroundColor: '#E2E8F0',
      borderRadius: 8,
      overflow: 'hidden',
    },
    profileCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      ...getShadow(3, '#000000', 0.05),
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    profileTextCol: {
      flex: 1,
      gap: 4,
    },
    userName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text || '#0F172A',
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    roleText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(11),
      color: '#1E40AF',
    },
    areaText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary || '#64748B',
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      borderLeftWidth: 4,
      gap: 6,
      ...getShadow(2, '#000000', 0.04),
    },
    metricIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EFF6FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricValue: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(20),
      color: theme.colors.text || '#0F172A',
    },
    metricLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary || '#64748B',
    },
    sectionCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 14,
      ...getShadow(2, '#000000', 0.04),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.text || '#0F172A',
    },
    hierarchyRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.background || '#F8FAFC',
      padding: 12,
      borderRadius: 12,
    },
    hierarchyItem: {
      alignItems: 'center',
      gap: 2,
    },
    hierarchyVal: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(18),
      color: '#1E40AF',
    },
    hierarchyLbl: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    influencerGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    influencerBox: {
      flex: 1,
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
      gap: 2,
    },
    influencerVal: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: '#D97706',
    },
    influencerLbl: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: '#475569',
      textAlign: 'center',
    },
    chartBarWrapper: {
      gap: 6,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    barLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#475569',
    },
    progressContainer: {
      height: 12,
      borderRadius: 6,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: '#E2E8F0',
    },
    progressFill: {
      backgroundColor: '#10B981',
    },
    progressPending: {
      backgroundColor: '#CBD5E1',
    },
    politicalViewsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    pvChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      width: '46%',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pvLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#334155',
    },
  });
