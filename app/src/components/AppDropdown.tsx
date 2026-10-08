import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { SafeImage } from './SafeImage';
import { rfValue } from '../utils/responsive';
import React, { useState, useMemo } from 'react';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from './MaterialDesignIcons';

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
  searchIcon = 'search',
  clearable = false,
  onClear,
  clearText = 'Clear',
  renderValue,
  maxHeight = 220,
  loading = false,
  disabled = false,
  containerStyle,
  buttonStyle,
  panelStyle,
}: AppDropdownProps<T>) {
  const { theme } = useAppTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    if (isControlled && onToggle) {
      onToggle(nextState);
    } else {
      setInternalIsOpen(nextState);
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onSelect(option.id, option);
    if (isControlled && onToggle) {
      onToggle(false);
    } else {
      setInternalIsOpen(false);
    }
    setSearchQuery('');
  };

  const selectedItem = useMemo(() => {
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label && opt.label.toLowerCase().includes(q);
      const matchSub = opt.sublabel && opt.sublabel.toLowerCase().includes(q);
      const matchId = String(opt.id).toLowerCase().includes(q);
      return matchLabel || matchSub || matchId;
    });
  }, [options, searchable, searchQuery]);

  const showClear = clearable && Boolean(value && value !== 'All' && value !== '');

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Optional Header / Label Row */}
      {(label || showClear || labelRightAction) && (
        <View style={styles.headerRow}>
          {label ? (
            <Text style={[styles.headerLabel, { color: theme.colors.text }]}>
              {label}
            </Text>
          ) : <View />}
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

      {/* Dropdown Trigger Button */}
      <TouchableOpacity
        style={[
          styles.button,
          isOpen && [styles.buttonActive, { borderColor: theme.colors.primary }],
          disabled && styles.buttonDisabled,
          buttonStyle,
        ]}
        activeOpacity={0.7}
        onPress={handleToggle}
        disabled={disabled}
      >
        {icon && (
          <MaterialDesignIcons
            name={icon as any}
            size={18}
            color={isOpen ? theme.colors.primary : '#64748B'}
          />
        )}

        {selectedItem?.image && (
          <SafeImage
            uri={selectedItem.image}
            placeholderType="avatar"
            style={styles.selectedAvatar}
          />
        )}

        <View style={styles.buttonTextContainer}>
          {renderValue ? (
            renderValue(selectedItem)
          ) : (
            <Text
              style={[
                styles.buttonText,
                selectedItem ? { color: theme.colors.text } : styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {selectedItem ? (
                <>
                  {selectedItem.sublabel ? (
                    <Text style={{ fontFamily: FontFamily.black }}>{selectedItem.sublabel} - </Text>
                  ) : null}
                  {selectedItem.label}
                </>
              ) : (
                placeholder
              )}
            </Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <MaterialDesignIcons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isOpen ? theme.colors.primary : '#64748B'}
          />
        )}
      </TouchableOpacity>

      {/* Expandable Dropdown List */}
      {isOpen && (
        <View style={[styles.panel, panelStyle]}>
          {searchable && (
            <View style={styles.searchBox}>
              <MaterialDesignIcons name={searchIcon} size={16} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#94A3B8"
                style={[styles.searchInput, { color: theme.colors.text }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {Boolean(searchQuery) && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialDesignIcons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          )}
          <ScrollView
            style={[styles.listContainer, { maxHeight }]}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {filteredOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialDesignIcons name="alert-circle-outline" size={20} color="#94A3B8" />
                <Text style={styles.emptyText}>No options found</Text>
              </View>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <TouchableOpacity
                    key={String(opt.id)}
                    style={[
                      styles.item,
                      isSelected && [styles.itemActive, { backgroundColor: theme.colors.primary + '10' }],
                      opt.disabled && styles.itemDisabled,
                    ]}
                    onPress={() => handleSelect(opt)}
                    disabled={opt.disabled}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemContent}>
                      {opt.image ? (
                        <SafeImage
                          uri={opt.image}
                          placeholderType="avatar"
                          style={styles.itemAvatar}
                        />
                      ) : opt.icon ? (
                        <MaterialDesignIcons
                          name={opt.icon as any}
                          size={18}
                          color={isSelected ? theme.colors.primary : '#64748B'}
                        />
                      ) : null}

                      <View style={styles.itemLabels}>
                        <Text
                          style={[
                            styles.itemLabelText,
                            isSelected && [styles.itemLabelActive, { color: theme.colors.primary }],
                          ]}
                          numberOfLines={1}
                        >
                          {opt.sublabel ? (
                            <Text style={{ fontFamily: FontFamily.black }}>{opt.sublabel} - </Text>
                          ) : null}
                          {opt.label}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <MaterialDesignIcons
                        name="check"
                        size={16}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLabel: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(13),
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
  },
  placeholderText: {
    color: '#94A3B8',
  },
  selectedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    paddingVertical: 4,
  },
  listContainer: {
    maxHeight: 220,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  itemLabels: {
    flex: 1,
  },
  itemLabelText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: '#334155',
  },
  itemLabelActive: {
    fontFamily: FontFamily.black,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: '#94A3B8',
  },
});
