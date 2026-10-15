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
import { Phone, MessageCircle, ChevronDown } from 'lucide-react-native';
import { logVolunteerInteractionAction } from '../../../store/actions/voters';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';

interface VoterCardProps {
  voter: Voter;
  canEditParty?: boolean;
  t: (key: TranslationKeys) => string;
  onSelectParty: (voterId: string) => void;
}

export const VoterCard: React.FC<VoterCardProps> = memo(({
  voter,
  canEditParty = true,
  onSelectParty,
  t,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);

  const hindiName = voter.hindiName || voter.name;
  const englishName = voter.englishName || '';

  const handleCall = () => {
    if (voter?.id) {
      dispatch(logVolunteerInteractionAction({ voterId: voter.id, boothId: voter.boothId, activityType: 'call' }) as any);
    }
    openPhoneDialer(voter.mobile);
  };

  const handleWhatsApp = () => {
    if (voter?.id) {
      dispatch(logVolunteerInteractionAction({ voterId: voter.id, boothId: voter.boothId, activityType: 'whatsapp' }) as any);
    }
    openWhatsAppChat(voter.mobile, `Namaste ${englishName || hindiName}, greetings from Ranniti team.`);
  };

  const handleCardPress = () => {
    navigation.navigate(SCREENS.VOTER_DETAIL, { voter });
  };

  return (
    <View style={styles.voterCard}>
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
          activeOpacity={0.7}
          onPress={handleCardPress}
        >
          <SafeImage
            uri={voter.image}
            placeholderType="avatar"
            style={styles.voterPhoto}
            name={englishName || hindiName}
            containerStyles={styles.avatarContainer}
          />

          <View style={styles.voterInfo}>
            {/* Main Title: Hindi Name */}
            <Text style={styles.voterName} numberOfLines={1}>
              {hindiName}
            </Text>

            {/* Subtitle: English Name */}
            {Boolean(englishName) && (
              <Text style={styles.englishNameText} numberOfLines={1}>
                {englishName}
              </Text>
            )}

            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {voter.boothNo} • {voter.wardNo} • {voter.acName}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Supporting Party Button */}
        {canEditParty ? (
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
        )}
      </View>

      {/* Bottom Row: Location on Left & Quick Actions on Right */}
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
          {!!voter.mobile && (
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
            </>
          )}

        </View>
      </View>
    </View>
  );
});

export default VoterCard;
