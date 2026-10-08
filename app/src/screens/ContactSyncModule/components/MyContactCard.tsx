import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeImage } from '../../../components/SafeImage';
import { useLanguage } from '../../../languages';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { Phone, MessageCircle, CheckCircle2, MinusCircle } from 'lucide-react-native';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';

export interface DeviceContactItem {
  id: string;
  name: string;
  phone: string;
  isMatched?: boolean;
  voterId?: string;
}

interface MyContactCardProps {
  item: DeviceContactItem;
  theme: Theme;
}

export const MyContactCard: React.FC<MyContactCardProps> = ({ item, theme }) => {
  const { t } = useLanguage();
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SafeImage
          name={item.name}
          placeholderType="avatar"
          style={styles.avatar}
        />

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isMatched ? (
              <View style={styles.matchedBadge}>
                <CheckCircle2 {...({ size: 12, color: '#16A34A' } as any)} />
                <Text style={styles.matchedBadgeText}>{t('matchedVoter')}</Text>
              </View>
            ) : (
              <View style={styles.unmatchedBadge}>
                <MinusCircle {...({ size: 12, color: '#64748B' } as any)} />
                <Text style={styles.unmatchedBadgeText}>{t('notInVoterList')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.phoneText} numberOfLines={1}>
            {item.phone}
          </Text>
        </View>
      </View>

      <View style={styles.actionsBar}>
        {!!item.phone && (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openPhoneDialer(item.phone)}
              activeOpacity={0.8}
            >
              <Phone {...({ size: 14, color: '#2563EB' } as any)} />
              <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openWhatsAppChat(item.phone)}
              activeOpacity={0.8}
            >
              <MessageCircle {...({ size: 14, color: '#16A34A' } as any)} />
              <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
            </TouchableOpacity>
          </>
        )}
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
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    infoCol: {
      gap: 3,
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
    matchedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 6,
    },
    matchedBadgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#15803D',
    },
    unmatchedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 2.5,
      borderRadius: 6,
    },
    unmatchedBadgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(10),
      color: '#64748B',
    },
    phoneText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary || '#64748B',
    },
    actionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border || '#F1F5F9',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    actionBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(11),
    },
  });
