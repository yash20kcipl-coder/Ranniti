import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
  FlatList,
  TextInput,
} from 'react-native';
import { Modal } from '../../components/Modal';
import apiClient from '../../api/apiClient';
import {
  fetchCreatableRolesAction,
  onboardTeamMemberAction,
  updateTeamMemberAction,
  fetchTeamMembersAction,
} from '../../store/actions/team';
import toast from '../../utils/toast';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { SafeView } from '../../components/SafeView';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { AppHeader } from '../../components/AppHeader';
import { AppTextInput } from '../../components/AppTextInput';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BoothSelectorModal } from './components/BoothSelectorModal';
import { fetchMasterBoothsAction, fetchMasterWardsAction } from '../../store/actions/master';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { getVolunteerPasswordPreview } from '../../utils/volunteerPassword';

const ALL_MOBILE_SCREENS = [
  { key: 'voter_search', label: 'Voters Directory', icon: 'account-search' },
  { key: 'family_tree', label: 'Family Tree Mapping', icon: 'account-group' },
  { key: 'survey', label: 'Cadre / Voter Survey', icon: 'clipboard-text' },
  { key: 'booth_analytics', label: 'Booth Analytics', icon: 'chart-bar' },
  { key: 'gate_meetings', label: 'Gate Meetings & Influencers', icon: 'star-circle' },
];

const VALID_PARENT_ROLES: Record<string, string[]> = {
  pc_leader: [],
  ac_leader: ['pc_leader'],
  sub_leader: ['ac_leader'],
  supporter: ['sub_leader'],
};

const ROLE_HIERARCHY_HINT: Record<string, string> = {
  pc_leader: 'PC Leader has no parent — reports directly to Campaign Admin.',
  ac_leader: 'AC Leader must report to a PC Leader.',
  sub_leader: 'Sub-Leader must report to an AC Leader.',
  supporter: 'Supporter must report to a Sub-Leader.',
};

