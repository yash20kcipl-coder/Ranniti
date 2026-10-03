import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { fetchSuperAdminVoterById } from '@/redux/actions/voterSuperAdmin';
import { PageHeader } from '@/components/common/PageHeader';
import { ArrowLeft, Edit, UserCheck, ShieldAlert } from 'lucide-react';

// Section Components (Reused from tenant voter components)
import {
  VoterProfileDetailCard,
  VoterAffiliationDetailCard,
  VoterDemographicsDetailCard,
  VoterGeographyDetailCard,
  VoterContactKycDetailCard,
  VoterFamilyNetworkDetailCard,
  VoterSocialInfluenceDetailCard,
} from '@/pages/tenant/voters/components';

export const SuperAdminVoterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [voter, setVoter] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [dispatch, id]);

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
          onClick={() => navigate('/dashboard/super-admin/voters')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Super Admin Directory
        </button>
      </div>
    );
  }

  const engFullName = [voter.engFirstName, voter.engMiddleName, voter.engSurname].filter(Boolean).join(' ') || voter.voterName || 'Unnamed Voter';
  const localFullName = [voter.firstName, voter.middleName, voter.surname].filter(Boolean).join(' ');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={engFullName}
        subtitle={`EPIC No: ${voter.epicNo || 'N/A'} • Booth: ${voter.boothName || 'Unassigned'}`}
        icon={<UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/super-admin/voters')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Directory
            </button>

            <button
              type="button"
              onClick={() => navigate(`/dashboard/super-admin/voters/${voter.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Record
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <VoterProfileDetailCard voter={voter} engFullName={engFullName} localFullName={localFullName} />
          <VoterAffiliationDetailCard voter={voter} />
          <VoterContactKycDetailCard voter={voter} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <VoterDemographicsDetailCard voter={voter} />
          <VoterGeographyDetailCard voter={voter} />
          <VoterFamilyNetworkDetailCard voter={voter} />
          <VoterSocialInfluenceDetailCard voter={voter} />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminVoterDetailPage;
