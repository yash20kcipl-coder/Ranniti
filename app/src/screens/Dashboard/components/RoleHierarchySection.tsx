import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import { SectionContainer } from './SectionContainer';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { useLanguage } from '../../../languages';

interface RoleHierarchySectionProps {
  role: string;
  hierarchy: {
    acLeadersCount: number;
    subLeadersCount: number;
    supportersCount: number;
  };
  subtitle?: string;
}

export const RoleHierarchySection: React.FC<RoleHierarchySectionProps> = ({
  role,
  hierarchy,
  subtitle,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));

  return (
    <SectionContainer
      title={t('roleHierarchy')}
      subtitle={subtitle || t('roleHierarchySubtitle')}
      icon={<Shield {...({ size: 18, color: theme.colors.primary || '#1E40AF' } as any)} />}
      accentColor={theme.colors.primary || '#1E40AF'}
    >
      <View style={[styles.hierarchyRow, { backgroundColor: theme.colors.background || '#F8FAFC' }]}>
        {role === 'pc_leader' && (
          <View style={styles.hierarchyItem}>
            <Text style={styles.hierarchyVal}>{hierarchy?.acLeadersCount || 0}</Text>
            <Text style={[styles.hierarchyLbl, { color: theme.colors.textSecondary || '#64748B' }]}>
              {t('acLeadersCount')}
            </Text>
          </View>
        )}

        {(role === 'pc_leader' || role === 'ac_leader') && (
          <View style={styles.hierarchyItem}>
            <Text style={styles.hierarchyVal}>{hierarchy?.subLeadersCount || 0}</Text>
            <Text style={[styles.hierarchyLbl, { color: theme.colors.textSecondary || '#64748B' }]}>
              {t('subLeadersCount')}
            </Text>
          </View>
        )}

        <View style={styles.hierarchyItem}>
          <Text style={[styles.hierarchyVal, { color: '#10B981' }]}>
            {hierarchy?.supportersCount || 0}
          </Text>
          <Text style={[styles.hierarchyLbl, { color: theme.colors.textSecondary || '#64748B' }]}>
            {t('supportersCount')}
          </Text>
        </View>
      </View>
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  hierarchyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginTop: 4,
  },
  hierarchyItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  hierarchyVal: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(18),
    color: '#1E40AF',
  },
  hierarchyLbl: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(11),
    textAlign: 'center',
  },
});
