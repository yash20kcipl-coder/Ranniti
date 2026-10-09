import React, { useMemo } from 'react';
import { useLanguage } from '../../../languages';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { SectionContainer } from './SectionContainer';
import { darkColors } from '../../../constants/theme';
import { FontFamily } from '../../../utils/typography';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, Award, Users, UserCheck, ArrowUpRight, ChevronRight } from 'lucide-react-native';

interface RoleHierarchySectionProps {
  role: string;
  hierarchy: {
    acLeadersCount: number;
    subLeadersCount: number;
    supportersCount: number;
  };
  subtitle?: string;
  onPressAcLeaders?: () => void;
  onPressSubLeaders?: () => void;
  onPressSupporters?: () => void;
  onPressHeader?: () => void;
}

interface HierarchyCardConfig {
  key: string;
  title: string;
  count: number;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export const RoleHierarchySection: React.FC<RoleHierarchySectionProps> = ({
  role,
  hierarchy,
  subtitle,
  onPressAcLeaders,
  onPressSubLeaders,
  onPressSupporters,
  onPressHeader,
}) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme(() => ({}));
  const isDark = theme.colors.background === darkColors.background;

  const cards: HierarchyCardConfig[] = useMemo(() => {
    const list: HierarchyCardConfig[] = [];

    if (role === 'pc_leader') {
      list.push({
        key: 'ac_leaders',
        title: t('acLeadersCount'),
        count: hierarchy?.acLeadersCount || 0,
        accentColor: '#2563EB',
        bgColor: '#EFF6FF',
        borderColor: '#DBEAFE',
        iconBg: '#DBEAFE',
        icon: <Award size={14} color="#2563EB" />,
        onPress: onPressAcLeaders,
      });
    }

    if (role === 'pc_leader' || role === 'ac_leader') {
      list.push({
        key: 'sub_leaders',
        title: t('subLeadersCount'),
        count: hierarchy?.subLeadersCount || 0,
        accentColor: '#7C3AED',
        bgColor: '#F5F3FF',
        borderColor: '#EDE9FE',
        iconBg: '#EDE9FE',
        icon: <Users size={14} color="#7C3AED" />,
        onPress: onPressSubLeaders,
      });
    }

    list.push({
      key: 'supporters',
      title: t('supportersCount'),
      count: hierarchy?.supportersCount || 0,
      accentColor: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#D1FAE5',
      iconBg: '#D1FAE5',
      icon: <UserCheck size={14} color="#059669" />,
      onPress: onPressSupporters,
    });

    return list;
  }, [role, hierarchy, t, onPressAcLeaders, onPressSubLeaders, onPressSupporters]);

  const totalCount = useMemo(() => {
    return cards.reduce((sum, item) => sum + item.count, 0);
  }, [cards]);

  const rightElement = onPressHeader ? (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPressHeader}
      style={[
        styles.headerActionPill,
        {
          backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
          borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#DBEAFE',
        },
      ]}
    >
      {/* <Text style={styles.headerActionText}>{t('viewTeam')}</Text> */}
      <ChevronRight size={13} color="#2563EB" />
    </TouchableOpacity>
  ) : undefined;

  return (
    <SectionContainer
      title={t('roleHierarchy')}
      rightElement={rightElement}
      onPressHeader={onPressHeader}
      contentStyle={{ paddingBottom: 5 }}
      accentColor={theme.colors.primary || '#1E40AF'}
      subtitle={subtitle || t('roleHierarchySubtitle')}
      icon={<Shield size={18} color={theme.colors.primary || '#1E40AF'} />}
    >
      <View style={styles.listContainer}>
        {cards.map((item, index) => {
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={[
                styles.listItem,
                index !== cards.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }
              ]}
            >
              <View style={styles.listItemLeft}>
                <View
                  style={[
                    styles.listIconBox,
                    {
                      backgroundColor: isDark
                        ? `${item.accentColor}26`
                        : item.iconBg,
                    },
                  ]}
                >
                  {item.icon}
                </View>
                <View style={styles.listTextCol}>
                  <Text
                    style={[
                      styles.listTitle,
                      { color: theme.colors.text || '#0F172A' },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
              </View>
              <View style={styles.listItemRight}>
                <Text style={[styles.listCount, { color: item.accentColor }]}>
                  {item.count.toLocaleString()}
                </Text>
                <ChevronRight size={16} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SectionContainer>
  );
};

const styles = StyleSheet.create({
  headerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerActionText: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(11),
    color: '#2563EB',
  },
  listContainer: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderColor: 'transparent',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontFamily: FontFamily.bold,
    fontSize: rfValue(13),
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listCount: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(15),
  },
});
