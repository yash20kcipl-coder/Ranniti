import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { fetchInfluencersAction } from '../../store/actions/influencers';
import { toggleVotedStatusAction } from '../../store/actions/voters';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { influencerStyles } from './styles';
import { SafeImage } from '../../components/SafeImage';
import MdSearchBar from '../../components/MdSearchBar';
import { openPhoneDialer, openWhatsAppChat } from '../../utils/linkingUtils';
import { Phone, MessageCircle, CheckCircle, XCircle } from 'lucide-react-native';

export const InfluencerMappingScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme<ReturnType<typeof influencerStyles>>(influencerStyles);

  const { influencers } = useSelector((state: RootState) => state.influencers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchInfluencersAction());
  }, [dispatch]);

  const filteredInfluencers = influencers.filter((inf) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inf.name.toLowerCase().includes(q) ||
      inf.profession.toLowerCase().includes(q) ||
      inf.mobile.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <MdSearchBar value={search} onChangeText={setSearch} placeholder={t('searchInfluencer')} />
      </View>

      <FlatList
        data={filteredInfluencers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.card}>
            {/* Influencer Details */}
            <View style={styles.influencerHeader}>
              <SafeImage src={item.photo} alt={item.name} style={styles.photo} />
              <View style={styles.infoCol}>
                <View style={styles.badgeRow}>
                  <Text style={styles.badgeText}>{item.supportingParty}</Text>
                  <Text style={styles.countTag}>{item.influencedVotersCount} Voters Influenced</Text>
                </View>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.professionText}>{item.profession}</Text>
                <Text style={styles.areaText}>{item.influenceArea}</Text>
              </View>

              <View style={styles.quickContact}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openPhoneDialer(item.mobile)}>
                  <Phone {...({ size: 16, color: '#2563EB' } as any)} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openWhatsAppChat(item.mobile)}>
                  <MessageCircle {...({ size: 16, color: '#16A34A' } as any)} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Influenced Voter List */}
            <View style={styles.votersListSection}>
              <Text style={styles.sectionLabel}>{t('influencedVoters')}:</Text>
              {item.influencedVoters.map((voter: any) => (
                <View key={voter.id} style={styles.voterItem}>
                  <View style={styles.voterTextCol}>
                    <Text style={styles.voterName}>{voter.name}</Text>
                    <Text style={styles.voterSub}>
                      EPIC: {voter.epicNo} • {voter.boothNo}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => dispatch(toggleVotedStatusAction(voter.id))}>
                    {voter.isVoted ? (
                      <CheckCircle {...({ size: 18, color: '#16A34A' } as any)} />
                    ) : (
                      <XCircle {...({ size: 18, color: '#94A3B8' } as any)} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default InfluencerMappingScreen;
