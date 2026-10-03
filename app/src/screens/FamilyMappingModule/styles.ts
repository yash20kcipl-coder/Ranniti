import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const familyMappingStyles = (theme: Theme) =>
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
    familyCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      overflow: 'hidden',
      ...getShadow(2, '#000000', 0.04),
    },
    headHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    headPhoto: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    headInfo: {
      flex: 1,
      gap: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    headBadge: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    countBadge: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10),
      color: '#1E40AF',
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    headName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    headSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    membersContainer: {
      backgroundColor: theme.colors.background || '#F8FAFC',
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border || '#E2E8F0',
      gap: 10,
    },
    membersTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: '#475569',
      marginBottom: 2,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    memberTextCol: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    memberRel: {
      color: theme.colors.textSecondary || '#64748B',
      fontSize: rfValue(11),
    },
    memberSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: '#94A3B8',
    },
    memberActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
  });
