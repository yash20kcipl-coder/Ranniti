import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchVotersAction,
  toggleVotedStatusAction,
  updateVoterPartyAction,
  setVoterFiltersAction,
} from '../../store/actions/voters';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { SafeImage } from '../../components/SafeImage';
import MdSearchBar from '../../components/MdSearchBar';
import { ScrollableFilterPills } from '../../components/ScrollableFilterPills';
import {
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  MapPin,
  ChevronDown,
  Plus,
} from 'lucide-react-native';
import { openPhoneDialer, openWhatsAppChat } from '../../utils/linkingUtils';

import { voterListStyles } from './styles';

const PARTIES = ['Party A', 'Party B', 'Independent', 'Undecided'];

export const VoterListScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme<ReturnType<typeof voterListStyles>>(voterListStyles);

  const { voters, filters } = useSelector((state: RootState) => state.voters);
  const [partyModalVoterId, setPartyModalVoterId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchVotersAction());
  }, [dispatch]);

  const filteredVoters = voters.filter((voter) => {
    const matchesSearch =
      !filters.search ||
      voter.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      voter.epicNo.toLowerCase().includes(filters.search.toLowerCase()) ||
      voter.mobile.includes(filters.search);

    const matchesParty = filters.supportingParty === 'All' || voter.supportingParty === filters.supportingParty;
    const matchesVoted =
      filters.isVoted === 'all' ||
      (filters.isVoted === 'voted' && voter.isVoted) ||
      (filters.isVoted === 'not_voted' && !voter.isVoted);

    return matchesSearch && matchesParty && matchesVoted;
  });

  const handleToggleVoted = (voterId: string) => {
    dispatch(toggleVotedStatusAction(voterId));
  };

  const handleSelectParty = (party: string) => {
    if (partyModalVoterId) {
      dispatch(updateVoterPartyAction(partyModalVoterId, party));
      setPartyModalVoterId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.headerBox}>
        <MdSearchBar
          value={filters.search}
          onChangeText={(text: string) => dispatch(setVoterFiltersAction({ search: text }))}
          placeholder={t('search')}
        />

        {/* Filter Pills */}
        <ScrollableFilterPills
          options={[
            { id: 'all', label: t('all') },
            { id: 'voted', label: t('voted') },
            { id: 'not_voted', label: t('notVoted') },
          ]}
          activeId={filters.isVoted}
          onSelect={(id: string) => dispatch(setVoterFiltersAction({ isVoted: id }))}
        />
      </View>

      {/* Voter List */}
      <FlatList
        data={filteredVoters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }: { item: any }) => (

          <View style={styles.voterCard}>
            <View style={styles.cardHeader}>
              <SafeImage src={item.image} alt={item.name} style={styles.voterPhoto} />
              <View style={styles.voterInfo}>
                <Text style={styles.voterName}>{item.name}</Text>
                <Text style={styles.relativeName}>{item.relativeName}</Text>
                <View style={styles.epicBadge}>
                  <Text style={styles.epicText}>EPIC: {item.epicNo}</Text>
                </View>
              </View>

              {/* Supporting Party Button */}
              <TouchableOpacity
                style={styles.partyTag}
                onPress={() => setPartyModalVoterId(item.id)}
              >
                <Text style={styles.partyText}>{item.supportingParty}</Text>
                <ChevronDown {...({ size: 12, color: "#1E40AF" } as any)} />
              </TouchableOpacity>
            </View>

            {/* Location & Booth details */}
            <View style={styles.locationRow}>
              <MapPin {...({ size: 14, color: "#64748B" } as any)} />
              <Text style={styles.locationText}>
                {item.boothNo} • {item.wardNo} • {item.acName}
              </Text>
            </View>

            {/* Quick Action Options */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openPhoneDialer(item.mobile)}
              >
                <Phone {...({ size: 16, color: "#2563EB" } as any)} />
                <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>{t('call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openWhatsAppChat(item.mobile, `Namaste ${item.name}, greetings from Ranniti team.`)}
              >
                <MessageCircle {...({ size: 16, color: "#16A34A" } as any)} />
                <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.votedBtn, item.isVoted ? styles.votedActive : styles.votedInactive]}
                onPress={() => handleToggleVoted(item.id)}
              >
                {item.isVoted ? (
                  <CheckCircle {...({ size: 16, color: "#FFFFFF" } as any)} />
                ) : (
                  <XCircle {...({ size: 16, color: "#64748B" } as any)} />
                )}
                <Text style={[styles.votedBtnText, item.isVoted && { color: '#FFFFFF' }]}>
                  {item.isVoted ? t('voted') : t('markVoted')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Add Voter Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('addeditvoter')}
        activeOpacity={0.85}
      >
        <Plus {...({ size: 24, color: "#FFFFFF" } as any)} />
      </TouchableOpacity>

      {/* Supporting Party Modal Selector */}
      <Modal
        visible={Boolean(partyModalVoterId)}
        transparent
        animationType="fade"
        onRequestClose={() => setPartyModalVoterId(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPartyModalVoterId(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('supportingParty')}</Text>
            {PARTIES.map((party) => (
              <TouchableOpacity
                key={party}
                style={styles.partyOption}
                onPress={() => handleSelectParty(party)}
              >
                <Text style={styles.partyOptionText}>{party}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default VoterListScreen;
