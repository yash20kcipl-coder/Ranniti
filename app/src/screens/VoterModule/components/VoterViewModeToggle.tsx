import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Users, Building2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { getShadow } from '../../../utils/shadow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoterViewModeToggleProps {
  viewMode: 'voters' | 'societies';
  onChangeViewMode: (mode: 'voters' | 'societies') => void;
  voterCount?: number;
  societyCount?: number;
  t: (key: any) => string;
}

const formatCount = (count?: number): string => {
  if (count === undefined || count === null || count < 0) return '';
  if (count >= 100000) return `${(count / 1000).toFixed(0)}k`;
  if (count >= 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toLocaleString();
};

export const VoterViewModeToggle: React.FC<VoterViewModeToggleProps> = ({
  viewMode,
  onChangeViewMode,
  voterCount,
  societyCount,
  t,
}) => {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const isVoters = viewMode === 'voters';

  // Track layout width measurement (fallback to screen width minus horizontal padding)
  const initialTrackWidth = SCREEN_WIDTH - 28;
  const [trackWidth, setTrackWidth] = useState(initialTrackWidth);

  // Tab inner dimensions: 4px padding on each side of the track
  const tabWidth = trackWidth > 8 ? (trackWidth - 8) / 2 : 0;

  // Reanimated shared value for sliding pill (0 = voters, 1 = societies)
  const position = useSharedValue(isVoters ? 0 : 1);

  useEffect(() => {
    position.value = withSpring(isVoters ? 0 : 1, {
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    });
  }, [isVoters, position]);

  const pillAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: position.value * tabWidth,
        },
      ],
      width: tabWidth,
    };
  });

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - trackWidth) > 1) {
      setTrackWidth(width);
    }
  };

  const primaryColor = theme.colors.primary || '#1E40AF';
  const textSecondary = theme.colors.textSecondary || '#64748B';

  const voterCountText = formatCount(voterCount);
  const societyCountText = formatCount(societyCount);

  return (
    <View style={styles.container}>
      <View style={styles.segmentTrack} onLayout={handleTrackLayout}>
        {/* Animated Sliding Pill Indicator */}
        {tabWidth > 0 && (
          <Animated.View style={[styles.slidingPill, pillAnimatedStyle]} />
        )}

        {/* Tab 1: All Voters */}
        <TouchableOpacity
          style={styles.segmentBtn}
          onPress={() => onChangeViewMode('voters')}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6 }}
        >
          <Users
            {...({
              size: 15,
              color: isVoters ? '#FFFFFF' : textSecondary,
              strokeWidth: isVoters ? 2.4 : 2,
            } as any)}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.segmentText, isVoters && styles.segmentTextActive]}
          >
            {t('allVoters') || 'All Voters'}
          </Text>
          {Boolean(voterCountText) && (
            <View style={[styles.badge, isVoters && styles.badgeActive]}>
              <Text
                style={[
                  styles.badgeText,
                  isVoters && styles.badgeTextActive,
                ]}
              >
                {voterCountText}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tab 2: By Society */}
        <TouchableOpacity
          style={styles.segmentBtn}
          onPress={() => onChangeViewMode('societies')}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6 }}
        >
          <Building2
            {...({
              size: 15,
              color: !isVoters ? '#FFFFFF' : textSecondary,
              strokeWidth: !isVoters ? 2.4 : 2,
            } as any)}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.segmentText, !isVoters && styles.segmentTextActive]}
          >
            {t('bySociety') || 'By Society'}
          </Text>
          {Boolean(societyCountText) && (
            <View style={[styles.badge, !isVoters && styles.badgeActive]}>
              <Text
                style={[
                  styles.badgeText,
                  !isVoters && styles.badgeTextActive,
                ]}
              >
                {societyCountText}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => {
  const primaryColor = theme.colors.primary || '#1E40AF';
  const borderColor = theme.colors.border || '#E2E8F0';
  const trackBg = theme.colors.subtleSurface || '#EEF2F6';

  return StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
    },
    segmentTrack: {
      flexDirection: 'row',
      backgroundColor: trackBg,
      borderRadius: 12,
      padding: 4,
      position: 'relative',
      borderWidth: 1,
      borderColor: borderColor,
      height: 48,
      alignItems: 'center',
      ...getShadow(1, '#000000', 0.04),
    },
    slidingPill: {
      position: 'absolute',
      left: 4,
      top: 4,
      bottom: 4,
      borderRadius: 10,
      backgroundColor: primaryColor,
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 5,
      elevation: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      paddingHorizontal: 8,
      zIndex: 2,
      gap: 6,
    },
    segmentText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12.5),
      color: theme.colors.textSecondary || '#64748B',
      flexShrink: 1,
    },
    segmentTextActive: {
      fontFamily: FontFamily.bold,
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    badgeText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    badgeTextActive: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bold,
    },
  });
};

export default VoterViewModeToggle;
