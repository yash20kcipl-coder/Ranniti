import {
  VolunteerStatsCards,
  VolunteerCredentialsBanner,
  VolunteerFormModal,
} from './components';
import {
  VOLUNTEER_ROLE_OPTIONS,
  STATUS_OPTIONS,
} from '@/constants/dropdownOptions';
import {
  fetchTenantVolunteers,
  fetchVolunteerBoothCoverage,
  createTenantVolunteer,
  updateTenantVolunteer,
  deleteTenantVolunteer,
  toggleTenantVolunteerStatus,
  clearLastCreatedCredentials,
} from '@/redux/actions/volunteer';
import toast from 'react-hot-toast';
import React, { useState, useMemo } from 'react';
import { SafeImage } from '@/components/common/SafeImage';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { TableActions } from '@/components/common/TableActions';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useTenantMasterData } from '@/hooks/useTenantMasterData';
import type { VolunteerRecord } from '@/redux/reducers/volunteer';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Users, Vote, Smartphone, Power, PowerOff } from 'lucide-react';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';

function getRoleBadge(role: string) {
  switch (role) {
    case 'pc_leader':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          PC Leader
        </span>
      );
    case 'ac_leader':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          AC Leader
        </span>
      );
    case 'sub_leader':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Sub-Leader / Ward Lead
        </span>
      );
    case 'supporter':
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Booth Supporter
        </span>
      );
  }
}

