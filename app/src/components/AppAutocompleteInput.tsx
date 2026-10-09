import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { useLanguage } from '../languages';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import React, { useState, useMemo, useRef, useEffect } from 'react';

export interface AutocompleteSuggestion {
  id?: string;
  name: string;
  sublabel?: string;
  category?: string;
}

export interface AppAutocompleteInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectSuggestion?: (item: AutocompleteSuggestion | string) => void;
  suggestions: (string | AutocompleteSuggestion)[];
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
  error?: string;
  allowCustom?: boolean;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  panelStyle?: ViewStyle;
  testID?: string;
}

export const AppAutocompleteInput: React.FC<AppAutocompleteInputProps> = ({
  label,
  value = '',
  onChangeText,
  onSelectSuggestion,
  suggestions = [],
  placeholder = 'Select or type...',
  icon,
  disabled = false,
  error,
  allowCustom = true,
  containerStyle,
  buttonStyle,
  panelStyle,
  testID,
}) => {
  const { theme } = useAppTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);

  // Synchronize internal search query when opening modal
  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery(value || '');
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  // Normalize suggestions into uniform objects
  const normalizedSuggestions = useMemo<AutocompleteSuggestion[]>(() => {
    const set = new Set<string>();
    const list: AutocompleteSuggestion[] = [];

    (suggestions || []).forEach((item) => {
      if (!item) return;
      const name = typeof item === 'string' ? item.trim() : item.name?.trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!set.has(key)) {
        set.add(key);
        if (typeof item === 'string') {
          list.push({ name });
        } else {
          list.push({
            id: item.id,
            name,
            sublabel: item.sublabel,
            category: item.category,
          });
        }
      }
    });

    return list;
  }, [suggestions]);

  // Filter suggestions based on live search query
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return normalizedSuggestions.slice(0, 30);
    return normalizedSuggestions
      .filter((s) => {
        const matchName = s.name.toLowerCase().includes(q);
        const matchSub = s.sublabel && s.sublabel.toLowerCase().includes(q);
        const matchCat = s.category && s.category.toLowerCase().includes(q);
        return matchName || matchSub || matchCat;
      })
      .slice(0, 30);
  }, [normalizedSuggestions, searchQuery]);

  // Check if search query matches an existing suggestion exactly
  const hasExactMatch = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return normalizedSuggestions.some((s) => s.name.toLowerCase() === q);
  }, [normalizedSuggestions, searchQuery]);

  // Handle selecting an existing suggestion
  const handleSelect = (item: AutocompleteSuggestion) => {
    onChangeText(item.name);
    onSelectSuggestion?.(item);
    setModalVisible(false);
  };

  // Handle adding custom free-text entry
  const handleAddNewCustom = () => {
    const clean = searchQuery.trim();
    if (!clean) return;
    onChangeText(clean);
    onSelectSuggestion?.(clean);
    setModalVisible(false);
  };

  // Clear current input value
  const handleClear = (e?: any) => {
    e?.stopPropagation?.();
    onChangeText('');
    setSearchQuery('');
  };

  // Auto-focus text input when modal opens
  useEffect(() => {
    if (modalVisible) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

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

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {/* Header Label Row */}
      {Boolean(label) && (
        <View style={styles.headerRow}>
          <Text style={[styles.headerLabel, { color: theme.colors.text }]}>
            {label}
          </Text>
          {Boolean(value) && !disabled && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={styles.clearBtn}>
              <Text style={[styles.clearText, { color: theme.colors.primary }]}>
                {t('clear') || 'Clear'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Trigger Button Field */}
      <TouchableOpacity
        style={[
          styles.triggerBox,
          {
            backgroundColor: theme.colors.surface || '#F8FAFC',
            borderColor: error ? theme.colors.error : theme.colors.border || '#E2E8F0',
          },
          disabled && styles.triggerDisabled,
          buttonStyle,
        ]}
        activeOpacity={0.75}
        onPress={handleOpen}
        disabled={disabled}
      >
        {icon ? (
          <MaterialDesignIcons
            name={icon as any}
            size={18}
            color="#64748B"
            style={styles.triggerLeftIcon}
          />
        ) : null}

        <Text
          style={[
            styles.triggerText,
            { color: value ? theme.colors.text : '#94A3B8' },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <View style={styles.triggerRightActions}>
          {Boolean(value) && !disabled ? (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialDesignIcons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
          <MaterialDesignIcons name="magnify" size={18} color="#64748B" />
        </View>
      </TouchableOpacity>

      {/* Validation Error Message */}
      {Boolean(error) && (
        <Text style={[styles.errorText, { color: theme.colors.error || '#EF4444' }]}>
          {error}
        </Text>
      )}

      {/* Modal Autocomplete Picker */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            style={modalContainerStyle}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={[styles.modalTopSection, { backgroundColor: theme.colors.surface || '#FFFFFF' }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  {icon ? (
                    <MaterialDesignIcons name={icon as any} size={18} color={theme.colors.primary} />
                  ) : null}
                  <Text style={[styles.modalHeaderTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {label || placeholder}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.modalCloseBtn}
                >
                  <MaterialDesignIcons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Search / Free-Text Input Box */}
              <View style={styles.searchBox}>
                <MaterialDesignIcons name="magnify" size={18} color="#64748B" />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={placeholder || (t('selectOrType') || 'Select or type...')}
                  placeholderTextColor="#94A3B8"
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleAddNewCustom}
                />
                {Boolean(searchQuery) && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialDesignIcons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* "+ Add new '{searchQuery}'" Highlight Banner */}
            {allowCustom && !hasExactMatch && Boolean(searchQuery.trim()) && (
              <TouchableOpacity
                style={[
                  styles.addNewCard,
                  {
                    backgroundColor: theme.colors.primary + '12',
                    borderColor: theme.colors.primary + '40',
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleAddNewCustom}
              >
                <View style={[styles.addNewIconWrap, { backgroundColor: theme.colors.primary + '20' }]}>
                  <MaterialDesignIcons name="plus" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.addNewTextWrap}>
                  <Text style={[styles.addNewTitle, { color: theme.colors.primary }]} numberOfLines={1}>
                    {t('addNew') || 'Add new'}: <Text style={{ fontFamily: FontFamily.black }}>"{searchQuery.trim()}"</Text>
                  </Text>
                  <Text style={styles.addNewSubtitle}>
                    {t('willBeAddedToDb') || 'Will be added to database upon save'}
                  </Text>
                </View>
                <MaterialDesignIcons name="chevron-right" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}

            {/* Suggestions List */}
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }: { item: AutocompleteSuggestion }) => {
                const isSelected = item.name.toLowerCase() === value.toLowerCase().trim();
                return (
                  <TouchableOpacity
                    style={[
                      styles.suggestionItem,
                      isSelected && [styles.suggestionItemActive, { backgroundColor: theme.colors.primary + '10' }],
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.suggestionLeft}>
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: isSelected ? theme.colors.primary : theme.colors.text },
                          isSelected && styles.suggestionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.sublabel ? (
                        <Text style={styles.suggestionSublabel} numberOfLines={1}>
                          {item.sublabel}
                        </Text>
                      ) : null}
                    </View>

                    {isSelected && (
                      <MaterialDesignIcons name="check" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialDesignIcons name="format-list-bulleted" size={24} color="#94A3B8" />
                  <Text style={styles.emptyText}>
                    {searchQuery.trim()
                      ? (t('noSuggestionsFound') || 'No suggestions found. Tap above to add.')
                      : (t('selectOrType') || 'Type to search or add new...')}
                  </Text>
                </View>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
  clearBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
  },
  triggerBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  triggerLeftIcon: {
    marginRight: 2,
  },
  triggerText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
  },
  triggerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11.5),
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalTopSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  addNewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewTextWrap: {
    flex: 1,
  },
  addNewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  addNewSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    color: '#64748B',
    marginTop: 1,
  },
  list: {
    maxHeight: 340,
  },
  listContent: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  suggestionItemActive: {},
  suggestionLeft: {
    flex: 1,
    marginRight: 8,
  },
  suggestionText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(13),
  },
  suggestionTextActive: {
    fontFamily: FontFamily.bold,
  },
  suggestionSublabel: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    color: '#94A3B8',
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12.5),
    color: '#94A3B8',
    textAlign: 'center',
  },
});
