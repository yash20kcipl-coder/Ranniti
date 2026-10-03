import { rfValue } from '../utils/responsive';
import NoData, { NoDataProps } from './NoData';
import Animated from 'react-native-reanimated';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import {
  Text, StyleSheet, RefreshControl, FlatListProps, StyleProp,
  ViewStyle, ListRenderItem, ActivityIndicator, FlatList
} from 'react-native';
import React, { memo, useCallback, useState } from 'react';

interface PaginationProps {
  count: number;
}

export interface MdFlatlistProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem' | 'ListEmptyComponent'> {
  data?: T[] | null;
  refresh?: () => void;
  renderItem?: ListRenderItem<T>;
  style?: StyleProp<ViewStyle>;
  paginationProps?: PaginationProps | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  nodatatext?: string;
  empty?: NoDataProps;
  showsVerticalScrollIndicator?: boolean;
  isAnimated?: boolean;
  isLoading?: boolean;
  renderSkeleton?: ListRenderItem<T>;
}

const wait = (timeout: number) => { return new Promise<void>(resolve => setTimeout(() => resolve(), timeout)); }

function MdFlatlistInner<T>(
  {
    data = [],
    refresh,
    renderItem,
    style,
    paginationProps = null,
    ListEmptyComponent = undefined,
    nodatatext = "",
    empty = undefined,
    showsVerticalScrollIndicator = false,
    isAnimated = false,
    isLoading = false,
    renderSkeleton,
    ...props
  }: MdFlatlistProps<T>,
  ref: React.Ref<FlatList<T>>
) {
  const { theme } = useAppTheme();
  const parcount = paginationProps?.count || 25;
  const [refreshing, setRefreshing] = useState(false);
  const [paginationState, setPaginationState] = useState({ count: parcount, loading: false });

  const listData = React.useMemo(() => {
    if (isLoading) {
      return Array.from({ length: 10 }).map((_, i) => ({ id: `skeleton-${i}` })) as unknown as T[];
    }
    return Array.isArray(data) ? (paginationProps ? data?.slice(0, paginationState?.count) : data) : [];
  }, [data, paginationProps, paginationState?.count, isLoading]);

  const onRefresh = useCallback(() => {
    if (typeof refresh === 'function') {
      refresh();
      setRefreshing(true);
      wait(2000).then(() => setRefreshing(false));
    }
  }, [refresh]);

  const refreshControl = React.useMemo(() => {
    if (typeof refresh !== 'function') return undefined;
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[theme.colors.primary]}
        tintColor={theme.colors.primary}
        enabled={true}
      />
    );
  }, [refreshing, onRefresh, refresh, theme.colors.primary]);

  const paginationConfig = React.useMemo(() => {
    return paginationProps && {
      onEndReachedThreshold: 0.3,
      onEndReached: async () => {
        if (!paginationState?.loading && paginationState?.count < (data?.length || 0)) {
          setPaginationState((prev) => ({ ...prev, loading: true }));
          await wait(1000).then(() => setPaginationState((prev) => ({ ...prev, count: prev?.count + parcount, loading: false })));
        }
      },
      ...(paginationProps && paginationState?.loading && {
        ListFooterComponent: <ActivityIndicator color={theme.colors.text} size="small" style={{ paddingVertical: 10 }} />
      })
    };
  }, [paginationProps, paginationState, data?.length, parcount, theme.colors.text]);

  const emptyComponent = React.useMemo(() => {
    if (ListEmptyComponent) {
      return ListEmptyComponent;
    }
    if (nodatatext) {
      return <Text style={[styles.nodata, { color: theme.colors.text }]}>{nodatatext}</Text>;
    }
    if (empty) {
      return <NoData {...empty} />;
    }
    return <NoData />;
  }, [ListEmptyComponent, nodatatext, empty, theme.colors.text]);

  const Component = (isAnimated ? Animated.FlatList : FlatList) as unknown as typeof FlatList;

  return (
    <Component
      ref={ref}
      bounces
      removeClippedSubviews={true}
      {...paginationConfig}
      {...props}
      style={style}
      data={listData}
      ListEmptyComponent={emptyComponent}
      keyExtractor={(item: T, index: number) => index.toString()}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      renderItem={isLoading && renderSkeleton ? renderSkeleton : renderItem}
      {...(refreshControl ? { refreshControl } : {})}
    />
  );
}

const MdFlatList = memo(React.forwardRef(MdFlatlistInner)) as <T>(
  props: MdFlatlistProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement;

export default MdFlatList;

const styles = StyleSheet.create({
  nodata: {
    marginTop: 10,
    alignSelf: "center",
    fontFamily: FontFamily.body,
    fontSize: rfValue(14),
  },
});
