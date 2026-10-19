import React, { memo } from 'react';
import { useDispatch } from 'react-redux';
import { voterListStyles } from '../styles';
import { Voter } from '../../../store/reducers/voters';
import { SCREENS } from '../../../navigation/constants';
import { TranslationKeys } from '../../../languages/en';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import { View, Text, TouchableOpacity } from 'react-native';
import { logVolunteerInteractionAction } from '../../../store/actions/voters';
import { openPhoneDialer, openWhatsAppChat, openSmsComposer } from '../../../utils/linkingUtils';
import { Phone, MessageCircle, MessageSquare, ChevronDown, CheckCircle2, Circle } from 'lucide-react-native';

export interface VoterCardProps {
  voter: Voter | any;
  canEditParty?: boolean;
  t: (key: TranslationKeys) => string;
  onSelectParty?: (voterId: string) => void;
  onWhatsAppPress?: (voter: any) => void;
  onSmsPress?: (voter: any) => void;
  // Election Poll Day mode props
  onToggleVote?: (voter: any) => void;
}

export const VoterCard: React.FC<VoterCardProps> = memo(({
  voter,
  canEditParty = true,
  onSelectParty,
  onWhatsAppPress,
  onSmsPress,
  onToggleVote,
  t,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);

  const hindiName = voter.hindiName || voter.name || '';
  const englishName = voter.englishName || voter.engName || '';
  const voterMobile = voter.mobile || voter.mobileNo || '';
  const hasVoted = Boolean(voter.hasVoted ?? voter.isVoted);

  const handleCall = () => {
    if (voter?.id) {
      dispatch(logVolunteerInteractionAction({ voterId: voter.id, boothId: voter.boothId, activityType: 'call' }) as any);
    }
    openPhoneDialer(voterMobile);
  };

  const handleWhatsApp = () => {
    if (onWhatsAppPress) {
      onWhatsAppPress(voter);
      return;
    }
    if (voter?.id) {
      dispatch(logVolunteerInteractionAction({ voterId: voter.id, boothId: voter.boothId, activityType: 'whatsapp' }) as any);
    }
    openWhatsAppChat(voterMobile, `Namaste ${englishName || hindiName}, greetings from Ranniti team.`);
  };

  const handleSms = () => {
    if (onSmsPress) {
      onSmsPress(voter);
      return;
    }
    if (voter?.id) {
      dispatch(logVolunteerInteractionAction({ voterId: voter.id, boothId: voter.boothId, activityType: 'sms' }) as any);
    }
    openSmsComposer(voterMobile, `Namaste ${englishName || hindiName}, greetings from Ranniti team.`);
  };

  const handleCardPress = () => {
    navigation.navigate(SCREENS.VOTER_DETAIL, { voter });
  };

  return (
    <View style={[styles.voterCard, hasVoted && styles.voterCardVoted]}>
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
          activeOpacity={0.7}
          onPress={handleCardPress}
        >
          <SafeImage
            placeholderType="avatar"
            style={styles.voterPhoto}
            name={englishName || hindiName}
            uri={voter.image || voter.avatar}
            containerStyles={styles.avatarContainer}
          />

          <View style={styles.voterInfo}>
            {/* Main Title: Hindi Name */}
            <Text style={styles.voterName} numberOfLines={1}>
              {hindiName}
            </Text>

            {/* Subtitle: English Name */}
            {Boolean(englishName && englishName !== hindiName) && (
              <Text style={styles.englishNameText} numberOfLines={1}>
                {englishName}
              </Text>
            )}

            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {[voter.boothNo, voter.wardNo, voter.acName].filter(Boolean).join(' • ')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Supporting Party Button */}
        {voter.supportingParty ? (
          canEditParty && onSelectParty ? (
            <TouchableOpacity
              style={styles.partyTag}
              onPress={() => onSelectParty(voter.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.partyText}>{voter.supportingParty}</Text>
              <ChevronDown {...({ size: 12, color: "#1E40AF" } as any)} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.partyTag, { opacity: 0.9 }]}>
              <Text style={styles.partyText}>{voter.supportingParty}</Text>
            </View>
          )
        ) : null}
      </View>

      {/* Bottom Row: Demographics & Quick Actions */}
      <View style={styles.bottomRow}>
        {/* <View style={styles.badgeRow}>
          <View style={styles.epicBadge}>
            <Text style={styles.epicText}>EPIC: {voter.epicNo}</Text>
            </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{voter.gender} • {voter.age} yrs</Text>
        </View>
        </View> */}
        <View style={styles.actionsBar}>
          {Boolean(voterMobile) && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <Phone {...({ size: 12, color: "#2563EB" } as any)} />
                <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleWhatsApp}
                activeOpacity={0.7}
              >
                <MessageCircle {...({ size: 12, color: "#16A34A" } as any)} />
                <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
              </TouchableOpacity>

              {!onToggleVote && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleSms}
                  activeOpacity={0.7}
                >
                  <MessageSquare {...({ size: 12, color: "#7E22CE" } as any)} />
                  <Text style={[styles.actionBtnText, { color: '#7E22CE' }]}>{t('sms')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {onToggleVote && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                hasVoted && { backgroundColor: '#DCFCE7' },
              ]}
              onPress={() => onToggleVote(voter)}
              activeOpacity={0.7}
            >
              {hasVoted ? (
                <CheckCircle2 {...({ size: 12, color: '#16A34A' } as any)} />
              ) : (
                <Circle {...({ size: 12, color: '#64748B' } as any)} />
              )}
              <Text
                style={[
                  styles.actionBtnText,
                  { color: hasVoted ? '#16A34A' : '#475569' },
                ]}
              >
                {hasVoted ? t('voted') : t('markVoted')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

export default VoterCard;
