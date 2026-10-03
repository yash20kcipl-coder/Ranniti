import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  StatusBar,
  Linking,
} from 'react-native';
import { splashStyles } from './styles';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Sparkles } from 'lucide-react-native';
import { useLanguage } from '../../languages';
import { AppUpdateModal } from '../../components';
import { SCREENS } from '../../navigation/constants';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import { replace, navigateToDashboard } from '../../navigation/navigationUtils';

const MINIMUM_SPLASH_TIME_MS = 2200;

const Splash: React.FC = () => {
  const { t } = useLanguage();
  const hasNavigated = useRef(false);
  const versionInfo = useVersionCheck();
  const splashTimerFinished = useRef(false);
  const auth = useSelector((state: RootState) => state.auth);
  const { styles } = useAppTheme<ReturnType<typeof splashStyles>>(splashStyles);

  const bgRotate = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.95)).current;
  const haloOpacity = useRef(new Animated.Value(0.25)).current;
  const brandTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // 1. Logo Entrance Animation (Bouncy Spring)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
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
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.4)),
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
            duration: 2000,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.65,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(haloScale, {
            toValue: 0.95,
            duration: 2000,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.25,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 4. Ambient background slow rotation
    Animated.loop(
      Animated.timing(bgRotate, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    // Minimum splash timer
    const timer = setTimeout(() => {
      splashTimerFinished.current = true;
    }, MINIMUM_SPLASH_TIME_MS);

    return () => clearTimeout(timer);
  }, [bgRotate, brandOpacity, brandTranslateY, haloOpacity, haloScale, logoOpacity, logoScale,]);

  // Main Navigation decision runner
  const performNavigation = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (auth?.isLoggedIn && auth?.token) {
      navigateToDashboard(auth?.role || 'pc_leader');
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
        } else {
          // Proceed normally
          performNavigation();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [versionInfo.status, auth]);

  const bgSpin = bgRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>

      {/* Ambient Animated Background Elements */}

      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />
      <View style={styles.bgCircle4} />

      {/* Center Branding Section */}
      <View style={styles.centerContent}>
        {/* Pulsing Outer Halos */}
        <Animated.View style={[styles.haloContainerOuter, { transform: [{ scale: haloScale }], opacity: haloOpacity, },]} />
        <Animated.View style={[styles.haloContainer, { transform: [{ scale: haloScale }], opacity: haloOpacity, },]} />

        {/* Scaled Logo Wrapper */}
        <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }], },]}>
          <Image
            source={require('../../assets/images/ranniti-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Text */}
        <Animated.View style={[styles.brandContainer, { opacity: brandOpacity, transform: [{ translateY: brandTranslateY }], },]}>
          <Text style={styles.brandSub}>{t('appTagline')}</Text>
        </Animated.View>
      </View>

      {/* Footer Section */}
      <View style={styles.footerContainer}>
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>

        <View style={styles.versionPill}>
          <Text style={styles.versionText}>
            v{versionInfo.currentVersion || '0.0.1'}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.bgCircle1, { transform: [{ rotate: bgSpin }] },]} />
      {/* Force Update Modal */}
      <AppUpdateModal
        type={"force-update"}
        versionInfo={versionInfo}
        latestVersion={versionInfo.latestVersion}
        visible={versionInfo.status === 'force-update'}
      />
    </View>
  );
};

export default Splash;
