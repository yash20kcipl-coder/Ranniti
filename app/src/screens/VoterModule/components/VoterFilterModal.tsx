import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppModal } from '../../../components/AppModal';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';

interface VoterFilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  filters: {
    search?: string;
    isVoted?: string;
    supportingParty?: string;
    gender?: string;
  };
  onApplyFilters: (newFilters: { isVoted?: string; supportingParty?: string; gender?: string }) => void;
  onResetFilters: () => void;
  t: (key: any) => string;
}

const GENDER_OPTIONS = [
  { id: 'all', label: 'All Genders' },
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
];

const PARTY_OPTIONS = ['All', 'Party A', 'Party B', 'Independent', 'Undecided'];

const VOTED_OPTIONS = [
  { id: 'all', label: 'All Status' },
  { id: 'voted', label: 'Voted' },
  { id: 'not_voted', label: 'Not Voted' },
];

export const VoterFilterModal: React.FC<VoterFilterModalProps> = ({
  visible,
  onDismiss,
  filters,
  onApplyFilters,
  onResetFilters,
  t,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [selectedGender, setSelectedGender] = React.useState(filters.gender || 'all');
  const [selectedParty, setSelectedParty] = React.useState(filters.supportingParty || 'All');
  const [selectedVoted, setSelectedVoted] = React.useState(filters.isVoted || 'all');

  React.useEffect(() => {
    if (visible) {
      setSelectedGender(filters.gender || 'all');
      setSelectedParty(filters.supportingParty || 'All');
      setSelectedVoted(filters.isVoted || 'all');
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApplyFilters({
      gender: selectedGender,
      supportingParty: selectedParty,
      isVoted: selectedVoted,
    });
    onDismiss();
  };

  const handleReset = () => {
    onResetFilters();
    onDismiss();
  };

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={t('filters') || 'Filter Voters'}
      icon="filter-variant"
      primaryAction={{
        label: t('apply') || 'Apply Filters',
        onPress: handleApply,
      }}
      secondaryAction={{
        label: t('reset') || 'Reset',
        onPress: handleReset,
      }}
    >
      <View style={styles.modalBody}>
        {/* Voting Status Filter */}
        <Text style={styles.sectionTitle}>Voting Status</Text>
        <View style={styles.optionsRow}>
          {VOTED_OPTIONS.map((opt) => {
            const isActive = selectedVoted === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedVoted(opt.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gender Filter */}
        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.optionsRow}>
          {GENDER_OPTIONS.map((opt) => {
            const isActive = selectedGender === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedGender(opt.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Supporting Party Filter */}
        <Text style={styles.sectionTitle}>Supporting Party</Text>
        <View style={styles.optionsRow}>
          {PARTY_OPTIONS.map((party) => {
            const isActive = selectedParty === party;
            return (
              <TouchableOpacity
                key={party}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedParty(party)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {party}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </AppModal>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBody: {
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 12,
    },
    sectionTitle: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
      color: theme.colors.text || '#0F172A',
      marginTop: 4,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    chipActive: {
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: '#475569',
    },
    chipTextActive: {
      color: theme.colors.primary,
      fontFamily: FontFamily.bodyBold,
    },
  });

export default VoterFilterModal;
