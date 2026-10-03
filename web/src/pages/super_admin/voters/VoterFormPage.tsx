import {
  fetchSuperAdminVoterById,
  createSuperAdminVoterItem,
  updateSuperAdminVoterItem,
  fetchSuperAdminInfluencerOptions,
} from '@/redux/actions/voterSuperAdmin';
import {
  FORM_GENDER_OPTIONS,
  FORM_VOTER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from '@/constants/dropdownOptions';
import { calculateAge } from '@/utils';
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { useMasterData } from '@/hooks/useMasterData';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

// Shared Standard Components
import type { Option } from '@/components/common/FormInput';
import { PageHeader } from '@/components/common/PageHeader';

// Section Components (Reused from tenant voter components)
import {
  VoterIdentificationFormSection,
  VoterGeographyFormSection,
  VoterInfluencerFormSection,
  VoterDemographicsFormSection,
} from '@/pages/tenant/voters/components';

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
  const { booths, religions, castes, acs, states, districts, pcs, parties } = useMasterData();

  const [submitting, setSubmitting] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [voterMeta, setVoterMeta] = useState<any | null>(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');

  const [formData, setFormData] = useState<Record<string, any>>({
    epicNo: '',
    voterIdNo: '',
    serialNo: 0,
    sectionNo: 0,
    partNo: '',
    isDead: 'false',
    status: 'ACTIVE',
    voterType: 'General Voter',
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
    casteId: '',
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

    houseNo: '',
    houseName: '',
    streetName: '',
    areaLocality: '',
    cityTown: '',
    postOffice: '',
    pinCode: '',

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
    occupation: '',
    annualIncome: '',

    isFamilyInfluencer: 'false',
    isSocialInfluencer: 'false',
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

  const [familyInfluencers, setFamilyInfluencers] = useState<Option[]>([]);
  const [socialInfluencers, setSocialInfluencers] = useState<Option[]>([]);

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
              label: `${opt.name} (${opt.epicNo})`,
              value: opt.id,
            }))
          )
        )
        .catch(() => {});

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
              label: `${opt.name} (${opt.epicNo})`,
              value: opt.id,
            }))
          )
        )
        .catch(() => {});
    },
    200,
    [dispatch, formData.boothId, id]
  );

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingVoter(true);
    dispatch(fetchSuperAdminVoterById(id))
      .then((data: any) => {
        if (!data) return;
        setVoterMeta(data);
        setFormData({
          epicNo: data.epicNo || '',
          voterIdNo: data.voterIdNo || '',
          serialNo: data.serialNo || 0,
          sectionNo: data.sectionNo || 0,
          partNo: data.partNo || '',
          isDead: String(data.isDead ?? false),
          status: data.status || 'ACTIVE',
          voterType: data.voterType || 'General Voter',
          partyAffiliationId: data.partyAffiliationId || '',

          engFirstName: data.engFirstName || '',
          engMiddleName: data.engMiddleName || '',
          engSurname: data.engSurname || '',
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          surname: data.surname || '',
          dob: data.dob ? data.dob.slice(0, 10) : '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || 'Male',
          religionId: data.religionId || '',
          casteId: data.casteId || '',
          subCaste: data.subCaste || '',

          stateId: data.stateId || '',
          districtId: data.districtId || '',
          pcId: data.pcId || '',
          acId: data.acId || '',
          boothId: data.boothId || '',

          guardianName: data.guardianName || '',
          relationType: data.relationType || 'Father',
          guardianNameEng: data.guardianNameEng || '',

          mobileNo: data.mobileNo || '',
          alternateMobileNo: data.alternateMobileNo || '',
          email: data.email || '',

          houseNo: data.houseNo || '',
          houseName: data.houseName || '',
          streetName: data.streetName || '',
          areaLocality: data.areaLocality || '',
          cityTown: data.cityTown || '',
          postOffice: data.postOffice || '',
          pinCode: data.pinCode || '',

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
          occupation: data.occupation || '',
          annualIncome: data.annualIncome || '',

          isFamilyInfluencer: String(data.isFamilyInfluencer ?? false),
          isSocialInfluencer: String(data.isSocialInfluencer ?? false),
          influencerCategory: data.influencerCategory || '',
          influencerNotes: data.influencerNotes || '',
          influencerRole: data.influencerRole || '',
          influencerStatus: data.influencerStatus || 'Active',
          influenceReachCount: data.influenceReachCount || 0,
          mappedFamilyMembersCount: data.mappedFamilyMembersCount || 0,
          mappedSocialVotersCount: data.mappedSocialVotersCount || 0,

          familyInfluencerId: data.familyInfluencerId || '',
          familyInfluencerHeadName: data.familyInfluencerHeadName || '',
          socialInfluencerId: data.socialInfluencerId || '',
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
  }, [dispatch, id, isEditMode]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'dob' && value) {
        next.age = String(calculateAge(value));
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
    setSubmitting(true);
    setToastMessage(null);

    try {
      const payload: Record<string, any> = {
        ...formData,
        serialNo: Number(formData.serialNo) || 0,
        sectionNo: Number(formData.sectionNo) || 0,
        age: formData.age ? Number(formData.age) : undefined,
        isDead: formData.isDead === 'true',
        isFamilyInfluencer: formData.isFamilyInfluencer === 'true',
        isSocialInfluencer: formData.isSocialInfluencer === 'true',
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
        navigate('/dashboard/super-admin/voters');
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={isEditMode ? 'Edit Super Admin Voter Record' : 'Add New Super Admin Voter'}
        subtitle="Manage master voter records across all electoral constituencies"
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/super-admin/voters')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
        }
      />

      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            toastMessage.type === 'success'
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
          handleChange={handleChange}
          formVoterTypeOptions={FORM_VOTER_TYPE_OPTIONS}
          statusOptions={STATUS_OPTIONS}
          parties={parties}
        />

        <VoterGeographyFormSection
          formData={formData}
          handleChange={handleChange}
          states={states}
          districts={districts}
          pcs={pcs}
          acs={acs}
          booths={booths}
          sameAddress={sameAddress}
          handleCopyPresentAddress={handleCopyPresentAddress}
        />

        <VoterDemographicsFormSection
          formData={formData}
          handleChange={handleChange}
          formGenderOptions={FORM_GENDER_OPTIONS}
          religions={religions}
          castes={castes}
          bloodGroupOptions={BLOOD_GROUP_OPTIONS}
        />

        <VoterInfluencerFormSection
          formData={formData}
          handleChange={handleChange}
          familyInfluencers={familyInfluencers}
          socialInfluencers={socialInfluencers}
          onOpenFamilyAssignModal={() => setFamilyModalOpen(true)}
          onOpenSocialAssignModal={() => setSocialModalOpen(true)}
          onOpenLinkModal={(type) => {
            setLinkInfluencerType(type);
            setLinkModalOpen(true);
          }}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/dashboard/super-admin/voters')}
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
