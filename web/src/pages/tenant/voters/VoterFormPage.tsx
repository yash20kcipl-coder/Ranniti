import {
  fetchTenantVoterById as fetchVoterById,
  createTenantVoterItem as createVoterItem,
  updateTenantVoterItem as updateVoterItem,
  fetchTenantInfluencerOptions as fetchInfluencerOptions,
  fetchTenantBoothOptions,
} from '@/redux/actions/voterTenant';
import {
  FORM_GENDER_OPTIONS,
  FORM_VOTER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from '@/constants/dropdownOptions';
import { calculateAge } from '@/utils';
import { useAppDispatch } from '@/redux/hooks';
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchTenantMasterCategoryData } from '@/redux/actions/masterTenant';
import { useTenantMasterData, TENANT_MASTER_ENDPOINTS } from '@/hooks/useTenantMasterData';

// Shared Standard Components
import type { Option } from '@/components/common/FormInput';
import { PageHeader } from '@/components/common/PageHeader';

// Section Components
import {
  VoterIdentificationFormSection,
  VoterGeographyFormSection,
  VoterInfluencerFormSection,
  VoterDemographicsFormSection,
} from '@/components/common/voter/form';

// Icons
import {
  Save,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  FamilyInfluencerAssignModal,
  SocialInfluencerAssignModal,
  LinkToInfluencerModal,
} from '@/components/common/influencer';


