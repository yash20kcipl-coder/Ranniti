import React, { useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchSuperAdminVoterById } from '@/redux/actions/voterSuperAdmin';
import { ArrowLeft, Edit, UserCheck, ShieldAlert, AlertTriangle, Crown, Sparkles } from 'lucide-react';

// Section Components
import {
  VoterProfileDetailCard,
  VoterAffiliationDetailCard,
  VoterDemographicsDetailCard,
  VoterGeographyDetailCard,
  VoterContactKycDetailCard,
  VoterFamilyNetworkDetailCard,
  VoterSocialInfluenceDetailCard,
} from '@/components/common/voter/detail';

export const SuperAdminVoterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [voter, setVoter] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useDebouncedEffect(
    () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      dispatch(fetchSuperAdminVoterById(id))
        .then((data: any) => {
          if (!data) {
            setError('Voter record not found');
          } else {
            setVoter(data);
          }
        })
        .catch((err: any) => {
          setError(err?.message || 'Failed to fetch voter details');
        })
        .finally(() => {
          setLoading(false);
        });
    },
    200,
    [dispatch, id]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'INACTIVE':
        return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'SUSPENDED':
        return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400';
      default:
        return 'bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20 text-slate-700 dark:text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !voter) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested voter record could not be retrieved.'}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/voters')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Voter Directory
        </button>
      </div>
    );
  }

  const engFullName = [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.voterName || 'Unnamed Voter';
  const localFullName = [voter.firstName, voter.middleName, voter.surname].filter(Boolean).join(' ');

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

      <PageHeader
        title={engFullName}
        subtitle={localFullName ? `${localFullName} • EPIC No: ${voter.epicNo || 'N/A'}` : `EPIC No: ${voter.epicNo || 'N/A'}`}
        icon={<UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/voters')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Directory
            </button>

            <button
              type="button"
              onClick={() => navigate(`/dashboard/voters/${voter.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Record
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <VoterProfileDetailCard voter={voter} engFullName={engFullName} localFullName={localFullName} />
          <VoterAffiliationDetailCard voter={voter} />
          <VoterFamilyNetworkDetailCard voter={voter} />
          <VoterSocialInfluenceDetailCard voter={voter} />
        </div>

        {/* Right Details Grid */}
        <div className="space-y-6 lg:col-span-2">
          <VoterGeographyDetailCard voter={voter} />
          <VoterDemographicsDetailCard voter={voter} />
          <VoterContactKycDetailCard voter={voter} />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminVoterDetailPage;
