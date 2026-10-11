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
import { InfluencerMemberAssignModal } from './components/InfluencerMemberAssignModal';
import { VoterDemographicsFormSection } from './components/VoterDemographicsFormSection';
import { VoterIdentificationFormSection } from './components/VoterIdentificationFormSection';

type FormSectionTab = 'all' | 'identification' | 'electoral' | 'political' | 'demographics';

const calculateAge = (dobString?: string | null): number | null => {
  if (!dobString) return null;
  const parts = dobString.split('-');
  if (parts.length < 3) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

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

  const initialAc = existingVoter?.acId && acs?.length ? acs.find((a: any) => String(a.id) === String(existingVoter.acId)) : undefined;

  // Form State with all 44 canonical fields matching Web
  const [formData, setFormData] = useState<any>({
    epicNo: existingVoter?.epicNo || '',
    boothId: existingVoter?.boothId ? String(existingVoter.boothId) : '',
    stateId: existingVoter?.stateId ? String(existingVoter.stateId) : (initialAc?.stateId ? String(initialAc.stateId) : ''),
    districtId: existingVoter?.districtId ? String(existingVoter.districtId) : (initialAc?.districtId ? String(initialAc.districtId) : ''),
    pcId: existingVoter?.pcId ? String(existingVoter.pcId) : (initialAc?.pcId ? String(initialAc.pcId) : ''),
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
    age: existingVoter?.age
      ? String(existingVoter.age)
      : (typeof existingVoter?.dob === 'string'
        ? calculateAge(existingVoter.dob.split('T')[0])?.toString() || ''
        : ''),
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
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'family' | 'social'>('family');

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
            const loadedBoothId = freshVoter.boothId ? String(freshVoter.boothId) : '';
            let resolvedAcId = freshVoter.acId ? String(freshVoter.acId) : '';
            let resolvedPcId = freshVoter.pcId ? String(freshVoter.pcId) : '';
            let resolvedDistrictId = freshVoter.districtId ? String(freshVoter.districtId) : '';
            let resolvedStateId = freshVoter.stateId ? String(freshVoter.stateId) : '';

            if (resolvedAcId && acs?.length) {
              const a = acs.find((ac: any) => String(ac.id) === resolvedAcId);
              if (a) {
                if (!resolvedPcId && a.pcId) resolvedPcId = String(a.pcId);
                if (!resolvedDistrictId && a.districtId) resolvedDistrictId = String(a.districtId);
                if (!resolvedStateId && a.stateId) resolvedStateId = String(a.stateId);
              }
            }

            setFormData((prev: any) => ({
              ...prev,
              ...freshVoter,
              boothId: loadedBoothId || prev.boothId,
              stateId: resolvedStateId || prev.stateId,
              districtId: resolvedDistrictId || prev.districtId,
              pcId: resolvedPcId || prev.pcId,
              acId: resolvedAcId || prev.acId,
              partyId: freshVoter.partyId ? String(freshVoter.partyId) : prev.partyId,
              religionId: freshVoter.religionId ? String(freshVoter.religionId) : prev.religionId,
              casteId: freshVoter.casteId ? String(freshVoter.casteId) : prev.casteId,
              familyInfluencerId: freshVoter.familyInfluencerId ? String(freshVoter.familyInfluencerId) : '',
              socialInfluencerId: freshVoter.socialInfluencerId ? String(freshVoter.socialInfluencerId) : '',
              guardianName: freshVoter.guardianName || freshVoter.relativeName || prev.guardianName,
              relativeName: freshVoter.relativeName || freshVoter.guardianName || prev.relativeName,
              relation: freshVoter.relation || prev.relation,
              dob: typeof freshVoter.dob === 'string' ? freshVoter.dob.split('T')[0] : prev.dob,
              age: freshVoter.age
                ? String(freshVoter.age)
                : (typeof freshVoter.dob === 'string'
                  ? calculateAge(freshVoter.dob.split('T')[0])?.toString() || prev.age
                  : prev.age),
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

  // 2. Auto-resolve missing State, District, and PC from AC when AC master data is loaded or acId changes
  useEffect(() => {
    if (formData.acId && acs && acs.length > 0) {
      const matchedAc = acs.find((a: any) => String(a.id) === String(formData.acId));
      if (matchedAc) {
        setFormData((prev: any) => {
          let updatedStateId = prev.stateId;
          let updatedDistrictId = prev.districtId;
          let updatedPcId = prev.pcId;
          let changed = false;

          if (!updatedStateId && matchedAc.stateId) {
            updatedStateId = String(matchedAc.stateId);
            changed = true;
          }
          if (!updatedDistrictId && matchedAc.districtId) {
            updatedDistrictId = String(matchedAc.districtId);
            changed = true;
          }
          if (!updatedPcId && matchedAc.pcId) {
            updatedPcId = String(matchedAc.pcId);
            changed = true;
          }

          if (changed) {
            return {
              ...prev,
              stateId: updatedStateId,
              districtId: updatedDistrictId,
              pcId: updatedPcId,
            };
          }
          return prev;
        });
      }
    }
  }, [acs, formData.acId]);

  // 3. Fetch Booth Options when acId changes
  useEffect(() => {
    if (formData.acId) {
      dispatch(fetchMasterBoothsAction(formData.acId));
    }
  }, [dispatch, formData.acId]);

  // 4. Fetch Influencer Options when boothId changes
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
    const list = (states || []).map((s) => ({
      id: String(s.id),
      label: s.name,
    }));
    if (formData.stateId && !list.some((o) => String(o.id) === String(formData.stateId))) {
      const name = existingVoter?.stateName || voterMeta?.stateName;
      if (name) {
        list.unshift({ id: String(formData.stateId), label: name });
      }
    }
    return list;
  }, [states, formData.stateId, existingVoter, voterMeta]);

  const districtOptions: DropdownOption[] = useMemo(() => {
    const list = (districts || [])
      .filter((d) => {
        if (formData.districtId && String(d.id) === String(formData.districtId)) return true;
        return !formData.stateId || String(d.stateId) === String(formData.stateId);
      })
      .map((d) => ({
        id: String(d.id),
        label: d.name,
      }));

    if (formData.districtId && !list.some((o) => String(o.id) === String(formData.districtId))) {
      const name = existingVoter?.districtName || voterMeta?.districtName;
      if (name) {
        list.unshift({ id: String(formData.districtId), label: name });
      }
    }
    return list;
  }, [districts, formData.stateId, formData.districtId, existingVoter, voterMeta]);

  const pcOptions: DropdownOption[] = useMemo(() => {
    const list = (pcs || [])
      .filter((p) => {
        if (formData.pcId && String(p.id) === String(formData.pcId)) return true;
        return !formData.stateId || String(p.stateId) === String(formData.stateId);
      })
      .map((p) => ({
        id: String(p.id),
        label: `${p.pcNumber ? `[PC-${p.pcNumber}] ` : ''}${p.name}`,
      }));

    if (formData.pcId && !list.some((o) => String(o.id) === String(formData.pcId))) {
      const name = existingVoter?.pcName || voterMeta?.pcName;
      if (name) {
        list.unshift({ id: String(formData.pcId), label: name });
      }
    }
    return list;
  }, [pcs, formData.stateId, formData.pcId, existingVoter, voterMeta]);

  const acOptions: DropdownOption[] = useMemo(() => {
    const list = (acs || [])
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

    if (formData.acId && !list.some((o) => String(o.id) === String(formData.acId))) {
      const name = existingVoter?.acName || voterMeta?.acName;
      if (name) {
        list.unshift({ id: String(formData.acId), label: name });
      }
    }
    return list;
  }, [acs, formData.acId, formData.pcId, formData.districtId, formData.stateId, existingVoter, voterMeta]);

  const boothOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = (booths || [])
      .filter((b) => !formData.acId || !b.acId || String(b.acId) === String(formData.acId))
      .map((b) => ({
        id: String(b.id),
        label: `Booth #${b.boothNumber ?? b.id} - ${b.name}`,
      }));

    if (formData.boothId && !list.some((o) => String(o.id) === String(formData.boothId))) {
      const bName = existingVoter?.boothName || voterMeta?.boothName;
      const bNum = existingVoter?.boothNumber ?? voterMeta?.boothNumber;
      const fallbackLabel = bName
        ? (bNum !== undefined && bNum !== null ? `Booth #${bNum} - ${bName}` : bName)
        : (bNum !== undefined && bNum !== null ? `Booth #${bNum}` : `Booth #${formData.boothId}`);
      list.unshift({
        id: String(formData.boothId),
        label: fallbackLabel,
      });
    }

    return list;
  }, [booths, formData.acId, formData.boothId, existingVoter, voterMeta]);

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
    if (formData.partyId && !list.some((o) => String(o.id) === String(formData.partyId))) {
      const name = existingVoter?.partyName || voterMeta?.partyName;
      if (name) {
        list.push({ id: String(formData.partyId), label: name });
      }
    }
    return list;
  }, [parties, formData.partyId, t, existingVoter, voterMeta]);

  const religionOptions: DropdownOption[] = useMemo(() => {
    const list = (religions || []).map((r) => ({
      id: String(r.id),
      label: r.name,
    }));
    if (formData.religionId && !list.some((o) => String(o.id) === String(formData.religionId))) {
      const name = existingVoter?.religionName || voterMeta?.religionName;
      if (name) {
        list.push({ id: String(formData.religionId), label: name });
      }
    }
    return list;
  }, [religions, formData.religionId, existingVoter, voterMeta]);

  const casteOptions: (DropdownOption & { religionId?: string })[] = useMemo(() => {
    const list: (DropdownOption & { religionId?: string })[] = (castes || []).map((c) => ({
      id: String(c.id),
      label: c.name,
      religionId: c.religionId ? String(c.religionId) : undefined,
    }));
    if (formData.casteId && !list.some((o) => String(o.id) === String(formData.casteId))) {
      const name = existingVoter?.casteName || voterMeta?.casteName;
      if (name) {
        list.push({
          id: String(formData.casteId),
          label: name,
          religionId: formData.religionId ? String(formData.religionId) : undefined,
        });
      }
    }
    return list;
  }, [castes, formData.casteId, formData.religionId, existingVoter, voterMeta]);

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
    const list = (familyInfluencers || []).map((inf: any) => {
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
    if (
      formData.familyInfluencerId &&
      !list.some((item) => String(item.id) === String(formData.familyInfluencerId))
    ) {
      const fallbackName =
        voterMeta?.familyInfluencerName || `Family Head #${formData.familyInfluencerId}`;
      list.unshift({
        id: String(formData.familyInfluencerId),
        label: fallbackName,
      });
    }
    return list;
  }, [familyInfluencers, formData.familyInfluencerId, voterMeta?.familyInfluencerName]);

  const socialInfluencerOptions: DropdownOption[] = useMemo(() => {
    const list = (socialInfluencers || []).map((inf: any) => {
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
    if (
      formData.socialInfluencerId &&
      !list.some((item) => String(item.id) === String(formData.socialInfluencerId))
    ) {
      const fallbackName =
        voterMeta?.socialInfluencerName || `Social Leader #${formData.socialInfluencerId}`;
      list.unshift({
        id: String(formData.socialInfluencerId),
        label: fallbackName,
      });
    }
    return list;
  }, [socialInfluencers, formData.socialInfluencerId, voterMeta?.socialInfluencerName]);

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
            rawAcs={acs}
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
            onOpenAssignModal={(type) => {
              setAssignModalType(type);
              setAssignModalOpen(true);
            }}
          />
        )}

        {/* Section 4: Contact & Demographics */}
        {(activeTab === 'all' || activeTab === 'demographics') && (
          <VoterDemographicsFormSection
            t={t}
            theme={theme}
            errors={errors}
            formData={formData}
            setFormData={setFormData}
            casteOptions={casteOptions}
            canEditContact={canEditContact}
            religionOptions={religionOptions}
            canEditDemographics={canEditDemographics}
            subcasteSuggestions={subcasteSuggestions}
            rawCastes={castes}
            rawReligions={religions}
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

      {/* Dedicated Influencer Member Assignment Modal */}
      {isEditing && voterMeta && assignModalOpen && (
        <InfluencerMemberAssignModal
          visible={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          type={assignModalType}
          influencer={{
            id: voterMeta.id,
            name:
              [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') ||
              voterMeta.engName ||
              voterMeta.name ||
              voterMeta.epicNo ||
              'Influencer',
            epicNo: voterMeta.epicNo,
            boothId: voterMeta.boothId || formData.boothId,
            boothName: voterMeta.boothName,
            houseNo: voterMeta.houseNo || formData.houseNo,
            avatar: voterMeta.avatar,
            memberCount:
              assignModalType === 'family'
                ? voterMeta.familyInfluencedCount
                : voterMeta.socialInfluencedCount,
          }}
          onSuccess={() => {
            if (existingVoter?.id) {
              dispatch(fetchVoterByIdAction(existingVoter.id)).then((data: any) => {
                if (data) {
                  setVoterMeta(data);
                }
              });
            }
          }}
        />
      )}
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


