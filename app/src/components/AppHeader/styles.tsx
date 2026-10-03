import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const appHeaderStyles = (theme: Theme) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: theme.colors.header || theme.colors.surface || '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
      position: 'relative',
      zIndex: 10,
    },
    topAccentLine: {
      height: 3,
      backgroundColor: theme.colors.primary || '#1E40AF',
      width: '100%',
    },
    headerPrimary: {
      backgroundColor: theme.colors.primary || '#1E40AF',
      borderBottomWidth: 0,
      ...getShadow(4, theme.colors.primary || '#1E40AF', 0.25),
    },
    headerTransparent: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
    },
    contentRow: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.colors.headerSubtle || '#F8FAFC',
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      ...getShadow(2, '#0F172A', 0.05),
    },
    actionBtnPrimary: {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      elevation: 0,
      shadowOpacity: 0,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoImage: {
      width: 145,
      height: 55,
    },
    titleContainer: {
      justifyContent: 'center',
      flexShrink: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(17),
      color: theme.colors.headerText || theme.colors.text || '#0F172A',
      letterSpacing: -0.4,
    },
    titleTextPrimary: {
      color: '#FFFFFF',
    },
    subtitleText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      marginTop: 1,
    },
    subtitleTextPrimary: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    badgeContainer: {
      backgroundColor: 'rgba(30, 64, 175, 0.08)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.15)',
    },
    badgeContainerPrimary: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: theme.colors.primary || '#1E40AF',
    },
    badgeTextPrimary: {
      color: '#FFFFFF',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  });

export default appHeaderStyles;
