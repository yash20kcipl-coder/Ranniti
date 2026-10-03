import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const voterListStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    headerCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
      gap: 10,
    },
    headerBox: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
      gap: 10,
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    filterPillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#1E40AF',
    },
    listPadding: {
      padding: 14,
      gap: 12,
    },
    voterCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 10,
      ...getShadow(2, '#000000', 0.04),
    },
    voterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    voterPhoto: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    infoCol: {
      flex: 1,
      gap: 2,
    },
    voterInfo: {
      flex: 1,
      gap: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    epicBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    epicText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#1E40AF',
    },
    partyBadge: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10),
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    partyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    partyText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(11),
      color: '#1E40AF',
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    voterName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    subText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    relativeName: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#64748B',
    },
    areaText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#334155',
    },
    influencerTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    influencerTagText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#D97706',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    actionBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
    },
    votedBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
    },
    votedActive: {
      backgroundColor: '#16A34A',
    },
    votedInactive: {
      backgroundColor: '#E2E8F0',
    },
    votedBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
      color: '#475569',
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
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    modalTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text || '#0F172A',
      marginBottom: 6,
    },
    partyOption: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    partyOptionText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(14),
      color: '#1E293B',
    },
  });

export const addEditVoterStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#E2E8F0',
      gap: 12,
    },
    backBtn: {
      padding: 6,
    },
    headerTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text || '#0F172A',
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 40,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 12,
    },
    sectionTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.primary || '#1E40AF',
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    flex1: {
      flex: 1,
    },
    inputLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
      marginTop: 4,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    activePill: {
      backgroundColor: theme.colors.primary || '#1E40AF',
      borderColor: theme.colors.primary || '#1E40AF',
    },
    pillText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#475569',
    },
    activePillText: {
      color: '#FFFFFF',
    },
    saveBtn: {
      marginTop: 8,
      backgroundColor: theme.colors.primary || '#1E40AF',
    },
  });
