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
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchTenantMasterCategoryData, searchTenantMasterCategory } from '@/redux/actions/masterTenant';
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
  UserPlus,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  const currentUser = useAppSelector((state) => state.user.myprofile || state.user.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Load master categories excluding heavy booths
  const { religions, castes, acs, states, districts, pcs, parties, professionCategories, professions, talukas, villages } = useTenantMasterData([
    'states', 'districts', 'pcs', 'acs', 'religions', 'castes', 'parties', 'professionCategories', 'professions', 'talukas', 'villages'
  ]);

  // Resolve assigned PC for tenant from Redux user profile or loaded tenant pcs
  const assignedPc = useMemo(() => {
    const userPcId = (currentUser as any)?.assignedPcId;
    if (userPcId) {
      const found = pcs?.find((p: any) => String(p.id) === String(userPcId));
      if (found) return found;
    }
    if (Array.isArray((currentUser as any)?.pcIds) && (currentUser as any).pcIds.length > 0) {
      const targetId = (currentUser as any).pcIds[0];
      const found = pcs?.find((p: any) => String(p.id) === String(targetId));
      if (found) return found;
    }
    return pcs?.length > 0 ? pcs[0] : null;
  }, [pcs, currentUser]);

  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);

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
    guardianName: '',
    relation: '',
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
    religion: '',
    casteId: '',
    casteName: '',
    caste: '',
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
    socialInfluencerScope: null as 'booth' | 'ac' | null,
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
            const socialScope = voter.socialInfluencerScope || (Number(voter.socialInfluencedCount) > 0 ? 'booth' : null);

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
              guardianName: voter.guardianName || voter.relativeName || '',
              relation: voter.relation || '',
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
              religion: voter.religionName || '',
              casteId: voter.casteId ? String(voter.casteId) : '',
              casteName: voter.casteName || '',
              caste: voter.casteName || '',
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
              socialInfluencerScope: socialScope,
            });

            if (voter.fullAddress && voter.fullAddress === voter.voterAddress) {
              setSameAddress(true);
            }
          }
        })
        .catch(() => {
          toast.error('Failed to load voter details');
        })
        .finally(() => {
          setLoadingVoter(false);
        });
    }
  }, 150, [dispatch, id, isEditMode]);

  // Auto-populate tenant's assigned PC, State, District, and single AC in Create mode
  useDebouncedEffect(() => {
    if (isEditMode) return;

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      // 1. Prepopulate PC from assigned tenant PC
      if (!next.pcId && assignedPc?.id) {
        next.pcId = String(assignedPc.id);
        changed = true;
      }

      // 2. Prepopulate State from assigned PC
      const targetStateId = assignedPc?.stateId;
      if (!next.stateId && targetStateId) {
        next.stateId = String(targetStateId);
        changed = true;
      }

      // 3. Resolve target AC (either user assigned AC or if single AC)
      const userAcId = (currentUser as any)?.assignedAcId;
      const targetAc =
        (userAcId ? acs?.find((a: any) => String(a.id) === String(userAcId)) : null) ||
        (Array.isArray((currentUser as any)?.acIds) && (currentUser as any).acIds.length === 1
          ? acs?.find((a: any) => String(a.id) === String((currentUser as any).acIds[0]))
          : null) ||
        (acs?.length === 1 ? acs[0] : null);

      if (!next.acId && targetAc?.id) {
        next.acId = String(targetAc.id);
        changed = true;
      }

      // 4. Prepopulate District from target AC or matching AC
      const effectiveAc = targetAc || (next.acId ? acs?.find((a: any) => String(a.id) === String(next.acId)) : null);
      if (!next.districtId && effectiveAc?.districtId) {
        next.districtId = String(effectiveAc.districtId);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, 100, [assignedPc, acs, currentUser, isEditMode]);

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

      // Smart cascading resets & auto-linking
      if (name === 'stateId') {
        updated.districtId = '';
        updated.pcId = '';
        updated.acId = '';
        updated.boothId = '';
        updated.taluka = '';
        updated.village = '';
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
        if (updated.taluka && value) {
          const currentTaluka = (talukas || []).find(
            (t: any) => (t.name || '').trim().toLowerCase() === String(updated.taluka).trim().toLowerCase()
          );
          if (currentTaluka && currentTaluka.districtId && String(currentTaluka.districtId) !== String(value)) {
            updated.taluka = '';
            updated.village = '';
          }
        }
        if (updated.village && value) {
          const currentVillageObj = (villages || []).find(
            (v: any) => (v.name || '').trim().toLowerCase() === String(updated.village).trim().toLowerCase()
          );
          if (currentVillageObj && currentVillageObj.districtId && String(currentVillageObj.districtId) !== String(value)) {
            updated.village = '';
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
        const valStr = String(value || '').trim();
        const matchingRel = (religions || []).find(
          (r: any) => (r.religionName || r.name || '').trim().toLowerCase() === valStr.toLowerCase()
        );
        updated.religion = value;
        updated.religionName = value;
        updated.religionId = matchingRel ? String(matchingRel.id) : '';

        // If current caste does not belong to this religion, clear caste and subcaste
        if (updated.casteId && matchingRel) {
          const currentCaste = (castes || []).find((c: any) => String(c.id) === String(updated.casteId));
          if (currentCaste && currentCaste.religionId && String(currentCaste.religionId) !== String(matchingRel.id)) {
            updated.caste = '';
            updated.casteId = '';
            updated.casteName = '';
            updated.subcasteName = '';
          }
        }
      } else if (name === 'caste' || name === 'casteName') {
        const valStr = String(value || '').trim();
        const matchingCaste = (castes || []).find(
          (c: any) => !(c.parentCasteId || c.parent_caste_id) && (c.casteName || c.name || '').trim().toLowerCase() === valStr.toLowerCase()
        ) || (castes || []).find(
          (c: any) => (c.casteName || c.name || '').trim().toLowerCase() === valStr.toLowerCase()
        );

        updated.caste = value;
        updated.casteName = value;
        updated.casteId = matchingCaste ? String(matchingCaste.id) : '';

        // Auto-populate Religion from caste
        if (matchingCaste) {
          const targetRelId = matchingCaste.religionId || matchingCaste.religion_id;
          let rel = targetRelId ? (religions || []).find((r: any) => String(r.id) === String(targetRelId)) : null;
          const candidateRelName = String((rel && (rel.religionName || rel.name)) || matchingCaste.religionName || matchingCaste.religion_name || '').trim();
          if (!rel && candidateRelName) {
            rel = (religions || []).find((r: any) => (r.religionName || r.name || '').trim().toLowerCase() === candidateRelName.toLowerCase());
          }
          const finalRelName = rel ? (rel.religionName || rel.name) : candidateRelName;
          if (finalRelName) {
            updated.religion = finalRelName;
            updated.religionName = finalRelName;
            if (rel) updated.religionId = String(rel.id);
            else if (targetRelId) updated.religionId = String(targetRelId);
          }
        }

        // If current subcaste does not belong to this caste, clear subcaste
        if (updated.subcasteName && matchingCaste) {
          const currentSub = (castes || []).find(
            (c: any) => (c.parentCasteId || c.parent_caste_id) && (c.casteName || c.name || '').trim().toLowerCase() === String(updated.subcasteName).trim().toLowerCase()
          );
          const pId = currentSub ? (currentSub.parentCasteId || currentSub.parent_caste_id) : null;
          if (currentSub && pId && String(pId) !== String(matchingCaste.id)) {
            updated.subcasteName = '';
          }
        }
      } else if (name === 'subcasteName' || name === 'subCaste') {
        const valStr = String(value || '').trim();
        updated.subcasteName = value;

        if (valStr) {
          const matchingSub = (castes || []).find(
            (c: any) => (c.parentCasteId || c.parent_caste_id) && (c.casteName || c.name || '').trim().toLowerCase() === valStr.toLowerCase()
          ) || (castes || []).find(
            (c: any) => (c.casteName || c.name || '').trim().toLowerCase() === valStr.toLowerCase()
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
              updated.caste = parentCasteName;
              updated.casteName = parentCasteName;
              updated.casteId = parentCasteId;
            }

            // Auto-populate Religion from parent caste or subcaste
            const targetRelId = (parentC && (parentC.religionId || parentC.religion_id)) || matchingSub.religionId || matchingSub.religion_id;
            let rel = targetRelId ? (religions || []).find((r: any) => String(r.id) === String(targetRelId)) : null;
            const candidateRelName = String((rel && (rel.religionName || rel.name)) || (parentC && (parentC.religionName || parentC.religion_name)) || matchingSub.religionName || matchingSub.religion_name || '').trim();
            if (!rel && candidateRelName) {
              rel = (religions || []).find((r: any) => (r.religionName || r.name || '').trim().toLowerCase() === candidateRelName.toLowerCase());
            }

            const finalRelName = rel ? (rel.religionName || rel.name) : candidateRelName;
            if (finalRelName) {
              updated.religion = finalRelName;
              updated.religionName = finalRelName;
              if (rel) updated.religionId = String(rel.id);
              else if (targetRelId) updated.religionId = String(targetRelId);
            }
          }
        }
      } else if (name === 'profession') {
        const valStr = String(value || '').trim();
        updated.profession = value;
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
              updated.professionType = finalCatName;
            }
          }
        }
      } else if (name === 'professionType') {
        const valStr = String(value || '').trim();
        updated.professionType = value;
        if (updated.profession && valStr) {
          const matchedProf = (professions || []).find(
            (p: any) => (p.name || '').trim().toLowerCase() === String(updated.profession).trim().toLowerCase()
          );
          if (matchedProf && matchedProf.categoryId) {
            const matchedCat = (professionCategories || []).find((c: any) => String(c.id) === String(matchedProf.categoryId));
            if (!matchedCat || matchedCat.name.trim().toLowerCase() !== valStr.toLowerCase()) {
              updated.profession = '';
            }
          }
        }
      } else if (name === 'village') {
        const valStr = String(value || '').trim();
        updated.village = value;
        if (valStr) {
          const matchedVillage = (villages || []).find(
            (v: any) => (v.name || '').trim().toLowerCase() === valStr.toLowerCase()
          );
          if (matchedVillage) {
            // Auto-populate Taluka
            if (matchedVillage.talukaName) {
              updated.taluka = matchedVillage.talukaName;
            } else if (matchedVillage.talukaId) {
              const matchedTaluka = (talukas || []).find((t: any) => String(t.id) === String(matchedVillage.talukaId));
              if (matchedTaluka) updated.taluka = matchedTaluka.name;
            }

            // Auto-populate District if not locked or currently empty
            if (matchedVillage.districtId && (isSuperAdmin || !updated.districtId)) {
              updated.districtId = String(matchedVillage.districtId);
            }

            // Auto-populate State if not locked or currently empty
            if (matchedVillage.stateId && (isSuperAdmin || !updated.stateId)) {
              updated.stateId = String(matchedVillage.stateId);
            }
          }
        }
      } else if (name === 'taluka') {
        const valStr = String(value || '').trim();
        updated.taluka = value;
        if (valStr) {
          const matchedTaluka = (talukas || []).find(
            (t: any) => (t.name || '').trim().toLowerCase() === valStr.toLowerCase()
          );
          if (matchedTaluka) {
            // Auto-populate District if not locked or currently empty
            if (matchedTaluka.districtId && (isSuperAdmin || !updated.districtId)) {
              updated.districtId = String(matchedTaluka.districtId);
            }

            // Auto-populate State if not locked or currently empty
            if (matchedTaluka.stateId && (isSuperAdmin || !updated.stateId)) {
              updated.stateId = String(matchedTaluka.stateId);
            }

            // If current village doesn't belong to this taluka, clear village
            if (updated.village) {
              const currentVillageObj = (villages || []).find(
                (v: any) => (v.name || '').trim().toLowerCase() === String(updated.village).trim().toLowerCase()
              );
              if (
                currentVillageObj &&
                currentVillageObj.talukaId &&
                String(currentVillageObj.talukaId) !== String(matchedTaluka.id)
              ) {
                updated.village = '';
              }
            }
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
    if (formData.mobileNo && !/^[0-9]{10}$/.test(formData.mobileNo.replace(/[\s\-\+]/g, '').replace(/^91/, ''))) {
      newErrors.mobileNo = 'Enter valid 10-digit mobile number';
    }

    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      toast.error('Please fill required fields (EPIC Number, First Name, and Booth)');
      const el = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

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
      guardianName: formData.guardianName?.trim() || null,
      relation: formData.relation?.trim() || null,
      gender: formData.gender,
      dob: formData.dob || null,
      age: formData.age ? Number(formData.age) : null,
      mobileNo: formData.mobileNo?.trim() || null,
      email: formData.email?.trim() || null,
      aadhaarNo: formData.aadhaarNo?.trim() || null,
      panNo: formData.panNo?.trim() || null,
      professionType: formData.professionType?.trim() || null,
      profession: formData.profession?.trim() || null,
      religionId: formData.religionId ? formData.religionId : null,
      religionName: formData.religionName?.trim() || formData.religion?.trim() || null,
      casteId: formData.casteId ? formData.casteId : null,
      casteName: formData.casteName?.trim() || formData.caste?.trim() || null,
      subcasteName: formData.subcasteName?.trim() || null,
      voterType: formData.voterType,
      status: formData.status,
      isDead: formData.isDead,
      bloodGroup: formData.bloodGroup?.trim() || null,
      avatar: formData.avatar instanceof File ? formData.avatar : (typeof formData.avatar === 'string' && formData.avatar.trim() ? formData.avatar.trim() : null),
      taluka: formData.taluka?.trim() || null,
      village: formData.village?.trim() || null,
      fullAddress: formData.fullAddress?.trim() || null,
      voterAddress: formData.voterAddress?.trim() || null,
      partyId: formData.partyId ? formData.partyId : null,
      familyInfluencerId: formData.familyInfluencerId ? formData.familyInfluencerId : null,
      socialInfluencerId: formData.socialInfluencerId ? formData.socialInfluencerId : null,
      isFamilyInfluencer: formData.isFamilyInfluencer,
      socialInfluencerScope: formData.socialInfluencerScope || null,
    };

    try {
      if (isEditMode && id) {
        await dispatch(updateVoterItem(id, payload));
        toast.success('Voter details updated successfully!');
      } else {
        await dispatch(createVoterItem(payload));
        toast.success('New voter created successfully!');
      }

      // Auto-refresh master categories in Redux store for newly added values (non-blocking)
      dispatch(fetchTenantMasterCategoryData('religions', TENANT_MASTER_ENDPOINTS.religions, false)).catch(() => { });
      dispatch(fetchTenantMasterCategoryData('castes', TENANT_MASTER_ENDPOINTS.castes, false)).catch(() => { });
      setTimeout(() => {
        navigate('/dashboard/voters');
      }, 800);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save voter details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Dropdown Options mapped to Option[] standard
  const stateOptions: Option[] = useMemo(() => {
    const list = (states || []).map((s: any) => ({
      label: s.stateName || s.name || `State #${s.id}`,
      value: String(s.id),
    }));
    if (formData.stateId && !list.some((o) => o.value === String(formData.stateId))) {
      const pcMatch = pcs?.find((p: any) => String(p.stateId) === String(formData.stateId));
      const acMatch = acs?.find((a: any) => String(a.stateId) === String(formData.stateId));
      list.unshift({
        label: pcMatch?.stateName || acMatch?.stateName || `State #${formData.stateId}`,
        value: String(formData.stateId),
      });
    }
    return list;
  }, [states, pcs, acs, formData.stateId]);

  const districtOptions: Option[] = useMemo(() => {
    const list = (districts || [])
      .filter((d: any) => {
        if (formData.districtId && String(d.id) === String(formData.districtId)) return true;
        return !formData.stateId || String(d.stateId) === String(formData.stateId);
      })
      .map((d: any) => ({
        label: d.districtName || d.name || `District #${d.id}`,
        value: String(d.id),
      }));
    if (formData.districtId && !list.some((o) => o.value === String(formData.districtId))) {
      const acMatch = acs?.find((a: any) => String(a.districtId) === String(formData.districtId));
      list.unshift({
        label: acMatch?.districtName || `District #${formData.districtId}`,
        value: String(formData.districtId),
      });
    }
    return list;
  }, [districts, acs, formData.districtId, formData.stateId]);

  const pcOptions: Option[] = useMemo(() => {
    const list = (pcs || [])
      .filter((p: any) => {
        if (formData.pcId && String(p.id) === String(formData.pcId)) return true;
        return !formData.stateId || String(p.stateId) === String(formData.stateId);
      })
      .map((p: any) => ({
        label: `${p.pcNo ? `[PC-${p.pcNo}] ` : ''}${p.pcName || p.name || `PC #${p.id}`}`,
        value: String(p.id),
      }));
    if (formData.pcId && !list.some((o) => o.value === String(formData.pcId))) {
      const p = pcs?.find((item: any) => String(item.id) === String(formData.pcId));
      if (p) {
        list.unshift({
          label: `${p.pcNo ? `[PC-${p.pcNo}] ` : ''}${p.pcName || p.name || `PC #${p.id}`}`,
          value: String(p.id),
        });
      }
    }
    return list;
  }, [pcs, formData.pcId, formData.stateId]);

  const acOptions: Option[] = useMemo(() => {
    return (acs || [])
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
  }, [acs, formData.acId, formData.pcId, formData.districtId, formData.stateId]);



  const religionSuggestions: string[] = useMemo(() => {
    return Array.from(new Set((religions || []).map((r: any) => r.religionName || r.name).filter(Boolean)));
  }, [religions]);

  const casteSuggestions: string[] = useMemo(() => {
    const primaryCastes = (castes || []).filter((c: any) => !c.parentCasteId);
    const targetRelId = formData.religionId || (religions || []).find(
      (r: any) => (r.religionName || r.name || '').trim().toLowerCase() === String(formData.religionName || '').trim().toLowerCase()
    )?.id;

    if (targetRelId) {
      return Array.from(
        new Set(
          primaryCastes
            .filter((c: any) => String(c.religionId) === String(targetRelId))
            .map((c: any) => c.casteName || c.name)
            .filter(Boolean)
        )
      );
    }
    return Array.from(new Set(primaryCastes.map((c: any) => c.casteName || c.name).filter(Boolean)));
  }, [castes, religions, formData.religionId, formData.religionName]);

  const subcasteSuggestions: string[] = useMemo(() => {
    const subcastes = (castes || []).filter((c: any) => Boolean(c.parentCasteId));
    const targetCasteId = formData.casteId || (castes || []).find(
      (c: any) => !c.parentCasteId && (c.casteName || c.name || '').trim().toLowerCase() === String(formData.casteName || '').trim().toLowerCase()
    )?.id;

    if (targetCasteId) {
      return Array.from(
        new Set(
          subcastes
            .filter((c: any) => String(c.parentCasteId) === String(targetCasteId))
            .map((c: any) => c.casteName || c.name)
            .filter(Boolean)
        )
      );
    }
    return Array.from(new Set(subcastes.map((c: any) => c.casteName || c.name).filter(Boolean)));
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

  const handleSearchVillages = React.useCallback(async (query: string) => {
    return dispatch(searchTenantMasterCategory('villages', '/tenant/villages', query, 20));
  }, [dispatch]);

  const handleSearchTalukas = React.useCallback(async (query: string) => {
    return dispatch(searchTenantMasterCategory('talukas', '/tenant/talukas', query, 20));
  }, [dispatch]);

  const handleSearchProfessions = React.useCallback(async (query: string) => {
    return dispatch(searchTenantMasterCategory('professions', '/tenant/professions', query, 20));
  }, [dispatch]);

  const handleSearchSubcastes = React.useCallback(async (query: string) => {
    return dispatch(searchTenantMasterCategory('castes', '/tenant/castes', query, 20));
  }, [dispatch]);

  const handleSelectVillage = React.useCallback((village: any) => {
    if (!village || typeof village !== 'object') return;
    setFormData((prev: any) => ({
      ...prev,
      village: village.name || prev.village,
      taluka: village.talukaName || prev.taluka,
      ...(isSuperAdmin && village.districtId ? { districtId: String(village.districtId) } : {}),
      ...(isSuperAdmin && village.stateId ? { stateId: String(village.stateId) } : {}),
    }));
  }, [isSuperAdmin]);

  const handleSelectTaluka = React.useCallback((taluka: any) => {
    if (!taluka || typeof taluka !== 'object') return;
    setFormData((prev: any) => ({
      ...prev,
      taluka: taluka.name || prev.taluka,
      ...(isSuperAdmin && taluka.districtId ? { districtId: String(taluka.districtId) } : {}),
      ...(isSuperAdmin && taluka.stateId ? { stateId: String(taluka.stateId) } : {}),
    }));
  }, [isSuperAdmin]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title={isEditMode ? ([formData.engFirstName, formData.engSurname].filter(Boolean).join(' ') || 'Edit Voter Details') : 'Register New Voter'}
        subtitle={
          isEditMode
            ? `Update electoral and demographic profile for EPIC #${formData.epicNo || id}`
            : 'Fill in complete voter information, electoral geography, and influencer links'
        }
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
            <span>Back to Directory</span>
          </button>
        }
      />

      {loadingVoter ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Fetching voter profile records...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Identification & Profile Status */}
          <VoterIdentificationFormSection
            errors={errors}
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            statusOptions={statusOptions}
            genderOptions={genderOptions}
            voterTypeOptions={voterTypeOptions}
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
            disableGeography={!isSuperAdmin}
            talukas={talukas}
            villages={villages}
            onSearchTalukas={handleSearchTalukas}
            onSearchVillages={handleSearchVillages}
            onSelectTaluka={handleSelectTaluka}
            onSelectVillage={handleSelectVillage}
          />

          {/* Section 3: Contact & Demographics */}
          <VoterDemographicsFormSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            religionSuggestions={religionSuggestions}
            casteSuggestions={casteSuggestions}
            subcasteSuggestions={subcasteSuggestions}
            religionOptions={religionOptions}
            casteOptions={casteOptions}
            professionCategories={professionCategories}
            professions={professions}
            onSearchProfessions={handleSearchProfessions}
            onSearchSubcastes={handleSearchSubcastes}
          />

          {/* Section 4: Party Affiliation & Influencer Networks */}
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

      {/* Dedicated Influencer Assignment Modals */}
      {isEditMode && voterMeta && assignModalType === 'family' && (
        <FamilyInfluencerAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          isSuperAdmin={isSuperAdmin}
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
          isSuperAdmin={isSuperAdmin}
          influencer={{
            id: voterMeta.id,
            name: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            engName: [voterMeta.engFirstName, voterMeta.engMiddleName, voterMeta.engSurname].filter(Boolean).join(' ') || voterMeta.epicNo,
            epicNo: voterMeta.epicNo,
            acId: voterMeta.acId,
            acName: voterMeta.acName,
            boothId: voterMeta.boothId,
            boothName: voterMeta.boothName,
            sectionNo: voterMeta.sectionNo,
            houseNo: voterMeta.houseNo,
            avatar: voterMeta.avatar,
            socialInfluencedCount: voterMeta.socialInfluencedCount,
            socialInfluencerScope: voterMeta.socialInfluencerScope || null,
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
          boothId={formData.boothId}
          type={linkInfluencerType}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            dispatch(fetchVoterById(id)).then((data: any) => {
              if (data) {
                setVoterMeta(data);
                setFormData((prev) => ({
                  ...prev,
                  familyInfluencerId: data.familyInfluencerId ? String(data.familyInfluencerId) : '',
                  socialInfluencerId: data.socialInfluencerId ? String(data.socialInfluencerId) : '',
                  isFamilyInfluencer: Boolean(data.isFamilyInfluencer || Number(data.familyInfluencedCount) > 0),
                  socialInfluencerScope: data.socialInfluencerScope || (Number(data.socialInfluencedCount) > 0 ? 'booth' : null),
                }));
              }
            });
          }}
        />
      )}
    </div>
  );
};
