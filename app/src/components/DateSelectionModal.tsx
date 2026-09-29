import React from 'react';
import moment from 'moment';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { Calendar } from 'react-native-calendars';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

interface DateSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  dayType: 'full' | 'half';
  startDate: string;
  endDate: string;
  onSelectDates: (startDateIso: string, endDateIso: string) => void;
  holidays?: any[];
}

export const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  visible,
  onClose,
  dayType,
  startDate,
  endDate,
  onSelectDates,
  holidays,
}) => {
  const { theme, styles } = useAppTheme(getStyles);

  const handleDatePress = (dateString: string) => {
    const selected = dateString; // This is already YYYY-MM-DD

    if (dayType === 'half') {
      onSelectDates(selected, selected);
      onClose();
    } else {
      if (!startDate || (startDate && endDate)) {
        onSelectDates(selected, '');
      } else {
        const start = moment(startDate);
        const current = moment(selected);

        if (current.isBefore(start)) {
          onSelectDates(selected, '');
        } else {
          onSelectDates(startDate, selected);
        }
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // 1. Populate holidays
    if (holidays && Array.isArray(holidays)) {
      holidays.forEach((holiday: any) => {
        if (!holiday.startDate) return;
        let currentHoliday = moment(holiday.startDate).startOf('day');
        const endHoliday = moment(holiday.endDate || holiday.startDate).startOf('day');

        while (currentHoliday.isSameOrBefore(endHoliday, 'day')) {
          const dateStr = currentHoliday.format('YYYY-MM-DD');
          marked[dateStr] = {
            color: theme.colors.warning + '20', // transparent warning background
            textColor: theme.colors.warning, // warning text color
            startingDay: currentHoliday.isSame(moment(holiday.startDate), 'day'),
            endingDay: currentHoliday.isSame(endHoliday, 'day'),
          };
          currentHoliday.add(1, 'days');
        }
      });
    }

    if (!startDate) return marked;

    const startStr = startDate.split('T')[0];

    if (dayType === 'half' || !endDate) {
      marked[startStr] = {
        selected: true,
        startingDay: true,
        endingDay: true,
        color: theme.colors.primary,
        textColor: '#FFFFFF',
      };
      return marked;
    }

    const endStr = endDate.split('T')[0];

    if (startStr === endStr) {
      marked[startStr] = {
        selected: true,
        startingDay: true,
        endingDay: true,
        color: theme.colors.primary,
        textColor: '#FFFFFF',
      };
      return marked;
    }

    marked[startStr] = {
      selected: true,
      startingDay: true,
      color: theme.colors.primary,
      textColor: '#FFFFFF',
    };

    marked[endStr] = {
      selected: true,
      endingDay: true,
      color: theme.colors.primary,
      textColor: '#FFFFFF',
    };

    let current = moment(startDate).add(1, 'days');
    const end = moment(endDate);

    while (current.isBefore(end)) {
      const dateStr = current.format('YYYY-MM-DD');
      marked[dateStr] = {
        selected: true,
        color: theme.colors.primary + '18',
        textColor: theme.colors.primary,
      };
      current.add(1, 'days');
    }

    return marked;
  };

  const confirmDateRange = () => {
    if (!endDate) {
      onSelectDates(startDate, startDate);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.calendarModalContainer}
        >

          <Calendar
            renderArrow={(direction: string) => (
              <View style={styles.arrowBox}>
                <MaterialDesignIcons
                  size={18}
                  color={theme.colors.primary}
                  name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                />
              </View>
            )}
            minDate={moment().format('YYYY-MM-DD')}
            markingType="period"
            markedDates={getMarkedDates()}
            onDayPress={(day) => handleDatePress(day.dateString)}
            theme={{
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.text,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.text,
              textDisabledColor: theme.colors.textSecondary + '40',
              dotColor: theme.colors.primary,
              selectedDotColor: '#FFFFFF',
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.text,
              indicatorColor: theme.colors.primary,
              textDayFontFamily: FontFamily.body,
              textMonthFontFamily: FontFamily.bodyBold,
              textDayHeaderFontFamily: FontFamily.bodyBold,
              textDayFontSize: rfValue(13.5),
              textMonthFontSize: rfValue(15.5),
              textDayHeaderFontSize: rfValue(11),
              'stylesheet.day.basic': {
                base: {
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                text: {
                  marginTop: 0,
                  fontSize: rfValue(12),
                  fontFamily: FontFamily.bodyBold,
                },
              }
            } as any}
            enableSwipeMonths
          />

          {dayType === 'full' && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, !endDate && styles.confirmBtnDisabled]}
                activeOpacity={0.85}
                onPress={confirmDateRange}
                disabled={!endDate}
              >
                <Text style={styles.confirmBtnText}>Confirm Range</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarModalContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    paddingTop: 5,
    ...getShadow(4, theme.colors.shadowColor, 0.15),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.heading,
    color: theme.colors.text,
  },
  modalFooter: {
    marginTop: 16,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: theme.colors.textSecondary + '40',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14),
  },
  arrowBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 6,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...getShadow(1, theme.colors.shadowColor, 0.02),
  },
});
