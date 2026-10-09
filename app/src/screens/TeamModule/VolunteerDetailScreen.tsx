import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../languages';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootState } from '../../store/store';
import { deleteTeamMemberAction } from '../../store/actions/team';
import { SCREENS } from '../../navigation/constants';
import { canCreateTeamMember } from '../../utils/permissionUtils';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FontFamily } from '../../utils/typography';
import { rfValue } from '../../utils/responsive';
import { TeamMember } from '../../store/reducers/team';

import { VolunteerDetailHeader } from './components/VolunteerDetailHeader';
import { VolunteerTerritorySection } from './components/VolunteerTerritorySection';
import { VolunteerReportingSection } from './components/VolunteerReportingSection';
import { VolunteerPermissionsSection } from './components/VolunteerPermissionsSection';

export const VolunteerDetailScreen: React.FC<any> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const { theme } = useAppTheme();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const member: TeamMember = route?.params?.member;
  const auth = useSelector((state: RootState) => state.auth);
  const userAccess = (auth as any).access;
  const canManage = canCreateTeamMember(userAccess);

  if (!member) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader
          title={t('volunteerDetails')}
          showBack={true}
          onBack={() => navigation.goBack()}
          variant="primary"
        />
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="account-search-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No volunteer information available.
          </Text>
        </View>
      </View>
    );
  }

  const handleEditPress = () => {
    navigation.navigate(SCREENS.ONBOARD_TEAM_MEMBER, { memberToEdit: member });
  };

  const handleConfirmDelete = () => {
    setDeleteModalVisible(false);
    dispatch(deleteTeamMemberAction(member.id));
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* AppHeader Component */}
      <AppHeader
        title={member.name || t('volunteerDetails')}
        subtitle={member.roleName || member.role}
        showBack={true}
        onBack={() => navigation.goBack()}
        variant="primary"
        rightElement={
          canManage ? (
            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={handleEditPress}
              activeOpacity={0.8}
            >
              <MaterialDesignIcons name="pencil" size={15} color="#FFFFFF" />
              <Text style={styles.headerEditText}>{t('edit')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VolunteerDetailHeader member={member} t={t} theme={theme} />

        <VolunteerTerritorySection member={member} t={t} theme={theme} />

        <VolunteerReportingSection member={member} t={t} theme={theme} />

        <VolunteerPermissionsSection member={member} t={t} theme={theme} />

        {/* Delete Volunteer Destructive Action */}
        {canManage && (
          <Button
            title={t('deleteVolunteer')}
            variant="outline"
            onPress={() => setDeleteModalVisible(true)}
            style={styles.deleteBtn}
          />
        )}
      </ScrollView>

      {/* Reusable Confirm Modal for Deletion */}
      <ConfirmModal
        visible={deleteModalVisible}
        title={t('deleteVolunteer')}
        message={t('confirmDeleteVolunteer')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  headerEditText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12.5),
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  deleteBtn: {
    marginTop: 8,
    borderColor: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: rfValue(14),
  },
});

export default VolunteerDetailScreen;
