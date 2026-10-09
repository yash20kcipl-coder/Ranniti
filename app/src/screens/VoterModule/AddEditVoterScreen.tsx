import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import {
  fetchMasterStatesAction,
  fetchMasterDistrictsAction,
  fetchMasterPcsAction,
  fetchMasterAcsAction,
  fetchMasterBoothsAction,
  fetchMasterPartiesAction,
  fetchMasterReligionsAction,
  fetchMasterCastesAction,
  fetchMasterTalukasAction,
  fetchMasterVillagesAction,
  fetchMasterInfluencerOptionsAction,
} from '../../store/actions/master';
import toast from '../../utils/toast';
import { RootState } from '../../store/store';
import { ScrollView } from '../../components';
import { useLanguage } from '../../languages';
import { Button } from '../../components/Button';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppHeader } from '../../components/AppHeader';
import { useSelector, useDispatch } from 'react-redux';
import { DropdownOption } from '../../components/AppDropdown';
import { hasVoterPermission } from '../../utils/permissionUtils';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VoterSectionTabBar } from './components/VoterSectionTabBar';
import { MaterialDesignIcons } from '../../components/MaterialDesignIcons';
import { addVoterAction, updateVoterAction, fetchVoterByIdAction } from '../../store/actions/voters';

import { VoterGeographyFormSection } from './components/VoterGeographyFormSection';
import { VoterInfluencerFormSection } from './components/VoterInfluencerFormSection';
import { VoterDemographicsFormSection } from './components/VoterDemographicsFormSection';
import { VoterIdentificationFormSection } from './components/VoterIdentificationFormSection';

type FormSectionTab = 'all' | 'identification' | 'electoral' | 'political' | 'demographics';

