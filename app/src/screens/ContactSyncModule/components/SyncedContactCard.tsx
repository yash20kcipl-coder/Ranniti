import React from 'react';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { SafeImage } from '../../../components/SafeImage';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SyncedContactVoter } from '../../../store/reducers/contactSync';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';
import { Phone, MessageCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react-native';

interface SyncedContactCardProps {
  item: SyncedContactVoter;
  theme: Theme;
  onToggleVoted: (voterId: string) => void;
  onRequestUnlink: (item: SyncedContactVoter) => void;
}

export const SyncedContactCard: React.FC<SyncedContactCardProps> = ({
  item,
  theme,
  onToggleVoted,
  onRequestUnlink,
}) => {
  const { t } = useLanguage();
  const styles = getStyles(theme);

  const phoneToCall = item.mobileNo || item.devicePhone;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SafeImage
          uri={item.avatar}
          placeholderType="avatar"
          style={styles.avatar}
          name={item.hindiName || item.englishName || item.name}
        />

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.deviceContactName}
            </Text>
            {Boolean(item.voterType) && (
              <View style={styles.voterTypeBadge}>
                <Text style={styles.voterTypeBadgeText}>{item.voterType}</Text>
              </View>
            )}
          </View>

          <Text style={styles.voterName} numberOfLines={1}>
            {item.hindiName || item.englishName || item.name}
          </Text>

          <Text style={styles.voterSub} numberOfLines={1}>
            {item.devicePhone} | EPIC: {item.epicNo}
          </Text>

          {Boolean(item.boothNo || item.boothName) && (
            <Text style={styles.boothText} numberOfLines={1}>
              Booth #{item.boothNo} {item.boothName ? `(${item.boothName})` : ''}
              {item.houseNo ? ` • H.No: ${item.houseNo}` : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.unlinkBtn}
          onPress={() => onRequestUnlink(item)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 {...({ size: 15, color: '#EF4444' } as any)} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsBar}>
        {Boolean(phoneToCall) && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openPhoneDialer(phoneToCall)}
            activeOpacity={0.8}
          >
            <Phone {...({ size: 14, color: '#2563EB' } as any)} />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
          </TouchableOpacity>
        )}

        {Boolean(phoneToCall) && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openWhatsAppChat(phoneToCall)}
            activeOpacity={0.8}
          >
            <MessageCircle {...({ size: 14, color: '#16A34A' } as any)} />
            <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.votedBtn, item.isVoted ? styles.votedActive : styles.votedInactive]}
          onPress={() => onToggleVoted(item.voterId)}
          activeOpacity={0.8}
        >
          {item.isVoted ? (
            <CheckCircle {...({ size: 14, color: '#FFFFFF' } as any)} />
          ) : (
            <XCircle {...({ size: 14, color: '#64748B' } as any)} />
          )}
          <Text style={[styles.votedBtnText, item.isVoted && { color: '#FFFFFF' }]}>
            {item.isVoted ? t('voted') : t('markVoted')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
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
      gap: 10,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    infoCol: {
      gap: 2,
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    contactName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.text || '#0F172A',
      flex: 1,
    },
    voterTypeBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    voterTypeBadgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#1E40AF',
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
    boothText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(10),
      color: '#2563EB',
    },
    unlinkBtn: {
      padding: 4,
      borderRadius: 6,
      backgroundColor: '#FEF2F2',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border || '#F1F5F9',
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
