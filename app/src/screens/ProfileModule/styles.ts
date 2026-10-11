import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const profileStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    contentPadding: {
      padding: 16,
      paddingBottom: 32,
    },
  });
