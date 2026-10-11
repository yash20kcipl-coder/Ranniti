import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

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
    separator: {
      height: 0,
    },
    loadingShimmerBox: {
      paddingVertical: 12,
      gap: 10,
    },
  });

export default familyMappingStyles;

