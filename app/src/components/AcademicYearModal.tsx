import { AppModal } from './AppModal';
import { Skeleton } from './Skeleton';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { fetchAcademicYearsAction, switchAcademicYearAction } from '../store/actions/auth';

interface AcademicYearModalProps {
  visible: boolean;
  onDismiss: () => void;
  onYearSelected?: () => void;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  visible,
  onDismiss,
  onYearSelected
}) => {
  const dispatch = useDispatch<any>();
  const { theme, styles } = useAppTheme(getStyles);
  const currentYear = useSelector((state: any) => state.auth.academicYear);

  const [loading, setLoading] = useState(false);
  const [years, setYears] = useState<any[]>([]);

  const loadYears = async () => {
    setLoading(true);
    const data = await fetchAcademicYearsAction();
    setYears(data);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      loadYears();
    }
  }, [visible]);

  const handleSelect = async (year: any) => {
    await dispatch(switchAcademicYearAction(year, true));
    onDismiss();
    if (onYearSelected) { onYearSelected() }
  };

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title="Academic Cycle"
      message="Select an academic year to browse its schedule and records."
      icon="calendar-sync-outline"
    >
      <View style={styles.container}>
        {loading ? (
          <View style={styles.listContent}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.item, styles.itemUnselected, { opacity: 0.8 }]}>
                <View style={styles.itemRow}>
                  <Skeleton width={42} height={42} borderRadius={21} style={{ marginRight: 16 }} />
                  <View style={styles.itemTextColumn}>
                    <Skeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={14} borderRadius={4} />
                  </View>
                </View>
                <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 12 }} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={years}
            keyExtractor={(item) => item.id?.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.id === currentYear?.id;
              const isActiveStatus = item.status?.toLowerCase() === 'active';
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    isSelected
                      ? styles.itemSelected
                      : styles.itemUnselected
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.itemRow}>
                    <View style={[
                      styles.circle,
                      { backgroundColor: isSelected ? theme.colors.primary : '#F3F4F6' }
                    ]}>
                      <MaterialDesignIcons
                        name={isSelected ? "calendar-check" : "calendar-blank"}
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>
                    <View style={styles.itemTextColumn}>
                      <View style={styles.itemTextContainer}>
                        <Text style={[
                          styles.itemName,
                          isSelected && styles.itemNameSelected
                        ]}>
                          {item.name}
                        </Text>
                        {isActiveStatus && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.badgeText}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      {item.startDate && item.endDate && (
                        <Text style={[styles.itemSub, isSelected && { color: theme.colors.primary + 'B3' }]}>
                          {item.startDate} — {item.endDate}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && (
                      <MaterialDesignIcons name="check-bold" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No academic cycles found.</Text>
            }
          />
        )}
      </View>
    </AppModal>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 380,
    marginTop: 20,
  },
  loader: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 2,
    paddingBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  itemUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemName: {
    fontSize: rfValue(16),
    color: '#334155',
    fontFamily: FontFamily.heading,
    marginRight: 8,
  },
  itemNameSelected: {
    color: theme.colors.primary,
    fontFamily: FontFamily.black,
  },
  itemSub: {
    fontSize: rfValue(12),
    color: '#64748B',
    fontFamily: FontFamily.medium,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: rfValue(9),
    color: '#166534',
    fontFamily: FontFamily.black,
    letterSpacing: 0.5,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    paddingVertical: 30,
    fontFamily: FontFamily.medium,
    fontSize: rfValue(14),
  },
});
