import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const splashStyles = (theme: Theme, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary || '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    // Background Ambient Circles
    bgCircle1: {
      position: 'absolute',
      width: SCREEN_WIDTH * 1.2,
      height: SCREEN_WIDTH * 1.2,
      borderRadius: (SCREEN_WIDTH * 1.3) / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      top: -SCREEN_WIDTH * 0.45,
      right: -SCREEN_WIDTH * 0.35,
    },
    bgCircle2: {
      position: 'absolute',
      width: SCREEN_WIDTH * 0.9,
      height: SCREEN_WIDTH * 0.9,
      borderRadius: (SCREEN_WIDTH * 0.9) / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      bottom: -SCREEN_WIDTH * 0.25,
      left: -SCREEN_WIDTH * 0.25,
    },
    bgCircle3: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      top: '20%',
      left: -60,
    },
    bgCircle4: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      bottom: '28%',
      right: -40,
    },

    // Center Content
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    // Logo & Halos
    haloContainer: {
      width: 155,
      height: 155,
      borderRadius: 84,
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    haloContainerOuter: {
      position: 'absolute',
      width: 216,
      height: 216,
      borderRadius: 108,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    logoWrapper: {
      width: 200,
      height: 50,
      justifyContent: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },

    // Brand Typography
    brandContainer: {
      alignItems: 'center',
    },
    brandSub: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: rfValue(18),
      fontFamily: FontFamily.medium,
      color: 'rgba(255, 255, 255, 1)',
    },

    // Badge
    badgeContainer: {
      marginTop: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.32)',
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
      bottom: Math.max(insets.bottom + 24, 36),
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    loadingText: {
      marginLeft: 4,
      fontSize: rfValue(18),
      fontFamily: FontFamily.body,
      color: 'rgba(255, 255, 255, 1)',
    },
    versionPill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    versionText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: 'rgba(255, 255, 255, 0.75)',
      letterSpacing: 0.5,
    },
  });
