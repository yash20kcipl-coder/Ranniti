import React from 'react';
import {
  Shield as LucideShield,
  Phone as LucidePhone,
  MapPin as LucideMapPin,
  LogOut as LucideLogOut,
  Globe as LucideGlobe,
} from 'lucide-react-native';
import { profileStyles } from './styles';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { SafeImage } from '../../components/SafeImage';
import { logoutAction } from '../../store/actions/auth';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const Shield = LucideShield as any;
const Phone = LucidePhone as any;
const MapPin = LucideMapPin as any;
const LogOut = LucideLogOut as any;
const Globe = LucideGlobe as any;

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { t, language, setLanguage } = useLanguage();
  const user = useSelector((state: RootState) => state.auth.user);
  const { theme, styles } = useAppTheme<ReturnType<typeof profileStyles>>(profileStyles);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding}>
      <View style={styles.profileHeaderCard}>
        <SafeImage
          src={user?.avatar}
          name={user?.name}
          style={styles.avatar}
          placeholderType="avatar"
          alt={user?.name || 'User'}
        />
        <Text style={styles.userName}>{user?.name || 'Campaign Leader'}</Text>
        <View style={styles.roleBadge}>
          <Shield size={12} color="#1E40AF" />
          <Text style={styles.roleText}>{user?.roleName || t('pcLeader')}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Phone size={16} color="#64748B" />
          <Text style={styles.infoText}>{user?.phone || '9876543210'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.infoText}>{user?.assignedPc || 'Jaipur Constituency'}</Text>
        </View>
      </View>

      {/* Language Toggle Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardTitleRow}>
          <Globe size={18} color="#1E40AF" />
          <Text style={styles.cardTitle}>{t('selectLanguage')}</Text>
        </View>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              {t('english')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
            onPress={() => setLanguage('hi')}
          >
            <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>
              {t('hindi')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logoutAction())}>
        <LogOut size={18} color="#EF4444" />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
