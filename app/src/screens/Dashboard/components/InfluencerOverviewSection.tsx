import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Users, PhoneCall } from 'lucide-react-native';
import { SectionContainer } from './SectionContainer';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';

interface InfluencerOverviewSectionProps {
  influencers: {
    familyInfluencersCount: number;
    socialInfluencersCount: number;
  };
  syncedContactsVotersCount: number;
  subtitle?: string;
}

export const InfluencerOverviewSection: React.FC<InfluencerOverviewSectionProps> = ({
  influencers,
  syncedContactsVotersCount,
  subtitle,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  return (
    <SectionContainer
      title={t('influencerOverview')}
      subtitle={subtitle || t('influencerOverviewSubtitle')}
      icon={<Sparkles {...({ size: 18, color: '#F59E0B' } as any)} />}
      accentColor="#F59E0B"
    >
      <View style={styles.influencerGrid}>
        <View style={[styles.influencerBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <View style={styles.boxHeaderRow}>
            <Sparkles {...({ size: 14, color: '#D97706' } as any)} />
            <Text style={[styles.influencerVal, { color: '#D97706' }]}>
              {influencers?.familyInfluencersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('familyInfluencers')}</Text>
        </View>

        <View style={[styles.influencerBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <View style={styles.boxHeaderRow}>
            <Users {...({ size: 14, color: '#16A34A' } as any)} />
            <Text style={[styles.influencerVal, { color: '#16A34A' }]}>
              {influencers?.socialInfluencersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('socialInfluencers')}</Text>
        </View>

        <View style={[styles.influencerBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
          <View style={styles.boxHeaderRow}>
            <PhoneCall {...({ size: 14, color: '#0284C7' } as any)} />
            <Text style={[styles.influencerVal, { color: '#0284C7' }]}>
              {syncedContactsVotersCount || 0}
            </Text>
          </View>
          <Text style={styles.influencerLbl}>{t('contactSyncVoters')}</Text>
        </View>
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
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
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
    fontFamily: FontFamily.medium,
    fontSize: rfValue(10),
    color: '#475569',
    textAlign: 'center',
  },
});
