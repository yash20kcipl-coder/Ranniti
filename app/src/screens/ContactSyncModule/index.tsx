import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { syncDeviceContactsAction } from '../../store/actions/contactSync';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { contactSyncStyles } from './styles';
import { Phone, MessageCircle, CheckCircle, XCircle, RefreshCw, Contact } from 'lucide-react-native';
import { openPhoneDialer, openWhatsAppChat } from '../../utils/linkingUtils';

export const ContactSyncScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme<ReturnType<typeof contactSyncStyles>>(contactSyncStyles);

  const { syncedVoters, loading, totalSyncedCount } = useSelector((state: RootState) => state.contactSync);

  const handleSync = () => {
    dispatch(syncDeviceContactsAction());
  };

  return (
    <View style={styles.container}>
      {/* Top Sync Banner */}
      <View style={styles.syncBanner}>
        <View style={styles.bannerInfo}>
          <Contact {...({ size: 24, color: '#1E40AF' } as any)} />
          <View>
            <Text style={styles.bannerTitle}>{t('contactSyncTitle')}</Text>
            <Text style={styles.bannerSub}>{totalSyncedCount} Matched Voters in Phone Book</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.syncBtn} onPress={handleSync} disabled={loading}>
          <RefreshCw {...({ size: 16, color: '#FFFFFF' } as any)} />
          <Text style={styles.syncBtnText}>{loading ? t('loading') : t('syncContactsBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Synced Voters List */}
      <FlatList
        data={syncedVoters}
        keyExtractor={(item) => item.voterId}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.infoCol}>
                <Text style={styles.contactName}>{item.contactName}</Text>
                <Text style={styles.voterName}>Voter: {item.voterName}</Text>
                <Text style={styles.voterSub}>
                  {item.mobile} • EPIC: {item.epicNo} • {item.boothNo}
                </Text>
              </View>

              <View style={styles.partyBadge}>
                <Text style={styles.partyBadgeText}>{item.supportingParty}</Text>
              </View>
            </View>

            <View style={styles.actionsBar}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openPhoneDialer(item.mobile)}>
                <Phone {...({ size: 14, color: '#2563EB' } as any)} />
                <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => openWhatsAppChat(item.mobile)}>
                <MessageCircle {...({ size: 14, color: '#16A34A' } as any)} />
                <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.votedBtn, item.isVoted ? styles.votedActive : styles.votedInactive]}
                onPress={() => dispatch(toggleVotedStatusAction(item.voterId))}
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
        )}
      />
    </View>
  );
};

export default ContactSyncScreen;
