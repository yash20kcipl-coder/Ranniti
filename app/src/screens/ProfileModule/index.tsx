import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { profileStyles } from './styles';
import { logoutAction, fetchProfileAndRoleAccessAction } from '../../store/actions/auth';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AppHeader } from '../../components/AppHeader';
import { SafeView } from '../../components/SafeView';

import { ProfileHeaderCard } from './components/ProfileHeaderCard';
import { ProfileContactSection } from './components/ProfileContactSection';
import { ProfileJurisdictionSection } from './components/ProfileJurisdictionSection';
import { ProfileSettingsSection } from './components/ProfileSettingsSection';
import { ProfileLogoutSection } from './components/ProfileLogoutSection';
import { ProfileSkeleton } from './components/ProfileSkeleton';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { t, language, setLanguage } = useLanguage();
  const user = useSelector((state: RootState) => state.auth.user);
  const { theme, styles } = useAppTheme<ReturnType<typeof profileStyles>>(profileStyles);

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const canGoBack = Boolean(navigation?.canGoBack && navigation.canGoBack());

  // Hydrate user profile on initial screen mount
  useEffect(() => {
    let mounted = true;
    dispatch(fetchProfileAndRoleAccessAction())
      .finally(() => {
        if (mounted) {
          setInitialLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchProfileAndRoleAccessAction())
      .finally(() => {
        setRefreshing(false);
      });
  }, [dispatch]);

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

            {/* 5. Safe Logout Trigger */}
            <ProfileLogoutSection
              onPressLogout={() => setShowLogoutModal(true)}
              t={t}
              theme={theme}
            />
          </>
        )}
      </ScrollView>

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
