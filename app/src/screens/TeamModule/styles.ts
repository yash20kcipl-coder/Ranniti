import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const teamStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    listPadding: {
      padding: 14,
      gap: 12,
    },
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    infoCol: {
      flex: 1,
      gap: 2,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    roleText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#1E40AF',
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    subText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    areaText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#334155',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary || '#1E40AF',
      justifyContent: 'center',
      alignItems: 'center',
      ...getShadow(6, '#1E40AF', 0.4),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 12,
    },
    modalTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text || '#0F172A',
      marginBottom: 4,
    },
    roleSelectLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
      marginTop: 4,
    },
    roleRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    rolePill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    rolePillActive: {
      backgroundColor: theme.colors.primary || '#1E40AF',
      borderColor: theme.colors.primary || '#1E40AF',
    },
    rolePillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
    },
    rolePillTextActive: {
      color: '#FFFFFF',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(14),
      color: theme.colors.textSecondary || '#64748B',
    },
    submitBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.primary || '#1E40AF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(14),
      color: '#FFFFFF',
    },
  });
