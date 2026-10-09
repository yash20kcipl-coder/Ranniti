import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeImage } from './SafeImage';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Dropdown, IDropdownRef } from 'react-native-element-dropdown';

export interface DropdownOption<T = string> {
  id: T;
  label: string;
  sublabel?: string;
  icon?: string;
  image?: string;
  disabled?: boolean;
}

export interface AppDropdownProps<T = string> {
  label?: string;
  labelRightAction?: React.ReactNode;
  placeholder?: string;
  icon?: string;
  value: T;
  options: DropdownOption<T>[];
  onSelect: (value: T, item?: DropdownOption<T>) => void;
  // Open control
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchIcon?: string;
  // Clear
  clearable?: boolean;
  onClear?: () => void;
  clearText?: string;
  // Custom display override
  renderValue?: (selectedItem?: DropdownOption<T>) => React.ReactNode;
  // Sizing & states
  maxHeight?: number;
  loading?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  panelStyle?: ViewStyle;
  mode?: 'modal' | 'default' | 'auto';
  testID?: string;
}

interface DropdownItemData<T> extends DropdownOption<T> {
  displayLabel: string;
  searchContent: string;
}

export function AppDropdown<T extends string | number = string>({
  label,
  labelRightAction,
  placeholder = 'Select an option...',
  icon,
  value,
  options,
  onSelect,
  isOpen: controlledIsOpen,
  onToggle,
  searchable = true,
  searchPlaceholder = 'Search options...',
  searchIcon = 'magnify',
  clearable = false,
  onClear,
  clearText = 'Clear',
  maxHeight = 360,
  loading = false,
  disabled = false,
  containerStyle,
  buttonStyle,
  panelStyle,
  mode = 'modal',
  testID,
}: AppDropdownProps<T>) {
  const { theme } = useAppTheme();
  const dropdownRef = useRef<IDropdownRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isOpenRef = useRef(false);

  // Sync controlled isOpen state with imperative dropdown methods
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      if (controlledIsOpen && !isOpenRef.current) {
        isOpenRef.current = true;
        dropdownRef.current?.open();
      } else if (!controlledIsOpen && isOpenRef.current) {
        isOpenRef.current = false;
        dropdownRef.current?.close();
      }
    }
  }, [controlledIsOpen]);

  // Map options to rich data containing displayLabel and searchContent
  const data = useMemo<DropdownItemData<T>[]>(() => {
    return options.map((opt) => ({
      ...opt,
      displayLabel: opt.sublabel ? `${opt.sublabel} - ${opt.label}` : opt.label,
      searchContent: `${opt.label} ${opt.sublabel || ''} ${String(opt.id)}`.toLowerCase(),
    }));
  }, [options]);

  const selectedItem = useMemo(() => {
    return options.find((opt) => String(opt.id) === String(value));
  }, [options, value]);

  const handleSelect = (item: DropdownItemData<T>) => {
    if (item.disabled) return;
    onSelect(item.id, item);
  };

  const handleFocus = () => {
    setIsFocused(true);
    isOpenRef.current = true;
    onToggle?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    isOpenRef.current = false;
    onToggle?.(false);
  };

  const showClear = clearable && Boolean(value && value !== 'All' && value !== '');

  const modalContainerStyle = useMemo<ViewStyle>(() => {
    const screenWidth = Dimensions.get('window').width;
    return {
      width: Math.min(screenWidth * 0.92, 440),
      maxWidth: 440,
      alignSelf: 'center',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 10,
      paddingBottom: 6,
      ...panelStyle,
    };
  }, [panelStyle, theme.colors]);

  const renderLeftIcon = (visible?: boolean) => {
    if (selectedItem?.image) {
      return (
        <SafeImage
          uri={selectedItem.image}
          placeholderType="avatar"
          style={styles.selectedAvatar}
        />
      );
    }
    if (icon) {
      return (
        <MaterialDesignIcons
          name={icon as any}
          size={18}
          color={visible || isFocused ? theme.colors.primary : '#64748B'}
          style={styles.leftIcon}
        />
      );
    }
    return null;
  };

  const renderRightIcon = (visible?: boolean) => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={styles.rightIcon}
        />
      );
    }
    return (
      <MaterialDesignIcons
        name={visible ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={visible || isFocused ? theme.colors.primary : '#64748B'}
        style={styles.rightIcon}
      />
    );
  };

  const renderInputSearch = (onSearch: (text: string) => void) => {
    return (
      <View style={[styles.modalTopSection, { backgroundColor: theme.colors.surface || '#FFFFFF' }]}>
        {label ? (
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              {icon ? (
                <MaterialDesignIcons name={icon as any} size={18} color={theme.colors.primary} />
              ) : null}
              <Text
                style={[styles.modalHeaderTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => dropdownRef.current?.close()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.modalCloseBtn}
            >
              <MaterialDesignIcons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.searchBox}>
          <MaterialDesignIcons
            name={(searchIcon as any) || 'magnify'}
            size={18}
            color="#64748B"
          />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { color: theme.colors.text }]}
            onChangeText={onSearch}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>
    );
  };

  const renderItem = (item: DropdownItemData<T>, selected?: boolean) => {
    const isSelected = selected || String(item.id) === String(value);
    return (
      <View
        style={[
          styles.item,
          isSelected && [styles.itemActive, { backgroundColor: theme.colors.primary + '12' }],
          item.disabled && styles.itemDisabled,
        ]}
      >
        <View style={styles.itemContent}>
          {item.image ? (
            <SafeImage
              uri={item.image}
              placeholderType="avatar"
              style={styles.itemAvatar}
            />
          ) : item.icon ? (
            <MaterialDesignIcons
              name={item.icon as any}
              size={18}
              color={isSelected ? theme.colors.primary : '#64748B'}
              style={styles.itemIcon}
            />
          ) : null}

          <View style={styles.itemLabels}>
            <Text
              style={[
                styles.itemLabelText,
                { color: isSelected ? theme.colors.primary : theme.colors.text },
                isSelected && styles.itemLabelActive,
              ]}
              numberOfLines={1}
            >
              {item.sublabel ? (
                <Text style={{ fontFamily: FontFamily.black }}>{item.sublabel} - </Text>
              ) : null}
              {item.label}
            </Text>
          </View>
        </View>

        {isSelected && (
          <MaterialDesignIcons
            name="check"
            size={18}
            color={theme.colors.primary}
          />
        )}
      </View>
    );
  };

  const flatListProps = useMemo(() => {
    return {
      keyboardShouldPersistTaps: 'handled' as const,
      ListEmptyComponent: (
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="alert-circle-outline" size={22} color="#94A3B8" />
          <Text style={styles.emptyText}>No options found</Text>
        </View>
      ),
      ListHeaderComponent:
        !searchable && label ? (
          <View
            style={[
              styles.modalHeaderNoSearch,
              { backgroundColor: theme.colors.surface || '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeaderLeft}>
              {icon ? (
                <MaterialDesignIcons name={icon as any} size={18} color={theme.colors.primary} />
              ) : null}
              <Text
                style={[styles.modalHeaderTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => dropdownRef.current?.close()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.modalCloseBtn}
            >
              <MaterialDesignIcons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        ) : undefined,
    };
  }, [searchable, label, icon, theme.colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Optional Header / Label Row */}
      {(label || showClear || labelRightAction) && (
        <View style={styles.headerRow}>
          {label ? (
            <Text style={[styles.headerLabel, { color: theme.colors.text }]}>
              {label}
            </Text>
          ) : (
            <View />
          )}
          <View style={styles.headerActions}>
            {showClear && onClear && (
              <TouchableOpacity onPress={onClear} activeOpacity={0.7} style={styles.clearBtn}>
                <Text style={[styles.clearText, { color: theme.colors.primary }]}>
                  {clearText}
                </Text>
              </TouchableOpacity>
            )}
            {labelRightAction}
          </View>
        </View>
      )}

      {/* react-native-element-dropdown Modal Dropdown */}
      <Dropdown
        ref={dropdownRef}
        testID={testID}
        mode={mode}
        data={data}
        labelField="displayLabel"
        valueField="id"
        searchField="searchContent"
        value={value as any}
        placeholder={placeholder}
        search={searchable}
        searchPlaceholder={searchPlaceholder}
        searchPlaceholderTextColor="#94A3B8"
        disable={disabled || loading}
        maxHeight={maxHeight}
        backgroundColor="rgba(0, 0, 0, 0.45)"
        activeColor={theme.colors.primary + '10'}
        autoScroll={true}
        showsVerticalScrollIndicator={true}
        onChange={handleSelect}
        onFocus={handleFocus}
        onBlur={handleBlur}
        renderLeftIcon={renderLeftIcon}
        renderRightIcon={renderRightIcon}
        renderItem={renderItem}
        renderInputSearch={renderInputSearch}
        flatListProps={flatListProps}
        containerStyle={modalContainerStyle}
        style={[
          styles.dropdownTrigger,
          isFocused && [styles.dropdownTriggerActive, { borderColor: theme.colors.primary }],
          disabled && styles.dropdownTriggerDisabled,
          buttonStyle,
        ]}
        placeholderStyle={[styles.placeholderStyle, { color: '#94A3B8' }]}
        selectedTextStyle={[styles.selectedTextStyle, { color: theme.colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13.5),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
  },
  dropdownTrigger: {
    minHeight: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  dropdownTriggerActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
  },
  dropdownTriggerDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  placeholderStyle: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
  },
  selectedTextStyle: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
  },
  selectedAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 10,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 6,
  },
  modalTopSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderNoSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modalHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14.5),
    letterSpacing: 0.2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemActive: {},
  itemDisabled: {
    opacity: 0.4,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  itemAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  itemIcon: {
    marginRight: 2,
  },
  itemLabels: {
    flex: 1,
  },
  itemLabelText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
  },
  itemLabelActive: {
    fontFamily: FontFamily.bold,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
    color: '#94A3B8',
  },
});
