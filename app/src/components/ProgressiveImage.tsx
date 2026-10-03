import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';

interface ProgressiveImageProps {
  uri: string;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  delay?: number;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  delay = 0,
}) => {
  const [shouldRender, setShouldRender] = useState(delay === 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Animated value for smooth fade-in transition
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const handleLoadSuccess = () => {
    setIsLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadError = () => {
    setIsLoading(false);
    setIsError(true);
  };

  // If we shouldn't render yet, show placeholder skeleton
  if (!shouldRender) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.4)" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* If error loading image, show premium fallback placeholder */}
      {isError ? (
        <View style={styles.errorContainer}>
          <MaterialDesignIcons name="image-off-outline" size={24} color="#9CA3AF" />
        </View>
      ) : (
        <Animated.Image
          source={{ uri }}
          style={[style, { opacity: fadeAnim }]}
          resizeMode={resizeMode}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
        />
      )}

      {/* Show subtle loading spinner on top of placeholder until image loaded */}
      {isLoading && !isError && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color="#059669" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
