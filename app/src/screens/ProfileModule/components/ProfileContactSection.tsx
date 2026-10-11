import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { getShadow } from '../../../utils/shadow';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import toast from '../../../utils/toast';
import { ProfileInfoTile } from './ProfileInfoTile';

interface ProfileContactSectionProps {
  user: any;
  t: (key: any) => string;
  theme: Theme;
}

export const ProfileContactSection: React.FC<ProfileContactSectionProps> = ({ user, t, theme }) => {
  const phone = user?.phone || user?.mobile || '—';
  const email = user?.email || '—';

  const handleCopy = (text: string, label: string) => {
    if (text && text !== '—') {
      toast.success(`Copied ${label}: ${text}`);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="account-circle-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('contactInformation')}
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Mobile Phone */}
        <ProfileInfoTile
          label={t('phoneNumber')}
          value={phone}
          icon="phone-outline"
          iconColor="#2563EB"
          iconBg="#EFF6FF"
          onPress={() => handleCopy(phone, t('phoneNumber'))}
          theme={theme}
        />

        {/* Email Address */}
        <ProfileInfoTile
          label={t('emailAddress')}
          value={email}
          icon="email-outline"
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
          onPress={() => handleCopy(email, t('emailAddress'))}
          theme={theme}
        />

        {/* Account Status */}
        <ProfileInfoTile
          label={t('accountStatus')}
          value={user?.status ? String(user.status).toUpperCase() : 'ACTIVE'}
          icon="check-decagram"
          iconColor="#16A34A"
          iconBg="#ECFDF5"
          valueColor="#16A34A"
          valueStyle={{ fontFamily: FontFamily.bold }}
          theme={theme}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    ...getShadow(2, '#000000', 0.04),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(15),
  },
  grid: {
    gap: 10,
  },
});
