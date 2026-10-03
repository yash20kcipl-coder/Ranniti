import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { Theme } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { DateSelectionModal } from './DateSelectionModal';
import { getShadow } from '../utils/shadow';
import { formatDate } from '../utils/dateUtils';

interface DateRangePickerProps {
  dayType: 'full' | 'half';
  startDate: string;
  endDate: string;
  onSelectDates: (startDateIso: string, endDateIso: string) => void;
  label?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dayType,
  startDate,
  endDate,
  onSelectDates,
  label = 'Duration',
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [showCalendar, setShowCalendar] = useState(false);
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setShowCalendar(true)}
        style={styles.formGroup}
      >
        <Text style={styles.formGroupLabel}>{label}</Text>

        <View style={styles.datePickerContainer}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateSubLabel}>start date</Text>
            <View style={styles.dateSubRow}>
              <MaterialDesignIcons name="calendar-import" size={16} color={theme.colors.primary} />
              <Text style={styles.dateValueText}>
                {formatDate(startDate)}
              </Text>
            </View>
          </View>

          <View style={styles.arrowColumn}>
            <MaterialDesignIcons name="arrow-right-thin" size={22} color={theme.colors.textSecondary + '50'} />
          </View>

          <View style={styles.dateColumn}>
            <Text style={styles.dateSubLabel}>end date</Text>
            <View style={styles.dateSubRow}>
              <MaterialDesignIcons name="calendar-export" size={16} color={theme.colors.primary} />
              <Text style={styles.dateValueText}>
                {formatDate(endDate || startDate)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <DateSelectionModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        dayType={dayType}
        startDate={startDate}
        endDate={endDate}
        onSelectDates={onSelectDates}
      />
    </>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  formGroup: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...getShadow(2, theme.colors.shadowColor, 0.04),
  },
  formGroupLabel: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
    color: theme.colors.text,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dateColumn: {
    flex: 1,
  },
  dateSubLabel: {
    fontSize: rfValue(10),
    fontFamily: FontFamily.medium,
    color: theme.colors.textSecondary,
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  dateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateValueText: {
    fontSize: rfValue(14),
    fontFamily: FontFamily.bodyBold,
    color: theme.colors.text,
    marginLeft: 8,
  },
  arrowColumn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
