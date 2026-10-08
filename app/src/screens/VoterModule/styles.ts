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
      gap: 6,
      padding: 10,
      flexGrow: 1,
      paddingBottom: 30,
    },
    voterCard: {
      gap: 4,
      padding: 8,
      borderWidth: 1,
      borderRadius: 14,
      borderColor: theme.colors.border || '#E2E8F0',
      backgroundColor: theme.colors.surface || '#FFFFFF',
      ...getShadow(1, '#000000', 0.03),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarContainer: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    voterPhoto: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    voterInfo: {
      flex: 1,
      gap: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 1,
    },
    epicBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    epicText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#1E40AF',
    },
    metaBadge: {
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    metaText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(9.5),
      color: '#475569',
    },
    partyBadge: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9.5),
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    partyTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 5,
      alignSelf: 'flex-start',
    },
    partyText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(10.5),
      color: '#1E40AF',
    },
    nameText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    voterName: {
      fontSize: rfValue(13),
      lineHeight: rfValue(16),
      fontFamily: FontFamily.bold,
      color: theme.colors.text || '#0F172A',
    },
    englishNameText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      lineHeight: rfValue(14),
    },
    subText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(10),
      color: theme.colors.textSecondary || '#64748B',
    },
    relativeName: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(10),
      color: theme.colors.textSecondary || '#64748B',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginTop: 2,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: '#64748B',
    },
    areaText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: '#334155',
    },
    influencerTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    influencerTagText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(9.5),
      color: '#D97706',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 5,
    },
    actionBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10.5),
    },
    votedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 5,
    },
    votedActive: {
      backgroundColor: '#16A34A',
    },
    votedInactive: {
      backgroundColor: '#E2E8F0',
    },
    votedBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10.5),
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
