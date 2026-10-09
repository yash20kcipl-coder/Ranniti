import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';
import { getShadow } from '../../../utils/shadow';
import { Theme } from '../../../constants/theme';
import { Voter } from '../../../store/reducers/voters';

interface VoterDemographicsSectionProps {
  voter: Voter;
  t: (key: any) => string;
  theme: Theme;
}

export const VoterDemographicsSection: React.FC<VoterDemographicsSectionProps> = ({ voter, t, theme }) => {
  const relativeName = voter.guardianName || voter.relativeName || '';
  const relationText = voter.relation ? ` (${voter.relation})` : '';
  const mobile = voter.mobile || voter.mobileNo || '';
  const address = voter.fullAddress || voter.voterAddress || voter.address || '';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.titleRow}>
        <View style={[styles.titleIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="account-details-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('demographicsTitle')}
        </Text>
      </View>

      {/* Group 1: Personal & Bio */}
      <View style={styles.groupContainer}>
        <Text style={[styles.groupSubtitle, { color: theme.colors.textSecondary }]}>
          PERSONAL & BIO
        </Text>

        <View style={styles.grid}>
          {/* Gender */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons
                name={voter.gender === 'Female' ? 'gender-female' : 'gender-male'}
                size={15}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('gender')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {voter.gender || '—'}
            </Text>
          </View>

          {/* Age */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="calendar-clock-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('age')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {voter.age ? `${voter.age} yrs` : '—'}
            </Text>
          </View>

          {/* Date of Birth (if available) */}
          {Boolean(voter.dob) && (
            <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="cake-variant-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('dob')}</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {voter.dob}
              </Text>
            </View>
          )}

          {/* Blood Group */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="water-outline" size={15} color="#DC2626" />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('bloodGroup')}</Text>
            </View>
            <Text style={[styles.value, { color: voter.bloodGroup ? '#DC2626' : theme.colors.text }]}>
              {voter.bloodGroup || '—'}
            </Text>
          </View>

          {/* Relative / Guardian Name */}
          <View style={[styles.fullTile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="account-child-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                {t('relativeName')}{relationText}
              </Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {relativeName || '—'}
            </Text>
          </View>

          {/* Mobile Number */}
          {Boolean(mobile) && (
            <View style={[styles.fullTile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="phone-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('mobileNumber')}</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {mobile}
              </Text>
            </View>
          )}

          {/* Email Address */}
          {Boolean(voter.email) && (
            <View style={[styles.fullTile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="email-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {voter.email}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Group 2: Social & Profession */}
      <View style={styles.groupContainer}>
        <Text style={[styles.groupSubtitle, { color: theme.colors.textSecondary }]}>
          SOCIAL & OCCUPATION
        </Text>

        <View style={styles.grid}>
          {/* Religion */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="hands-pray" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('religion')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {voter.religionName || '—'}
            </Text>
          </View>

          {/* Caste */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="account-group-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('caste')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {voter.casteName || '—'}
            </Text>
          </View>

          {/* Sub-caste (if present) */}
          {Boolean(voter.subcasteName) && (
            <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="account-multiple-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('subCaste')}</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
                {voter.subcasteName}
              </Text>
            </View>
          )}

          {/* Profession */}
          <View
            style={[
              voter.subcasteName ? styles.tile : styles.fullTile,
              { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            ]}
          >
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="briefcase-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('profession')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {voter.profession || voter.professionType || '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Group 3: Residential Address */}
      <View style={styles.groupContainer}>
        <Text style={[styles.groupSubtitle, { color: theme.colors.textSecondary }]}>
          ADDRESS & RESIDENCE
        </Text>

        <View style={styles.grid}>
          {/* House No */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="home-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('houseNo')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {voter.houseNo || '—'}
            </Text>
          </View>

          {/* Village / City */}
          <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="city-variant-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('village')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
              {voter.village || '—'}
            </Text>
          </View>

          {/* Taluka */}
          {Boolean(voter.taluka) && (
            <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="sign-direction" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('taluka')}</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
                {voter.taluka}
              </Text>
            </View>
          )}

          {/* District */}
          {Boolean(voter.districtName) && (
            <View style={[styles.tile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
              <View style={styles.tileHeader}>
                <MaterialDesignIcons name="map-marker-radius-outline" size={15} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('district')}</Text>
              </View>
              <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
                {voter.districtName}
              </Text>
            </View>
          )}

          {/* Full Address */}
          <View style={[styles.fullTile, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.tileHeader}>
              <MaterialDesignIcons name="map-marker-outline" size={15} color={theme.colors.textSecondary} />
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{t('address')}</Text>
            </View>
            <Text style={[styles.value, { color: theme.colors.text }]}>
              {address || '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    ...getShadow(2, '#000000', 0.05),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14.5),
  },
  groupContainer: {
    marginBottom: 14,
    gap: 8,
  },
  groupSubtitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(10.5),
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48.2%',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  fullTile: {
    width: '100%',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
});
