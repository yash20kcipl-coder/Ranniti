import React from 'react';
import { useLanguage } from '../../../languages';
import { rfValue } from '../../../utils/responsive';
import { SectionContainer } from './SectionContainer';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { Sparkles, Users, PhoneCall } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface InfluencerOverviewSectionProps {
  influencers: {
    familyInfluencersCount: number;
    socialInfluencersCount: number;
  };
  syncedContactsVotersCount: number;
  subtitle?: string;
  onPressFamily?: () => void;
  onPressSocial?: () => void;
  onPressContactSync?: () => void;
  onPressHeader?: () => void;
}

export const InfluencerOverviewSection: React.FC<InfluencerOverviewSectionProps> = ({
  influencers,
  syncedContactsVotersCount,
  subtitle,
  onPressFamily,
  onPressSocial,
  onPressContactSync,
  onPressHeader,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  return (
    <SectionContainer
      title={t('influencerOverview')}
      subtitle={subtitle || t('influencerOverviewSubtitle')}
      icon={<Sparkles {...({ size: 18, color: '#F59E0B' } as any)} />}
      accentColor="#F59E0B"
      onPressHeader={onPressHeader}
    >
      <View style={styles.influencerGrid}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPressFamily}
          style={[styles.influencerBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
        >
          <View style={styles.boxHeaderRow}>
            <Sparkles {...({ size: 14, color: '#D97706' } as any)} />
            <Text style={[styles.influencerVal, { color: '#D97706' }]}>
              {influencers?.familyInfluencersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('familyInfluencers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPressSocial}
          style={[styles.influencerBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
        >
          <View style={styles.boxHeaderRow}>
            <Users {...({ size: 14, color: '#16A34A' } as any)} />
            <Text style={[styles.influencerVal, { color: '#16A34A' }]}>
              {influencers?.socialInfluencersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('socialInfluencers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onPressContactSync}
          style={[styles.influencerBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}
        >
          <View style={styles.boxHeaderRow}>
            <PhoneCall {...({ size: 14, color: '#0284C7' } as any)} />
            <Text style={[styles.influencerVal, { color: '#0284C7' }]}>
              {syncedContactsVotersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('contactSyncVoters')}</Text>
        </TouchableOpacity>
      </View>
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  influencerGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  influencerBox: {
    gap: 6,
    flex: 1,
    padding: 10,
    borderWidth: .5,
    borderRadius: 10,
    alignItems: 'center',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  influencerVal: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(16),
  },
  influencerLbl: {
    fontFamily: FontFamily.extraBold,
    fontSize: rfValue(9),
    color: '#475569',
    textAlign: 'center',
  },
});
