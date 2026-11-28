import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { profileStyles } from './styles';
import { logoutAction, fetchProfileAndRoleAccessAction, fetchLinkedProfilesAction, switchProfileAction } from '../../store/actions/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AppHeader } from '../../components/AppHeader';
import { SafeView } from '../../components/SafeView';

import { ProfileHeaderCard } from './components/ProfileHeaderCard';
import { ProfileContactSection } from './components/ProfileContactSection';
import { ProfileJurisdictionSection } from './components/ProfileJurisdictionSection';
import { ProfileSettingsSection } from './components/ProfileSettingsSection';
import { ProfileSwitchSection, LinkedProfileItem } from './components/ProfileSwitchSection';
import { ProfileLogoutSection } from './components/ProfileLogoutSection';
import { ProfileSkeleton } from './components/ProfileSkeleton';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { t, language, setLanguage } = useLanguage();
  const user = useSelector((state: RootState) => state.auth.user);
  const linkedProfiles = useSelector((state: RootState) => state.auth.linkedProfiles || []);
  const { theme, styles } = useAppTheme<ReturnType<typeof profileStyles>>(profileStyles);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!user);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingSwitchProfile, setPendingSwitchProfile] = useState<LinkedProfileItem | null>(null);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

  const canGoBack = Boolean(navigation?.canGoBack && navigation.canGoBack());

  // Hydrate user profile & linked profiles on initial screen mount
  useEffect(() => {
    let mounted = true;
    setProfilesLoading(true);
    Promise.all([
      dispatch(fetchProfileAndRoleAccessAction()),
      dispatch(fetchLinkedProfilesAction()),
    ]).finally(() => {
      if (mounted) {
        setInitialLoading(false);
        setProfilesLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchProfileAndRoleAccessAction()),
      dispatch(fetchLinkedProfilesAction()),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  const handleConfirmSwitchProfile = async () => {
    if (!pendingSwitchProfile) return;
    setIsSwitchingProfile(true);
    try {
      await dispatch(switchProfileAction(pendingSwitchProfile.tenantDbName));
    } finally {
      setIsSwitchingProfile(false);
      setPendingSwitchProfile(null);
    }
  };

  // Logout confirmation action
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutAction());
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <SafeView>
      {/* Universal Screen Header (with Back/Menu & Language Switch) */}
      <AppHeader
        title={t('profileTitle') || 'My Profile'}
        subtitle={user?.roleName || user?.role || t('profileSubtitle')}
        showMenu={!canGoBack}
        showBack={canGoBack}
        showLanguageToggle={true}
        statusBar="hidden"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {initialLoading && !user ? (
          <ProfileSkeleton theme={theme} />
        ) : (
          <>
            {/* 1. Hero Identity & Role Header Card */}
            <ProfileHeaderCard
              user={user}
              t={t}
              theme={theme}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />

            {/* 2. Contact Information & Identity Card */}
            <ProfileContactSection
              user={user}
              t={t}
              theme={theme}
            />

            {/* 3. Assigned Political & Electoral Jurisdiction Card */}
            <ProfileJurisdictionSection
              user={user}
              t={t}
              theme={theme}
            />

            {/* 4. Language & App Configuration Card */}
            <ProfileSettingsSection
              language={language}
              setLanguage={setLanguage}
              t={t}
              theme={theme}
            />

            {/* 5. Campaign Profile Switcher (visible when mobile is registered in 2+ tenants) */}
            <ProfileSwitchSection
              profiles={linkedProfiles}
              loading={profilesLoading}
              onSelectProfile={(profile) => setPendingSwitchProfile(profile)}
              t={t}
              theme={theme}
            />

            {/* 6. Safe Logout Trigger */}
            <ProfileLogoutSection
              onPressLogout={() => setShowLogoutModal(true)}
              t={t}
              theme={theme}
            />
          </>
        )}
      </ScrollView>

      {/* Confirmation Modal for Profile Switch (Rule 24) */}
      <ConfirmModal
        visible={Boolean(pendingSwitchProfile)}
        variant="info"
        title={t('confirmSwitchProfile')}
        message={
          pendingSwitchProfile
            ? `${pendingSwitchProfile.organizationName} (${pendingSwitchProfile.roleName || pendingSwitchProfile.role})\n\n${t('switchProfileConfirmMsg')}`
            : t('switchProfileConfirmMsg')
        }
        confirmText={t('switchAction')}
        cancelText={t('cancel')}
        icon="account-switch-outline"
        loading={isSwitchingProfile}
        onConfirm={handleConfirmSwitchProfile}
        onClose={() => !isSwitchingProfile && setPendingSwitchProfile(null)}
      />

      {/* Confirmation Modal for Logout (Rule 24) */}
      <ConfirmModal
        visible={showLogoutModal}
        variant="danger"
        title={t('confirmLogout')}
        message={t('logoutConfirmMessage')}
        confirmText={t('logout')}
        cancelText={t('cancel')}
        icon="logout"
        loading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </SafeView>
  );
};

export default ProfileScreen;
