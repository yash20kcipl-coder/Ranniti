import React, { useState } from 'react';
import { 
  Image, 
  ImageProps, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  ImageSourcePropType 
} from 'react-native';

// Register native optimized local placeholders downloaded via asset build system.
const UserPlaceholder = require('../assets/images/user_placeholder.png');
const GeneralPlaceholder = require('../assets/images/image_placeholder.png');

export interface CustomImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  placeholderType?: 'avatar' | 'landscape';
  fallbackSource?: ImageSourcePropType;
  showLoader?: boolean;
}

/**
 * High-Fidelity Intelligent Image Handler providing instantaneous graceful fallback 
 * orchestration for null, corrupted, or broken networked media pipelines.
 */
export const CustomImage: React.FC<CustomImageProps> = ({
  uri,
  placeholderType = 'landscape',
  fallbackSource,
  showLoader = false,
  style,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Resolve static asset backup
  const resolvedFallback = fallbackSource || (placeholderType === 'avatar' ? UserPlaceholder : GeneralPlaceholder);

  // Core URI normalization logic (checks empty string and null explicitly)
  const sourceUri = uri && uri.trim() !== '' ? { uri } : resolvedFallback;

  return (
    <View style={[styles.container, style]}>
      <Image
        {...rest}
        style={[StyleSheet.absoluteFill, style as any]}
        source={error ? resolvedFallback : sourceUri}
        onLoadStart={() => {
          if (showLoader && sourceUri !== resolvedFallback) setLoading(true);
        }}
        onLoad={() => setLoading(false)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      
      {showLoader && loading && !error && (
        <View style={[StyleSheet.absoluteFill, styles.loaderWrapper]}>
          <ActivityIndicator size="small" color="#6B7280" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6', // Standard soft fallback base
  },
  loaderWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.4)',
  },
});
