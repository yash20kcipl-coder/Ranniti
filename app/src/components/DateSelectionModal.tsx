import React, { useState } from 'react';
import moment from 'moment';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';

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
  startDate: initialStart,
  endDate: initialEnd,
  onSelectDates,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [selectedStart, setSelectedStart] = useState<string>(initialStart || moment().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState(moment());

  const handleDatePress = (dateStr: string) => {
    setSelectedStart(dateStr);
    onSelectDates(dateStr, dateStr);
    onClose();
  };

  const startOfMonth = currentMonth.clone().startOf('month');
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarModalContainer}>
          {/* Calendar Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}
              style={styles.arrowBox}
            >
              <MaterialDesignIcons size={18} color={theme.colors.primary} name="chevron-left" />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{currentMonth.format('MMMM YYYY')}</Text>

            <TouchableOpacity
              onPress={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}
              style={styles.arrowBox}
            >
              <MaterialDesignIcons size={18} color={theme.colors.primary} name="chevron-right" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {/* Grid of Days */}
          <View style={styles.daysGrid}>
            {days.map((dayNum, idx) => {
              if (dayNum === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const dateStr = currentMonth.clone().date(dayNum).format('YYYY-MM-DD');
              const isSelected = dateStr === selectedStart;
              const isToday = dateStr === moment().format('YYYY-MM-DD');

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.colors.primary, borderRadius: 20 },
                  ]}
                  onPress={() => handleDatePress(dateStr)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                      isToday && !isSelected && { color: theme.colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    calendarModalContainer: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      ...getShadow(8, '#000000', 0.2),
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    monthTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text,
    },
    arrowBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
    },
    weekDayText: {
      width: 36,
      textAlign: 'center',
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    dayCell: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 2,
    },
    dayText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(14),
      color: theme.colors.text,
    },
  });

export default DateSelectionModal;
