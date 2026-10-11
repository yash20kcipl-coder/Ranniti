import React from 'react';
import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { getFormattedAppVersion } from '../../../utils/version';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface ProfileSettingsSectionProps {
  language: string;
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: any) => string;
  theme: Theme;
}

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  language,
  setLanguage,
  t,
  theme,
}) => {
  const formattedVersion = getFormattedAppVersion();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
          <MaterialDesignIcons name="cog-outline" size={18} color={theme.colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('appSettings')}
        </Text>
      </View>

      {/* Language Selection */}
      <View style={styles.settingBlock}>
        <Text style={[styles.settingLabel, { color: theme.colors.textSecondary }]}>
          {t('selectLanguage')}
        </Text>

        <View style={styles.langRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.langBtn,
              language === 'en'
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            ]}
            onPress={() => setLanguage('en')}
          >
            <View style={styles.langBtnContent}>
              <Text style={styles.flagEmoji}>🇬🇧</Text>
              <Text
                style={[
                  styles.langText,
                  { color: language === 'en' ? '#FFFFFF' : theme.colors.text },
                  language === 'en' && { fontFamily: FontFamily.bold },
                ]}
              >
                {t('english')}
              </Text>
            </View>
            {language === 'en' && (
              <MaterialDesignIcons name="check-circle" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.langBtn,
              language === 'hi'
                ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            ]}
            onPress={() => setLanguage('hi')}
          >
            <View style={styles.langBtnContent}>
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text
                style={[
                  styles.langText,
                  { color: language === 'hi' ? '#FFFFFF' : theme.colors.text },
                  language === 'hi' && { fontFamily: FontFamily.bold },
                ]}
              >
                {t('hindi')}
              </Text>
            </View>
            {language === 'hi' && (
              <MaterialDesignIcons name="check-circle" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Version Information */}
      <View style={styles.versionRow}>
        <MaterialDesignIcons name="information-outline" size={13} color={theme.colors.textSecondary} />
        <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
          {t('appName')} {t('appVersion')} {formattedVersion}
        </Text>
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
  settingBlock: {
    gap: 8,
    marginBottom: 12,
  },
  settingLabel: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(12),
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  langBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagEmoji: {
    fontSize: rfValue(16),
  },
  langText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(13),
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 4,
  },
  versionText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
  },
});
