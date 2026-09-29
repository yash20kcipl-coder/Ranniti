import React from 'react';
import { navigate } from '../../../navigation';
import { profileOptionStyles } from './styles';
import { SCREENS } from '../../../navigation/constants';
import { SafeView } from '../../../components/SafeView';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const ProfileOption = () => {
  const { theme, styles } = useAppTheme(profileOptionStyles);

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
          <Text style={styles.title}>Welcome to School</Text>
          <Text style={styles.subtitle}>
            Please select your role to continue your journey
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('teacher')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
              <MaterialDesignIcons name="school-outline" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>I am a Teacher</Text>
              <Text style={styles.cardSubtitle}>Manage classes and students</Text>
            </View>
            <MaterialDesignIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('student')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '10' }]}>
              <MaterialDesignIcons name="account-outline" size={28} color={theme.colors.warning} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>I am a Student</Text>
              <Text style={styles.cardSubtitle}>View courses and assignments</Text>
            </View>
            <MaterialDesignIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => selectRole('parent')}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.info + '10' }]}>
              <MaterialDesignIcons name="human-male-child" size={28} color={theme.colors.info} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>I am a Parent</Text>
              <Text style={styles.cardSubtitle}>Monitor child's academic progress</Text>
            </View>
            <MaterialDesignIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeView>
  );
};

export default ProfileOption;
