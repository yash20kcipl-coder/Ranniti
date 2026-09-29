import { useAppTheme } from '../hooks/useAppTheme';
import React, { forwardRef, useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ScrollView as RNScrollView, ScrollViewProps as RNScrollViewProps, StyleSheet, ViewStyle, RefreshControl } from 'react-native';

interface ScrollViewProps extends Omit<RNScrollViewProps, 'style' | 'contentContainerStyle'> {
  useFlex?: boolean;
  isKeyboardAware?: boolean;
  progressViewOffset?: number;
  useThemeBackground?: boolean;
  refreshApi?: () => Promise<any>;
  style?: ViewStyle | ViewStyle[];
  contentContainerStyle?: ViewStyle | ViewStyle[];
}

export const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(({
  style,
  contentContainerStyle,
  useThemeBackground = true,
  isKeyboardAware = false,
  useFlex = true,
  showsVerticalScrollIndicator = false,
  refreshApi,
  progressViewOffset,
  children,
  ...props
}, ref) => {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (!refreshApi) return;
    setRefreshing(true);
    try {
      await refreshApi();
    } catch (error) {
      console.warn('ScrollView refresh API failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshControlElement = refreshApi ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.colors.primary}
      colors={[theme.colors.primary]}
      progressViewOffset={progressViewOffset}
    />
  ) : props.refreshControl;

  const commonStyle = [
    useFlex && styles.container,
    useThemeBackground && { backgroundColor: theme.colors.background },
    style,
  ];

  const commonContentContainerStyle = [
    styles.contentContainer,
    contentContainerStyle,
  ];

  if (isKeyboardAware) {
    return (
      <KeyboardAwareScrollView
        {...(props as any)}
        ref={ref as any}
        bottomOffset={20}
        style={commonStyle}
        contentContainerStyle={commonContentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        refreshControl={refreshControlElement}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  return (
    <RNScrollView
      {...props}
      ref={ref}
      style={commonStyle}
      contentContainerStyle={commonContentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={refreshControlElement}
    >
      {children}
    </RNScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

