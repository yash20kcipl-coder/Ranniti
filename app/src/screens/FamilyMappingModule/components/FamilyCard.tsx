import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import React, { memo } from 'react';
import { useLanguage } from '../../../languages';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SafeImage } from '../../../components/SafeImage';
import type { FamilyGroup } from '../../../store/reducers/familyMapping';
import { openPhoneDialer, openWhatsAppChat } from '../../../utils/linkingUtils';
import { Phone, MessageCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FamilyCardProps {
  item: FamilyGroup;
  isExpanded: boolean;
  onToggle: (familyId: string) => void;
  onToggleVoted: (voterId: string) => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = memo(({
  item,
  isExpanded,
  onToggle,
  onToggleVoted,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();

  const votedCount = item.members.filter(m => m.isVoted).length;
  const allVoted = votedCount === item.members.length;
  const noneVoted = votedCount === 0;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(item.familyId);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderColor: theme.colors.border || '#E2E8F0',
        },
      ]}
    >
      {/* Head Header Row */}
      <TouchableOpacity style={styles.headRow} onPress={handleToggle} activeOpacity={0.7}>
        {/* Avatar */}
        <SafeImage
          alt={item.headName}
          src={item.headPhoto}
          placeholderType="avatar"
          containerStyles={[styles.headPhoto, { borderWidth: 2, borderColor: allVoted ? '#16A34A' : noneVoted ? '#E2E8F0' : '#F59E0B', }]}
        />

        {/* Name & Info */}
        <View style={styles.headInfo}>
          <Text style={[styles.headName, { color: theme.colors.text || '#0F172A' }]} numberOfLines={1}>
            {item.headName}
          </Text>
          <Text style={[styles.headSub, { color: theme.colors.textSecondary || '#64748B' }]} numberOfLines={1}>
            {item.headEpic} • {item.headMobile}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.membersBadge, { backgroundColor: allVoted ? '#DCFCE7' : noneVoted ? '#F1F5F9' : '#FEF3C7' }]}>
              <Users {...({ size: 10, color: allVoted ? '#15803D' : noneVoted ? '#64748B' : '#D97706' } as any)} />
              <Text style={[styles.countBadgeText, { color: allVoted ? '#15803D' : noneVoted ? '#64748B' : '#D97706' }]}>{votedCount}/{item.totalMembers}</Text>
            </View>
          </View>
        </View>

        {/* Voted Progress Pill + Chevron */}
        <View style={styles.rightCol}>
          {isExpanded ? (
            <ChevronUp {...({ size: 18, color: '#94A3B8' } as any)} />
          ) : (
            <ChevronDown {...({ size: 18, color: '#94A3B8' } as any)} />
          )}
        </View>
      </TouchableOpacity>

      {/* Address Row */}
      <View style={styles.addressRow}>
        <MapPin {...({ size: 12, color: '#94A3B8' } as any)} />
        <Text style={[styles.addressText, { color: theme.colors.textSecondary || '#64748B' }]} numberOfLines={1}>
          {item.address}
        </Text>
      </View>

      {/* Members Accordion */}
      {isExpanded && (
        <View style={[styles.membersContainer, { backgroundColor: theme.colors.background || '#F8FAFC', borderTopColor: theme.colors.border || '#E2E8F0' },]}>
          <Text style={styles.membersTitle}>{t('familyMembers')}</Text>

          {item.members.map((member, idx) => (
            <View
              key={member.id}
              style={[
                styles.memberRow,
                {
                  borderLeftWidth: 3,
                  borderColor: theme.colors.border || '#E2E8F0',
                  backgroundColor: theme.colors.surface || '#FFFFFF',
                  borderLeftColor: member.isVoted ? '#16A34A' : '#E2E8F0'
                },
                idx < item.members.length - 1 && styles.memberRowGap,
              ]}
            >

              {/* Member Info */}
              <View style={styles.memberTextCol}>
                <Text style={[styles.memberName, { color: theme.colors.text || '#0F172A' }]} numberOfLines={1}>{member.name}{' '}</Text>
                <Text style={styles.memberSub}>
                  {member.age} yrs • {member.gender} • {member.epicNo}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.memberActions}>
                {!!member.mobile && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                      onPress={() => openPhoneDialer(member.mobile)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Phone {...({ size: 13, color: '#2563EB' } as any)} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}
                      onPress={() => openWhatsAppChat(member.mobile)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MessageCircle {...({ size: 13, color: '#16A34A' } as any)} />
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => onToggleVoted(member.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {member.isVoted ? (
                    <CheckCircle {...({ size: 20, color: '#16A34A' } as any)} />
                  ) : (
                    <XCircle {...({ size: 20, color: '#CBD5E1' } as any)} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default FamilyCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: .5,
    borderRadius: 16,
    overflow: 'hidden',
    ...getShadow(2, '#000000', 0.04),
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  votedRing: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
  },
  headInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  headBadge: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(9.5),
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(9.5),
    color: '#1E40AF',
  },
  headName: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(14.5),
  },
  headSub: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
  },
  rightCol: {
    alignItems: 'center',
    gap: 4,
  },
  turnoutPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  turnoutText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
  },
  addressRow: {
    gap: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  addressText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    flex: 1,
  },
  membersContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  membersTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
    color: '#475569',
    marginBottom: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  memberRowGap: {
    marginBottom: 0,
  },
  votedBar: {
    width: 3,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: 10,
    marginLeft: 0,
  },
  memberTextCol: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12.5),
  },
  memberRel: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(11),
    color: '#94A3B8',
  },
  memberSub: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(10.5),
    color: '#94A3B8',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
