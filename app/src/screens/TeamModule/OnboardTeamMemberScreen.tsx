import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import {
  fetchCreatableRolesAction,
  onboardTeamMemberAction,
  updateTeamMemberAction,
  fetchTeamMembersAction,
} from '../../store/actions/team';
import {
  fetchMasterAcsAction,
  fetchMasterBoothsAction,
  fetchMasterWardsAction,
} from '../../store/actions/master';
import toast from '../../utils/toast';
import apiClient from '../../api/apiClient';
import { RootState } from '../../store/store';
import { useLanguage } from '../../languages';
import { Theme } from '../../constants/theme';
import { Modal } from '../../components/Modal';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { SafeView } from '../../components/SafeView';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSelector, useDispatch } from 'react-redux';
import { AppHeader } from '../../components/AppHeader';
import { SafeImage } from '../../components/SafeImage';
import React, { useState, useEffect, useMemo } from 'react';
import { AppTextInput } from '../../components/AppTextInput';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BoothSelectorModal } from './components/BoothSelectorModal';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { getVolunteerPasswordPreview } from '../../utils/volunteerPassword';
import { AttachmentPickerModal } from '../../components/AttachmentPickerModal';

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
  const { booths, wards, acs = [] } = useSelector((state: RootState) => state.master);

  const isPcLeader = auth.user?.role === 'pc_leader';

  const [name, setName] = useState(memberToEdit?.name || '');
  const [mobile, setMobile] = useState(memberToEdit?.mobile || '');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [selectedRole, setSelectedRole] = useState(memberToEdit?.role || '');
  const [parentLeaderId, setParentLeaderId] = useState<string | null>(
    memberToEdit?.parentLeaderId || null
  );
  const [allTeamMembers, setAllTeamMembers] = useState<any[]>([]);
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState('');

  // Selected Assembly Constituency (especially selectable when current user is PC Leader)
  const [selectedAcId, setSelectedAcId] = useState<string>(
    memberToEdit?.assignedAcId || auth.user?.assignedAcId || ''
  );
  const [isAcPickerOpen, setIsAcPickerOpen] = useState(false);
  const [acSearch, setAcSearch] = useState('');

  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>(
    memberToEdit?.assignedBooths?.map((b: any) => b.id) ||
    memberToEdit?.assignedBoothIds || []
  );
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string>(
    memberToEdit?.avatar || memberToEdit?.avatarUrl || ''
  );
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [status, setStatus] = useState<string>(memberToEdit?.status || 'active');

  // Fetch AC master options if logged in user is a PC Leader
  useEffect(() => {
    if (isPcLeader) {
      dispatch(fetchMasterAcsAction());
    }
  }, [dispatch, isPcLeader]);

  // Default to first AC if none selected for PC leader
  useEffect(() => {
    if (isPcLeader && !isEditing && acs.length > 0 && !selectedAcId) {
      setSelectedAcId(acs[0].id);
    }
  }, [isPcLeader, isEditing, acs, selectedAcId]);

  // Fetch booths and wards dynamically for selected AC or user assigned AC
  useEffect(() => {
    const effectiveAcId = selectedAcId || auth.user?.assignedAcId;
    if (effectiveAcId) {
      dispatch(fetchMasterBoothsAction(effectiveAcId));
      dispatch(fetchMasterWardsAction(effectiveAcId));
    }
  }, [dispatch, selectedAcId, auth.user?.assignedAcId]);

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
      .catch(() => { });
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

  // Combine allTeamMembers with current logged-in user so self is always available as supervisor
  const currentUserAsLeader = useMemo(() => {
    if (!auth.user?.id) return null;
    return {
      id: auth.user.id,
      name: `${auth.user.name || 'You'} (${t('you') || 'You'})`,
      role: auth.user.role,
      roleName: auth.user.roleName || (auth.user.role === 'pc_leader' ? 'PC Leader' : auth.user.role),
      mobile: auth.user.mobile,
      assignedAcId: auth.user.assignedAcId,
      assignedAcName: auth.user.assignedAcName,
      assignedBooths: auth.user.assignedBooths || [],
      assignedBoothIds: auth.user.assignedBoothIds || [],
    };
  }, [auth.user, t]);

  const candidateLeaders = useMemo(() => {
    const list = [...allTeamMembers];
    if (currentUserAsLeader && !list.some((m) => m.id === currentUserAsLeader.id)) {
      list.unshift(currentUserAsLeader);
    }
    return list;
  }, [allTeamMembers, currentUserAsLeader]);

  // Eligible parent leaders based on selected role
  const eligibleParentLeaders = useMemo(() => {
    const validRoles = VALID_PARENT_ROLES[selectedRole] || [];
    if (validRoles.length === 0) return [];
    return candidateLeaders.filter(
      (m) => m.id !== memberToEdit?.id && validRoles.includes(m.role)
    );
  }, [candidateLeaders, selectedRole, memberToEdit?.id]);

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
    return candidateLeaders.find((m) => m.id === parentLeaderId) || null;
  }, [candidateLeaders, parentLeaderId]);

  // Filtered ACs for PC Leader picker search
  const filteredAcs = useMemo(() => {
    if (!acSearch.trim()) return acs;
    const term = acSearch.trim().toLowerCase();
    return acs.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(term)) ||
        (a.acNumber !== undefined && String(a.acNumber).includes(term))
    );
  }, [acs, acSearch]);

  // Default to first creatable role when roles load (only in create mode)
  useEffect(() => {
    if (!isEditing && creatableRoles.length > 0 && !selectedRole) {
      const first = creatableRoles[0];
      setSelectedRole(first.roleKey);
      const validParents = VALID_PARENT_ROLES[first.roleKey] || [];
      if (validParents.length > 0 && auth.user?.role && validParents.includes(auth.user.role)) {
        setParentLeaderId(auth.user.id);
      } else if (validParents.length > 0) {
        const firstValid = candidateLeaders.find((m) => validParents.includes(m.role));
        if (firstValid) setParentLeaderId(firstValid.id);
      }
    }
  }, [creatableRoles, selectedRole, isEditing, auth.user, candidateLeaders]);

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
    // Auto-resolve parent leader according to hierarchy
    const validRoles = VALID_PARENT_ROLES[roleKey] || [];
    if (validRoles.length === 0) {
      setParentLeaderId(null);
    } else if (auth.user?.role && validRoles.includes(auth.user.role)) {
      setParentLeaderId(auth.user.id);
    } else {
      const firstValid = candidateLeaders.find((m) => validRoles.includes(m.role));
      setParentLeaderId(firstValid ? firstValid.id : null);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter full name');
      return;
    }
    if (/[<>]/.test(name) || (email && /[<>]/.test(email))) {
      toast.error(t('invalidCharactersHtml'));
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
    if (!selectedRole) {
      toast.error('Please select a cadre role');
      return;
    }
    if (selectedRole !== 'pc_leader' && !parentLeaderId && eligibleParentLeaders.length > 0) {
      toast.error('Please select a reporting leader');
      return;
    }

    const generatedPasswordPreview = getVolunteerPasswordPreview(name, mobile);
    const effectiveAcId =
      selectedAcId ||
      selectedParentLeader?.assignedAcId ||
      memberToEdit?.assignedAcId ||
      auth.user?.assignedAcId ||
      undefined;

    if (isEditing) {
      const updatePayload: any = {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        role: selectedRole,
        parentLeaderId: parentLeaderId || undefined,
        assignedAcId: effectiveAcId,
        assignedBoothIds: selectedBoothIds,
        status: status,
        avatar: avatarUri || undefined,
      };

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
        password: generatedPasswordPreview,
        role: selectedRole,
        parentLeaderId: parentLeaderId || undefined,
        assignedAcId: effectiveAcId,
        assignedBoothIds: selectedBoothIds,
        avatar: avatarUri || undefined,
      };

      dispatch(
        onboardTeamMemberAction(createPayload, () => {
          dispatch(fetchTeamMembersAction({ role: selectedRole }));
          toast.success(t('teamMemberSuccessOnboarded') || 'Cadre Successfully Onboarded');
          navigation.goBack();
        })
      );
    }
  };

  const userAcName = useMemo(() => {
    if (selectedAcId) {
      const matched = acs.find((a) => a.id === selectedAcId);
      if (matched) return matched.name;
    }
    return (
      selectedParentLeader?.assignedAcName ||
      auth.user?.assignedAcName ||
      auth.user?.assignedAc ||
      'Constituency Region'
    );
  }, [selectedAcId, acs, selectedParentLeader, auth.user]);

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
                  activeOpacity={0.8}
                  style={[
                    styles.roleCard,
                    isSelected && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => handleRoleChange(role.roleKey)}
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

          {/* Avatar / Profile Photo Picker */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsAttachmentModalOpen(true)}
              style={styles.avatarWrapper}
            >
              <SafeImage
                uri={avatarUri}
                name={name || 'Volunteer'}
                placeholderType="avatar"
                containerStyles={styles.avatarCircle}
              />
              <View style={styles.avatarBadge}>
                <MaterialDesignIcons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsAttachmentModalOpen(true)}>
              <Text style={styles.avatarSubtext}>
                {t('tapToChangePhoto') || 'Tap to select photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View>

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

            {/* Member Status Selector (Edit Mode Only) */}
            {isEditing && (
              <View style={{ gap: 6, marginTop: 4 }}>
                <Text style={styles.leaderCardLabel}>{t('memberStatus') || 'Member Status'}</Text>
                <View style={styles.statusRow}>
                  {['active', 'inactive', 'suspended'].map((st) => {
                    const isSelected = status === st;
                    const label = t(st as any) || st.charAt(0).toUpperCase() + st.slice(1);
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusChip, isSelected && styles.statusChipActive]}
                        onPress={() => setStatus(st)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
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

          {/* Interactive AC Selector Card for PC Leader, or fixed AC for other roles */}
          {isPcLeader ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsAcPickerOpen(true)}
              style={styles.leaderSelectorCard}
            >
              <View style={styles.leaderIconBox}>
                <MaterialDesignIcons name="domain" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.leaderTextCol}>
                <Text style={styles.leaderCardLabel}>{t('assemblyConstituency') || 'Assembly Constituency (AC)'} *</Text>
                <Text style={styles.leaderCardValue} numberOfLines={1}>
                  {selectedAcId
                    ? (acs.find((a) => a.id === selectedAcId)?.name || userAcName)
                    : (t('selectAssemblyConstituency') || 'Select Assembly Constituency')}
                </Text>
              </View>
              <MaterialDesignIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.territoryRow}>
              <View style={styles.territoryIconBox}>
                <MaterialDesignIcons name="domain" size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.territoryTextCol}>
                <Text style={styles.territoryLabel}>{t('assemblyConstituency') || 'Assigned Assembly Constituency'}</Text>
                <Text style={styles.territoryValue}>{userAcName}</Text>
              </View>
            </View>
          )}

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
        wards={wards}
        booths={availableBooths}
        visible={isBoothModalOpen}
        selectedBoothIds={selectedBoothIds}
        singleSelect={selectedRole === 'supporter'}
        onDismiss={() => setIsBoothModalOpen(false)}
        onSelectBooths={(boothIds) => setSelectedBoothIds(boothIds)}
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

      {/* Assembly Constituency Picker Modal (for PC Leader) */}
      <Modal
        visible={isAcPickerOpen}
        onDismiss={() => setIsAcPickerOpen(false)}
        position="center"
        contentContainerStyle={styles.parentPickerModalContent}
      >
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderTitleRow}>
            <MaterialDesignIcons name="domain" size={20} color={theme.colors.primary} />
            <Text style={styles.modalHeaderTitle}>{t('selectAssemblyConstituency') || 'Select Assembly Constituency'}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsAcPickerOpen(false)}>
            <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.parentSearchBox}>
          <MaterialDesignIcons name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.parentSearchInput}
            placeholder={t('searchAcPlaceholder') || 'Search assembly constituency...'}
            placeholderTextColor={theme.colors.textSecondary}
            value={acSearch}
            onChangeText={setAcSearch}
          />
        </View>

        <FlatList
          data={filteredAcs}
          keyExtractor={(item) => item.id}
          style={styles.parentList}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }: { item: any }) => {
            const isSelected = selectedAcId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.parentItem,
                  isSelected && styles.parentItemSelected,
                ]}
                onPress={() => {
                  setSelectedAcId(item.id);
                  setSelectedBoothIds([]);
                  setIsAcPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.parentItemAvatar}>
                  <MaterialDesignIcons name="domain" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.parentItemTextCol}>
                  <Text style={styles.parentItemName}>{item.name}</Text>
                  {item.acNumber !== undefined && (
                    <Text style={styles.parentItemRole}>AC #{item.acNumber}</Text>
                  )}
                </View>
                {isSelected && (
                  <MaterialDesignIcons name="check-circle" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.parentEmptyBox}>
              <MaterialDesignIcons name="alert-circle-outline" size={28} color={theme.colors.textSecondary} />
              <Text style={styles.parentEmptyText}>{t('noAcsFound') || 'No Assembly Constituencies Found'}</Text>
            </View>
          }
        />
      </Modal>

      {/* Attachment Picker Modal for Avatar Photo */}
      <AttachmentPickerModal
        visible={isAttachmentModalOpen}
        mediaTypesOnly={true}
        onClose={() => setIsAttachmentModalOpen(false)}
        onSelectFile={(_fileName, fileUri) => {
          setAvatarUri(fileUri);
          setIsAttachmentModalOpen(false);
        }}
        onSelectFiles={(files) => {
          if (files && files.length > 0) {
            setAvatarUri(files[0].uri);
          }
          setIsAttachmentModalOpen(false);
        }}
      />
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
      gap: 10,
    },
    roleCard: {
      gap: 4,
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderRadius: 14,
      borderColor: theme.colors.border || '#E2E8F0',
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
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
      borderColor: `${theme.colors.primary}20`,
      backgroundColor: `${theme.colors.primary}09`,
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

    // Avatar Photo & Status Styles
    avatarContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 6,
    },
    avatarWrapper: {
      position: 'relative',
      width: 80,
      height: 80,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: theme.colors.primary || '#1E40AF',
    },
    avatarBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.primary || '#1E40AF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    avatarSubtext: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11),
      color: theme.colors.primary || '#1E40AF',
    },
    statusRow: {
      flexDirection: 'row',
      gap: 8,
    },
    statusChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border || '#E2E8F0',
      alignItems: 'center',
      backgroundColor: theme.colors.subtleSurface || '#F8FAFC',
    },
    statusChipActive: {
      borderColor: `${theme.colors.primary}30` || '#1E40AF',
      backgroundColor: `${theme.colors.primary}20`,
    },
    statusChipText: {
      fontFamily: FontFamily.medium,
      fontSize: rfValue(11.5),
      color: theme.colors.textSecondary || '#64748B',
    },
    statusChipTextActive: {
      fontFamily: FontFamily.bold,
      color: theme.colors.primary || '#1E40AF',
    },
  });
