import {
  fetchSuperAdminVoterById,
  createSuperAdminVoterItem,
  updateSuperAdminVoterItem,
  fetchSuperAdminBoothOptions,
  fetchSuperAdminInfluencerOptions,
} from '@/redux/actions/voterSuperAdmin';
import {
  FORM_GENDER_OPTIONS,
  FORM_VOTER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from '@/constants/dropdownOptions';
import { calculateAge } from '@/utils';
import { useAppDispatch } from '@/redux/hooks';
import React, { useState, useMemo } from 'react';
import { useMasterData } from '@/hooks/useMasterData';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

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

export const SuperAdminVoterFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const dispatch = useAppDispatch();
  // Load master categories excluding heavy booths
  const { religions, castes, acs, states, districts, pcs, parties } = useMasterData([
    'states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties'
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [voterMeta, setVoterMeta] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [showSocialPicker, setShowSocialPicker] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'family' | 'social'>('family');
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');

  const [formData, setFormData] = useState<Record<string, any>>({
    epicNo: '',
    voterIdNo: '',
    serialNo: 0,
    sectionNo: 0,
    partNo: '',
    isDead: false,
    status: 'ACTIVE',
    voterType: 'General Voter',
    partyId: '',
    partyAffiliationId: '',

    engFirstName: '',
    engMiddleName: '',
    engSurname: '',
    firstName: '',
    middleName: '',
    surname: '',
    dob: '',
    age: '',
    gender: 'Male',
    religionId: '',
    religionName: '',
    religion: '',
    casteId: '',
    casteName: '',
    caste: '',
    subcasteName: '',
    subCaste: '',

    stateId: '',
    districtId: '',
    pcId: '',
    acId: '',
    boothId: '',

    guardianName: '',
    relationType: 'Father',
    guardianNameEng: '',

    mobileNo: '',
    alternateMobileNo: '',
    email: '',
    aadhaarNo: '',
    panNo: '',

    houseNo: '',
    houseName: '',
    streetName: '',
    areaLocality: '',
    cityTown: '',
    postOffice: '',
    pinCode: '',
    taluka: '',
    village: '',
    fullAddress: '',
    voterAddress: '',

    permHouseNo: '',
    permHouseName: '',
    permStreetName: '',
    permAreaLocality: '',
    permCityTown: '',
    permPostOffice: '',
    permPinCode: '',

    maritalStatus: 'Single',
    bloodGroup: '',
    education: '',
    professionType: '',
    profession: '',
    occupation: '',
    annualIncome: '',

    isFamilyInfluencer: false,
    isSocialInfluencer: false,
    influencerCategory: '',
    influencerNotes: '',
    influencerRole: '',
    influencerStatus: 'Active',
    influenceReachCount: 0,
    mappedFamilyMembersCount: 0,
    mappedSocialVotersCount: 0,

    familyInfluencerId: '',
    familyInfluencerHeadName: '',
    socialInfluencerId: '',
    socialInfluencerLeaderName: '',
  });

  // Local state for on-demand Booths and Influencers (isolated from List Page)
  const [boothOptions, setBoothOptions] = useState<Option[]>([]);
  const [familyInfluencers, setFamilyInfluencers] = useState<Option[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<Option[]>([]);

  // In-memory filtered dropdown options
  const filteredDistricts = useMemo(() => {
    if (!formData.stateId) return districts;
    return districts.filter((d: any) => String(d.stateId) === String(formData.stateId));
  }, [districts, formData.stateId]);

  const districtOptions: Option[] = useMemo(() => {
    return filteredDistricts.map((d: any) => ({
      label: d.name || d.districtName || `District #${d.id}`,
      value: String(d.id),
    }));
  }, [filteredDistricts]);

  const filteredPcs = useMemo(() => {
    if (!formData.stateId) return pcs;
    return pcs.filter((p: any) => String(p.stateId) === String(formData.stateId));
  }, [pcs, formData.stateId]);

  const pcOptions: Option[] = useMemo(() => {
    return filteredPcs.map((p: any) => ({
      label: p.name || p.pcName || `PC #${p.id}`,
      value: String(p.id),
    }));
  }, [filteredPcs]);

  const filteredAcs = useMemo(() => {
    return acs.filter((a: any) => {
      if (formData.acId && String(a.id) === String(formData.acId)) return true;
      if (formData.pcId && a.pcId && String(a.pcId) !== String(formData.pcId)) return false;
      if (formData.districtId && a.districtId && String(a.districtId) !== String(formData.districtId)) return false;
      if (formData.stateId && a.stateId && String(a.stateId) !== String(formData.stateId)) return false;
      return true;
    });
  }, [acs, formData.acId, formData.pcId, formData.districtId, formData.stateId]);

  const acOptions: Option[] = useMemo(() => {
    return filteredAcs.map((a: any) => ({
      label: `${a.acNumber || a.acNo ? `[AC-${a.acNumber || a.acNo}] ` : ''}${a.name || a.acName || `AC #${a.id}`}`,
      value: String(a.id),
    }));
  }, [filteredAcs]);

  const filteredCastes = useMemo(() => {
    if (!formData.religionId) return castes;
    return castes.filter((c: any) => String(c.religionId) === String(formData.religionId));
  }, [castes, formData.religionId]);

  const casteOptions: Option[] = useMemo(() => {
    return filteredCastes.map((c: any) => ({
      label: c.name || c.casteName || `Caste #${c.id}`,
      value: String(c.id),
    }));
  }, [filteredCastes]);

  const stateOptions: Option[] = useMemo(() => {
    return states.map((s: any) => ({ label: s.name || s.stateName, value: String(s.id) }));
  }, [states]);

  const religionOptions: Option[] = useMemo(() => {
    return religions.map((r: any) => ({ label: r.name || r.religionName, value: String(r.id) }));
  }, [religions]);

  const religionSuggestions: string[] = useMemo(() => {
    return Array.from(new Set(religions.map((r: any) => r.name || r.religionName).filter(Boolean)));
  }, [religions]);

  const casteSuggestions: string[] = useMemo(() => {
    const primaryCastes = (castes || []).filter((c: any) => !c.parentCasteId);
    if (!formData.religionId && !formData.religionName) {
      return Array.from(new Set(primaryCastes.map((c: any) => c.name || c.casteName).filter(Boolean)));
    }
    const targetRelId = formData.religionId;
    const relMatches = primaryCastes.filter((c: any) => targetRelId && String(c.religionId) === String(targetRelId)).map((c: any) => c.name || c.casteName);
    const others = primaryCastes.filter((c: any) => !targetRelId || String(c.religionId) !== String(targetRelId)).map((c: any) => c.name || c.casteName);
    return Array.from(new Set([...relMatches, ...others].filter(Boolean)));
  }, [castes, formData.religionId, formData.religionName]);

  const subcasteSuggestions: string[] = useMemo(() => {
    const subcastes = (castes || []).filter((c: any) => Boolean(c.parentCasteId));
    if (!formData.casteId && !formData.casteName) {
      return Array.from(new Set(subcastes.map((c: any) => c.name || c.casteName).filter(Boolean)));
    }
    const targetCasteId = formData.casteId;
    const casteMatches = subcastes.filter((c: any) => targetCasteId && String(c.parentCasteId) === String(targetCasteId)).map((c: any) => c.name || c.casteName);
    const others = subcastes.filter((c: any) => !targetCasteId || String(c.parentCasteId) !== String(targetCasteId)).map((c: any) => c.name || c.casteName);
    return Array.from(new Set([...casteMatches, ...others].filter(Boolean)));
  }, [castes, formData.casteId, formData.casteName]);

  const partyOptions: Option[] = useMemo(() => {
    return parties.map((p: any) => ({ label: `${p.abbreviation || p.name} - ${p.name}`, value: String(p.id) }));
  }, [parties]);

  // Load booth options on-demand whenever acId changes (Create & Edit mode)
  useDebouncedEffect(
    () => {
      if (!formData.acId) {
        setBoothOptions([]);
        return;
      }
      dispatch(fetchSuperAdminBoothOptions({ acId: formData.acId, saveToStore: false }))
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

  // Load family and social influencer options on-demand whenever boothId changes
  useDebouncedEffect(
    () => {
      if (!formData.boothId) {
        setFamilyInfluencers([]);
        setSocialInfluencers([]);
        return;
      }
      dispatch(
        fetchSuperAdminInfluencerOptions({
          boothId: formData.boothId,
          excludeId: id,
          type: 'family',
        })
      )
        .then((options: any[]) =>
          setFamilyInfluencers(
            (options || []).map((opt) => ({
              label: `${opt.name} (${opt.epicNo})${opt.houseNo ? ` - H.No: ${opt.houseNo}` : ''}`,
              value: String(opt.id),
            }))
          )
        )
        .catch(() => setFamilyInfluencers([]));

      dispatch(
        fetchSuperAdminInfluencerOptions({
          boothId: formData.boothId,
          excludeId: id,
          type: 'social',
        })
      )
        .then((options: any[]) =>
          setSocialInfluencers(
            (options || []).map((opt) => ({
              label: `${opt.name} (${opt.epicNo})${opt.houseNo ? ` - H.No: ${opt.houseNo}` : ''}`,
              value: String(opt.id),
            }))
          )
        )
        .catch(() => setSocialInfluencers([]));
    },
    150,
    [dispatch, formData.boothId, id]
  );

  useDebouncedEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingVoter(true);
    dispatch(fetchSuperAdminVoterById(id))
      .then((data: any) => {
        if (!data) return;
        setVoterMeta(data);

        const loadedAcId = data.acId ? String(data.acId) : '';
        let resolvedStateId = data.stateId ? String(data.stateId) : '';
        let resolvedDistrictId = data.districtId ? String(data.districtId) : '';
        let resolvedPcId = data.pcId ? String(data.pcId) : '';

        if (loadedAcId && acs?.length) {
          const a = acs.find((ac: any) => String(ac.id) === loadedAcId);
          if (a) {
            if (!resolvedStateId && a.stateId) resolvedStateId = String(a.stateId);
            if (!resolvedDistrictId && a.districtId) resolvedDistrictId = String(a.districtId);
            if (!resolvedPcId && a.pcId) resolvedPcId = String(a.pcId);
          }
        }

        setFormData({
          epicNo: data.epicNo || '',
          voterIdNo: data.voterIdNo || '',
          serialNo: data.serialNo ?? 0,
          sectionNo: data.sectionNo ?? 0,
          partNo: data.partNo || '',
          isDead: Boolean(data.isDead),
          status: data.status || 'ACTIVE',
          voterType: data.voterType || 'General Voter',
          partyId: data.partyId ? String(data.partyId) : (data.partyAffiliationId ? String(data.partyAffiliationId) : ''),
          partyAffiliationId: data.partyAffiliationId || data.partyId || '',

          engFirstName: data.engFirstName || '',
          engMiddleName: data.engMiddleName || '',
          engSurname: data.engSurname || '',
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          surname: data.surname || '',
          dob: data.dob ? data.dob.slice(0, 10) : '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || 'Male',
          religionId: data.religionId ? String(data.religionId) : '',
          religionName: data.religionName || '',
          religion: data.religionName || '',
          casteId: data.casteId ? String(data.casteId) : '',
          casteName: data.casteName || '',
          caste: data.casteName || '',
          subcasteName: data.subcasteName || data.subCaste || '',
          subCaste: data.subcasteName || data.subCaste || '',

          stateId: resolvedStateId,
          districtId: resolvedDistrictId,
          pcId: resolvedPcId,
          acId: loadedAcId,
          boothId: data.boothId ? String(data.boothId) : '',

          guardianName: data.guardianName || '',
          relationType: data.relationType || 'Father',
          guardianNameEng: data.guardianNameEng || '',

          mobileNo: data.mobileNo || '',
          alternateMobileNo: data.alternateMobileNo || '',
          email: data.email || '',
          aadhaarNo: data.aadhaarNo || '',
          panNo: data.panNo || '',

          houseNo: data.houseNo || '',
          houseName: data.houseName || '',
          streetName: data.streetName || '',
          areaLocality: data.areaLocality || '',
          cityTown: data.cityTown || '',
          postOffice: data.postOffice || '',
          pinCode: data.pinCode || '',
          taluka: data.taluka || '',
          village: data.village || '',
          fullAddress: data.fullAddress || '',
          voterAddress: data.voterAddress || '',

          permHouseNo: data.permHouseNo || '',
          permHouseName: data.permHouseName || '',
          permStreetName: data.permStreetName || '',
          permAreaLocality: data.permAreaLocality || '',
          permCityTown: data.permCityTown || '',
          permPostOffice: data.permPostOffice || '',
          permPinCode: data.permPinCode || '',

          maritalStatus: data.maritalStatus || 'Single',
          bloodGroup: data.bloodGroup || '',
          education: data.education || '',
          professionType: data.professionType || '',
          profession: data.profession || '',
          occupation: data.occupation || '',
          annualIncome: data.annualIncome || '',

          isFamilyInfluencer: Boolean(data.isFamilyInfluencer || Number(data.familyInfluencedCount) > 0),
          isSocialInfluencer: Boolean(data.isSocialInfluencer || Number(data.socialInfluencedCount) > 0),
          influencerCategory: data.influencerCategory || '',
          influencerNotes: data.influencerNotes || '',
          influencerRole: data.influencerRole || '',
          influencerStatus: data.influencerStatus || 'Active',
          influenceReachCount: data.influenceReachCount || 0,
          mappedFamilyMembersCount: data.mappedFamilyMembersCount || 0,
          mappedSocialVotersCount: data.mappedSocialVotersCount || 0,

          familyInfluencerId: data.familyInfluencerId ? String(data.familyInfluencerId) : '',
          familyInfluencerHeadName: data.familyInfluencerHeadName || '',
          socialInfluencerId: data.socialInfluencerId ? String(data.socialInfluencerId) : '',
          socialInfluencerLeaderName: data.socialInfluencerLeaderName || '',
        });
      })
      .catch((err: any) => {
        setToastMessage({
          type: 'error',
          text: err?.message || 'Failed to fetch voter details',
        });
      })
      .finally(() => {
        setLoadingVoter(false);
      });
  }, 150, [dispatch, id, isEditMode]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => {
      const next: Record<string, any> = { ...prev, [name]: finalValue };

      if (name === 'dob' && value) {
        next.age = String(calculateAge(value));
      }

      // Smart cascading resets
      if (name === 'stateId') {
        next.districtId = '';
        next.pcId = '';
        next.acId = '';
        next.boothId = '';
        next.familyInfluencerId = '';
        next.socialInfluencerId = '';
      } else if (name === 'pcId') {
        next.acId = '';
        next.boothId = '';
        next.familyInfluencerId = '';
        next.socialInfluencerId = '';
      } else if (name === 'districtId') {
        if (next.acId) {
          const ac = acs.find((a: any) => String(a.id) === String(next.acId));
          if (ac && ac.districtId && String(ac.districtId) !== String(value)) {
            next.acId = '';
            next.boothId = '';
            next.familyInfluencerId = '';
            next.socialInfluencerId = '';
          }
        }
      } else if (name === 'acId') {
        next.boothId = '';
        next.familyInfluencerId = '';
        next.socialInfluencerId = '';
        if (value) {
          const ac = acs.find((a: any) => String(a.id) === String(value));
          if (ac) {
            if (!next.stateId && ac.stateId) next.stateId = String(ac.stateId);
            if (!next.pcId && ac.pcId) next.pcId = String(ac.pcId);
            if (!next.districtId && ac.districtId) next.districtId = String(ac.districtId);
          }
        }
      } else if (name === 'boothId') {
        next.familyInfluencerId = '';
        next.socialInfluencerId = '';
      } else if (name === 'religion' || name === 'religionName') {
        const matchingRel = (religions || []).find(
          (r: any) => (r.name || r.religionName || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        next.religionName = value;
        next.religionId = matchingRel ? String(matchingRel.id) : '';
      } else if (name === 'caste' || name === 'casteName') {
        const matchingCaste = (castes || []).find(
          (c: any) => (c.name || c.casteName || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        next.casteName = value;
        next.casteId = matchingCaste ? String(matchingCaste.id) : '';
        if (matchingCaste && matchingCaste.religionId && !next.religionId) {
          const rel = (religions || []).find((r: any) => String(r.id) === String(matchingCaste.religionId));
          if (rel) {
            next.religionId = String(rel.id);
            next.religionName = rel.name || rel.religionName;
          }
        }
      } else if (name === 'subcasteName' || name === 'subCaste') {
        next.subcasteName = value;
        next.subCaste = value;
        const matchingSub = (castes || []).find(
          (c: any) => c.parentCasteId && (c.name || c.casteName || '').trim().toLowerCase() === String(value).trim().toLowerCase()
        );
        if (matchingSub && matchingSub.parentCasteId && !next.casteId) {
          const parentC = (castes || []).find((c: any) => String(c.id) === String(matchingSub.parentCasteId));
          if (parentC) {
            next.casteId = String(parentC.id);
            next.casteName = parentC.name || parentC.casteName;
          }
        }
      }

      return next;
    });
  };

  const handleCopyPresentAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permHouseNo: prev.houseNo,
        permHouseName: prev.houseName,
        permStreetName: prev.streetName,
        permAreaLocality: prev.areaLocality,
        permCityTown: prev.cityTown,
        permPostOffice: prev.postOffice,
        permPinCode: prev.pinCode,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.epicNo?.trim()) newErrors.epicNo = 'EPIC Voter ID is required';
    if (!formData.engFirstName?.trim()) newErrors.engFirstName = 'First Name is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setToastMessage(null);

    try {
      const payload: Record<string, any> = {
        ...formData,
        serialNo: Number(formData.serialNo) || 0,
        sectionNo: Number(formData.sectionNo) || 0,
        age: formData.age ? Number(formData.age) : undefined,
        partyId: formData.partyId || formData.partyAffiliationId || null,
        taluka: formData.taluka?.trim() || null,
        village: formData.village?.trim() || null,
        religionName: formData.religionName?.trim() || formData.religion?.trim() || null,
        casteName: formData.casteName?.trim() || formData.caste?.trim() || null,
        subcasteName: formData.subcasteName?.trim() || formData.subCaste?.trim() || null,
        isDead: Boolean(formData.isDead),
        isFamilyInfluencer: Boolean(formData.isFamilyInfluencer),
        isSocialInfluencer: Boolean(formData.isSocialInfluencer),
        influenceReachCount: Number(formData.influenceReachCount) || 0,
      };

      if (isEditMode && id) {
        await dispatch(updateSuperAdminVoterItem(id, payload));
        setToastMessage({ type: 'success', text: 'Voter updated successfully!' });
      } else {
        await dispatch(createSuperAdminVoterItem(payload));
        setToastMessage({ type: 'success', text: 'Voter created successfully!' });
      }

      setTimeout(() => {
        navigate('/dashboard/voters');
      }, 1000);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to save voter',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVoter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const targetInfluencerObj = voterMeta
    ? {
      id: voterMeta.id,
      name: [voterMeta.engFirstName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.voterName || 'Voter',
      epicNo: voterMeta.epicNo,
      boothId: voterMeta.boothId,
      boothName: voterMeta.boothName,
      sectionNo: voterMeta.sectionNo,
      houseNo: voterMeta.houseNo,
    }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Super Admin Voter Record' : 'Add New Super Admin Voter'}
        subtitle="Manage master voter records across all electoral constituencies"
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/voters')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
        }
      />

      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <p className="text-sm font-medium">{toastMessage.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <VoterIdentificationFormSection
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          setFormData={setFormData}
          statusOptions={STATUS_OPTIONS.filter((s) => s.value !== '')}
          voterTypeOptions={FORM_VOTER_TYPE_OPTIONS}
          genderOptions={FORM_GENDER_OPTIONS}
          bloodGroupOptions={BLOOD_GROUP_OPTIONS}
        />

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
          handleSameAddressToggle={(e) => handleCopyPresentAddress(e.target.checked)}
        />

        <VoterDemographicsFormSection
          errors={errors}
          formData={formData}
          handleChange={handleChange}
          casteOptions={casteOptions}
          religionOptions={religionOptions}
          casteSuggestions={casteSuggestions}
          religionSuggestions={religionSuggestions}
          subcasteSuggestions={subcasteSuggestions}
        />

        <VoterInfluencerFormSection
          formData={formData}
          handleChange={handleChange}
          setFormData={setFormData}
          partyOptions={partyOptions}
          voterMeta={voterMeta}
          isEditMode={isEditMode}
          familyInfluencerOptions={familyInfluencers}
          socialInfluencerOptions={socialInfluencers}
          showFamilyPicker={showFamilyPicker}
          setShowFamilyPicker={setShowFamilyPicker}
          showSocialPicker={showSocialPicker}
          setShowSocialPicker={setShowSocialPicker}
          setLinkModalOpen={setLinkModalOpen}
          setAssignModalOpen={(open) => {
            if (assignModalType === 'family') setFamilyModalOpen(open);
            else setSocialModalOpen(open);
          }}
          setAssignModalType={setAssignModalType}
          setLinkInfluencerType={setLinkInfluencerType}
          linkedFamilyHead={null}
          linkedSocialLeader={null}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/dashboard/voters')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEditMode ? 'Update Voter' : 'Create Voter'}
          </button>
        </div>
      </form>

      {targetInfluencerObj && (
        <>
          <FamilyInfluencerAssignModal
            isOpen={familyModalOpen}
            onClose={() => setFamilyModalOpen(false)}
            influencer={targetInfluencerObj}
            onSuccess={() => {
              setFamilyModalOpen(false);
              dispatch(fetchSuperAdminVoterById(id!)).then((data: any) => setVoterMeta(data));
            }}
          />

          <SocialInfluencerAssignModal
            isOpen={socialModalOpen}
            onClose={() => setSocialModalOpen(false)}
            influencer={targetInfluencerObj}
            onSuccess={() => {
              setSocialModalOpen(false);
              dispatch(fetchSuperAdminVoterById(id!)).then((data: any) => setVoterMeta(data));
            }}
          />

          <LinkToInfluencerModal
            isOpen={linkModalOpen}
            onClose={() => setLinkModalOpen(false)}
            voterIds={[id!]}
            type={linkInfluencerType}
            onSuccess={() => {
              setLinkModalOpen(false);
              dispatch(fetchSuperAdminVoterById(id!)).then((data: any) => setVoterMeta(data));
            }}
          />
        </>
      )}
    </div>
  );
};

export default SuperAdminVoterFormPage;
