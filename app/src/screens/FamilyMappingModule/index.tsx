import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchFamilyHeadsAction } from '../../store/actions/familyMapping';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { familyMappingStyles } from './styles';
import { SafeImage } from '../../components/SafeImage';
import MdSearchBar from '../../components/MdSearchBar';
import { Phone, MessageCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { openPhoneDialer, openWhatsAppChat } from '../../utils/linkingUtils';

export const FamilyMappingScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme<ReturnType<typeof familyMappingStyles>>(familyMappingStyles);

  const { families } = useSelector((state: RootState) => state.familyMapping);
  const [search, setSearch] = useState('');
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Record<string, boolean>>({ 'fam-01': true });

  useEffect(() => {
    dispatch(fetchFamilyHeadsAction());
  }, [dispatch]);

  const toggleExpand = (familyId: string) => {
    setExpandedFamilyIds((prev) => ({ ...prev, [familyId]: !prev[familyId] }));
  };

  const filteredFamilies = families.filter((fam) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      fam.headName.toLowerCase().includes(q) ||
      fam.headEpic.toLowerCase().includes(q) ||
      fam.headMobile.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <MdSearchBar value={search} onChangeText={setSearch} placeholder={t('searchFamilyHead')} />
      </View>

      <FlatList
        data={filteredFamilies}
        keyExtractor={(item) => item.familyId}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => {
          const isExpanded = expandedFamilyIds[item.familyId];
          return (
            <View style={styles.familyCard}>
              {/* Head Header */}
              <TouchableOpacity
                style={styles.headHeaderRow}
                onPress={() => toggleExpand(item.familyId)}
                activeOpacity={0.7}
              >
                <SafeImage src={item.headPhoto} alt={item.headName} style={styles.headPhoto} />
                <View style={styles.headInfo}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.headBadge}>{t('familyHead')}</Text>
                    <Text style={styles.countBadge}>{item.totalMembers} Members</Text>
                  </View>
                  <Text style={styles.headName}>{item.headName}</Text>
                  <Text style={styles.headSub}>
                    EPIC: {item.headEpic} • {item.headMobile}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp {...({ size: 20, color: '#64748B' } as any)} />
                ) : (
                  <ChevronDown {...({ size: 20, color: '#64748B' } as any)} />
                )}
              </TouchableOpacity>

              {/* Family Members Accordion */}
              {isExpanded && (
                <View style={styles.membersContainer}>
                  <Text style={styles.membersTitle}>{t('familyMembers')}:</Text>
                  {item.members.map((member: any) => (
                    <View key={member.id} style={styles.memberRow}>
                      <View style={styles.memberTextCol}>
                        <Text style={styles.memberName}>
                          {member.name} <Text style={styles.memberRel}>({member.relation})</Text>
                        </Text>
                        <Text style={styles.memberSub}>
                          {member.age} yrs • {member.gender} • EPIC: {member.epicNo}
                        </Text>
                      </View>

                      {/* Member Actions */}
                      <View style={styles.memberActions}>
                        <TouchableOpacity onPress={() => openPhoneDialer(member.mobile)}>
                          <Phone {...({ size: 16, color: '#2563EB' } as any)} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openWhatsAppChat(member.mobile)}>
                          <MessageCircle {...({ size: 16, color: '#16A34A' } as any)} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => dispatch(toggleVotedStatusAction(member.id))}>
                          {member.isVoted ? (
                            <CheckCircle {...({ size: 18, color: '#16A34A' } as any)} />
                          ) : (
                            <XCircle {...({ size: 18, color: '#94A3B8' } as any)} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

export default FamilyMappingScreen;
