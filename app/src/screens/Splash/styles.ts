import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const splashStyles = (theme: Theme, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    // Background Ambient Circles
    bgCircle1: {
      position: 'absolute',
      width: SCREEN_WIDTH * 1.2,
      height: SCREEN_WIDTH * 1.2,
      borderRadius: (SCREEN_WIDTH * 1.2) / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      top: -SCREEN_WIDTH * 0.4,
      right: -SCREEN_WIDTH * 0.3,
    },
    bgCircle2: {
      position: 'absolute',
      width: SCREEN_WIDTH * 0.8,
      height: SCREEN_WIDTH * 0.8,
      borderRadius: (SCREEN_WIDTH * 0.8) / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      bottom: -SCREEN_WIDTH * 0.2,
      left: -SCREEN_WIDTH * 0.2,
    },
    bgCircle3: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      top: '25%',
      left: -40,
    },
    bgCircle4: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      bottom: '30%',
      right: -30,
    },

    // Center Content
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    // Logo & Halo
    haloContainer: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    haloContainerOuter: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoWrapper: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      padding: 12,
      ...getShadow(8, '#000000', 0.25),
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },

    // Brand Typography
    brandContainer: {
      alignItems: 'center',
      marginTop: 28,
    },
    brandTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(36),
      color: '#FFFFFF',
      letterSpacing: 3,
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    brandSub: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(14),
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 6,
      letterSpacing: 0.8,
      textAlign: 'center',
    },

    // Badge
    badgeContainer: {
      marginTop: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#34D399',
    },
    badgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(11),
      color: '#FFFFFF',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },

    // Footer & Progress
    footerContainer: {
      position: 'absolute',
      bottom: Math.max(insets.bottom + 24, 32),
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    loadingText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12),
      color: 'rgba(255, 255, 255, 0.8)',
    },
    versionText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12),
      color: 'rgba(255, 255, 255, 0.75)',
      letterSpacing: 0.5,
    },

    // Modal Overlays for App Updates
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      zIndex: 999,
    },
    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      ...getShadow(10, '#000000', 0.3),
    },
    modalIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(20),
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalBody: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(14),
      color: '#4B5563',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    modalActions: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      width: '100%',
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...getShadow(4, theme.colors.primary, 0.3),
    },
    primaryBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(15),
      color: '#FFFFFF',
    },
    secondaryBtn: {
      width: '100%',
      height: 44,
      borderRadius: 14,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(14),
      color: '#6B7280',
    },
  });
