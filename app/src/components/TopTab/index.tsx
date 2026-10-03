import React from 'react';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TabView, SceneRendererProps, NavigationState } from 'react-native-tab-view';
import { MaterialDesignIcons } from '../MaterialDesignIcons';

const { width } = Dimensions.get('window');

interface Route {
  key: string;
  title: string;
  icon?: string;
}

interface TopTabProps {
  index: number;
  setIndex: (index: number) => void;
  routes: Route[];
  renderScene: (props: SceneRendererProps & { route: Route }) => React.ReactNode;
}

const TopTab: React.FC<TopTabProps> = ({ index, setIndex, routes, renderScene }) => {
  const { theme } = useAppTheme();

  const navigationState: NavigationState<Route> = { index, routes };

  const CustomTabBar = () => (
    <View style={styles.barWrapper}>
      <View
        style={[
          styles.barContainer,
          {
            backgroundColor: theme.colors.glassBackground,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadowColor,
          },
        ]}
      >
        <View style={styles.pillTrack}>
          {/* Sliding active pill */}
          <View
            style={[
              styles.slidingPill,
              {
                left: index === 0
                  ? 5
                  : `${(index / routes.length) * 100}%` as any,
                right: index === routes.length - 1
                  ? 5
                  : `${((routes.length - index - 1) / routes.length) * 100}%` as any,
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
              },
            ]}
          />

          {routes.map((route, i) => {
            const focused = i === index;
            const iconColor = focused ? '#FFFFFF' : theme.colors.textSecondary;
            const textColor = focused ? '#FFFFFF' : theme.colors.textSecondary;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => setIndex(i)}
                style={styles.tabItem}
                activeOpacity={0.8}
              >
                {route.icon && (
                  <MaterialDesignIcons
                    name={route.icon as any}
                    size={18}
                    color={iconColor}
                    style={styles.tabIcon}
                  />
                )}
                <Text
                  style={[
                    styles.label,
                    {
                      color: textColor,
                      fontFamily: focused ? FontFamily.black : FontFamily.bodyBold,
                    },
                  ]}
                >
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <TabView<Route>
      lazy
      tabBarPosition="bottom"
      onIndexChange={setIndex}
      initialLayout={{ width }}
      navigationState={navigationState}
      renderScene={renderScene as any}
      renderTabBar={() => <CustomTabBar />}
    />
  );
};

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  barContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
  },
  pillTrack: {
    flexDirection: 'row',
    height: 56,
    padding: 5,
    position: 'relative',
    zIndex: 2,
  },
  slidingPill: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  tabIcon: {
    marginRight: 7,
  },
  label: {
    fontSize: rfValue(14),
    letterSpacing: 0.2,
  },
});

export default TopTab;
