import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../../constants/theme';
import { rfValue } from '../../../utils/responsive';
import { FontFamily } from '../../../utils/typography';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';

interface ProfileLogoutSectionProps {
  onPressLogout: () => void;
  t: (key: any) => string;
  theme: Theme;
}

export const ProfileLogoutSection: React.FC<ProfileLogoutSectionProps> = ({
  onPressLogout,
  t,
  theme,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.logoutBtn}
        onPress={onPressLogout}
      >
        <MaterialDesignIcons name="logout" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(15),
    color: '#EF4444',
  },
});
