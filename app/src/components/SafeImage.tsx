import {
  Image,
  ImageProps,
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Skeleton } from './Skeleton';
import React, { useState, useEffect } from 'react';

// Register native optimized local placeholders downloaded via asset build system.
const UserPlaceholder = require('../assets/images/user_placeholder.png');
const GeneralPlaceholder = require('../assets/images/image_placeholder.png');

export interface CustomImageProps extends Omit<ImageProps, 'source' | 'src' | 'alt'> {
  uri?: string | null;
  src?: string | null;
  name?: string | null;
  alt?: string | null;
  fallbackText?: string | null;
  placeholderType?: 'avatar' | 'landscape';
  fallbackSource?: ImageSourcePropType;
  showLoader?: boolean;
  containerStyles?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AVATAR_COLORS = [
  '#1E40AF', // Royal Blue
  '#0D9488', // Teal
  '#7C3AED', // Violet
  '#C026D3', // Fuchsia
  '#D97706', // Amber
  '#2563EB', // Blue
  '#059669', // Emerald
  '#DC2626', // Red
  '#4F46E5', // Indigo
];

const getAvatarBgColor = (name?: string | null): string => {
  if (!name) return '#1E40AF';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (text?: string | null): string => {
  if (!text) return '';
  const clean = text.trim();
  if (!clean || clean.toLowerCase() === 'na' || clean.toLowerCase() === 'null') return '';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

/**
 * High-Fidelity Intelligent Image Handler providing instantaneous graceful fallback 
 * orchestration for null, corrupted, or broken networked media pipelines with smooth
 * Skeleton loading transitions and dynamic Name Initials rendering for profile pictures.
 */
export const SafeImage: React.FC<CustomImageProps> = ({
  uri,
  src,
  name,
  alt,
  fallbackText,
  placeholderType = 'landscape',
  fallbackSource,
  showLoader = false,
  style,
  containerStyles,
  textStyle,
  ...rest
}) => {
  const activeUri = uri || src;
  const isRemote = Boolean(activeUri && typeof activeUri === 'string' && activeUri.trim() !== '');

  const [loading, setLoading] = useState(isRemote);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(Boolean(activeUri && typeof activeUri === 'string' && activeUri.trim() !== ''));
    setError(false);
  }, [activeUri]);

  // Resolve static asset backup
  const resolvedFallback = fallbackSource || (placeholderType === 'avatar' ? UserPlaceholder : GeneralPlaceholder);

  // Core URI normalization logic (checks empty string and null explicitly)
  const sourceUri = isRemote ? { uri: activeUri!.trim() } : resolvedFallback;

  // Resolve border radius to match container or placeholder type
  const flatStyle = StyleSheet.flatten([style, containerStyles]);
  const inheritedRadius = flatStyle?.borderRadius;
  const skeletonRadius = typeof inheritedRadius === 'number'
    ? inheritedRadius
    : (placeholderType === 'avatar' ? 9999 : 0);

  // Profile avatar initials calculation
  const isAvatar = placeholderType === 'avatar' || Boolean(name);
  const profileName = name || fallbackText || alt;
  const initials = isAvatar ? getInitials(profileName) : '';
  const avatarBgColor = getAvatarBgColor(profileName);

  const dimension =
    typeof flatStyle?.width === 'number'
      ? flatStyle.width
      : typeof flatStyle?.height === 'number'
      ? flatStyle.height
      : 48;
  const fontSize = Math.max(12, Math.round(dimension * 0.38));

  const showInitialsFallback = (!isRemote || error) && initials.length > 0;

  return (
    <View style={[styles.container, style as any, containerStyles]}>
      {showInitialsFallback ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.initialsContainer,
            { backgroundColor: avatarBgColor, borderRadius: skeletonRadius },
          ]}
        >
          <Text
            style={[styles.initialsText, { fontSize }, textStyle]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {initials}
          </Text>
        </View>
      ) : (
        <Image
          {...rest}
          onLoadStart={() => {
            if (isRemote) setLoading(true);
          }}
          onLoad={() => setLoading(false)}
          onLoadEnd={() => setLoading(false)}
          source={error ? resolvedFallback : sourceUri}
          style={[StyleSheet.absoluteFill, style as any]}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}

      {loading && !error && (
        <Skeleton
          style={StyleSheet.absoluteFill}
          borderRadius={skeletonRadius}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6', // Standard soft fallback base
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
