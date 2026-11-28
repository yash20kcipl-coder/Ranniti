import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Phone, Vote, Users, MapPin, ShieldCheck, Sparkles, Lock } from 'lucide-react-native';
import { SurveyFieldRule } from '../../../store/reducers/dashboard';
import { FontFamily } from '../../../utils/typography';
import { rfValue } from '../../../utils/responsive';

interface PointRulesTabProps {
  rules: Record<string, SurveyFieldRule>;
  theme: any;
  t: (key: any) => string;
}

const CATEGORY_ORDER = ['contact', 'political', 'demographic', 'status', 'address', 'identification', 'profile'];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  contact: { label: 'Contact Information', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', Icon: Phone },
  political: { label: 'Political & Leaning', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', Icon: Vote },
  demographic: { label: 'Demographics', color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.12)', Icon: Users },
  status: { label: 'Voter Status', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.12)', Icon: MapPin },
  address: { label: 'Address', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', Icon: MapPin },
  identification: { label: 'Identification', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)', Icon: ShieldCheck },
  profile: { label: 'Profile', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.12)', Icon: Sparkles },
};

export const PointRulesTab: React.FC<PointRulesTabProps> = ({ rules, theme, t }) => {
  const grouped = Object.entries(rules || {}).reduce(
    (acc, [fieldKey, rule]) => {
      const cat = rule.category || 'profile';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ fieldKey, rule });
      return acc;
    },
    {} as Record<string, Array<{ fieldKey: string; rule: SurveyFieldRule }>>
  );

  const orderedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return (
    <View style={styles.container}>
      {orderedCategories.map(([category, items]) => {
        const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.profile;
        const IconComp = cfg.Icon;
        return (
          <View
            key={category}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={[styles.catHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={[styles.catIcon, { backgroundColor: cfg.bg }]}>
                <IconComp size={15} color={cfg.color} />
              </View>
              <Text style={[styles.catTitle, { color: theme.colors.text }]}>{cfg.label}</Text>
            </View>

            <View style={styles.list}>
              {items.map(({ fieldKey, rule }, idx) => (
                <View
                  key={fieldKey}
                  style={[
                    styles.ruleRow,
                    idx < items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                    !rule.enabled && { opacity: 0.45 },
                  ]}
                >
                  <View style={styles.ruleLeft}>
                    <Text style={[styles.ruleLabel, { color: theme.colors.text }]}>
                      {rule.label}
                    </Text>
                    {rule.requirePreviouslyEmpty && (
                      <View style={styles.blankBadge}>
                        <Lock size={10} color="#64748B" />
                        <Text style={styles.blankBadgeText}>{t('blankFieldsOnly')}</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.ptsPill,
                      {
                        backgroundColor: rule.enabled ? 'rgba(79, 70, 229, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ptsText,
                        { color: rule.enabled ? '#4F46E5' : theme.colors.textSecondary },
                      ]}
                    >
                      {rule.enabled ? `+${rule.points} ${t('pointsPerUpdate')}` : t('disabledRule')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontSize: rfValue(13.5),
    fontFamily: FontFamily.bodyBold,
  },
  list: {
    paddingHorizontal: 14,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    gap: 10,
  },
  ruleLeft: {
    flex: 1,
    gap: 4,
  },
  ruleLabel: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.medium,
  },
  blankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blankBadgeText: {
    fontSize: rfValue(10),
    fontFamily: FontFamily.body,
    color: '#64748B',
  },
  ptsPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ptsText: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.bodyBold,
  },
});
