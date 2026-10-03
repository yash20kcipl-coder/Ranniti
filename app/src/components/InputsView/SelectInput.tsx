import React, { useState } from 'react';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from '../MaterialDesignIcons';

interface SelectInputComponentProps extends Partial<FormInputProps> {
  theme: Theme;
  styles: any;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
}


export const SelectInput: React.FC<SelectInputComponentProps> = ({
  value,
  placeholder,
  options = [],
  onChange,
  disabled,
  error,
  theme,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayText = selectedOption ? selectedOption.label : placeholder || 'Select option...';

  const handleSelect = (val: any) => {
    if (onChange) {
      onChange(val);
    }
    setModalVisible(false);
  };

  return (
    <View style={componentStyles.container}>
      <TouchableOpacity
        style={[
          componentStyles.selectBox,
          { backgroundColor: theme.colors.surface, borderColor: error ? theme.colors.error : theme.colors.outline },
          disabled && { opacity: 0.6 },
        ]}
        activeOpacity={0.7}
        onPress={() => !disabled && setModalVisible(true)}
      >
        <Text
          style={[
            componentStyles.selectText,
            { color: selectedOption ? theme.colors.text : theme.colors.textSecondary },
          ]}
        >
          {displayText}
        </Text>
        <MaterialDesignIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={componentStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[componentStyles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <View style={componentStyles.modalHeader}>
              <Text style={[componentStyles.modalTitle, { color: theme.colors.text }]}>
                {placeholder || 'Select Option'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={[
                      componentStyles.optionItem,
                      isSelected && { backgroundColor: theme.colors.primary + '15' },
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text
                      style={[
                        componentStyles.optionText,
                        { color: isSelected ? theme.colors.primary : theme.colors.text },
                        isSelected && { fontWeight: 'bold' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialDesignIcons name="check" size={18} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const componentStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(14),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: 360,
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(16),
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(14),
  },
});

export default SelectInput;
