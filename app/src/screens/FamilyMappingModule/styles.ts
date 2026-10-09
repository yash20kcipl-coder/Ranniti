import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const familyMappingStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    listPadding: {
      paddingHorizontal: 14,
      paddingBottom: 24,
    },
    headerContainer: {
      paddingTop: 12,
    },
    filterBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    titleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    boothPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.border ? `${theme.colors.border}50` : '#E2E8F0',
      maxWidth: 170,
    },
    boothPillActive: {
      backgroundColor: `${theme.colors.primary}12`,
      borderColor: theme.colors.primary,
    },
    boothPillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      flex: 1,
    },
    boothPillTextActive: {
      fontFamily: FontFamily.bold,
      color: theme.colors.primary || '#1E40AF',
    },
    separator: {
      height: 10,
    },
    loadingShimmerBox: {
      paddingVertical: 12,
      gap: 10,
    },
    shimmerMargin: {
      marginBottom: 6,
    },
  });

export default familyMappingStyles;
