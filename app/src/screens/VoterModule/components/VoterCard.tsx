import React, { memo } from 'react';
import { voterListStyles } from '../styles';
import { Voter } from '../../../store/reducers/voters';
import { TranslationKeys } from '../../../languages/en';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import { View, Text, TouchableOpacity } from 'react-native';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';
import { Phone, MessageCircle, CheckCircle, XCircle, MapPin, ChevronDown } from 'lucide-react-native';

interface VoterCardProps {
  voter: Voter;
  t: (key: TranslationKeys) => string;
  onSelectParty: (voterId: string) => void;
  onToggleVoted: (voterId: string) => void;
}

export const VoterCard: React.FC<VoterCardProps> = memo(({
  voter,
  onSelectParty,
  onToggleVoted,
  t,
}) => {
  const { styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);

  const hindiName = voter.hindiName || voter.name;
  const englishName = voter.englishName || '';

  return (
    <View style={styles.voterCard}>
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        <SafeImage
          uri={voter.image}
          placeholderType="avatar"
          style={styles.voterPhoto}
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

          <View style={styles.badgeRow}>
            <View style={styles.epicBadge}>
              <Text style={styles.epicText}>EPIC: {voter.epicNo}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{voter.gender} • {voter.age} yrs</Text>
            </View>
          </View>
        </View>

        {/* Supporting Party Button */}
        <TouchableOpacity
          style={styles.partyTag}
          onPress={() => onSelectParty(voter.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.partyText}>{voter.supportingParty}</Text>
          <ChevronDown {...({ size: 12, color: "#1E40AF" } as any)} />
        </TouchableOpacity>
      </View>

      {/* Bottom Row: Location on Left & Quick Actions on Right */}
      <View style={styles.bottomRow}>
        <View style={styles.locationRow}>
          <MapPin {...({ size: 12, color: "#64748B" } as any)} />
          <Text style={styles.locationText} numberOfLines={1}>
            {voter.boothNo} • {voter.wardNo} • {voter.acName}
          </Text>
        </View>

        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openPhoneDialer(voter.mobile)}
            activeOpacity={0.7}
          >
            <Phone {...({ size: 12, color: "#2563EB" } as any)} />
            <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openWhatsAppChat(voter.mobile, `Namaste ${englishName || hindiName}, greetings from Ranniti team.`)}
            activeOpacity={0.7}
          >
            <MessageCircle {...({ size: 12, color: "#16A34A" } as any)} />
            <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.votedBtn, voter.isVoted ? styles.votedActive : styles.votedInactive]}
            onPress={() => onToggleVoted(voter.id)}
            activeOpacity={0.7}
          >
            {voter.isVoted ? (
              <CheckCircle {...({ size: 12, color: "#FFFFFF" } as any)} />
            ) : (
              <XCircle {...({ size: 12, color: "#64748B" } as any)} />
            )}
            <Text style={[styles.votedBtnText, voter.isVoted && { color: '#FFFFFF' }]}>
              {voter.isVoted ? t('voted') : t('markVoted')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default VoterCard;
