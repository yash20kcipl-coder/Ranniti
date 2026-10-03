import {
  Vote,
  ArrowLeft,
  Edit2,
  Trash2,
  AlertTriangle,
  Crown,
  Sparkles,
} from 'lucide-react';
import {
  VoterProfileDetailCard,
  VoterAffiliationDetailCard,
  VoterFamilyNetworkDetailCard,
  VoterSocialInfluenceDetailCard,
  VoterGeographyDetailCard,
  VoterDemographicsDetailCard,
  VoterContactKycDetailCard,
} from './components';
import toast from 'react-hot-toast';
import {
  FamilyInfluencerAssignModal,
  SocialInfluencerAssignModal,
  LinkToInfluencerModal,
} from '@/components/common/influencer';
import React, { useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { fetchVoterById, deleteVoterItem, updateVoterItem, bulkAssignInfluencerAction } from '@/redux/actions/voter';

export const VoterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [voter, setVoter] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<'family' | 'social'>('family');
  const [linkInfluencerType, setLinkInfluencerType] = useState<'family' | 'social'>('family');

  const isFamilyHead = Boolean(voter?.isFamilyInfluencer || Number(voter?.familyInfluencedCount) > 0);
  const isSocialLeader = Boolean(voter?.isSocialInfluencer || Number(voter?.socialInfluencedCount) > 0);

  const handleToggleFamilyRole = async () => {
    if (!voter || !id) return;
    try {
      const nextVal = !isFamilyHead;
      await dispatch(
        updateVoterItem(voter.id, {
          isFamilyInfluencer: nextVal,
          ...(nextVal ? { familyInfluencerId: null } : {}),
        })
      );
      toast.success(nextVal ? 'Designated as Family Influencer' : 'Removed Family Influencer role');
      dispatch(fetchVoterById(id)).then((data) => setVoter(data));
    } catch (err: any) {
      toast.error('Failed to update influencer role');
    }
  };

  const handleToggleSocialRole = async () => {
    if (!voter || !id) return;
    try {
      const nextVal = !isSocialLeader;
      await dispatch(updateVoterItem(voter.id, { isSocialInfluencer: nextVal }));
      toast.success(nextVal ? 'Designated as Social Influencer' : 'Removed Social Influencer role');
      dispatch(fetchVoterById(id)).then((data) => setVoter(data));
    } catch (err: any) {
      toast.error('Failed to update influencer role');
    }
  };

  const handleUnlinkFamilyHead = async () => {
    if (!voter || !id) return;
    try {
      await dispatch(
        bulkAssignInfluencerAction({
          influencerId: null,
          influencerType: 'family',
          voterIds: [voter.id],
        })
      );
      toast.success('Unlinked from family head');
      dispatch(fetchVoterById(id)).then((data) => setVoter(data));
    } catch (err: any) {
      toast.error('Failed to unlink from family head');
    }
  };

  const handleUnlinkSocialLeader = async () => {
    if (!voter || !id) return;
    try {
      await dispatch(
        bulkAssignInfluencerAction({
          influencerId: null,
          influencerType: 'social',
          voterIds: [voter.id],
        })
      );
      toast.success('Unlinked from social leader');
      dispatch(fetchVoterById(id)).then((data) => setVoter(data));
    } catch (err: any) {
      toast.error('Failed to unlink from social leader');
    }
  };

  // Fetch Voter Details (Debounced 150ms per Rule 13)
  useDebouncedEffect(
    () => {
      if (!id) return;
      let isMounted = true;
      setLoading(true);
      dispatch(fetchVoterById(id))
        .then((data) => {
          if (isMounted) setVoter(data);
        })
        .catch(() => {
          toast.error('Failed to load voter details');
          navigate('/dashboard/voters');
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    },
    150,
    [id, dispatch, navigate]
  );

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await dispatch(deleteVoterItem(id));
      toast.success('Voter record deleted successfully');
      navigate('/dashboard/voters');
    } catch (err) {
      // Handled in thunk
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading voter details...</p>
        </div>
      </div>
    );
  }

  if (!voter) {
    return (
      <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
        <p className="text-slate-600 dark:text-slate-400">Voter record not found.</p>
        <button
          onClick={() => navigate('/dashboard/voters')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          Return to Voter Directory
        </button>
      </div>
    );
  }

  const engFullName = [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || 'Unnamed Voter';
  const localFullName = [voter.firstName, voter.middleName, voter.surname].filter(Boolean).join(' ');

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'SHIFTED':
        return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'UNVERIFIED':
        return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400';
      case 'INACTIVE':
        return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400';
      default:
        return 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20 text-slate-700 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Deceased Warning Alert Banner */}
      {voter.isDead && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 shadow-sm dark:shadow-xl backdrop-blur-xl">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-sm block">DECEASED VOTER RECORD</span>
            <span>This voter has been marked as deceased on the electoral roll.</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <PageHeader
        title={engFullName}
        subtitle={localFullName ? `${localFullName} • EPIC No: ${voter.epicNo}` : `EPIC No: ${voter.epicNo}`}
        icon={<Vote className="w-6 h-6" />}
        badge={
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border font-semibold text-xs ${getStatusBadge(voter.status)}`}>
              {voter.status || 'ACTIVE'}
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-semibold text-xs">
              {voter.voterType || 'Voter'}
            </span>
            {Number(voter.familyInfluencedCount) > 0 && (
              <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold text-xs inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Family Influencer ({voter.familyInfluencedCount})
              </span>
            )}
            {Number(voter.socialInfluencedCount) > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 font-semibold text-xs inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Social Influencer ({voter.socialInfluencedCount})
              </span>
            )}
          </div>
        }
        actions={
          <>
            <button
              onClick={() => navigate('/dashboard/voters')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => navigate(`/dashboard/voters/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-medium shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Voter</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer shadow-sm dark:shadow-none"
              title="Delete Voter"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        }
      />

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <VoterProfileDetailCard
            voter={voter}
            engFullName={engFullName}
            localFullName={localFullName}
          />

          <VoterAffiliationDetailCard voter={voter} />


          {/* Household & Family Network */}
          <VoterFamilyNetworkDetailCard
            voter={voter}
            isFamilyHead={isFamilyHead}
            setModalInitialType={setModalInitialType}
            setAssignModalOpen={setAssignModalOpen}
            setLinkInfluencerType={setLinkInfluencerType}
            setLinkModalOpen={setLinkModalOpen}
            handleToggleFamilyRole={handleToggleFamilyRole}
            handleUnlinkFamilyHead={handleUnlinkFamilyHead}
          />

          {/* Community & Social Influence */}
          <VoterSocialInfluenceDetailCard
            voter={voter}
            isSocialLeader={isSocialLeader}
            setModalInitialType={setModalInitialType}
            setAssignModalOpen={setAssignModalOpen}
            setLinkInfluencerType={setLinkInfluencerType}
            setLinkModalOpen={setLinkModalOpen}
            handleToggleSocialRole={handleToggleSocialRole}
            handleUnlinkSocialLeader={handleUnlinkSocialLeader}
          />
        </div>

        {/* Right Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          <VoterGeographyDetailCard voter={voter} />

          <VoterDemographicsDetailCard voter={voter} />

          <VoterContactKycDetailCard voter={voter} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Voter Record"
        description={`Are you sure you want to delete voter record with EPIC '${voter.epicNo}'? This operation cannot be undone.`}
        confirmText="Delete Record"
        variant="danger"
      />

      {/* Dedicated Influencer Assignment Modals */}
      {voter && modalInitialType === 'family' && (
        <FamilyInfluencerAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          influencer={{
            id: voter.id,
            name: [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.epicNo,
            engName: [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.epicNo,
            epicNo: voter.epicNo,
            boothId: voter.boothId,
            boothName: voter.boothName,
            sectionNo: voter.sectionNo,
            houseNo: voter.houseNo,
            avatar: voter.avatar,
            familyInfluencedCount: voter.familyInfluencedCount,
          }}
          onSuccess={() => {
            if (id) dispatch(fetchVoterById(id)).then((data) => setVoter(data));
          }}
        />
      )}

      {voter && modalInitialType === 'social' && (
        <SocialInfluencerAssignModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          influencer={{
            id: voter.id,
            name: [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.epicNo,
            engName: [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.epicNo,
            epicNo: voter.epicNo,
            boothId: voter.boothId,
            boothName: voter.boothName,
            sectionNo: voter.sectionNo,
            houseNo: voter.houseNo,
            avatar: voter.avatar,
            socialInfluencedCount: voter.socialInfluencedCount,
          }}
          onSuccess={() => {
            if (id) dispatch(fetchVoterById(id)).then((data) => setVoter(data));
          }}
        />
      )}

      {/* Link this Voter to an Influencer Leader Modal */}
      {voter && (
        <LinkToInfluencerModal
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          voterIds={[voter.id]}
          type={linkInfluencerType}
          onSuccess={() => {
            setLinkModalOpen(false);
            if (id) dispatch(fetchVoterById(id)).then((data) => setVoter(data));
          }}
        />
      )}
    </div>
  );
};

export default VoterDetailPage;
