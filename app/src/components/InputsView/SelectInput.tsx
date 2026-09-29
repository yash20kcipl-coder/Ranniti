import React, { useRef, useState } from 'react';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { Dropdown } from 'react-native-element-dropdown';
import { View, Text, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const { height } = Dimensions.get("window")

interface SelectInputComponentProps extends FormInputProps {
  theme: Theme;
  styles: any;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
}

export const SelectInput: React.FC<SelectInputComponentProps> = ({
  label: _label,
  value,
  placeholder,
  options = [],
  onChange,
  editable = true,
  error,
  theme,
  styles,
  dropdownPosition = 'auto',
}) => {
  const containerRef = useRef<View>(null);
  const selectedOption = options?.find((opt) => opt.value === value);
  const [computedPosition, setComputedPosition] = useState<'top' | 'bottom'>('bottom');
  const insets = useSafeAreaInsets();

  const handleFocus = () => {
    if (dropdownPosition !== 'auto') {
      setComputedPosition(dropdownPosition);
      return;
    }

    containerRef.current?.measureInWindow((x, y, w, h) => {
      const screenHeight = Dimensions.get('window').height;
      const statusBarHeight = insets.top || StatusBar.currentHeight || 0;
      const bottomHeight = insets.bottom || 0;

      // Usable active height excluding the top status bar and bottom gesture bar/buttons
      const activeHeight = screenHeight - statusBarHeight - bottomHeight;
      const midpoint = activeHeight / 2;

      // Position of the input midpoint relative to the start of the active usable screen height
      const inputRelativeMidpoint = (y + h / 2) - statusBarHeight;

      if (inputRelativeMidpoint > midpoint) {
        setComputedPosition('top');
      } else {
        setComputedPosition('bottom');
      }
    });
  };

  return (
    <View ref={containerRef} style={{ width: '100%' }}>
      <Dropdown
        dropdownPosition={computedPosition}
        onFocus={handleFocus}
        style={[
          styles.selectBox,
          !!error && styles.selectBoxError,
          !editable && { opacity: 0.6 }
        ]}
        placeholderStyle={[styles.selectText, styles.placeholder]}
        selectedTextStyle={styles.selectText}
        inputSearchStyle={{
          borderRadius: 8,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.inputBackground,
          fontFamily: FontFamily.body,
          fontSize: rfValue(13),
          height: 40,
          color: theme.colors.text,
          paddingHorizontal: 8,
        }}
        containerStyle={{
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          marginTop: 4,
          paddingVertical: 4,
          ...getShadow(3, '#000000', 0.05),
        }}
        activeColor="transparent"
        data={options}
        search={options.length > 5}
        maxHeight={height / 2.5}
        labelField="label"
        valueField="value"
        placeholder={placeholder || 'Select option...'}
        searchPlaceholder="Search..."
        value={value}
        onChange={(item) => onChange(item.value)}
        disable={!editable}
        flatListProps={{
          keyboardShouldPersistTaps: 'handled',
        }}
        renderRightIcon={() => (
          <MaterialDesignIcons
            name="chevron-down"
            size={20}
            color={theme.colors.textSecondary + 'B3'}
          />
        )}
        renderLeftIcon={() =>
          selectedOption?.icon ? (
            <View style={{ marginRight: 10 }}>
              <MaterialDesignIcons
                name={selectedOption.icon as any}
                size={18}
                color={selectedOption.color || theme.colors.primary}
              />
            </View>
          ) : null
        }
        renderItem={(item) => {
          const isSelected = item.value === value;
          const itemIconColor = item.color || theme.colors.primary;
          const itemIconBg = item.bg || itemIconColor + '15';

          return (
            <View style={[styles.optionItem, isSelected && styles.activeOptionItem]}>
              <View style={styles.optionRow}>
                {item.icon && (
                  <View style={[styles.modalIconContainer, { width: 28, height: 28, borderRadius: 14, backgroundColor: itemIconBg }]}>
                    <MaterialDesignIcons
                      name={item.icon as any}
                      size={14}
                      color={itemIconColor}
                    />
                  </View>
                )}
                <Text style={[styles.optionText, { fontSize: rfValue(13.5) }, isSelected && styles.activeOptionText]}>
                  {item.label}
                </Text>
              </View>
              {isSelected && (
                <MaterialDesignIcons
                  name="check"
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default SelectInput;