export const VoterFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const dispatch = useAppDispatch();
  // Load master categories excluding heavy booths
  const { religions, castes, acs, states, districts, pcs, parties } = useTenantMasterData([
    'states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties'
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Voter metadata (for influencer counts and linked info)
  const [voterMeta, setVoterMeta] = useState<any | null>(null);

  // Booth & Influencer options local state (isolated from List Page)
  const [boothOptions, setBoothOptions] = useState<Option[]>([]);
  const [familyInfluencers, setFamilyInfluencers] = useState<any[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<any[]>([]);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'family' | 'social'>('family');

  // Link modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [showSocialPicker, setShowSocialPicker] = useState(false);

  // Form Initial State
  const initialFormState = {
    epicNo: '',
    boothId: '',
    stateId: '',
    districtId: '',
    pcId: '',
    acId: '',
    serialNo: '',
    sectionNo: '',
    houseNo: '',
    engFirstName: '',
    engMiddleName: '',
    engSurname: '',
    firstName: '',
    middleName: '',
    surname: '',
    gender: 'Male',
    dob: '',
    age: '',
    mobileNo: '',
    email: '',
    aadhaarNo: '',
    panNo: '',
    professionType: '',
    profession: '',
    religionId: '',
    religionName: '',
    casteId: '',
    casteName: '',
    subcasteName: '',
    voterType: 'Voter',

    // Extended 11 Fields
    status: 'ACTIVE',
    isDead: false,
    bloodGroup: '',
    avatar: '' as File | string | null,
    taluka: '',
    village: '',
    fullAddress: '',
    voterAddress: '',
    partyId: '',
    familyInfluencerId: '',
    socialInfluencerId: '',
    isFamilyInfluencer: false,
    isSocialInfluencer: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing voter details if in Edit mode
  useDebouncedEffect(() => {
    if (isEditMode && id) {
      setLoadingVoter(true);
      dispatch(fetchVoterById(id))
        .then((voter) => {
          if (voter) {
            setVoterMeta(voter);
            const isFam = Boolean(voter.isFamilyInfluencer || Number(voter.familyInfluencedCount) > 0);
            const isSoc = Boolean(voter.isSocialInfluencer || Number(voter.socialInfluencedCount) > 0);

            const loadedBoothId = voter.boothId ? String(voter.boothId) : '';
            let resolvedAcId = voter.acId ? String(voter.acId) : '';
            let resolvedPcId = voter.pcId ? String(voter.pcId) : '';
            let resolvedDistrictId = voter.districtId ? String(voter.districtId) : '';
            let resolvedStateId = voter.stateId ? String(voter.stateId) : '';

            if (resolvedAcId && acs?.length) {
              const a = acs.find((ac: any) => String(ac.id) === resolvedAcId);
              if (a) {
                if (!resolvedPcId && a.pcId) resolvedPcId = String(a.pcId);
                if (!resolvedDistrictId && a.districtId) resolvedDistrictId = String(a.districtId);
                if (!resolvedStateId && a.stateId) resolvedStateId = String(a.stateId);
              }
            }

            setFormData({
              epicNo: voter.epicNo || '',
              boothId: loadedBoothId,
              stateId: resolvedStateId,
              districtId: resolvedDistrictId,
              pcId: resolvedPcId,
              acId: resolvedAcId,
              serialNo: voter.serialNo ? String(voter.serialNo) : '',
              sectionNo: voter.sectionNo ? String(voter.sectionNo) : '',
              houseNo: voter.houseNo || '',
              engFirstName: voter.engFirstName || '',
              engMiddleName: voter.engMiddleName || '',
              engSurname: voter.engSurname || '',
              firstName: voter.firstName || '',
              middleName: voter.middleName || '',
              surname: voter.surname || '',
              gender: voter.gender || 'Male',
              dob: typeof voter.dob === 'string' ? voter.dob.split('T')[0] : '',
              age: voter.age
                ? String(voter.age)
                : typeof voter.dob === 'string'
                  ? calculateAge(voter.dob.split('T')[0])?.toString() || ''
                  : '',
              mobileNo: voter.mobileNo || '',
              email: voter.email || '',
              aadhaarNo: voter.aadhaarNo || '',
              panNo: voter.panNo || '',
              professionType: voter.professionType || '',
              profession: voter.profession || '',
              religionId: voter.religionId ? String(voter.religionId) : '',
              religionName: voter.religionName || '',
              casteId: voter.casteId ? String(voter.casteId) : '',
              casteName: voter.casteName || '',
              subcasteName: voter.subcasteName || '',
              voterType: voter.voterType || 'Voter',

              status: voter.status || 'ACTIVE',
              isDead: Boolean(voter.isDead),
              bloodGroup: voter.bloodGroup || '',
              avatar: voter.avatar || '',
              taluka: voter.taluka || '',
              village: voter.village || '',
              fullAddress: voter.fullAddress || '',
              voterAddress: voter.voterAddress || '',
              partyId: voter.partyId ? String(voter.partyId) : '',
              familyInfluencerId: isFam ? '' : (voter.familyInfluencerId ? String(voter.familyInfluencerId) : ''),
              socialInfluencerId: voter.socialInfluencerId ? String(voter.socialInfluencerId) : '',
              isFamilyInfluencer: isFam,
              isSocialInfluencer: isSoc,
            });

            if (voter.fullAddress && voter.fullAddress === voter.voterAddress) {
              setSameAddress(true);
            }
          }
        })
        .catch(() => {
          setToastMessage({ type: 'error', text: 'Failed to load voter details' });
        })
        .finally(() => {
          setLoadingVoter(false);
        });
    }
  }, 150, [dispatch, id, isEditMode]);

  // Load booth options on-demand whenever acId changes (Create & Edit mode)
  useDebouncedEffect(
    () => {
      if (!formData.acId) {
        setBoothOptions([]);
        return;
      }
      dispatch(fetchTenantBoothOptions({ acId: formData.acId, saveToStore: false }))
        .then((options: any[]) => {
          setBoothOptions(
            (options || []).map((b) => ({
              label: `Booth #${b.boothNumber || b.boothNo || b.id} - ${b.name || b.boothName || 'Station'}`,
              value: String(b.id),
            }))
          );
        })
        .catch(() => {
          setBoothOptions([]);
        });
    },
    150,
    [dispatch, formData.acId]
  );

  // Load family and social influencer dropdown options debounced (Rule 9 + Rule 13)
  useDebouncedEffect(
    () => {
      if (!formData.boothId) {
        setFamilyInfluencers([]);
        setSocialInfluencers([]);
        return;
      }

      dispatch(
        fetchInfluencerOptions({
          boothId: formData.boothId,
          excludeId: id,
          type: 'family',
        })
      )
        .then((options: any[]) => {
          setFamilyInfluencers(options || []);
        })
        .catch(() => { });

      dispatch(
        fetchInfluencerOptions({
          boothId: formData.boothId,
          excludeId: id,
          type: 'social',
        })
      )
        .then((options: any[]) => {
          setSocialInfluencers(options || []);
        })
        .catch(() => { });
    },
    150,
    [dispatch, formData.boothId, id]
  );

  const handleChange = (e: any) => {
    const name = e.target.name;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    setFormData((prev) => {
      const updated: any = { ...prev, [name]: value };
      if (name === 'fullAddress' && sameAddress) {
        updated.voterAddress = value;
      }
      if (name === 'dob') {
        const computed = calculateAge(value);
        updated.age = computed !== null ? String(computed) : '';
      }
      if (name === 'familyInfluencerId' && value) {
        // If voter is linked under a family influencer, they cannot be a family influencer themselves
        updated.isFamilyInfluencer = false;
      }

      // Smart cascading resets
      if (name === 'stateId') {
        updated.districtId = '';
        updated.pcId = '';
        updated.acId = '';
        updated.boothId = '';
        updated.familyInfluencerId = '';
        updated.socialInfluencerId = '';
      } else if (name === 'pcId') {
        updated.acId = '';
        updated.boothId = '';
        updated.familyInfluencerId = '';
        updated.socialInfluencerId = '';
      } else if (name === 'districtId') {
        if (updated.acId) {
          const ac = acs?.find((a: any) => String(a.id) === String(updated.acId));
          if (ac && ac.districtId && String(ac.districtId) !== String(value)) {
            updated.acId = '';
            updated.boothId = '';
            updated.familyInfluencerId = '';
            updated.socialInfluencerId = '';
          }
        }
      } else if (name === 'acId') {
        updated.boothId = '';
        updated.familyInfluencerId = '';
        updated.socialInfluencerId = '';
        if (value) {
          const ac = acs?.find((a: any) => String(a.id) === String(value));
          if (ac) {
            if (!updated.stateId && ac.stateId) updated.stateId = String(ac.stateId);
            if (!updated.pcId && ac.pcId) updated.pcId = String(ac.pcId);
            if (!updated.districtId && ac.districtId) updated.districtId = String(ac.districtId);
          }
        }
      } else if (name === 'boothId') {
        updated.familyInfluencerId = '';
        updated.socialInfluencerId = '';
      } else if (name === 'religion' || name === 'religionName') {
        const matchingRel = (religions || []).find(
          (r: any) => (r.religionName || r.name || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        updated.religionName = value;
        updated.religionId = matchingRel ? String(matchingRel.id) : '';
      } else if (name === 'caste' || name === 'casteName') {
        const matchingCaste = (castes || []).find(
          (c: any) => (c.casteName || c.name || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        updated.casteName = value;
        updated.casteId = matchingCaste ? String(matchingCaste.id) : '';
        if (matchingCaste && matchingCaste.religionId && !updated.religionId) {
          const rel = (religions || []).find((r: any) => String(r.id) === String(matchingCaste.religionId));
          if (rel) {
            updated.religionId = String(rel.id);
            updated.religionName = rel.religionName || rel.name;
          }
        }
      } else if (name === 'subcasteName') {
        updated.subcasteName = value;
        const matchingSub = (castes || []).find(
          (c: any) => c.parentCasteId && (c.casteName || c.name || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        if (matchingSub && matchingSub.parentCasteId && !updated.casteId) {
          const parentC = (castes || []).find((c: any) => String(c.id) === String(matchingSub.parentCasteId));
          if (parentC) {
            updated.casteId = String(parentC.id);
            updated.casteName = parentC.casteName || parentC.name;
          }
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAddress(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, voterAddress: prev.fullAddress }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.epicNo.trim()) {
      newErrors.epicNo = 'EPIC Voter ID is required';
    }
    if (!formData.engFirstName.trim()) {
      newErrors.engFirstName = 'First Name (English) is required';
    }
    if (!formData.boothId) {
      newErrors.boothId = 'Polling Booth is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address format';
    }
    if (formData.mobileNo && !/^[0-9]{10}$/.test(formData.mobileNo.replace(/[\s-]/g, ''))) {
      newErrors.mobileNo = 'Enter valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setToastMessage(null);

    const payload: Record<string, any> = {
      epicNo: formData.epicNo.toUpperCase().trim(),
      boothId: formData.boothId ? formData.boothId : null,
      stateId: formData.stateId ? formData.stateId : null,
      districtId: formData.districtId ? formData.districtId : null,
      pcId: formData.pcId ? formData.pcId : null,
      acId: formData.acId ? formData.acId : null,
      serialNo: formData.serialNo ? Number(formData.serialNo) : null,
      sectionNo: formData.sectionNo ? Number(formData.sectionNo) : null,
      houseNo: formData.houseNo.trim() || null,
      engFirstName: formData.engFirstName.trim(),
      engMiddleName: formData.engMiddleName.trim() || null,
      engSurname: formData.engSurname.trim() || null,
      firstName: formData.firstName.trim() || null,
      middleName: formData.middleName.trim() || null,
      surname: formData.surname.trim() || null,
      gender: formData.gender,
      dob: formData.dob || null,
      age: formData.age ? Number(formData.age) : null,
      mobileNo: formData.mobileNo.trim() || null,
      email: formData.email.trim() || null,
      aadhaarNo: formData.aadhaarNo.trim() || null,
      panNo: formData.panNo.trim() || null,
      professionType: formData.professionType.trim() || null,
      profession: formData.profession.trim() || null,
      religionId: formData.religionId ? formData.religionId : null,
      religionName: formData.religionName?.trim() || null,
      casteId: formData.casteId ? formData.casteId : null,
      casteName: formData.casteName?.trim() || null,
      subcasteName: formData.subcasteName.trim() || null,
      voterType: formData.voterType,
      status: formData.status,
      isDead: formData.isDead,
      bloodGroup: formData.bloodGroup.trim() || null,
      avatar: formData.avatar instanceof File ? formData.avatar : (typeof formData.avatar === 'string' && formData.avatar.trim() ? formData.avatar.trim() : null),
      taluka: formData.taluka.trim() || null,
      village: formData.village.trim() || null,
      fullAddress: formData.fullAddress.trim() || null,
      voterAddress: formData.voterAddress.trim() || null,
      partyId: formData.partyId ? formData.partyId : null,
      familyInfluencerId: formData.familyInfluencerId ? formData.familyInfluencerId : null,
      socialInfluencerId: formData.socialInfluencerId ? formData.socialInfluencerId : null,
      isFamilyInfluencer: formData.isFamilyInfluencer,
      isSocialInfluencer: formData.isSocialInfluencer,
    };

    try {
      if (isEditMode && id) {
        await dispatch(updateVoterItem(id, payload));
        setToastMessage({ type: 'success', text: 'Voter details updated successfully!' });
      } else {
        await dispatch(createVoterItem(payload));
        setToastMessage({ type: 'success', text: 'New voter created successfully!' });
      }

      // Auto-refresh master categories in Redux store for newly added values (non-blocking)
      dispatch(fetchTenantMasterCategoryData('religions', TENANT_MASTER_ENDPOINTS.religions, false)).catch(() => { });
      dispatch(fetchTenantMasterCategoryData('castes', TENANT_MASTER_ENDPOINTS.castes, false)).catch(() => { });
      setTimeout(() => {
        navigate('/dashboard/voters');
      }, 1000);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save voter details. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Dropdown Options mapped to Option[] standard
  const stateOptions: Option[] = (states || []).map((s: any) => ({
    label: s.stateName || s.name || `State #${s.id}`,
    value: String(s.id),
  }));

  const districtOptions: Option[] = (districts || [])
    .filter((d: any) => {
      if (formData.districtId && String(d.id) === String(formData.districtId)) return true;
      return !formData.stateId || String(d.stateId) === String(formData.stateId);
    })
    .map((d: any) => ({
      label: d.districtName || d.name || `District #${d.id}`,
      value: String(d.id),
    }));

  const pcOptions: Option[] = (pcs || [])
    .filter((p: any) => {
      if (formData.pcId && String(p.id) === String(formData.pcId)) return true;
      return !formData.stateId || String(p.stateId) === String(formData.stateId);
    })
    .map((p: any) => ({
      label: `${p.pcNo ? `[PC-${p.pcNo}] ` : ''}${p.pcName || p.name || `PC #${p.id}`}`,
      value: String(p.id),
    }));

  const acOptions: Option[] = (acs || [])
    .filter((a: any) => {
      if (formData.acId && String(a.id) === String(formData.acId)) return true;
      if (formData.pcId && a.pcId && String(a.pcId) !== String(formData.pcId)) return false;
      if (formData.districtId && a.districtId && String(a.districtId) !== String(formData.districtId)) return false;
      if (formData.stateId && a.stateId && String(a.stateId) !== String(formData.stateId)) return false;
      return true;
    })
    .map((a: any) => ({
      label: `${a.acNo ? `[AC-${a.acNo}] ` : ''}${a.acName || a.name || `AC #${a.id}`}`,
      value: String(a.id),
    }));



  const religionSuggestions: string[] = useMemo(() => {
    return Array.from(new Set((religions || []).map((r: any) => r.religionName || r.name).filter(Boolean)));
  }, [religions]);

  const casteSuggestions: string[] = useMemo(() => {
    const primaryCastes = (castes || []).filter((c: any) => !c.parentCasteId);
    if (!formData.religionId && !formData.religionName) {
      return Array.from(new Set(primaryCastes.map((c: any) => c.casteName || c.name).filter(Boolean)));
    }
    const targetRelId = formData.religionId;
    const relMatches = primaryCastes.filter((c: any) => targetRelId && String(c.religionId) === String(targetRelId)).map((c: any) => c.casteName || c.name);
    const others = primaryCastes.filter((c: any) => !targetRelId || String(c.religionId) !== String(targetRelId)).map((c: any) => c.casteName || c.name);
    return Array.from(new Set([...relMatches, ...others].filter(Boolean)));
  }, [castes, formData.religionId, formData.religionName]);

  const subcasteSuggestions: string[] = useMemo(() => {
    const subcastes = (castes || []).filter((c: any) => Boolean(c.parentCasteId));
    if (!formData.casteId && !formData.casteName) {
      return Array.from(new Set(subcastes.map((c: any) => c.casteName || c.name).filter(Boolean)));
    }
    const targetCasteId = formData.casteId;
    const casteMatches = subcastes.filter((c: any) => targetCasteId && String(c.parentCasteId) === String(targetCasteId)).map((c: any) => c.casteName || c.name);
    const others = subcastes.filter((c: any) => !targetCasteId || String(c.parentCasteId) !== String(targetCasteId)).map((c: any) => c.casteName || c.name);
    return Array.from(new Set([...casteMatches, ...others].filter(Boolean)));
  }, [castes, formData.casteId, formData.casteName]);

  const religionOptions: Option[] = (religions || []).map((r: any) => ({
    label: r.religionName || r.name || `Religion #${r.id}`,
    value: String(r.id),
  }));

  const casteOptions: Option[] = (castes || [])
    .filter((c: any) => !formData.religionId || String(c.religionId) === String(formData.religionId))
    .map((c: any) => ({
      label: c.casteName || c.name || `Caste #${c.id}`,
      value: String(c.id),
    }));

  const partyOptions: Option[] = (parties || []).map((p: any) => ({
    label: `${p.abbreviation || p.name} - ${p.name}`,
    value: String(p.id),
  }));

  const familyInfluencerOptions: Option[] = (familyInfluencers || []).map((inf: any) => {
    const fullName =
      [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
      inf.engName ||
      inf.name;
    return {
      label: `${fullName} (${inf.epicNo})${inf.houseNo ? ` - H.No: ${inf.houseNo}` : ''}`,
      value: String(inf.id),
    };
  });

  const socialInfluencerOptions: Option[] = (socialInfluencers || []).map((inf: any) => {
    const fullName =
      [inf.engFirstName, inf.engMiddleName, inf.engSurname].filter(Boolean).join(' ') ||
      inf.engName ||
      inf.name;
    return {
      label: `${fullName} (${inf.epicNo})${inf.houseNo ? ` - H.No: ${inf.houseNo}` : ''}`,
      value: String(inf.id),
    };
  });

  const linkedFamilyHead =
    familyInfluencers.find((inf: any) => String(inf.id) === String(formData.familyInfluencerId)) ||
    (voterMeta && String(voterMeta.familyInfluencerId) === String(formData.familyInfluencerId)
      ? {
        name: voterMeta.familyInfluencerName,
        epicNo: voterMeta.familyInfluencerEpic,
      }
      : null);

  const linkedSocialLeader =
    socialInfluencers.find((inf: any) => String(inf.id) === String(formData.socialInfluencerId)) ||
    (voterMeta && String(voterMeta.socialInfluencerId) === String(formData.socialInfluencerId)
      ? {
        name: voterMeta.socialInfluencerName,
        epicNo: voterMeta.socialInfluencerEpic,
      }
      : null);

  const genderOptions = FORM_GENDER_OPTIONS;
  const voterTypeOptions = FORM_VOTER_TYPE_OPTIONS;
  const statusOptions = STATUS_OPTIONS.filter((s) => s.value !== '');
  const bloodGroupOptions = BLOOD_GROUP_OPTIONS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEditMode ? 'Edit Voter Details' : 'Register New Voter'}
        subtitle={
          isEditMode
            ? `Update profile, contact info, status, party affiliation, and influencers for EPIC #${formData.epicNo || id}`
            : 'Fill in complete voter information, electoral geography, extended status, and influencer links'
        }
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/voters')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to List</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || loadingVoter}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Update Profile' : 'Save Voter'}</span>
            </button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${toastMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {loadingVoter ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Fetching voter profile records...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Identification & Profile Status */}
          <VoterIdentificationFormSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            setFormData={setFormData}
            statusOptions={statusOptions}
            voterTypeOptions={voterTypeOptions}
            genderOptions={genderOptions}
            bloodGroupOptions={bloodGroupOptions}
          />

          {/* Section 2: Electoral Geography & Full Addresses */}
          <VoterGeographyFormSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            stateOptions={stateOptions}
            districtOptions={districtOptions}
            pcOptions={pcOptions}
            acOptions={acOptions}
            boothOptions={boothOptions}
            sameAddress={sameAddress}
            handleSameAddressToggle={handleSameAddressToggle}
          />

          {/* Section 3: Party Affiliation & Influencer Networks */}
          <VoterInfluencerFormSection
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            partyOptions={partyOptions}
            isEditMode={isEditMode}
            voterMeta={voterMeta}
            familyInfluencerOptions={familyInfluencerOptions}
            socialInfluencerOptions={socialInfluencerOptions}
            linkedFamilyHead={linkedFamilyHead}
            linkedSocialLeader={linkedSocialLeader}
            showFamilyPicker={showFamilyPicker}
            setShowFamilyPicker={setShowFamilyPicker}
            showSocialPicker={showSocialPicker}
            setShowSocialPicker={setShowSocialPicker}
            setAssignModalType={setAssignModalType}
            setAssignModalOpen={setAssignModalOpen}
            setLinkInfluencerType={setLinkInfluencerType}
            setLinkModalOpen={setLinkModalOpen}
          />

          {/* Section 4: Contact & Demographics */}
          <VoterDemographicsFormSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            religionSuggestions={religionSuggestions}
            casteSuggestions={casteSuggestions}
            subcasteSuggestions={subcasteSuggestions}
            religionOptions={religionOptions}
            casteOptions={casteOptions}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/dashboard/voters')}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{submitting ? 'Saving...' : isEditMode ? 'Update Profile' : 'Save Voter'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Dedicated Influencer Assignment Modals */}
      {isEditMode && voterMeta && assignModalType === 'family' && (
        <FamilyInfluencerAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          influencer={{
            id: voterMeta.id,
            name: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            engName: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            epicNo: voterMeta.epicNo,
            boothId: voterMeta.boothId,
            boothName: voterMeta.boothName,
            sectionNo: voterMeta.sectionNo,
            houseNo: voterMeta.houseNo,
            avatar: voterMeta.avatar,
            familyInfluencedCount: voterMeta.familyInfluencedCount,
          }}
          onSuccess={() => {
            if (id) {
              dispatch(fetchVoterById(id)).then((data: any) => {
                if (data) {
                  setVoterMeta(data);
                }
              });
            }
          }}
        />
      )}

      {isEditMode && voterMeta && assignModalType === 'social' && (
        <SocialInfluencerAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          influencer={{
            id: voterMeta.id,
            name: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            engName: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            epicNo: voterMeta.epicNo,
            boothId: voterMeta.boothId,
            boothName: voterMeta.boothName,
            sectionNo: voterMeta.sectionNo,
            houseNo: voterMeta.houseNo,
            avatar: voterMeta.avatar,
            socialInfluencedCount: voterMeta.socialInfluencedCount,
          }}
          onSuccess={() => {
            if (id) {
              dispatch(fetchVoterById(id)).then((data: any) => {
                if (data) {
                  setVoterMeta(data);
                }
              });
            }
          }}
        />
      )}

      {/* Link this Voter to an Influencer Leader Modal */}
      {isEditMode && id && (
        <LinkToInfluencerModal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          voterIds={[id]}
          type={linkInfluencerType}
          onSuccess={() => {
            dispatch(fetchVoterById(id)).then((data: any) => {
              if (data) {
                setVoterMeta(data);
                setFormData((prev) => ({
                  ...prev,
                  familyInfluencerId: data.familyInfluencerId ? String(data.familyInfluencerId) : '',
                  socialInfluencerId: data.socialInfluencerId ? String(data.socialInfluencerId) : '',
                  isFamilyInfluencer: Boolean(data.isFamilyInfluencer || Number(data.familyInfluencedCount) > 0),
                  isSocialInfluencer: Boolean(data.isSocialInfluencer || Number(data.socialInfluencedCount) > 0),
                }));
              }
            });
          }}
        />
      )}
    </div>
  );
};
