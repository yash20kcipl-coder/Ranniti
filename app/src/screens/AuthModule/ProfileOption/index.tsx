import React from 'react';
import { navigate } from '../../../navigation';
import { profileOptionStyles } from './styles';
import { SCREENS } from '../../../navigation/constants';
import { SafeView } from '../../../components/SafeView';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, TouchableOpacity } from 'react-native';
import { GraduationCap, User, Users, ChevronRight } from 'lucide-react-native';

const ProfileOption = () => {
  const { theme, styles } = useAppTheme<ReturnType<typeof profileOptionStyles>>(profileOptionStyles);

  const selectRole = (role: string) => {
    navigate(SCREENS.LOGIN, { role });
  };

  return (
    <SafeView style={styles.container}>
      {/* Decorative Background Circles */}
      <View style={styles.background} pointerEvents="none">
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Ranniti</Text>
          <Text style={styles.subtitle}>
            Please select your role to continue
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('pc_leader')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
              <GraduationCap {...({ size: 28, color: theme.colors.primary } as any)} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>PC / AC Leader</Text>
              <Text style={styles.cardSubtitle}>Constituency management & team oversight</Text>
            </View>
            <ChevronRight {...({ size: 24, color: theme.colors.textSecondary } as any)} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('sub_leader')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '10' }]}>
              <User {...({ size: 28, color: theme.colors.warning } as any)} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Sub Leader</Text>
              <Text style={styles.cardSubtitle}>Ward & booth level campaign coordination</Text>
            </View>
            <ChevronRight {...({ size: 24, color: theme.colors.textSecondary } as any)} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('supporter')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.info + '10' }]}>
              <Users {...({ size: 28, color: theme.colors.info } as any)} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Supporter / Cadre</Text>
              <Text style={styles.cardSubtitle}>Voter mapping & booth survey</Text>
            </View>
            <ChevronRight {...({ size: 24, color: theme.colors.textSecondary } as any)} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeView>
  );
};

export default ProfileOption;
