import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const contactSyncStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    syncBanner: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    bannerTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.text || '#0F172A',
    },
    bannerSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    syncBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary || '#1E40AF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    syncBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
      color: '#FFFFFF',
    },
    listPadding: {
      padding: 14,
      gap: 10,
    },
    card: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 10,
      ...getShadow(2, '#000000', 0.04),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    infoCol: {
      gap: 2,
      flex: 1,
    },
    contactName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.text || '#0F172A',
    },
    voterName: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.text || '#334155',
    },
    voterSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    partyBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    partyBadgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#1E40AF',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(11),
    },
    votedBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 6,
      borderRadius: 8,
    },
    votedActive: {
      backgroundColor: '#16A34A',
    },
    votedInactive: {
      backgroundColor: '#E2E8F0',
    },
    votedBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(11),
      color: '#475569',
    },
  });
