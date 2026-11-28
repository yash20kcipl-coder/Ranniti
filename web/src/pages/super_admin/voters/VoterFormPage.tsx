import {
  fetchSuperAdminVoterById,
  createSuperAdminVoterItem,
  updateSuperAdminVoterItem,
  fetchSuperAdminBoothOptions,
  fetchSuperAdminInfluencerOptions,
} from '@/redux/actions/voterSuperAdmin';
import { searchSuperAdminMasterCategory } from '@/redux/actions/masterSuperAdmin';
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
  UserPlus,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  const { religions, castes, acs, states, districts, pcs, parties, professionCategories, professions, talukas, villages } = useMasterData([
    'states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties', 'professionCategories', 'professions', 'talukas', 'villages'
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);

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
    socialInfluencerScope: null as 'booth' | 'ac' | null,
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
    const targetRelId = formData.religionId || (religions || []).find(
      (r: any) => (r.name || r.religionName || '').trim().toLowerCase() === String(formData.religionName || '').trim().toLowerCase()
    )?.id;

    if (targetRelId) {
      return Array.from(
        new Set(
          primaryCastes
            .filter((c: any) => String(c.religionId) === String(targetRelId))
            .map((c: any) => c.name || c.casteName)
            .filter(Boolean)
        )
      );
    }
    return Array.from(new Set(primaryCastes.map((c: any) => c.name || c.casteName).filter(Boolean)));
  }, [castes, religions, formData.religionId, formData.religionName]);

  const subcasteSuggestions: string[] = useMemo(() => {
    const subcastes = (castes || []).filter((c: any) => Boolean(c.parentCasteId));
    const targetCasteId = formData.casteId || (castes || []).find(
      (c: any) => !c.parentCasteId && (c.name || c.casteName || '').trim().toLowerCase() === String(formData.casteName || '').trim().toLowerCase()
    )?.id;

    if (targetCasteId) {
      return Array.from(
        new Set(
          subcastes
            .filter((c: any) => String(c.parentCasteId) === String(targetCasteId))
            .map((c: any) => c.name || c.casteName)
            .filter(Boolean)
        )
      );
    }
    return Array.from(new Set(subcastes.map((c: any) => c.name || c.casteName).filter(Boolean)));
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
          socialInfluencerScope: data.socialInfluencerScope || (Number(data.socialInfluencedCount) > 0 ? 'booth' : null),
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
        toast.error(err?.message || 'Failed to fetch voter details');
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

      // Smart cascading resets & auto-linking
      if (name === 'stateId') {
        next.districtId = '';
        next.pcId = '';
        next.acId = '';
        next.boothId = '';
        next.taluka = '';
        next.village = '';
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
        if (next.taluka && value) {
          const currentTaluka = (talukas || []).find(
            (t: any) => (t.name || '').trim().toLowerCase() === String(next.taluka).trim().toLowerCase()
          );
          if (currentTaluka && currentTaluka.districtId && String(currentTaluka.districtId) !== String(value)) {
            next.taluka = '';
            next.village = '';
          }
        }
        if (next.village && value) {
          const currentVillageObj = (villages || []).find(
            (v: any) => (v.name || '').trim().toLowerCase() === String(next.village).trim().toLowerCase()
          );
          if (currentVillageObj && currentVillageObj.districtId && String(currentVillageObj.districtId) !== String(value)) {
            next.village = '';
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
        const valStr = String(value || '').trim();
        const matchingRel = (religions || []).find(
          (r: any) => (r.name || r.religionName || '').trim().toLowerCase() === valStr.toLowerCase()
        );
        next.religion = value;
        next.religionName = value;
        next.religionId = matchingRel ? String(matchingRel.id) : '';

        // If current caste does not belong to this religion, clear caste and subcaste
        if (next.casteId && matchingRel) {
          const currentCaste = (castes || []).find((c: any) => String(c.id) === String(next.casteId));
          if (currentCaste && currentCaste.religionId && String(currentCaste.religionId) !== String(matchingRel.id)) {
            next.caste = '';
            next.casteId = '';
            next.casteName = '';
            next.subcasteName = '';
            next.subCaste = '';
          }
        }
      } else if (name === 'caste' || name === 'casteName') {
        const valStr = String(value || '').trim();
        const matchingCaste = (castes || []).find(
          (c: any) => !(c.parentCasteId || c.parent_caste_id) && (c.name || c.casteName || '').trim().toLowerCase() === valStr.toLowerCase()
        ) || (castes || []).find(
          (c: any) => (c.name || c.casteName || '').trim().toLowerCase() === valStr.toLowerCase()
        );

        next.caste = value;
        next.casteName = value;
        next.casteId = matchingCaste ? String(matchingCaste.id) : '';

        // Auto-populate Religion from caste
        if (matchingCaste) {
          const targetRelId = matchingCaste.religionId || matchingCaste.religion_id;
          let rel = targetRelId ? (religions || []).find((r: any) => String(r.id) === String(targetRelId)) : null;
          const candidateRelName = String((rel && (rel.name || rel.religionName)) || matchingCaste.religionName || matchingCaste.religion_name || '').trim();
          if (!rel && candidateRelName) {
            rel = (religions || []).find((r: any) => (r.name || r.religionName || '').trim().toLowerCase() === candidateRelName.toLowerCase());
          }
          const finalRelName = rel ? (rel.name || rel.religionName) : candidateRelName;
          if (finalRelName) {
            next.religion = finalRelName;
            next.religionName = finalRelName;
            if (rel) next.religionId = String(rel.id);
            else if (targetRelId) next.religionId = String(targetRelId);
          }
        }

        // If current subcaste does not belong to this caste, clear subcaste
        if ((next.subcasteName || next.subCaste) && matchingCaste) {
          const activeSubName = String(next.subcasteName || next.subCaste).trim().toLowerCase();
          const currentSub = (castes || []).find(
            (c: any) => (c.parentCasteId || c.parent_caste_id) && (c.name || c.casteName || '').trim().toLowerCase() === activeSubName
          );
          const pId = currentSub ? (currentSub.parentCasteId || currentSub.parent_caste_id) : null;
          if (currentSub && pId && String(pId) !== String(matchingCaste.id)) {
            next.subcasteName = '';
            next.subCaste = '';
          }
        }
      } else if (name === 'subcasteName' || name === 'subCaste') {
        const valStr = String(value || '').trim();
        next.subcasteName = value;
        next.subCaste = value;

        if (valStr) {
          const matchingSub = (castes || []).find(
            (c: any) => (c.parentCasteId || c.parent_caste_id) && (c.name || c.casteName || '').trim().toLowerCase() === valStr.toLowerCase()
          ) || (castes || []).find(
            (c: any) => (c.name || c.casteName || '').trim().toLowerCase() === valStr.toLowerCase()
          );

          if (matchingSub) {
            const pId = matchingSub.parentCasteId || matchingSub.parent_caste_id;
            const parentC = pId
              ? (castes || []).find((c: any) => String(c.id) === String(pId))
              : ((matchingSub.parentCasteName || matchingSub.parent_caste_name)
                ? (castes || []).find((c: any) => !(c.parentCasteId || c.parent_caste_id) && (c.name || c.casteName || '').trim().toLowerCase() === String(matchingSub.parentCasteName || matchingSub.parent_caste_name).trim().toLowerCase())
                : null);

            const parentCasteName = parentC ? (parentC.name || parentC.casteName) : (matchingSub.parentCasteName || matchingSub.parent_caste_name || '');
            const parentCasteId = parentC ? String(parentC.id) : (pId ? String(pId) : '');

            if (parentCasteName) {
              next.caste = parentCasteName;
              next.casteName = parentCasteName;
              next.casteId = parentCasteId;
            }

            // Auto-populate Religion from parent caste or subcaste
            const targetRelId = (parentC && (parentC.religionId || parentC.religion_id)) || matchingSub.religionId || matchingSub.religion_id;
            let rel = targetRelId ? (religions || []).find((r: any) => String(r.id) === String(targetRelId)) : null;
            const candidateRelName = String((rel && (rel.name || rel.religionName)) || (parentC && (parentC.religionName || parentC.religion_name)) || matchingSub.religionName || matchingSub.religion_name || '').trim();
            if (!rel && candidateRelName) {
              rel = (religions || []).find((r: any) => (r.name || r.religionName || '').trim().toLowerCase() === candidateRelName.toLowerCase());
            }

            const finalRelName = rel ? (rel.name || rel.religionName) : candidateRelName;
            if (finalRelName) {
              next.religion = finalRelName;
              next.religionName = finalRelName;
              if (rel) next.religionId = String(rel.id);
              else if (targetRelId) next.religionId = String(targetRelId);
            }
          }
        }
      } else if (name === 'profession') {
        const valStr = String(value || '').trim();
        next.profession = value;
        if (valStr) {
          const matchedProf = (professions || []).find(
            (p: any) => (p.name || p.professionName || '').trim().toLowerCase() === valStr.toLowerCase()
          );
          if (matchedProf) {
            const catId = matchedProf.categoryId || matchedProf.category_id;
            const matchedCat = catId
              ? (professionCategories || []).find((c: any) => String(c.id) === String(catId))
              : null;
            const finalCatName = (matchedCat && (matchedCat.name || matchedCat.categoryName)) || matchedProf.categoryName || matchedProf.category_name;
            if (finalCatName) {
              next.professionType = finalCatName;
            }
          }
        }
      } else if (name === 'professionType') {
        const valStr = String(value || '').trim();
        next.professionType = value;
        if (next.profession && valStr) {
          const matchedProf = (professions || []).find(
            (p: any) => (p.name || '').trim().toLowerCase() === String(next.profession).trim().toLowerCase()
          );
          if (matchedProf && matchedProf.categoryId) {
            const matchedCat = (professionCategories || []).find((c: any) => String(c.id) === String(matchedProf.categoryId));
            if (!matchedCat || matchedCat.name.trim().toLowerCase() !== valStr.toLowerCase()) {
              next.profession = '';
            }
          }
        }
      } else if (name === 'village') {
        const valStr = String(value || '').trim();
        next.village = value;
        if (valStr) {
          const matchedVillage = (villages || []).find(
            (v: any) => (v.name || '').trim().toLowerCase() === valStr.toLowerCase()
          );
          if (matchedVillage) {
            // Auto-populate Taluka
            if (matchedVillage.talukaName) {
              next.taluka = matchedVillage.talukaName;
            } else if (matchedVillage.talukaId) {
              const matchedTaluka = (talukas || []).find((t: any) => String(t.id) === String(matchedVillage.talukaId));
              if (matchedTaluka) next.taluka = matchedTaluka.name;
            }

            // Auto-populate District
            if (matchedVillage.districtId) {
              next.districtId = String(matchedVillage.districtId);
            }

            // Auto-populate State
            if (matchedVillage.stateId) {
              next.stateId = String(matchedVillage.stateId);
            }
          }
        }
      } else if (name === 'taluka') {
        const valStr = String(value || '').trim();
        next.taluka = value;
        if (valStr) {
          const matchedTaluka = (talukas || []).find(
            (t: any) => (t.name || '').trim().toLowerCase() === valStr.toLowerCase()
          );
          if (matchedTaluka) {
            // Auto-populate District
            if (matchedTaluka.districtId) {
              next.districtId = String(matchedTaluka.districtId);
            }

            // Auto-populate State
            if (matchedTaluka.stateId) {
              next.stateId = String(matchedTaluka.stateId);
            }

            // If current village doesn't belong to this taluka, clear village
            if (next.village) {
              const currentVillageObj = (villages || []).find(
                (v: any) => (v.name || '').trim().toLowerCase() === String(next.village).trim().toLowerCase()
              );
              if (
                currentVillageObj &&
                currentVillageObj.talukaId &&
                String(currentVillageObj.talukaId) !== String(matchedTaluka.id)
              ) {
                next.village = '';
              }
            }
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
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill required fields (EPIC Number and First Name)');
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        ...formData,
        serialNo: Number(formData.serialNo) || 0,
        sectionNo: Number(formData.sectionNo) || 0,
        age: formData.age ? Number(formData.age) : undefined,
        partyId: formData.partyId || formData.partyAffiliationId || null,
        taluka: formData.taluka?.trim() || null,
        village: formData.village?.trim() || null,
        religionId: formData.religionId ? formData.religionId : null,
        religionName: formData.religionName?.trim() || formData.religion?.trim() || null,
        casteId: formData.casteId ? formData.casteId : null,
        casteName: formData.casteName?.trim() || formData.caste?.trim() || null,
        subcasteName: formData.subcasteName?.trim() || formData.subCaste?.trim() || null,
        professionType: formData.professionType?.trim() || null,
        profession: formData.profession?.trim() || null,
        isDead: Boolean(formData.isDead),
        isFamilyInfluencer: Boolean(formData.isFamilyInfluencer),
        socialInfluencerScope: formData.socialInfluencerScope || null,
        influenceReachCount: Number(formData.influenceReachCount) || 0,
      };

      if (isEditMode && id) {
        await dispatch(updateSuperAdminVoterItem(id, payload));
        toast.success('Voter updated successfully!');
      } else {
        await dispatch(createSuperAdminVoterItem(payload));
        toast.success('Voter created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard/voters');
      }, 800);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save voter';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const targetInfluencerObj = voterMeta
    ? {
      id: voterMeta.id,
      name: [voterMeta.engFirstName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.voterName || 'Voter',
      epicNo: voterMeta.epicNo,
      acId: voterMeta.acId,
      acName: voterMeta.acName,
      boothId: voterMeta.boothId,
      boothName: voterMeta.boothName,
      sectionNo: voterMeta.sectionNo,
      houseNo: voterMeta.houseNo,
      socialInfluencerScope: voterMeta.socialInfluencerScope || null,
    }
    : null;

  const linkedFamilyHead = useMemo(() => {
    const found = familyInfluencers.find((inf) => String(inf.value) === String(formData.familyInfluencerId));
    if (found) {
      return {
        name: found.label,
        epicNo: '',
      };
    }
    if (voterMeta && String(voterMeta.familyInfluencerId) === String(formData.familyInfluencerId)) {
      return {
        name: voterMeta.familyInfluencerName,
        epicNo: voterMeta.familyInfluencerEpic,
      };
    }
    return null;
  }, [familyInfluencers, formData.familyInfluencerId, voterMeta]);

  const linkedSocialLeader = useMemo(() => {
    const found = socialInfluencers.find((inf) => String(inf.value) === String(formData.socialInfluencerId));
    if (found) {
      return {
        name: found.label,
        epicNo: '',
      };
    }
    if (voterMeta && String(voterMeta.socialInfluencerId) === String(formData.socialInfluencerId)) {
      return {
        name: voterMeta.socialInfluencerName,
        epicNo: voterMeta.socialInfluencerEpic,
      };
    }
    return null;
  }, [socialInfluencers, formData.socialInfluencerId, voterMeta]);

  const handleSearchVillages = React.useCallback(async (query: string) => {
    return dispatch(searchSuperAdminMasterCategory('villages', '/masters/villages', query, 20));
  }, [dispatch]);

  const handleSearchTalukas = React.useCallback(async (query: string) => {
    return dispatch(searchSuperAdminMasterCategory('talukas', '/masters/talukas', query, 20));
  }, [dispatch]);

  const handleSearchProfessions = React.useCallback(async (query: string) => {
    return dispatch(searchSuperAdminMasterCategory('professions', '/masters/professions', query, 20));
  }, [dispatch]);

  const handleSearchSubcastes = React.useCallback(async (query: string) => {
    return dispatch(searchSuperAdminMasterCategory('castes', '/masters/castes', query, 20));
  }, [dispatch]);

  const handleSelectVillage = React.useCallback((village: any) => {
    if (!village || typeof village !== 'object') return;
    setFormData((prev: any) => ({
      ...prev,
      village: village.name || prev.village,
      taluka: village.talukaName || prev.taluka,
      districtId: village.districtId ? String(village.districtId) : prev.districtId,
      stateId: village.stateId ? String(village.stateId) : prev.stateId,
    }));
  }, []);

  const handleSelectTaluka = React.useCallback((taluka: any) => {
    if (!taluka || typeof taluka !== 'object') return;
    setFormData((prev: any) => ({
      ...prev,
      taluka: taluka.name || prev.taluka,
      districtId: taluka.districtId ? String(taluka.districtId) : prev.districtId,
      stateId: taluka.stateId ? String(taluka.stateId) : prev.stateId,
    }));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isEditMode ? ([formData.engFirstName, formData.engSurname].filter(Boolean).join(' ') || 'Edit Voter Record') : 'Register New Voter'}
        subtitle={isEditMode ? 'Modify electoral and demographic details for this voter' : 'Create master voter record across electoral constituencies'}
        icon={isEditMode ? <UserCheck className="w-5 h-5 text-indigo-500" /> : <UserPlus className="w-5 h-5 text-indigo-500" />}
        badge={
          isEditMode ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                #{formData.epicNo || 'EPIC'}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${formData.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {formData.status || 'ACTIVE'}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              New Voter Registration
            </span>
          )
        }
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/voters')}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
        }
      />

      {loadingVoter ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Fetching voter profile records...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          talukas={talukas}
          villages={villages}
          onSearchTalukas={handleSearchTalukas}
          onSearchVillages={handleSearchVillages}
          onSelectTaluka={handleSelectTaluka}
          onSelectVillage={handleSelectVillage}
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
          professionCategories={professionCategories}
          professions={professions}
          onSearchProfessions={handleSearchProfessions}
          onSearchSubcastes={handleSearchSubcastes}
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
          linkedFamilyHead={linkedFamilyHead}
          linkedSocialLeader={linkedSocialLeader}
        />

        {/* Sticky Bottom Actions Footer (Flush Bottom Aligned) */}
        <div className="sticky -bottom-4 sm:-bottom-6 z-30 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 mt-6 py-3.5 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isEditMode ? `Editing EPIC #${formData.epicNo || id}` : 'Ready to register voter'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard/voters')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? 'Saving...' : isEditMode ? 'Update Voter' : 'Register Voter'}
            </button>
          </div>
        </div>
      </form>
      )}

      {targetInfluencerObj && (
        <>
          <FamilyInfluencerAssignModal
            isOpen={familyModalOpen}
            onClose={() => setFamilyModalOpen(false)}
            influencer={targetInfluencerObj}
            isSuperAdmin={true}
            onSuccess={() => {
              setFamilyModalOpen(false);
              dispatch(fetchSuperAdminVoterById(id!)).then((data: any) => setVoterMeta(data));
            }}
          />

          <SocialInfluencerAssignModal
            isOpen={socialModalOpen}
            onClose={() => setSocialModalOpen(false)}
            influencer={targetInfluencerObj}
            isSuperAdmin={true}
            onSuccess={() => {
              setSocialModalOpen(false);
              dispatch(fetchSuperAdminVoterById(id!)).then((data: any) => setVoterMeta(data));
            }}
          />
        </>
      )}

      {isEditMode && id && (
        <LinkToInfluencerModal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          voterIds={[id]}
          boothId={formData.boothId}
          type={linkInfluencerType}
          isSuperAdmin={true}
          onSuccess={() => {
            setLinkModalOpen(false);
            dispatch(fetchSuperAdminVoterById(id)).then((data: any) => setVoterMeta(data));
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminVoterFormPage;
