import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const boothStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    listPadding: {
      padding: 14,
      paddingBottom: 40,
    },
  });