export const OnboardTeamMemberScreen: React.FC = () => {
  const { t } = useLanguage();
  const route = useRoute<any>();
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const { theme, styles } = useAppTheme(createStyles);

  const memberToEdit = route?.params?.member;
  const isEditing = Boolean(memberToEdit);

  const auth = useSelector((state: RootState) => state.auth);
  const { creatableRoles, isSubmitting } = useSelector((state: RootState) => state.team);
  const { booths, wards } = useSelector((state: RootState) => state.master);

  const [name, setName] = useState(memberToEdit?.name || '');
  const [mobile, setMobile] = useState(memberToEdit?.mobile || '');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(memberToEdit?.role || '');
  const [parentLeaderId, setParentLeaderId] = useState<string | null>(
    memberToEdit?.parentLeaderId || null
  );
  const [allTeamMembers, setAllTeamMembers] = useState<any[]>([]);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  const [selectedScreens, setSelectedScreens] = useState<string[]>(
    memberToEdit?.accessibleTabs?.mobileScreens || []
  );
  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>(
    memberToEdit?.assignedBooths?.map((b: any) => b.id) ||
    memberToEdit?.assignedBoothIds || []
  );
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);

  // Success modal for credentials sharing & WhatsApp
  const [createdMemberData, setCreatedMemberData] = useState<{
    name: string;
    mobile: string;
    password: string;
    roleName?: string;
  } | null>(null);

  // Fetch booths and wards for the user's territory scope
  useEffect(() => {
    if (auth.user?.assignedAcId) {
      dispatch(fetchMasterBoothsAction(auth.user?.assignedAcId));
      dispatch(fetchMasterWardsAction(auth.user?.assignedAcId));
    }
  }, [dispatch, auth.user?.assignedAcId]);

  // Fetch team members to populate potential reporting leaders
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/mobile/team', { params: { limit: 100 } })
      .then((res) => {
        if (isMounted) {
          const list = res?.data?.data?.teamMembers || [];
          setAllTeamMembers(list);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch creatable roles on mount if not already loaded
  useEffect(() => {
    if (!creatableRoles || creatableRoles.length === 0) {
      dispatch(fetchCreatableRolesAction());
    }
  }, [dispatch, creatableRoles]);

  // Default to first creatable role when roles load (only in create mode)
  useEffect(() => {
    if (!isEditing && creatableRoles.length > 0 && !selectedRole) {
      const first = creatableRoles[0];
      setSelectedRole(first.roleKey);
      setSelectedScreens(first.mobileScreens || ALL_MOBILE_SCREENS.map((s) => s.key));
      const validParents = VALID_PARENT_ROLES[first.roleKey] || [];
      if (validParents.length > 0 && auth.user?.role && validParents.includes(auth.user.role)) {
        setParentLeaderId(auth.user.id);
      }
    }
  }, [creatableRoles, selectedRole, isEditing, auth.user]);

  // Eligible parent leaders based on selected role
  const eligibleParentLeaders = useMemo(() => {
    const validRoles = VALID_PARENT_ROLES[selectedRole] || [];
    if (validRoles.length === 0) return [];
    return allTeamMembers.filter(
      (m) => m.id !== memberToEdit?.id && validRoles.includes(m.role)
    );
  }, [allTeamMembers, selectedRole, memberToEdit?.id]);

  const filteredParentLeaders = useMemo(() => {
    if (!parentSearch.trim()) return eligibleParentLeaders;
    const term = parentSearch.trim().toLowerCase();
    return eligibleParentLeaders.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.mobile && m.mobile.includes(term))
    );
  }, [eligibleParentLeaders, parentSearch]);

  const selectedParentLeader = useMemo(() => {
    if (!parentLeaderId) return null;
    return allTeamMembers.find((m) => m.id === parentLeaderId) || null;
  }, [allTeamMembers, parentLeaderId]);

  // Restrict available booths for supporter to parent's booths if assigned
  const availableBooths = useMemo(() => {
    if (selectedRole === 'supporter' && selectedParentLeader) {
      if (selectedParentLeader.assignedBooths && selectedParentLeader.assignedBooths.length > 0) {
        const parentBoothIds = selectedParentLeader.assignedBooths.map((b: any) => b.id);
        const scoped = booths.filter((b) => parentBoothIds.includes(b.id));
        if (scoped.length > 0) return scoped;
      }
    }
    return booths;
  }, [booths, selectedRole, selectedParentLeader]);

  const handleRoleChange = (roleKey: string) => {
    setSelectedRole(roleKey);
    setSelectedBoothIds([]);
    const matched = creatableRoles.find((r) => r.roleKey === roleKey);
    if (matched && matched.mobileScreens && matched.mobileScreens.length > 0) {
      setSelectedScreens(matched.mobileScreens);
    }
    // Auto-resolve parent leader according to hierarchy
    const validRoles = VALID_PARENT_ROLES[roleKey] || [];
    if (validRoles.length === 0) {
      setParentLeaderId(null);
    } else if (auth.user?.role && validRoles.includes(auth.user.role)) {
      setParentLeaderId(auth.user.id);
    } else {
      const firstValid = allTeamMembers.find((m) => validRoles.includes(m.role));
      setParentLeaderId(firstValid ? firstValid.id : null);
    }
  };

  const toggleScreen = (screenKey: string) => {
    if (selectedScreens.includes(screenKey)) {
      setSelectedScreens(selectedScreens.filter((s) => s !== screenKey));
    } else {
      setSelectedScreens([...selectedScreens, screenKey]);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter full name');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (email.trim() && !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.trim() && password.trim().length < 6) {
      toast.error(
        isEditing
          ? 'New password must be at least 6 characters'
          : 'Password must be at least 6 characters'
      );
      return;
    }
    if (!selectedRole) {
      toast.error('Please select a cadre role');
      return;
    }
    if (selectedRole !== 'pc_leader' && !parentLeaderId && eligibleParentLeaders.length > 0) {
      toast.error('Please select a reporting leader');
      return;
    }

    const generatedPasswordPreview = getVolunteerPasswordPreview(name, mobile);

    if (isEditing) {
      const updatePayload: any = {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        role: selectedRole,
        parentLeaderId: parentLeaderId || undefined,
        assignedAcId:
          selectedParentLeader?.assignedAcId ||
          memberToEdit?.assignedAcId ||
          auth.user?.assignedAcId ||
          undefined,
        assignedBoothIds: selectedBoothIds,
        accessibleTabs: {
          mobileScreens: selectedScreens,
        },
      };
      if (password.trim()) {
        updatePayload.password = password.trim();
      }

      dispatch(
        updateTeamMemberAction(memberToEdit.id, updatePayload, () => {
          toast.success(`Successfully updated ${name.trim()}!`);
          dispatch(fetchTeamMembersAction({ role: selectedRole }));
          navigation.goBack();
        })
      );
    } else {
      const createPayload = {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        password: password.trim() ? password.trim() : generatedPasswordPreview,
        role: selectedRole,
        parentLeaderId: parentLeaderId || undefined,
        assignedAcId:
          selectedParentLeader?.assignedAcId ||
          auth.user?.assignedAcId ||
          undefined,
        assignedBoothIds: selectedBoothIds,
        accessibleTabs: {
          mobileScreens: selectedScreens,
        },
      };

      dispatch(
        onboardTeamMemberAction(createPayload, (created) => {
          dispatch(fetchTeamMembersAction({ role: selectedRole }));
          const finalPwd = created?.generatedDefaultPassword || createPayload.password;
          setCreatedMemberData({
            name: created?.name || createPayload.name,
            mobile: created?.mobile || createPayload.mobile,
            password: finalPwd,
            roleName: creatableRoles.find((r) => r.roleKey === selectedRole)?.roleName || selectedRole,
          });
        })
      );
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdMemberData) return;
    const cleanMobile = (createdMemberData.mobile || '').replace(/\D/g, '');
    const message = `Namaste ${createdMemberData.name} ji,\n\nYour Ranniti Mobile Field App login credentials are:\n📱 Mobile: ${createdMemberData.mobile}\n🔑 Password: ${createdMemberData.password}\n\nPlease download and log into the Ranniti Mobile App to access your assigned polling booths and voter search.`;
    const url = `whatsapp://send?phone=91${cleanMobile}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl);
      }
    }).catch(() => {
      Linking.openURL(webUrl);
    });
  };

  const handleShareCredentials = async () => {
    if (!createdMemberData) return;
    const message = `Namaste ${createdMemberData.name} ji,\n\nYour Ranniti Mobile Field App login credentials are:\n📱 Mobile: ${createdMemberData.mobile}\n🔑 Password: ${createdMemberData.password}\n\nPlease download and log into the Ranniti Mobile App to access your assigned polling booths and voter search.`;
    try {
      await Share.share({ message });
    } catch {
      toast.success(t('credentialsShared') || 'Credentials shared successfully');
    }
  };

  const userAcName =
    selectedParentLeader?.assignedAcName ||
    auth.user?.assignedAcName ||
    auth.user?.assignedAc ||
    'Constituency Region';
  const generatedPasswordPreview = getVolunteerPasswordPreview(name, mobile);

  return (
    <SafeView>
      <AppHeader
        showBack
        statusBar="hidden"
        title={isEditing ? (t('editTeamMember') || 'Edit Team Member') : (t('onboardTeamMember') || 'Onboard Team Member')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section: Select Role */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialDesignIcons name="shield-account" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{t('selectRole')} *</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose cadre responsibility level allowed under your hierarchy
          </Text>

          <View style={styles.roleGrid}>
            {creatableRoles.map((role) => {
              const isSelected = selectedRole === role.roleKey;
              return (
                <TouchableOpacity
                  key={role.roleKey}
                  style={[
                    styles.roleCard,
                    isSelected && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => handleRoleChange(role.roleKey)}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleCardTop}>
                    <Text
                      style={[
                        styles.roleCardTitle,
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {role.roleName}
                    </Text>
                    {isSelected && (
                      <MaterialDesignIcons name="check-circle" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.roleCardSub,
                      isSelected && { color: 'rgba(255,255,255,0.85)' },
                    ]}
                  >
                    {role.mobileScreens?.length || 0} Default Tabs
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Reporting Leader Hierarchy */}
        {selectedRole !== 'pc_leader' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialDesignIcons name="account-arrow-up" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>{t('reportingLeader') || 'Reporting Leader'} *</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {ROLE_HIERARCHY_HINT[selectedRole] || 'Designate the commanding supervisor for this cadre member'}
            </Text>

            {eligibleParentLeaders.length === 0 ? (
              <View style={styles.noParentAlert}>
                <MaterialDesignIcons name="alert-circle-outline" size={20} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noParentTitle}>
                    {t('noReportingLeader') || 'No Reporting Leader Found'}
                  </Text>
                  <Text style={styles.noParentSub}>
                    {selectedRole === 'ac_leader'
                      ? 'No PC Leader found. Please onboard a PC Leader first.'
                      : selectedRole === 'sub_leader'
                      ? 'No AC Leader found. Please onboard an AC Leader first.'
                      : 'No Sub-Leader found. Please onboard a Sub-Leader first.'}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsParentPickerOpen(true)}
                style={styles.leaderSelectorCard}
              >
                <View style={styles.leaderIconBox}>
                  <MaterialDesignIcons name="account-tie" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.leaderTextCol}>
                  <Text style={styles.leaderCardLabel}>{t('reportsTo') || 'Reports To'}</Text>
                  <Text style={styles.leaderCardValue} numberOfLines={1}>
                    {selectedParentLeader
                      ? `${selectedParentLeader.name} (${selectedParentLeader.roleName || selectedParentLeader.role})`
                      : (t('selectReportingLeader') || 'Select Reporting Leader')}
                  </Text>
                </View>
                <MaterialDesignIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Section: Personal Credentials */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialDesignIcons name="account-details" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Cadre Credentials</Text>
          </View>

          <AppTextInput
            label={t('fullName') + ' *'}
            placeholder="e.g. Ramesh Chandra"
            value={name}
            onChangeText={setName}
          />

          <AppTextInput
            label={t('phoneNumber') + ' *'}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />

          <AppTextInput
            label={t('email') + ' (Optional)'}
            placeholder="e.g. ramesh@ranniti.in (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Auto-Generated Password Preview (Create Mode) */}
          {!isEditing && Boolean(name.trim() && mobile.trim()) && (
            <View style={styles.passwordPreviewCard}>
              <View style={styles.passwordPreviewLeft}>
                <MaterialDesignIcons name="lock" size={18} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.passwordPreviewLabel}>{t('autoGeneratedPassword') || 'Auto-Generated Login Password:'}</Text>
                  <Text style={styles.passwordPreviewCode}>{generatedPasswordPreview}</Text>
                </View>
              </View>
              <Text style={styles.passwordPreviewHint}>{t('formulaPasswordHint') || 'Formula: Name + PhoneLast4 + #'}</Text>
            </View>
          )}

          <AppTextInput
            label={isEditing ? 'Change Password (Optional)' : 'Custom Password (Optional)'}
            placeholder={
              isEditing
                ? (t('leaveBlankPassword') || 'Leave blank to keep unchanged')
                : generatedPasswordPreview
                  ? `Leave blank to use ${generatedPasswordPreview}`
                  : 'Min 6 characters (e.g. Leader@123)'
            }
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Section: Territory & Booth Assignment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <MaterialDesignIcons name="vote" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Territory Assignment</Text>
            </View>
            <View style={[styles.boothBadge, selectedBoothIds.length > 0 && styles.boothBadgeActive]}>
              <Text style={[styles.boothBadgeText, selectedBoothIds.length > 0 && styles.boothBadgeTextActive]}>
                {selectedBoothIds.length} {selectedRole === 'supporter' ? 'Booth' : 'Booths'} Selected
              </Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            {selectedRole === 'supporter'
              ? 'Select 1 primary polling booth for this supporter from supervisor territory'
              : 'Assign polling booth jurisdiction and territorial responsibilities'}
          </Text>

          <View style={styles.territoryRow}>
            <View style={styles.territoryIconBox}>
              <MaterialDesignIcons name="domain" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.territoryTextCol}>
              <Text style={styles.territoryLabel}>Assigned Assembly Constituency</Text>
              <Text style={styles.territoryValue}>{userAcName}</Text>
            </View>
          </View>

          {/* Interactive Polling Booth Selector Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsBoothModalOpen(true)}
            style={styles.boothSelectorCard}
          >
            <View style={styles.boothIconBox}>
              <MaterialDesignIcons name="map-marker-multiple" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.boothTextCol}>
              <Text style={styles.boothCardLabel}>
                {selectedRole === 'supporter' ? (t('assignedBooth') || 'Assigned Polling Booth') : (t('assignPollingBooths') || 'Assigned Polling Booths')}
              </Text>
              <Text style={styles.boothCardValue} numberOfLines={1}>
                {selectedBoothIds.length > 0
                  ? (selectedRole === 'supporter'
                    ? (booths.find((b) => b.id === selectedBoothIds[0])?.name || '1 Booth Assigned')
                    : `${selectedBoothIds.length} Polling Booth(s) Assigned`)
                  : 'Tap to assign polling booth(s)'}
              </Text>
            </View>
            <View style={[styles.boothBadge, selectedBoothIds.length > 0 && styles.boothBadgeActive]}>
              <Text style={[styles.boothBadgeText, selectedBoothIds.length > 0 && styles.boothBadgeTextActive]}>
                {selectedBoothIds.length > 0 ? `${selectedBoothIds.length}` : 'Select'}
              </Text>
              <MaterialDesignIcons
                name="chevron-right"
                size={16}
                color={selectedBoothIds.length > 0 ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Tab Access Matrix */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialDesignIcons name="tab" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{t('accessibleTabs')} *</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Configure mobile application screen access granted to this cadre
          </Text>

          <View style={styles.tabsList}>
            {ALL_MOBILE_SCREENS.map((sc) => {
              const isEnabled = selectedScreens.includes(sc.key);
              return (
                <TouchableOpacity
                  key={sc.key}
                  style={[
                    styles.tabAccessItem,
                    isEnabled && styles.tabAccessItemActive,
                  ]}
                  onPress={() => toggleScreen(sc.key)}
                  activeOpacity={0.75}
                >
                  <View style={styles.tabAccessLeft}>
                    <View
                      style={[
                        styles.tabIconBox,
                        isEnabled && { backgroundColor: `${theme.colors.primary}18` },
                      ]}
                    >
                      <MaterialDesignIcons
                        name={sc.icon as any}
                        size={18}
                        color={isEnabled ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tabAccessLabel,
                        isEnabled && { color: theme.colors.primary, fontFamily: FontFamily.bold },
                      ]}
                    >
                      {sc.label}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.togglePill,
                      isEnabled && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.togglePillText}>
                      {isEnabled ? 'ALLOWED' : 'LOCKED'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.submitBtnContent}>
                <MaterialDesignIcons name={isEditing ? "check" : "account-plus"} size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isEditing ? (t('saveChanges') || 'Save Changes') : (t('onboardTeamMember') || 'Onboard Team Member')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Interactive Booth Selector Modal with Ward Filters */}
      <BoothSelectorModal
        visible={isBoothModalOpen}
        onDismiss={() => setIsBoothModalOpen(false)}
        selectedBoothIds={selectedBoothIds}
        onSelectBooths={(boothIds) => setSelectedBoothIds(boothIds)}
        booths={availableBooths}
        wards={wards}
        singleSelect={selectedRole === 'supporter'}
        title={selectedRole === 'supporter' ? (t('selectBooths') || 'Select Polling Booth') : (t('assignPollingBooths') || 'Assign Polling Booths')}
      />

      {/* Reporting Leader Picker Modal */}
      <Modal
        visible={isParentPickerOpen}
        onDismiss={() => setIsParentPickerOpen(false)}
        position="center"
        contentContainerStyle={styles.parentPickerModalContent}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTitleRow}>
            <MaterialDesignIcons name="account-tie" size={20} color={theme.colors.primary} />
            <Text style={styles.modalHeaderTitle}>{t('selectReportingLeader') || 'Select Reporting Leader'}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsParentPickerOpen(false)}>
            <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.parentSearchBox}>
          <MaterialDesignIcons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.parentSearchInput}
            placeholder="Search leader by name or mobile..."
            placeholderTextColor={theme.colors.textSecondary}
            value={parentSearch}
            onChangeText={setParentSearch}
          />
        </View>

        <FlatList
          data={filteredParentLeaders}
          keyExtractor={(item) => item.id}
          style={styles.parentList}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }: { item: any }) => {
            const isSelected = parentLeaderId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.parentItem,
                  isSelected && styles.parentItemSelected,
                ]}
                onPress={() => {
                  setParentLeaderId(item.id);
                  setIsParentPickerOpen(false);
                  if (selectedRole === 'supporter') {
                    setSelectedBoothIds([]);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.parentItemAvatar}>
                  <Text style={styles.parentItemAvatarText}>
                    {item.name ? item.name.charAt(0).toUpperCase() : 'L'}
                  </Text>
                </View>
                <View style={styles.parentItemTextCol}>
                  <Text style={styles.parentItemName}>{item.name}</Text>
                  <Text style={styles.parentItemRole}>{item.roleName || item.role} • {item.mobile || '—'}</Text>
                </View>
                {isSelected && (
                  <MaterialDesignIcons name="check-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.parentEmptyBox}>
              <MaterialDesignIcons name="account-off" size={28} color={theme.colors.textSecondary} />
              <Text style={styles.parentEmptyText}>No matching supervisors found</Text>
            </View>
          }
        />
      </Modal>

      {/* Post-Creation WhatsApp & Credentials Success Modal */}
      <Modal
        visible={Boolean(createdMemberData)}
        onDismiss={() => {
          setCreatedMemberData(null);
          navigation.goBack();
        }}
        position="center"
        contentContainerStyle={styles.credentialsModalContent}
      >
        <View style={styles.credentialsSuccessHeader}>
          <View style={styles.credentialsSuccessIcon}>
            <MaterialDesignIcons name="check-decagram" size={34} color="#10B981" />
          </View>
          <Text style={styles.credentialsSuccessTitle}>
            {t('teamMemberSuccessOnboarded') || 'Cadre Successfully Onboarded'}
          </Text>
          <Text style={styles.credentialsSuccessSub}>
            {t('shareCredentialsPrompt') || 'Share these credentials with the team member to start ground campaigning.'}
          </Text>
        </View>

        <View style={styles.credentialsCard}>
          <View style={styles.credentialRow}>
            <Text style={styles.credentialLabel}>{t('fullName') || 'Name'}</Text>
            <Text style={styles.credentialVal}>{createdMemberData?.name}</Text>
          </View>
          <View style={styles.credentialDivider} />
          <View style={styles.credentialRow}>
            <Text style={styles.credentialLabel}>{t('phoneNumber') || 'Mobile'}</Text>
            <Text style={[styles.credentialVal, { fontFamily: FontFamily.bold }]}>{createdMemberData?.mobile}</Text>
          </View>
          <View style={styles.credentialDivider} />
          <View style={styles.credentialRow}>
            <Text style={styles.credentialLabel}>Login Password</Text>
            <Text style={[styles.credentialVal, styles.credentialPassword]}>{createdMemberData?.password}</Text>
          </View>
        </View>

        <View style={styles.credentialsActions}>
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <MaterialDesignIcons name="whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.whatsAppBtnText}>{t('shareOnWhatsApp') || 'Share on WhatsApp'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareCredentialsBtn}
            onPress={handleShareCredentials}
            activeOpacity={0.85}
          >
            <MaterialDesignIcons name="share-variant" size={18} color={theme.colors.primary} />
            <Text style={styles.shareCredentialsBtnText}>{t('copyCredentials') || 'Share Credentials'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => {
              setCreatedMemberData(null);
              navigation.goBack();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t('done') || 'Done'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeView>
  );
};

export default OnboardTeamMemberScreen;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background || '#F8FAFC',
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 40,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      gap: 12,
      ...getShadow(2, '#000000', 0.04),
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text || '#0F172A',
    },
    sectionSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary || '#64748B',
      marginTop: -4,
    },
    roleGrid: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
      marginTop: 4,
    },
    roleCard: {
      flex: 1,
      minWidth: '46%',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border || '#E2E8F0',
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      gap: 4,
    },
    roleCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    roleCardTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text || '#0F172A',
    },
    roleCardSub: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    leaderSelectorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    leaderIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    leaderTextCol: {
      flex: 1,
      gap: 2,
    },
    leaderCardLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    leaderCardValue: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: theme.colors.text || '#0F172A',
    },
    noParentAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    noParentTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12),
      color: '#D97706',
    },
    noParentSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: '#92400E',
    },
    territoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    territoryIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    territoryTextCol: {
      flex: 1,
      gap: 2,
    },
    territoryLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    territoryValue: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13.5),
      color: theme.colors.text || '#0F172A',
    },
    passwordPreviewCard: {
      backgroundColor: `${theme.colors.primary}12`,
      borderColor: `${theme.colors.primary}35`,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    passwordPreviewLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    passwordPreviewLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    passwordPreviewCode: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: theme.colors.primary || '#1E40AF',
    },
    passwordPreviewHint: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(9.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    boothSelectorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      marginTop: 4,
    },
    boothIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    boothTextCol: {
      flex: 1,
      gap: 2,
    },
    boothCardLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(10.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    boothCardValue: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: theme.colors.text || '#0F172A',
    },
    boothBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    boothBadgeActive: {
      backgroundColor: `${theme.colors.primary}15`,
    },
    boothBadgeText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary || '#64748B',
    },
    boothBadgeTextActive: {
      color: theme.colors.primary || '#1E40AF',
    },
    tabsList: {
      gap: 8,
      marginTop: 4,
    },
    tabAccessItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    tabAccessItemActive: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}12`,
    },
    tabAccessLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    tabIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabAccessLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12.5),
      color: theme.colors.text || '#0F172A',
    },
    togglePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: '#94A3B8',
    },
    togglePillText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(9),
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.colors.subtleSurface || '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
    },
    cancelButtonText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.textSecondary || '#64748B',
    },
    submitButton: {
      flex: 2,
      height: 50,
      borderRadius: 14,
      backgroundColor: theme.colors.primary || '#1E40AF',
      justifyContent: 'center',
      alignItems: 'center',
      ...getShadow(4, theme.colors.primary || '#1E40AF', 0.25),
    },
    submitBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    submitButtonText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: '#FFFFFF',
    },

    // Parent Picker Modal Styles
    parentPickerModalContent: {
      width: '90%',
      maxHeight: '75%',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      alignSelf: 'center',
      ...getShadow(8, '#0F172A', 0.2),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    modalHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalHeaderTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
      color: theme.colors.text,
    },
    parentSearchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.subtleSurface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    parentSearchInput: {
      flex: 1,
      fontFamily: FontFamily.body,
      fontSize: rfValue(12.5),
      color: theme.colors.text,
      padding: 0,
    },
    parentList: {
      maxHeight: 320,
    },
    parentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
      gap: 10,
    },
    parentItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}15`,
    },
    parentItemAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${theme.colors.primary}20`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    parentItemAvatarText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(14),
      color: theme.colors.primary,
    },
    parentItemTextCol: {
      flex: 1,
      gap: 2,
    },
    parentItemName: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text,
    },
    parentItemRole: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      color: theme.colors.textSecondary,
    },
    parentEmptyBox: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 6,
    },
    parentEmptyText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(12),
      color: theme.colors.textSecondary,
    },

    // Credentials Success Modal Styles
    credentialsModalContent: {
      width: '90%',
      backgroundColor: theme.colors.surface,
      borderRadius: 22,
      padding: 20,
      alignSelf: 'center',
      ...getShadow(10, '#0F172A', 0.25),
    },
    credentialsSuccessHeader: {
      alignItems: 'center',
      marginBottom: 16,
      gap: 4,
    },
    credentialsSuccessIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    credentialsSuccessTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(16),
      color: theme.colors.text,
      textAlign: 'center',
    },
    credentialsSuccessSub: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    credentialsCard: {
      backgroundColor: theme.colors.subtleSurface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginBottom: 16,
      gap: 8,
    },
    credentialRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    credentialLabel: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary,
    },
    credentialVal: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(12.5),
      color: theme.colors.text,
    },
    credentialDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
    },
    credentialPassword: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    credentialsActions: {
      gap: 8,
    },
    whatsAppBtn: {
      height: 46,
      borderRadius: 12,
      backgroundColor: '#25D366',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...getShadow(3, '#25D366', 0.3),
    },
    whatsAppBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: '#FFFFFF',
    },
    shareCredentialsBtn: {
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.subtleSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    shareCredentialsBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: theme.colors.text,
    },
    doneBtn: {
      height: 42,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    doneBtnText: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(13),
      color: '#FFFFFF',
    },
  });
