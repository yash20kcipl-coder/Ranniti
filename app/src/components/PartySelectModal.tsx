import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Modal } from './Modal';
import toast from '../utils/toast';
import { SafeImage } from './SafeImage';
import { useLanguage } from '../languages';
import { RootState } from '../store/store';
import { Theme } from '../constants/theme';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { useDispatch, useSelector } from 'react-redux';
import { PartyMasterItem } from '../store/reducers/master';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import React, { useState, useMemo, useEffect } from 'react';
import { fetchMasterPartiesAction } from '../store/actions/master';

export interface PartySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectParty: (partyId: string | null, partyName: string) => void;
  currentPartyId?: string | null;
  currentPartyName?: string | null;
  voterName?: string;
  title?: string;
  canEdit?: boolean;
}

export const PartySelectModal: React.FC<PartySelectModalProps> = ({
  visible,
  onClose,
  onSelectParty,
  currentPartyId,
  currentPartyName,
  voterName,
  title,
  canEdit = true,
}) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { theme, styles } = useAppTheme(partySelectModalStyles);
  const [search, setSearch] = useState('');

  const master = useSelector((state: RootState) => state.master);
  const parties: PartyMasterItem[] = master.parties || [];

  // Hydrate master parties from API on open if not loaded
  useEffect(() => {
    if (visible && (!parties || parties.length === 0)) {
      dispatch(fetchMasterPartiesAction());
    }
  }, [visible, dispatch, parties]);

  // Clear search query on modal dismiss/open
  useEffect(() => {
    if (!visible) {
      setSearch('');
    }
  }, [visible]);

  // Filter parties by name or abbreviation
  const filteredParties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.abbreviation && p.abbreviation.toLowerCase().includes(q))
    );
  }, [parties, search]);

  const handleSelect = (partyId: string | null, partyName: string) => {
    if (!canEdit) {
      toast.error(
        t('noPermissionEditParty') ||
        'You do not have permission to change political party support'
      );
      return;
    }
    onSelectParty(partyId, partyName);
    onClose();
  };

  const isIndependentSelected =
    !currentPartyId &&
    (currentPartyName === 'Independent' ||
      currentPartyName === 'Undecided' ||
      !currentPartyName);

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.modalCard}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <View style={styles.titleIconRow}>
            <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialDesignIcons name="flag-variant-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || t('selectSupportingParty') || 'Select Supporting Party'}
            </Text>
          </View>
          {Boolean(voterName) && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {voterName}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary || '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <MaterialDesignIcons name="magnify" size={18} color="#94A3B8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPartyAbbrev') || 'Search party abbreviation or name...'}
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {Boolean(search) && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialDesignIcons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Parties List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Option 1: Independent / Undecided */}
        {(!search || 'independent'.includes(search.toLowerCase()) || 'undecided'.includes(search.toLowerCase())) && (
          <TouchableOpacity
            style={[
              styles.partyItem,
              isIndependentSelected && styles.partyItemSelected,
            ]}
            activeOpacity={0.7}
            onPress={() =>
              handleSelect(null, t('undecidedIndependent') || 'Independent / Undecided')
            }
          >
            <View style={[styles.partyLogoBox, { backgroundColor: '#F1F5F9' }]}>
              <MaterialDesignIcons
                name="flag-outline"
                size={20}
                color={isIndependentSelected ? theme.colors.primary : '#64748B'}
              />
            </View>
            <View style={styles.partyInfo}>
              <Text
                style={[
                  styles.partyMainText,
                  isIndependentSelected && { color: theme.colors.primary, fontFamily: FontFamily.bold },
                ]}
                numberOfLines={1}
              >
                {t('undecidedIndependent') || 'Independent / Undecided'}
              </Text>
              <Text style={styles.partySubText}>
                {t('neutral') || 'No specific party affiliation'}
              </Text>
            </View>
            {isIndependentSelected ? (
              <MaterialDesignIcons name="check-circle" size={20} color={theme.colors.primary} />
            ) : (
              <MaterialDesignIcons name="chevron-right" size={18} color="#CBD5E1" />
            )}
          </TouchableOpacity>
        )}

        {/* Dynamic API Parties */}
        {filteredParties.map((party) => {
          const isSelected =
            (currentPartyId && String(currentPartyId) === String(party.id)) ||
            (currentPartyName &&
              (currentPartyName.toLowerCase() === (party.abbreviation || '').toLowerCase() ||
                currentPartyName.toLowerCase() === (party.name || '').toLowerCase()));

          return (
            <TouchableOpacity
              key={party.id}
              style={[
                styles.partyItem,
                isSelected && styles.partyItemSelected,
              ]}
              activeOpacity={0.7}
              onPress={() =>
                handleSelect(party.id, party.abbreviation || party.name)
              }
            >
              <View style={styles.partyLogoBox}>
                {party.symbolLogo ? (
                  <SafeImage
                    uri={party.symbolLogo}
                    placeholderType="landscape"
                    name={party.name}
                    style={styles.partyLogoImg}
                  />
                ) : (
                  <MaterialDesignIcons
                    name="flag"
                    size={20}
                    color={isSelected ? theme.colors.primary : '#64748B'}
                  />
                )}
              </View>
              <View style={styles.partyInfo}>
                <Text
                  style={[
                    styles.partyMainText,
                    isSelected && { color: theme.colors.primary, fontFamily: FontFamily.bold },
                  ]}
                  numberOfLines={1}
                >
                  {party.abbreviation || party.name}
                </Text>
                {Boolean(party.abbreviation && party.name !== party.abbreviation) && (
                  <Text style={styles.partySubText} numberOfLines={1}>
                    {party.name}
                  </Text>
                )}
              </View>
              {isSelected ? (
                <MaterialDesignIcons name="check-circle" size={20} color={theme.colors.primary} />
              ) : (
                <MaterialDesignIcons name="chevron-right" size={18} color="#CBD5E1" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Empty state for search */}
        {filteredParties.length === 0 && Boolean(search) && (
          <View style={styles.emptyContainer}>
            <MaterialDesignIcons name="flag-remove-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {t('noSuggestionsFound') || 'No matching political parties found'}
            </Text>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
};

const partySelectModalStyles = (theme: Theme) =>
  StyleSheet.create({
    modalCard: {
      width: '92%',
      maxWidth: 380,
      borderRadius: 20,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      padding: 18,
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border || '#F1F5F9',
    },
    headerTextCol: {
      flex: 1,
      marginRight: 8,
    },
    titleIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleIconBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
      flex: 1,
    },
    headerSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary || '#64748B',
      marginTop: 2,
      marginLeft: 36,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginVertical: 12,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12.5),
      color: theme.colors.text || '#0F172A',
      paddingVertical: 2,
    },
    scrollList: {
      maxHeight: 360,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    partyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      marginBottom: 8,
    },
    partyItemSelected: {
      backgroundColor: (theme.colors.primary || '#1E40AF') + '10',
      borderColor: theme.colors.primary || '#1E40AF',
    },
    partyLogoBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    partyLogoImg: {
      width: 34,
      height: 34,
      borderRadius: 17,
    },
    partyInfo: {
      flex: 1,
    },
    partyMainText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    partySubText: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
      marginTop: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    emptyText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: '#94A3B8',
      textAlign: 'center',
    },
  });
