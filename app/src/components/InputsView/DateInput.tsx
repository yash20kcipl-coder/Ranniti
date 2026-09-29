import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import moment from 'moment';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { DateSelectionModal } from '../DateSelectionModal';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';

interface DateInputComponentProps extends FormInputProps {
  theme: Theme;
  styles: any;
}

export const DateInput: React.FC<DateInputComponentProps> = ({
  value,
  placeholder,
  onChange,
  editable = true,
  error,
  mode = 'single',
  theme,
  styles,
  holidays,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  let displayValue = placeholder || 'Choose date...';
  if (value) {
    if (typeof value === 'object') {
      const startStr = value.start ? moment(value.start).format('MMM D, YYYY') : '';
      const endStr = value.end ? moment(value.end).format('MMM D, YYYY') : '';
      displayValue = startStr && endStr ? `${startStr} - ${endStr}` : startStr || placeholder || 'Choose date...';
    } else if (typeof value === 'string') {
      displayValue = moment(value).format('MMM D, YYYY');
    }
  }

  const startDateVal = typeof value === 'object' ? value.start : value;
  const endDateVal = typeof value === 'object' ? value.end : value;

  return (
    <>
      <Pressable
        style={[styles.selectBox, !!error && styles.selectBoxError]}
        onPress={() => editable && setShowPicker(true)}
      >
        <View style={styles.dateRow}>
          <MaterialDesignIcons
            name="calendar"
            size={18}
            color={theme.colors.textSecondary + 'B3'}
          />
          <Text style={[styles.selectText, !value && styles.placeholder]}>
            {displayValue}
          </Text>
        </View>
      </Pressable>

      <DateSelectionModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        dayType={mode === 'range' ? 'full' : 'half'}
        startDate={startDateVal || ''}
        endDate={endDateVal || ''}
        holidays={holidays}
        onSelectDates={(start, end) => {
          if (mode === 'range') {
            onChange({ start, end });
          } else {
            onChange(start);
          }
        }}
      />
    </>
  );
};

export default DateInput;
