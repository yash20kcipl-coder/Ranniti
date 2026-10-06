import { StyleSheet } from 'react-native';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';

export const loginStyles = (theme: Theme, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    // Top Section
    topSection: {
      flex: 1,
      paddingBottom: 48,
      overflow: 'hidden',
      alignItems: 'center',
      position: 'relative',
      paddingHorizontal: 24,
      justifyContent: 'center',
      paddingTop: Math.max(insets.top + 16, 40),
      backgroundColor: theme.colors.primary || '#0F172A',
    },
    backButton: {
      position: 'absolute',
      top: Math.max(insets.top + 10, 20),
      left: 20,
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    // Ambient Background Circles
    bgCircle1: {
      position: 'absolute',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      top: -100,
      right: -80,
    },
    bgCircle2: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      bottom: 10,
      left: -40,
    },
    bgCircle3: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      top: 30,
      left: 50,
    },
    bgCircle4: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      top: -60,
      left: -80,
    },
    bgCircle5: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      bottom: -20,
      right: 15,
    },

    // Logo Card & Halos
    logoCardOuter: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginBottom: 16,
    },
    logoCardInner: {
      width: 250,
      height: 75,
      padding: 12,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },

    // Header Typography
    brandTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(24),
      color: '#FFFFFF',
      letterSpacing: 2,
      textAlign: 'center',
    },
    brandSubtitle: {
      textAlign: 'center',
      fontSize: rfValue(20),
      fontFamily: FontFamily.medium,
      color: 'rgba(255, 255, 255, 1)',
    },

    // Bottom Section
    bottomSection: {
      marginTop: -28,
      paddingVertical: 32,
      paddingHorizontal: 24,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      ...getShadow(8, '#000000', 0.1),
      backgroundColor: theme.colors.surface || '#FFFFFF',
    },
    welcomeTitle: {
      fontSize: rfValue(32),
      letterSpacing: -0.5,
      fontFamily: FontFamily.black,
      color: theme.colors.text || '#1E293B',
    },
    welcomeSub: {
      marginTop: 4,
      lineHeight: 20,
      marginBottom: 24,
      fontSize: rfValue(15),
      fontFamily: FontFamily.body,
      color: theme.colors.textSecondary || '#64748B',
    },
    formContainer: {
      gap: 10,
    },
    forgotBtn: {
      alignSelf: 'flex-end',
      paddingVertical: 10,
    },
    forgotText: {
      fontSize: rfValue(15),
      color: theme.colors.primary,
      fontFamily: FontFamily.bodyBold,
    },
    loginBtn: {
      height: 52,
      marginTop: 8,
      borderRadius: 14,
      ...getShadow(6, theme.colors.primary, 0.3),
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 28,
      gap: 6,
    },
    footerText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(13.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    footerLink: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(13.5),
      color: theme.colors.primary,
    },
  });

export default loginStyles;