export const TenantVolunteersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { volunteers = [], coverage, loading, lastCreatedCredentials } = useAppSelector(
    (state) => state.volunteer
  );
  const { pcs = [], acs = [], wards = [], booths = [] } = useTenantMasterData(['pcs', 'acs', 'wards', 'booths']);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAcFilter, setSelectedAcFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Partial<VolunteerRecord> | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Territory selection state for form
  const [formPcId, setFormPcId] = useState('');
  const [formAcId, setFormAcId] = useState('');
  const [formWardId, setFormWardId] = useState('');
  const [formBoothIds, setFormBoothIds] = useState<string[]>([]);

  // Debounced API fetch
  useDebouncedEffect(() => {
    dispatch(
      fetchTenantVolunteers({
        role: selectedRole,
        search: searchTerm,
        status: selectedStatus,
        acId: selectedAcFilter,
      })
    );
    dispatch(fetchVolunteerBoothCoverage());
  }, 250, [dispatch, selectedRole, searchTerm, selectedStatus, selectedAcFilter]);

  // Leaders available as parent leader options
  const potentialParentLeaders = useMemo(() => {
    return volunteers.filter(
      (v) => v.role === 'pc_leader' || v.role === 'ac_leader' || v.role === 'sub_leader'
    );
  }, [volunteers]);

  const handleOpenCreateModal = () => {
    setEditingVolunteer({
      name: '',
      mobile: '',
      email: '',
      role: 'supporter',
      roleName: 'Campaign Supporter / Volunteer',
      avatar: null,
      parentLeaderId: null,
      assignedAcId: null,
      assignedBoothIds: [],
    });
    setFormPcId('');
    setFormAcId('');
    setFormWardId('');
    setFormBoothIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (volunteer: VolunteerRecord) => {
    setEditingVolunteer({
      id: volunteer.id,
      name: volunteer.name,
      mobile: volunteer.mobile || '',
      email: volunteer.email,
      role: volunteer.role,
      roleName: volunteer.roleName,
      avatar: volunteer.avatar,
      status: volunteer.status,
      parentLeaderId: volunteer.parentLeaderId,
      assignedAcId: volunteer.assignedAcId,
      assignedBoothIds: volunteer.assignedBoothIds || [],
    });

    let acIdToUse = volunteer.assignedAcId || '';
    let pcIdToUse = '';

    // 1. Derive from assignedAcId
    if (acIdToUse) {
      const acObj = acs.find((a: any) => a.id === acIdToUse);
      if (acObj) pcIdToUse = acObj.pcId || acObj.pc_id || '';
    }

    // 2. Derive from assignedBoothIds if acIdToUse/pcIdToUse not found (e.g. PC Leader)
    if (!pcIdToUse && volunteer.assignedBoothIds && volunteer.assignedBoothIds.length > 0) {
      const boothObj = booths.find((b: any) => volunteer.assignedBoothIds?.includes(b.id));
      if (boothObj) {
        const bAcId = boothObj.acId || boothObj.ac_id;
        const acObj = acs.find((a: any) => a.id === bAcId);
        if (acObj) {
          pcIdToUse = acObj.pcId || acObj.pc_id || '';
          if (!acIdToUse && volunteer.role !== 'pc_leader') {
            acIdToUse = bAcId;
          }
        }
      }
    }

    // 3. Derive from parent leader
    if (!pcIdToUse && volunteer.parentLeaderId) {
      const parent = potentialParentLeaders.find((p) => p.id === volunteer.parentLeaderId);
      if (parent) {
        const pAcId = parent.assignedAcId || '';
        if (pAcId) {
          if (!acIdToUse) acIdToUse = pAcId;
          const acObj = acs.find((a: any) => a.id === pAcId);
          if (acObj) pcIdToUse = acObj.pcId || acObj.pc_id || '';
        }
      }
    }

    // 4. Fallback to first PC if available
    if (!pcIdToUse && pcs.length > 0) {
      pcIdToUse = pcs[0].id;
    }

    setFormPcId(pcIdToUse || '');
    setFormAcId(acIdToUse || '');
    setFormWardId('');
    setFormBoothIds(volunteer.assignedBoothIds || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer?.name?.trim()) {
      toast.error('Volunteer name is required');
      return;
    }
    if (!editingVolunteer?.mobile?.trim()) {
      toast.error('Mobile number is required for mobile login');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...editingVolunteer,
        assignedAcId: formAcId || null,
        assignedBoothIds: formBoothIds,
      };

      if (editingVolunteer.id) {
        await dispatch(updateTenantVolunteer(editingVolunteer.id, payload));
        toast.success('Volunteer details updated successfully');
      } else {
        await dispatch(createTenantVolunteer(payload as any));
        toast.success('Volunteer onboarded successfully!');
      }

      setIsModalOpen(false);
      setEditingVolunteer(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save volunteer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [statusToggleTarget, setStatusToggleTarget] = useState<VolunteerRecord | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleStatusConfirm = async () => {
    if (!statusToggleTarget) return;
    try {
      setIsTogglingStatus(true);
      const nextStatus = statusToggleTarget.status === 'active' ? 'disabled' : 'active';
      await dispatch(toggleTenantVolunteerStatus(statusToggleTarget.id, nextStatus));
      toast.success(
        `Volunteer ${statusToggleTarget.name} has been ${nextStatus === 'active' ? 'enabled' : 'disabled'}`
      );
      setStatusToggleTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await dispatch(deleteTenantVolunteer(deleteTargetId));
      toast.success('Volunteer removed from campaign');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove volunteer');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedAcFilter('');
  };

  // FilterBar configuration
  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'role',
        label: 'Role Tier',
        type: 'select',
        value: selectedRole,
        onChange: (val) => setSelectedRole(val),
        options: [{ label: 'All Roles', value: '' }, ...VOLUNTEER_ROLE_OPTIONS],
        isPrimary: true,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        value: selectedStatus,
        onChange: (val) => setSelectedStatus(val),
        options: [{ label: 'All Statuses', value: '' }, ...STATUS_OPTIONS],
        isPrimary: true,
      },
      {
        key: 'acId',
        label: 'Constituency (AC)',
        type: 'select',
        value: selectedAcFilter,
        onChange: (val) => setSelectedAcFilter(val),
        options: [
          { label: 'All Constituencies', value: '' },
          ...acs.map((a: any) => ({ label: a.name, value: a.id })),
        ],
        isPrimary: true,
      },
    ],
    [selectedRole, selectedStatus, selectedAcFilter, acs]
  );

  // DataTable columns
  const columns: Column<VolunteerRecord>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Volunteer Name',
        render: (vol) => (
          <div className="flex items-center gap-3">
            <SafeImage
              alt={vol.name}
              fallbackText={vol.name}
              src={typeof vol.avatar === 'string' ? vol.avatar : null}
              className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{vol.name}</div>
              <div className="text-[11px] text-slate-400">{vol.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role Tier',
        render: (vol) => getRoleBadge(vol.role),
      },
      {
        key: 'parentLeaderName',
        header: 'Reporting To',
        render: (vol) =>
          vol.parentLeaderName ? (
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {vol.parentLeaderName}
            </span>
          ) : (
            <span className="text-slate-400 italic">Direct Campaign Lead</span>
          ),
      },
      {
        key: 'assignedBoothCount',
        header: 'Assigned Booths',
        render: (vol) => (
          <div className="flex items-center gap-1.5">
            <Vote size={14} className="text-indigo-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">
              {vol.assignedBoothCount ?? vol.assignedBoothIds?.length ?? 0} Booths
            </span>
          </div>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile & Access',
        render: (vol) => (
          <div>
            <div className="font-mono text-slate-900 dark:text-white font-medium">
              {vol.mobile || '—'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
              <Smartphone size={10} /> Mobile App Only
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (vol) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${vol.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
          >
            {vol.status}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Field Volunteers & Cadre"
        subtitle="Manage PC/AC leaders, sub-leaders, and ground supporters with booth territory assignments"
        icon={<Users className="w-5 h-5 text-indigo-600" />}
        onAddClick={handleOpenCreateModal}
        addLabel="Onboard Volunteer"
      />

      {/* Cadre & Booth Coverage Stats */}
      <VolunteerStatsCards
        coverage={coverage}
        totalVolunteers={volunteers.length}
        totalBoothsCount={booths.length}
      />

      {/* Post-Creation WhatsApp & Credentials Banner */}
      {lastCreatedCredentials && (
        <VolunteerCredentialsBanner
          credentials={lastCreatedCredentials}
          onDismiss={() => dispatch(clearLastCreatedCredentials())}
        />
      )}

      {/* Standard FilterBar */}
      <FilterBar
        searchPlaceholder="Search volunteers by name, mobile, email..."
        searchValue={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        filters={filterFields}
        onReset={handleResetFilters}
      />

      {/* Standard DataTable */}
      <div className="rounded-2xl dark:bg-slate-900/60 dark:border dark:border-slate-800 dark:p-1">
        <DataTable
          columns={columns}
          data={volunteers}
          loading={loading}
          showHeader={false}
          actions={(row) => (
            <TableActions
              onEdit={() => handleOpenEditModal(row)}
              onDelete={() => setDeleteTargetId(row.id)}
              extra={
                <button
                  type="button"
                  onClick={() => setStatusToggleTarget(row)}
                  title={row.status === 'active' ? 'Active — Click to Disable' : 'Disabled — Click to Enable'}
                  className={`p-1.5 rounded-lg border transition-colors ${row.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                    }`}
                >
                  {row.status === 'active' ? <Power size={14} /> : <PowerOff size={14} />}
                </button>
              }
            />
          )}
        />
      </div>

      {/* Onboard / Edit Volunteer Modal */}
      <VolunteerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingVolunteer={editingVolunteer}
        setEditingVolunteer={setEditingVolunteer}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        potentialParentLeaders={potentialParentLeaders}
        pcs={pcs}
        acs={acs}
        wards={wards}
        booths={booths}
        formPcId={formPcId}
        setFormPcId={setFormPcId}
        formAcId={formAcId}
        setFormAcId={setFormAcId}
        formWardId={formWardId}
        setFormWardId={setFormWardId}
        formBoothIds={formBoothIds}
        setFormBoothIds={setFormBoothIds}
      />

      {/* Standard ConfirmModal for Status Toggle */}
      <ConfirmModal
        isOpen={Boolean(statusToggleTarget)}
        onClose={() => setStatusToggleTarget(null)}
        onConfirm={handleToggleStatusConfirm}
        isLoading={isTogglingStatus}
        title={
          statusToggleTarget?.status === 'active'
            ? 'Disable Volunteer Account'
            : 'Enable Volunteer Account'
        }
        description={
          statusToggleTarget?.status === 'active'
            ? `Are you sure you want to disable ${statusToggleTarget?.name}? Their mobile app access will be temporarily suspended.`
            : `Are you sure you want to enable ${statusToggleTarget?.name}? Their mobile app credentials will be reactivated.`
        }
        confirmText={
          statusToggleTarget?.status === 'active'
            ? 'Disable Account'
            : 'Enable Account'
        }
        variant={statusToggleTarget?.status === 'active' ? 'warning' : 'info'}
      />

      {/* Standard ConfirmModal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Volunteer from Campaign"
        description="Are you sure you want to remove this volunteer? Their assigned booth mappings and mobile app access will be revoked."
        confirmText="Remove Volunteer"
        variant="danger"
      />
    </div>
  );
};

export default TenantVolunteersPage;
