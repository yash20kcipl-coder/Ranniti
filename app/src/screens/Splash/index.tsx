import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StatusBar,
  Linking,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../hooks/useAppTheme';
import { splashStyles } from './styles';
import { SCREENS } from '../../navigation/constants';
import { replace, navigateToDashboard } from '../../navigation/navigationUtils';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import { RootState } from '../../store/store';
import { DownloadCloud, Sparkles, ShieldCheck } from 'lucide-react-native';

const MINIMUM_SPLASH_TIME_MS = 2200;

const Splash: React.FC = () => {
  const { theme, styles } = useAppTheme<ReturnType<typeof splashStyles>>(splashStyles);
  const versionInfo = useVersionCheck();
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);

  // Redux Auth State
  const auth = useSelector((state: RootState) => state.auth);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(20)).current;
  const haloScale = useRef(new Animated.Value(0.95)).current;
  const haloOpacity = useRef(new Animated.Value(0.2)).current;
  const bgRotate = useRef(new Animated.Value(0)).current;
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  // Track timer finish state
  const splashTimerFinished = useRef(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    // 1. Logo Entrance Animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Brand Text Entrance Animation
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Continuous Halo Pulse Animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 1.25,
            duration: 1800,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.6,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.95,
            duration: 1800,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.2,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 4. Background slow rotation
    Animated.loop(
      Animated.timing(bgRotate, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 5. Loading Dots Sequence
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Minimum splash timer
    const timer = setTimeout(() => {
      splashTimerFinished.current = true;
    }, MINIMUM_SPLASH_TIME_MS);

    return () => clearTimeout(timer);
  }, [
    bgRotate,
    brandOpacity,
    brandTranslateY,
    dot1Opacity,
    dot2Opacity,
    dot3Opacity,
    haloOpacity,
    haloScale,
    logoOpacity,
    logoScale,
  ]);

  // Main Navigation decision runner
  const performNavigation = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (auth?.isLoggedIn && auth?.token) {
      const childCount = auth?.parentData?.children?.length || 0;
      navigateToDashboard(auth?.role || 'student', childCount);
    } else {
      replace(SCREENS.LOGIN);
    }
  };

  useEffect(() => {
    // Wait until both version check and minimum splash timer finish
    if (versionInfo.status === 'loading') return;

    const interval = setInterval(() => {
      if (splashTimerFinished.current) {
        clearInterval(interval);

        if (versionInfo.status === 'force-update') {
          // Force update modal stays up, stop automatic navigation
          return;
        } else if (versionInfo.status === 'recommended-update') {
          // Show recommended update modal to user
          setShowRecommendedModal(true);
        } else {
          // Proceed normally
          performNavigation();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [versionInfo.status, auth]);

  const handleOpenStore = () => {
    if (versionInfo.storeUrl) {
      Linking.openURL(versionInfo.storeUrl).catch((err) =>
        console.error('Failed to open store URL:', err)
      );
    }
  };

  const handleSkipRecommendedUpdate = () => {
    setShowRecommendedModal(false);
    performNavigation();
  };

  const bgSpin = bgRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" {...({ backgroundColor: theme.colors.primary } as any)} translucent />

      {/* Animated Floating Background Elements */}
      <Animated.View style={[styles.bgCircle1, { transform: [{ rotate: bgSpin }] }]} />
      <Animated.View style={[styles.bgCircle2, { transform: [{ rotate: bgSpin }] }]} />
      <View style={styles.bgCircle3} />
      <View style={styles.bgCircle4} />

      {/* Center Branding Section */}
      <View style={styles.centerContent}>
        {/* Pulsing Outer Halo */}
        <Animated.View
          style={[
            styles.haloContainerOuter,
            {
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.haloContainer,
            {
              transform: [{ scale: haloScale }],
              opacity: haloOpacity,
            },
          ]}
        />

        {/* Scaled Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Text */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>RANNITI</Text>
          <Text style={styles.brandSub}>Smart Governance & Management</Text>

          <View style={styles.badgeContainer}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Enterprise Edition</Text>
            <Sparkles size={12} {...({ color: '#FBBF24' } as any)} style={{ marginLeft: 2 }} />
          </View>
        </Animated.View>
      </View>

      {/* Footer Section */}
      <View style={styles.footerContainer}>
        <View style={styles.loadingRow}>
          <Animated.View style={[styles.loadingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.loadingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.loadingDot, { opacity: dot3Opacity }]} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>

        <Text style={styles.versionText}>
          Version {versionInfo.currentVersion || '0.0.1'}
        </Text>
      </View>

      {/* Force Update Modal */}
      <Modal
        visible={versionInfo.status === 'force-update'}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <DownloadCloud size={32} {...({ color: theme.colors.primary } as any)} />
            </View>
            <Text style={styles.modalTitle}>Update Required</Text>
            <Text style={styles.modalBody}>
              A critical update for Ranniti is available (v{versionInfo.latestVersion}). Please update
              to continue using the app.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleOpenStore}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recommended Update Modal */}
      <Modal
        visible={showRecommendedModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <ShieldCheck size={32} {...({ color: theme.colors.primary } as any)} />
            </View>
            <Text style={styles.modalTitle}>New Version Available</Text>
            <Text style={styles.modalBody}>
              A new update (v{versionInfo.latestVersion}) is available with performance improvements
              and new features.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleOpenStore}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Update Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleSkipRecommendedUpdate}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Splash;
