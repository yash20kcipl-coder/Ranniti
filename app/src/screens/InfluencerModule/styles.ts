import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';

export const influencerStyles = (theme: Theme) =>
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
    loadingShimmerBox: {
      paddingVertical: 12,
      gap: 12,
    },
    shimmerMargin: {
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      padding: 14,
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
  });

export default influencerStyles;
