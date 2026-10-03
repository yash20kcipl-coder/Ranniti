import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const influencerStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    headerBox: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
    },
    listPadding: {
      padding: 14,
      gap: 12,
    },
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      padding: 14,
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    influencerHeader: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    photo: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    infoCol: {
      flex: 1,
      gap: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#1E40AF',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    countTag: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    professionText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#475569',
    },
    areaText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    quickContact: {
      gap: 8,
    },
    iconBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#F1F5F9',
    },
    votersListSection: {
      backgroundColor: theme.colors.background || '#F8FAFC',
      borderRadius: 12,
      padding: 10,
      gap: 8,
    },
    sectionLabel: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: '#334155',
    },
    voterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    voterTextCol: {
      flex: 1,
    },
    voterName: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.text || '#0F172A',
    },
    voterSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
  });
