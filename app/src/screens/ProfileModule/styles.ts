import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const profileStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    contentPadding: {
      padding: 16,
      gap: 14,
    },
    profileHeaderCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 8,
      ...getShadow(3, '#000000', 0.05),
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
    },
    userName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(18),
      color: theme.colors.text || '#0F172A',
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
      color: '#1E40AF',
    },
    infoCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(14),
      color: theme.colors.text || '#334155',
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.text || '#0F172A',
    },
    langRow: {
      flexDirection: 'row',
      gap: 10,
    },
    langBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
    },
    langBtnActive: {
      backgroundColor: theme.colors.primary || '#1E40AF',
    },
    langText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(13),
      color: theme.colors.textSecondary || '#64748B',
    },
    langTextActive: {
      color: '#FFFFFF',
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#FEE2E2',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 8,
    },
    logoutText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(15),
      color: '#EF4444',
    },
  });