export const AddEditVoterScreen: React.FC<any> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { theme } = useAppTheme();
  const dispatch = useDispatch<any>();
  const scrollViewRef = useRef<any>(null);
  const existingVoter = route?.params?.voter;
  const isEditing = Boolean(existingVoter);
  const [activeTab, setActiveTab] = useState<FormSectionTab>('all');
  const user = useSelector((state: RootState) => (state.auth as any)?.user);
  const access = useSelector((state: RootState) => (state.auth as any)?.access);

  // Volunteer permission checks
  const canEditInclination = hasVoterPermission(access, 'canEditInclination');
  const canCreateVoter = !isEditing && hasVoterPermission(access, 'canCreateVoter');
  const canEditContact = !isEditing || hasVoterPermission(access, 'canEditContact');
  const canManageFamily = !isEditing || hasVoterPermission(access, 'canManageFamily');
  const canEditVoterStatus = !isEditing || hasVoterPermission(access, 'canEditVoterStatus');
  const canEditDemographics = !isEditing || hasVoterPermission(access, 'canEditDemographics');

  // Master data from Redux store
  const { states, districts, pcs, acs, booths, parties, religions, castes, talukas, villages } = useSelector((state: RootState) => state.master);

  // Form State with all 44 canonical fields matching Web
  const [formData, setFormData] = useState<any>({
    epicNo: existingVoter?.epicNo || '',
    boothId: existingVoter?.boothId ? String(existingVoter.boothId) : '',
    stateId: existingVoter?.stateId ? String(existingVoter.stateId) : '',
    districtId: existingVoter?.districtId ? String(existingVoter.districtId) : '',
    pcId: existingVoter?.pcId ? String(existingVoter.pcId) : '',
    acId: existingVoter?.acId ? String(existingVoter.acId) : '',
    serialNo: existingVoter?.serialNo ? String(existingVoter.serialNo) : '',
    sectionNo: existingVoter?.sectionNo ? String(existingVoter.sectionNo) : '',
    houseNo: existingVoter?.houseNo || '',
    engFirstName: existingVoter?.engFirstName || existingVoter?.name || '',
    engMiddleName: existingVoter?.engMiddleName || '',
    engSurname: existingVoter?.engSurname || '',
    firstName: existingVoter?.firstName || existingVoter?.hindiName || '',
    middleName: existingVoter?.middleName || '',
    surname: existingVoter?.surname || '',
    guardianName: existingVoter?.guardianName || existingVoter?.relativeName || '',
    relativeName: existingVoter?.relativeName || existingVoter?.guardianName || '',
    relation: existingVoter?.relation || '',
    gender: existingVoter?.gender || 'Male',
    dob: typeof existingVoter?.dob === 'string' ? existingVoter.dob.split('T')[0] : '',
    age: existingVoter?.age ? String(existingVoter.age) : '',
    mobileNo: existingVoter?.mobileNo || existingVoter?.mobile || '',
    mobile: existingVoter?.mobileNo || existingVoter?.mobile || '',
    email: existingVoter?.email || '',
    aadhaarNo: existingVoter?.aadhaarNo || '',
    panNo: existingVoter?.panNo || '',
    professionType: existingVoter?.professionType || '',
    profession: existingVoter?.profession || '',
    religionId: existingVoter?.religionId ? String(existingVoter.religionId) : '',
    religionName: existingVoter?.religionName || '',
    casteId: existingVoter?.casteId ? String(existingVoter.casteId) : '',
    casteName: existingVoter?.casteName || '',
    subcasteName: existingVoter?.subcasteName || '',
    voterType: existingVoter?.voterType || existingVoter?.supportingParty || 'Voter',
    status: existingVoter?.status || 'ACTIVE',
    isDead: Boolean(existingVoter?.isDead),
    bloodGroup: existingVoter?.bloodGroup || '',
    avatar: existingVoter?.avatar || existingVoter?.image || '',
    taluka: existingVoter?.taluka || '',
    village: existingVoter?.village || '',
    fullAddress: existingVoter?.fullAddress || existingVoter?.address || '',
    voterAddress: existingVoter?.voterAddress || '',
    partyId: existingVoter?.partyId ? String(existingVoter.partyId) : '',
    familyInfluencerId: existingVoter?.familyInfluencerId ? String(existingVoter.familyInfluencerId) : '',
    socialInfluencerId: existingVoter?.socialInfluencerId ? String(existingVoter.socialInfluencerId) : '',
    isFamilyInfluencer: Boolean(existingVoter?.isFamilyInfluencer || existingVoter?.isFamilyHead),
    isSocialInfluencer: Boolean(existingVoter?.isSocialInfluencer),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAddress, setSameAddress] = useState<boolean>(
    Boolean(
      existingVoter?.fullAddress &&
      existingVoter?.fullAddress === existingVoter?.voterAddress
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  const [familyInfluencers, setFamilyInfluencers] = useState<any[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<any[]>([]);
  const [voterMeta, setVoterMeta] = useState<any>(existingVoter || null);

  // 1. Initial Master Data Hydration on Screen Mount
  useEffect(() => {
    dispatch(fetchMasterStatesAction());
    dispatch(fetchMasterDistrictsAction());
    dispatch(fetchMasterPcsAction());
    dispatch(fetchMasterAcsAction());
    dispatch(fetchMasterPartiesAction());
    dispatch(fetchMasterReligionsAction());
    dispatch(fetchMasterCastesAction());
    dispatch(fetchMasterTalukasAction());
    dispatch(fetchMasterVillagesAction());

    // If editing, fetch complete profile from backend
    if (isEditing && existingVoter?.id) {
      dispatch(fetchVoterByIdAction(existingVoter.id))
        .then((freshVoter: any) => {
          if (freshVoter) {
            setVoterMeta(freshVoter);
            setFormData((prev: any) => ({
              ...prev,
              ...freshVoter,
              boothId: freshVoter.boothId ? String(freshVoter.boothId) : prev.boothId,
              stateId: freshVoter.stateId ? String(freshVoter.stateId) : prev.stateId,
              districtId: freshVoter.districtId ? String(freshVoter.districtId) : prev.districtId,
              pcId: freshVoter.pcId ? String(freshVoter.pcId) : prev.pcId,
              acId: freshVoter.acId ? String(freshVoter.acId) : prev.acId,
              partyId: freshVoter.partyId ? String(freshVoter.partyId) : prev.partyId,
              religionId: freshVoter.religionId ? String(freshVoter.religionId) : prev.religionId,
              casteId: freshVoter.casteId ? String(freshVoter.casteId) : prev.casteId,
              familyInfluencerId: freshVoter.familyInfluencerId ? String(freshVoter.familyInfluencerId) : '',
              socialInfluencerId: freshVoter.socialInfluencerId ? String(freshVoter.socialInfluencerId) : '',
              dob: typeof freshVoter.dob === 'string' ? freshVoter.dob.split('T')[0] : prev.dob,
              age: freshVoter.age ? String(freshVoter.age) : prev.age,
            }));
            if (freshVoter.fullAddress && freshVoter.fullAddress === freshVoter.voterAddress) {
              setSameAddress(true);
            }
          }
        })
        .catch(() => { });
    } else {
      // If adding new voter, pre-scope to volunteer's assigned jurisdiction if restricted
      if (user?.assignedBoothIds && user.assignedBoothIds.length > 0) {
        setFormData((prev: any) => ({ ...prev, boothId: String(user.assignedBoothIds[0]) }));
      }
      if (user?.assignedAcId) {
        setFormData((prev: any) => ({ ...prev, acId: String(user.assignedAcId) }));
      }
      if (user?.assignedPcId) {
        setFormData((prev: any) => ({ ...prev, pcId: String(user.assignedPcId) }));
      }
    }
  }, [dispatch, isEditing, existingVoter?.id]);

  // 2. Fetch Booth Options when acId changes
  useEffect(() => {
    if (formData.acId) {
      dispatch(fetchMasterBoothsAction(formData.acId));
    }
  }, [dispatch, formData.acId]);

  // 3. Fetch Influencer Options when boothId changes
  useEffect(() => {
    if (!formData.boothId) {
      setFamilyInfluencers([]);
      setSocialInfluencers([]);
      return;
    }

    setLoadingInfluencers(true);
    Promise.allSettled([
      dispatch(
        fetchMasterInfluencerOptionsAction({
          boothId: formData.boothId,
          excludeId: existingVoter?.id,
          type: 'family',
        })
      ),
      dispatch(
        fetchMasterInfluencerOptionsAction({
          boothId: formData.boothId,
          excludeId: existingVoter?.id,
          type: 'social',
        })
      ),
    ])
      .then(([famRes, socRes]: [any, any]) => {
        if (famRes.status === 'fulfilled') {
          setFamilyInfluencers(famRes.value || []);
        }
        if (socRes.status === 'fulfilled') {
          setSocialInfluencers(socRes.value || []);
        }
      })
      .finally(() => {
        setLoadingInfluencers(false);
      });
  }, [dispatch, formData.boothId, existingVoter?.id]);

  // Cascading Dropdown Options
  const stateOptions: DropdownOption[] = useMemo(() => {
    return (states || []).map((s) => ({
      id: String(s.id),
      label: s.name,
    }));
  }, [states]);

  const districtOptions: DropdownOption[] = useMemo(() => {
    return (districts || [])
      .filter((d) => !formData.stateId || String(d.stateId) === String(formData.stateId))
      .map((d) => ({
        id: String(d.id),
        label: d.name,
      }));
  }, [districts, formData.stateId]);

  const pcOptions: DropdownOption[] = useMemo(() => {
    return (pcs || [])
      .filter((p) => !formData.stateId || String(p.stateId) === String(formData.stateId))
      .map((p) => ({
        id: String(p.id),
        label: `${p.pcNumber ? `[PC-${p.pcNumber}] ` : ''}${p.name}`,
      }));
  }, [pcs, formData.stateId]);

  const acOptions: DropdownOption[] = useMemo(() => {
    return (acs || [])
      .filter((a) => {
        if (formData.acId && String(a.id) === String(formData.acId)) return true;
        if (formData.pcId && a.pcId && String(a.pcId) !== String(formData.pcId)) return false;
        if (formData.districtId && a.districtId && String(a.districtId) !== String(formData.districtId)) return false;
        if (formData.stateId && a.stateId && String(a.stateId) !== String(formData.stateId)) return false;
        return true;
      })
      .map((a) => ({
        id: String(a.id),
        label: `${a.acNumber ? `[AC-${a.acNumber}] ` : ''}${a.name}`,
      }));
  }, [acs, formData.acId, formData.pcId, formData.districtId, formData.stateId]);

  const boothOptions: DropdownOption[] = useMemo(() => {
    return (booths || []).map((b) => ({
      id: String(b.id),
      label: `Booth #${b.boothNumber ?? b.id} - ${b.name}`,
    }));
  }, [booths]);

  const partyOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { id: '', label: t('undecidedIndependent') || 'None / Independent / Undecided' },
    ];
    (parties || []).forEach((p) => {
      list.push({
        id: String(p.id),
        label: `${p.abbreviation ? `${p.abbreviation} - ` : ''}${p.name}`,
      });
    });
    return list;
  }, [parties, t]);

  const religionOptions: DropdownOption[] = useMemo(() => {
    return (religions || []).map((r) => ({
      id: String(r.id),
      label: r.name,
    }));
  }, [religions]);

  const casteOptions: DropdownOption[] = useMemo(() => {
    return (castes || []).map((c) => ({
      id: String(c.id),
      label: c.name,
      religionId: c.religionId,
    }));
  }, [castes]);

  // Autocomplete suggestion lists matching web pattern
  const talukaSuggestions = useMemo(() => {
    if (!formData.districtId) {
      return Array.from(new Set((talukas || []).map((t: any) => t.name).filter(Boolean)));
    }
    const districtMatches = (talukas || [])
      .filter((t: any) => t.districtId === formData.districtId)
      .map((t: any) => t.name);
    const others = (talukas || [])
      .filter((t: any) => t.districtId !== formData.districtId)
      .map((t: any) => t.name);
    return Array.from(new Set([...districtMatches, ...others].filter(Boolean)));
  }, [talukas, formData.districtId]);

  const villageSuggestions = useMemo(() => {
    if (!formData.districtId) {
      return Array.from(new Set((villages || []).map((v: any) => v.name).filter(Boolean)));
    }
    const districtMatches = (villages || [])
      .filter((v: any) => v.districtId === formData.districtId)
      .map((v: any) => v.name);
    const others = (villages || [])
      .filter((v: any) => v.districtId !== formData.districtId)
      .map((v: any) => v.name);
    return Array.from(new Set([...districtMatches, ...others].filter(Boolean)));
  }, [villages, formData.districtId]);

  const subcasteSuggestions = useMemo(() => {
    const subcastes = (castes || []).filter((c: any) => Boolean(c.parentCasteId));
    if (!formData.casteId && !formData.casteName) {
      return Array.from(new Set(subcastes.map((c: any) => c.name).filter(Boolean)));
    }
    const targetCasteId = formData.casteId;
    const casteMatches = subcastes
      .filter((c: any) => targetCasteId && String(c.parentCasteId) === String(targetCasteId))
      .map((c: any) => c.name);
    const others = subcastes
      .filter((c: any) => !targetCasteId || String(c.parentCasteId) !== String(targetCasteId))
      .map((c: any) => c.name);
    return Array.from(new Set([...casteMatches, ...others].filter(Boolean)));
  }, [castes, formData.casteId, formData.casteName]);

  const familyInfluencerOptions: DropdownOption[] = useMemo(() => {
    return (familyInfluencers || []).map((inf: any) => {
      const name =
        [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
        inf.engName ||
        inf.name ||
        inf.epicNo;
      return {
        id: String(inf.id),
        label: `${name} (${inf.epicNo})${inf.houseNo ? ` - H.No: ${inf.houseNo}` : ''}`,
      };
    });
  }, [familyInfluencers]);

  const socialInfluencerOptions: DropdownOption[] = useMemo(() => {
    return (socialInfluencers || []).map((inf: any) => {
      const name =
        [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
        inf.engName ||
        inf.name ||
        inf.epicNo;
      return {
        id: String(inf.id),
        label: `${name} (${inf.epicNo})${inf.houseNo ? ` - H.No: ${inf.houseNo}` : ''}`,
      };
    });
  }, [socialInfluencers]);

  // Section Error Indicators for Quick Section Navigation
  const sectionErrors = useMemo(
    () => ({
      identification: Boolean(errors.epicNo || errors.engFirstName),
      electoral: Boolean(errors.boothId),
      political: false,
      demographics: Boolean(errors.mobileNo || errors.email),
    }),
    [errors]
  );

  const tabs: { key: FormSectionTab; label: string; icon: string; hasError?: boolean }[] = useMemo(
    () => [
      { key: 'all', label: t('allSections') || 'All Sections', icon: 'format-list-bulleted' },
      {
        key: 'identification',
        label: t('identificationTitle') || 'Identity & Status',
        icon: 'card-account-details-outline',
        hasError: sectionErrors.identification,
      },
      {
        key: 'electoral',
        label: t('electoral') || 'Electoral Geography',
        icon: 'map-marker-radius-outline',
        hasError: sectionErrors.electoral,
      },
      {
        key: 'political',
        label: t('political') || 'Party & Influencer',
        icon: 'account-group-outline',
        hasError: sectionErrors.political,
      },
      {
        key: 'demographics',
        label: t('demographicsTitle') || 'Contact & Demographics',
        icon: 'account-details-outline',
        hasError: sectionErrors.demographics,
      },
    ],
    [t, sectionErrors]
  );

  const sectionSequence: FormSectionTab[] = ['identification', 'electoral', 'political', 'demographics'];
  const currentSectionIndex = sectionSequence.indexOf(activeTab);

  const handleNextSection = () => {
    if (currentSectionIndex >= 0 && currentSectionIndex < sectionSequence.length - 1) {
      const nextTab = sectionSequence[currentSectionIndex + 1];
      setActiveTab(nextTab);
      scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevTab = sectionSequence[currentSectionIndex - 1];
      setActiveTab(prevTab);
      scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
    }
  };

  // Validation Logic strictly identical to Web
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.epicNo || !formData.epicNo.trim()) {
      newErrors.epicNo = t('epicRequired') || 'EPIC Voter ID is required';
    }
    if (!formData.engFirstName || !formData.engFirstName.trim()) {
      newErrors.engFirstName = t('firstNameRequired') || 'First Name (English) is required';
    }
    if (!formData.boothId) {
      newErrors.boothId = t('boothRequired') || 'Polling Booth is required';
    }
    if (formData.mobileNo && !/^[0-9]{10}$/.test(formData.mobileNo.replace(/[\s-]/g, ''))) {
      newErrors.mobileNo = t('invalidMobile') || 'Please enter a valid 10-digit mobile number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('invalidEmail') || 'Please enter a valid email address';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Auto-switch to the section containing the first error
      if (newErrors.epicNo || newErrors.engFirstName) {
        if (activeTab !== 'all') setActiveTab('identification');
      } else if (newErrors.boothId) {
        if (activeTab !== 'all') setActiveTab('electoral');
      } else if (newErrors.mobileNo || newErrors.email) {
        if (activeTab !== 'all') setActiveTab('demographics');
      }
      scrollViewRef.current?.scrollTo?.({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleSave = async () => {
    if (!isEditing && !canCreateVoter && access?.role === 'volunteer') {
      toast.error(t('volunteerRegisterNotAllowed') || 'Your volunteer role is not allowed to register new voters.');
      return;
    }

    if (!validateForm()) {
      toast.error(t('fixValidationErrors') || 'Please fix validation errors before saving');
      return;
    }

    setSubmitting(true);

    const payload = {
      ...(isEditing ? { id: existingVoter.id } : {}),
      epicNo: formData.epicNo.toUpperCase().trim(),
      engFirstName: formData.engFirstName.trim(),
      engMiddleName: formData.engMiddleName?.trim() || null,
      engSurname: formData.engSurname?.trim() || null,
      firstName: formData.firstName?.trim() || null,
      middleName: formData.middleName?.trim() || null,
      surname: formData.surname?.trim() || null,
      guardianName: formData.guardianName?.trim() || formData.relativeName?.trim() || null,
      relativeName: formData.relativeName?.trim() || formData.guardianName?.trim() || null,
      relation: formData.relation || null,
      gender: formData.gender,
      dob: formData.dob || null,
      age: formData.age ? Number(formData.age) : null,
      bloodGroup: formData.bloodGroup?.trim() || null,
      status: formData.status,
      isDead: Boolean(formData.isDead),
      voterType: formData.voterType,
      avatar: formData.avatar || null,

      // Geography
      stateId: formData.stateId || null,
      districtId: formData.districtId || null,
      pcId: formData.pcId || null,
      acId: formData.acId || null,
      boothId: formData.boothId || null,
      serialNo: formData.serialNo ? Number(formData.serialNo) : null,
      sectionNo: formData.sectionNo ? Number(formData.sectionNo) : null,
      houseNo: formData.houseNo?.trim() || null,
      village: formData.village?.trim() || null,
      taluka: formData.taluka?.trim() || null,
      fullAddress: formData.fullAddress?.trim() || null,
      voterAddress: formData.voterAddress?.trim() || null,

      // Party & Influencers
      partyId: formData.partyId || null,
      isFamilyInfluencer: Boolean(formData.isFamilyInfluencer),
      isSocialInfluencer: Boolean(formData.isSocialInfluencer),
      familyInfluencerId: formData.isFamilyInfluencer ? null : (formData.familyInfluencerId || null),
      socialInfluencerId: formData.socialInfluencerId || null,

      // Contact & Demographics
      mobileNo: formData.mobileNo?.trim() || null,
      email: formData.email?.trim() || null,
      aadhaarNo: formData.aadhaarNo?.trim() || null,
      panNo: formData.panNo?.trim() || null,
      religionId: formData.religionId || null,
      religionName: formData.religionName?.trim() || null,
      casteId: formData.casteId || null,
      casteName: formData.casteName?.trim() || null,
      subcasteName: formData.subcasteName?.trim() || null,
      professionType: formData.professionType?.trim() || null,
      profession: formData.profession?.trim() || null,
    };

    try {
      if (isEditing) {
        await dispatch(
          updateVoterAction(payload, () => {
            navigation.goBack();
          })
        );
      } else {
        await dispatch(
          addVoterAction(payload, () => {
            navigation.goBack();
          })
        );
      }
    } catch (e) {
      console.error('Error saving voter:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        showBack={true}
        variant="primary"
        statusBar="hidden"
        onBack={() => navigation.goBack()}
        title={isEditing ? t('editVoterDetails') || 'Edit Voter Details' : t('registerNewVoter') || 'Register New Voter'}
        rightElement={
          <TouchableOpacity
            style={styles.headerSaveButton}
            onPress={handleSave}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialDesignIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.headerSaveText}>{t('save') || 'Save'}</Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      {/* Quick Section Navigator Bar */}
      <VoterSectionTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(tabKey) => {
          setActiveTab(tabKey);
          scrollViewRef.current?.scrollTo?.({ y: 0, animated: false });
        }}
      />

      <ScrollView
        isKeyboardAware
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Identification & Profile Status */}
        {(activeTab === 'all' || activeTab === 'identification') && (
          <VoterIdentificationFormSection
            t={t}
            theme={theme}
            errors={errors}
            formData={formData}
            setFormData={setFormData}
            canEditVoterStatus={canEditVoterStatus}
            canEditInclination={canEditInclination}
            canEditDemographics={canEditDemographics}
          />
        )}

        {/* Section 2: Electoral Geography & Addresses */}
        {(activeTab === 'all' || activeTab === 'electoral') && (
          <VoterGeographyFormSection
            t={t}
            theme={theme}
            errors={errors}
            formData={formData}
            pcOptions={pcOptions}
            acOptions={acOptions}
            setFormData={setFormData}
            sameAddress={sameAddress}
            stateOptions={stateOptions}
            boothOptions={boothOptions}
            setSameAddress={setSameAddress}
            canEditContact={canEditContact}
            districtOptions={districtOptions}
            talukaSuggestions={talukaSuggestions}
            villageSuggestions={villageSuggestions}
          />
        )}

        {/* Section 3: Party Affiliation & Influencer Networks */}
        {(activeTab === 'all' || activeTab === 'political') && (
          <VoterInfluencerFormSection
            t={t}
            theme={theme}
            formData={formData}
            voterMeta={voterMeta}
            isEditMode={isEditing}
            setFormData={setFormData}
            partyOptions={partyOptions}
            canManageFamily={canManageFamily}
            canEditInclination={canEditInclination}
            loadingInfluencers={loadingInfluencers}
            familyInfluencerOptions={familyInfluencerOptions}
            socialInfluencerOptions={socialInfluencerOptions}
          />
        )}

        {/* Section 4: Contact & Demographics */}
        {(activeTab === 'all' || activeTab === 'demographics') && (
          <VoterDemographicsFormSection
            formData={formData}
            errors={errors}
            setFormData={setFormData}
            t={t}
            theme={theme}
            casteOptions={casteOptions}
            canEditContact={canEditContact}
            religionOptions={religionOptions}
            canEditDemographics={canEditDemographics}
            subcasteSuggestions={subcasteSuggestions}
          />
        )}

        {/* Bottom Actions */}
        {activeTab === 'all' ? (
          <View style={styles.bottomActions}>
            <Button
              title={t('cancel') || 'Cancel'}
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelBtn}
              disabled={submitting}
            />
            <Button
              title={
                submitting
                  ? t('saving') || 'Saving...'
                  : isEditing
                    ? t('updateProfile') || 'Update Profile'
                    : t('saveVoter') || 'Save Voter'
              }
              variant="primary"
              onPress={handleSave}
              loading={submitting}
              style={styles.submitBtn}
            />
          </View>
        ) : (
          <View style={styles.bottomActions}>
            <Button
              title={
                currentSectionIndex === 0
                  ? t('allSections') || 'All Sections'
                  : t('previousSection') || 'Previous Section'
              }
              variant="outline"
              onPress={currentSectionIndex === 0 ? () => setActiveTab('all') : handlePrevSection}
              style={styles.cancelBtn}
              disabled={submitting}
            />
            <Button
              title={
                currentSectionIndex < sectionSequence.length - 1
                  ? t('nextSection') || 'Next Section'
                  : submitting
                    ? t('saving') || 'Saving...'
                    : isEditing
                      ? t('updateProfile') || 'Update Profile'
                      : t('saveVoter') || 'Save Voter'
              }
              variant="primary"
              onPress={
                currentSectionIndex < sectionSequence.length - 1
                  ? handleNextSection
                  : handleSave
              }
              loading={submitting && currentSectionIndex === sectionSequence.length - 1}
              style={styles.submitBtn}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: rfValue(12),
    fontFamily: FontFamily.bodyBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 2,
  },
});

export default AddEditVoterScreen;


