import React, { useMemo } from 'react';
import { Vote, Lock, Building, ArrowDown } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import type { VolunteerRecord } from '@/redux/reducers/volunteer';
import { FORM_VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';

// ─── Role hierarchy ───────────────────────────────────────────────────────────
/** Which existing roles can be the parent for each new role */
const VALID_PARENT_ROLES: Record<string, string[]> = {
  pc_leader: [],
  ac_leader: ['pc_leader'],
  sub_leader: ['ac_leader'],
  supporter: ['sub_leader'],
};

const ROLE_HIERARCHY_HINT: Record<string, string> = {
  pc_leader: 'PC Leader has no parent — reports directly to Campaign Admin.',
  ac_leader: 'AC Leader must report to a PC Leader.',
  sub_leader: 'Sub-Leader must report to an AC Leader.',
  supporter: 'Supporter must report to a Sub-Leader.',
};

// ─── Password preview ─────────────────────────────────────────────────────────
function getVolunteerPasswordPreview(name: string, mobile: string): string {
  if (!name.trim()) return '';
  const cleanName = name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
  const capitalized =
    cleanName.length > 0
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
      : 'Volunteer';
  const cleanPhone = (mobile || '').replace(/\D/g, '');
  const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '••••';
  return `${capitalized}${last4}#`;
}

// ─── Shared booth grid ────────────────────────────────────────────────────────
interface BoothGridProps {
  booths: any[];
  selectedIds: string[];
  singleSelect?: boolean;
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
  acs?: any[];
  wards?: any[];
}
const BoothGrid: React.FC<BoothGridProps> = ({
  booths, selectedIds, singleSelect, onToggle, onSelectAll, acs = [], wards = [],
}) => {
  const acMap = useMemo(() => new Map((acs || []).map((a: any) => [a.id, a.name])), [acs]);
  const wardMap = useMemo(() => new Map((wards || []).map((w: any) => [w.id, w.name])), [wards]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Available Polling Booths ({booths.length})
        </span>
        {!singleSelect && booths.length > 0 && onSelectAll && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {booths.every((b) => selectedIds.includes(b.id)) ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-56 overflow-y-auto gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {booths.length === 0 ? (
          <div className="col-span-3 text-center py-6 text-xs text-slate-400">
            No polling booths found for this selection.
          </div>
        ) : (
          booths.map((booth: any) => {
            const isSelected = selectedIds.includes(booth.id);
            const bAcId = booth.acId || booth.ac_id;
            const bWardId = booth.wardId || booth.ward_id;
            const acName = booth.acName || acMap.get(bAcId) || '';
            const wardName = booth.wardName || wardMap.get(bWardId) || '';

            return (
              <div
                key={booth.id}
                onClick={() => onToggle(booth.id)}
                className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 font-semibold shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      Booth {booth.boothNumber ?? booth.booth_number ?? ''}
                    </span>
                    {acName && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                        {acName}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {booth.name || 'Polling Station'}
                  </p>
                  {wardName && (
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                      📍 {wardName}
                    </p>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded${singleSelect ? '-full' : ''} flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    isSelected ? 'bg-indigo-600' : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <span className="text-[10px] font-bold">✓</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface VolunteerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVolunteer: Partial<VolunteerRecord> | null;
  setEditingVolunteer: React.Dispatch<React.SetStateAction<Partial<VolunteerRecord> | null>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  potentialParentLeaders: VolunteerRecord[];
  pcs: any[];
  acs: any[];
  wards: any[];
  booths: any[];
  formPcId: string;
  setFormPcId: (val: string) => void;
  formAcId: string;
  setFormAcId: (val: string) => void;
  formWardId: string;
  setFormWardId: (val: string) => void;
  formBoothIds: string[];
  setFormBoothIds: React.Dispatch<React.SetStateAction<string[]>>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const VolunteerFormModal: React.FC<VolunteerFormModalProps> = ({
  isOpen, onClose, editingVolunteer, setEditingVolunteer,
  onSubmit, isLoading, potentialParentLeaders,
  pcs, acs, wards, booths,
  formPcId, setFormPcId,
  formAcId, setFormAcId,
  formWardId, setFormWardId,
  formBoothIds, setFormBoothIds,
}) => {
  const currentRole = (editingVolunteer?.role || 'supporter') as string;
  const validParentRoles = VALID_PARENT_ROLES[currentRole] ?? [];
  const isPcLeader = currentRole === 'pc_leader';
  const isAcLeader = currentRole === 'ac_leader';
  const isSubLeader = currentRole === 'sub_leader';
  const isSupporter = currentRole === 'supporter';

  // ── Parent leaders filtered by selected role ──────────────────────────────
  const filteredParentLeaders = useMemo(() => {
    if (isPcLeader) return [];
    return potentialParentLeaders.filter(
      (l) => l.id !== editingVolunteer?.id && validParentRoles.includes(l.role)
    );
  }, [potentialParentLeaders, editingVolunteer?.id, validParentRoles, isPcLeader]);

  // ── PC Leader: selected parent (pc_leader itself doesn't need one but
  //    AC leader picks a pc_leader → derive the pc_id from that leader's assignedAcId is complex;
  //    simpler: PC leader selection row is still formPcId ──────────────────

  // ── Auto-derive PC / AC when form values or parent leader change ───────────
  React.useEffect(() => {
    if (formAcId) {
      const matchedAc = acs.find((a: any) => a.id === formAcId);
      const pcId = matchedAc?.pcId || matchedAc?.pc_id;
      if (pcId && pcId !== formPcId) {
        setFormPcId(pcId);
      }
    } else if (editingVolunteer?.parentLeaderId) {
      const parent = potentialParentLeaders.find((l) => l.id === editingVolunteer.parentLeaderId);
      if (parent?.assignedAcId) {
        setFormAcId(parent.assignedAcId);
        const matchedAc = acs.find((a: any) => a.id === parent.assignedAcId);
        const pcId = matchedAc?.pcId || matchedAc?.pc_id;
        if (pcId && pcId !== formPcId) {
          setFormPcId(pcId);
        }
      }
    }
  }, [formAcId, editingVolunteer?.parentLeaderId, acs, potentialParentLeaders, formPcId, setFormPcId, setFormAcId]);

  // ── Cascading geography filtered sets ────────────────────────────────────
  const filteredAcs = useMemo(() => {
    if (!formPcId) return acs;
    return acs.filter((a: any) => a.pcId === formPcId || a.pc_id === formPcId);
  }, [acs, formPcId]);

  const filteredWards = useMemo(() => {
    if (!formAcId) return [];
    return wards.filter((w: any) => w.acId === formAcId || w.ac_id === formAcId);
  }, [wards, formAcId]);

  // Booths for PC Leader (all booths in PC if formAcId is empty, or filtered by formAcId)
  const pcLeaderBooths = useMemo(() => {
    if (!formPcId) return [];
    if (formAcId) {
      return booths.filter((b: any) => (b.acId || b.ac_id) === formAcId);
    }
    const pcAcIds = acs
      .filter((a: any) => (a.pcId || a.pc_id) === formPcId)
      .map((a: any) => a.id);
    return booths.filter((b: any) => pcAcIds.includes(b.acId || b.ac_id));
  }, [booths, acs, formPcId, formAcId]);

  // Booths for multi-select roles (ac_leader, sub_leader)
  const filteredBooths = useMemo(() => {
    if (!formAcId) return [];
    return booths.filter((b: any) => {
      const bAcId = b.acId || b.ac_id;
      const bWardId = b.wardId || b.ward_id;
      if (bAcId !== formAcId) return false;
      if (formWardId && bWardId !== formWardId) return false;
      return true;
    });
  }, [booths, formAcId, formWardId]);

  // For supporter — booths from selected parent sub-leader's assigned booths or AC
  const selectedParent = useMemo(
    () => potentialParentLeaders.find((l) => l.id === editingVolunteer?.parentLeaderId),
    [potentialParentLeaders, editingVolunteer?.parentLeaderId]
  );
  const supporterBooths = useMemo(() => {
    if (!selectedParent) return [];
    if (selectedParent.assignedBoothIds && selectedParent.assignedBoothIds.length > 0) {
      return booths.filter((b: any) => selectedParent.assignedBoothIds.includes(b.id));
    }
    if (selectedParent.assignedAcId) {
      return booths.filter((b: any) => (b.acId || b.ac_id) === selectedParent.assignedAcId);
    }
    return [];
  }, [booths, selectedParent]);

  // ── Booth toggle helpers ──────────────────────────────────────────────────
  const handleToggleBooth = (boothId: string) => {
    setFormBoothIds((prev) =>
      prev.includes(boothId) ? prev.filter((id) => id !== boothId) : [...prev, boothId]
    );
  };

  const handleSingleBooth = (boothId: string) => {
    setFormBoothIds([boothId]);
  };

  const handleSelectAll = (list: any[]) => {
    const ids = list.map((b: any) => b.id);
    const allSelected = ids.every((id: string) => formBoothIds.includes(id));
    if (allSelected) {
      setFormBoothIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setFormBoothIds(Array.from(new Set([...formBoothIds, ...ids])));
    }
  };

  if (!editingVolunteer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingVolunteer?.id ? 'Edit Volunteer Details' : 'Onboard New Volunteer'}
      subtitle="Assign fixed role, polling booth territory, and generate mobile login credentials"
      onSubmit={onSubmit}
      isLoading={isLoading}
      maxWidth="3xl"
      submitText={editingVolunteer?.id ? 'Update Volunteer' : 'Onboard Volunteer'}
    >
      <div className="space-y-5">
        {/* Profile Avatar Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Volunteer Profile Photo
          </label>
          <FileUploadInput
            value={editingVolunteer.avatar || null}
            onChange={(val) => setEditingVolunteer({ ...editingVolunteer, avatar: val })}
            variant="avatar"
            fallbackText={editingVolunteer.name || 'VT'}
            accept="image/*"
            category="avatars"
            placeholder="Upload volunteer photo (JPG, PNG, WebP up to 5MB)"
          />
        </div>

        {/* Row 1: Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Full Name"
            name="name"
            value={editingVolunteer.name || ''}
            onChange={(e) => setEditingVolunteer({ ...editingVolunteer, name: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            required
          />
          <FormInput
            label="Email Address"
            name="email"
            type="email"
            value={editingVolunteer.email || ''}
            onChange={(e) => setEditingVolunteer({ ...editingVolunteer, email: e.target.value })}
            placeholder="e.g. rahul@example.com (optional)"
          />
        </div>

        {/* Row 2: Mobile & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Mobile Number (Login Username)"
            name="mobile"
            value={editingVolunteer.mobile || ''}
            onChange={(e) => setEditingVolunteer({ ...editingVolunteer, mobile: e.target.value })}
            placeholder="e.g. 9876543210"
            required
          />
          <FormInput
            label="Role Category"
            name="role"
            type="select"
            options={FORM_VOLUNTEER_ROLE_OPTIONS}
            value={editingVolunteer.role || 'supporter'}
            onChange={(e) => {
              const newRole = e.target.value as VolunteerRecord['role'];
              const roleOption = FORM_VOLUNTEER_ROLE_OPTIONS.find((o) => o.value === newRole);
              const newRoleName = roleOption ? roleOption.label : 'Campaign Supporter / Volunteer';
              setEditingVolunteer({ ...editingVolunteer, role: newRole, roleName: newRoleName, parentLeaderId: null });
              setFormPcId('');
              setFormAcId('');
              setFormWardId('');
              setFormBoothIds([]);
            }}
            required
          />
        </div>

        {/* Hierarchy hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ArrowDown size={12} className="text-indigo-400" />
          <span className="font-medium">{ROLE_HIERARCHY_HINT[currentRole]}</span>
        </div>

        {/* Auto-Generated Password Preview */}
        {!editingVolunteer.id && editingVolunteer.name && editingVolunteer.mobile && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-indigo-600" />
              <span>
                Auto-Generated Mobile Password:{' '}
                <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {getVolunteerPasswordPreview(editingVolunteer.name, editingVolunteer.mobile)}
                </strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Formula: Name + PhoneLast4 + #</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ROLE-SPECIFIC TERRITORY SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Vote size={15} /> Territory Assignment
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
              {formBoothIds.length} {isSupporter ? 'Booth' : 'Booths'} Selected
            </span>
          </div>

          {/* ── PC LEADER: PC → optional AC filter → multi-booth ────────────── */}
          {isPcLeader && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="Parliamentary Constituency (PC)"
                  name="modalPc"
                  type="select"
                  options={[
                    { label: 'Select PC', value: '' },
                    ...pcs.map((p: any) => ({ label: p.name, value: p.id })),
                  ]}
                  value={formPcId}
                  onChange={(e) => {
                    setFormPcId(e.target.value);
                    setFormAcId('');
                    setFormWardId('');
                    setFormBoothIds([]);
                    setEditingVolunteer({ ...editingVolunteer, assignedAcId: null });
                  }}
                  required
                />
                <FormInput
                  label="Assembly Constituency (AC) (Optional)"
                  name="modalAc"
                  type="select"
                  options={[
                    { label: formPcId ? 'All ACs in PC' : 'Select PC first', value: '' },
                    ...filteredAcs.map((a: any) => ({ label: a.name, value: a.id })),
                  ]}
                  value={formAcId}
                  disabled={!formPcId}
                  onChange={(e) => {
                    setFormAcId(e.target.value);
                    setFormWardId('');
                    setEditingVolunteer({ ...editingVolunteer, assignedAcId: e.target.value || null });
                  }}
                />
              </div>
              {formPcId ? (
                <BoothGrid
                  booths={pcLeaderBooths}
                  selectedIds={formBoothIds}
                  onToggle={handleToggleBooth}
                  onSelectAll={() => handleSelectAll(pcLeaderBooths)}
                  acs={acs}
                  wards={wards}
                />
              ) : (
                <div className="p-4 text-center rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-xs text-slate-400">
                  <Building size={20} className="mx-auto mb-1 text-indigo-300" />
                  Select a PC to see booths
                </div>
              )}
            </div>
          )}

          {/* ── AC LEADER: parent PC Leader → AC → multi-booth ───────────── */}
          {isAcLeader && (
            <div className="space-y-3">
              <FormInput
                label="Reporting PC Leader"
                name="parentLeaderId"
                type="select"
                options={[
                  {
                    label: filteredParentLeaders.length === 0
                      ? 'No PC Leader found — add one first'
                      : 'Select PC Leader',
                    value: '',
                  },
                  ...filteredParentLeaders.map((l) => ({
                    label: `${l.name}`,
                    value: l.id,
                  })),
                ]}
                value={editingVolunteer.parentLeaderId || ''}
                onChange={(e) =>
                  setEditingVolunteer({ ...editingVolunteer, parentLeaderId: e.target.value || null })
                }
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  label="Parliamentary Constituency (PC)"
                  name="modalPc"
                  type="select"
                  options={[
                    { label: 'Select PC', value: '' },
                    ...pcs.map((p: any) => ({ label: p.name, value: p.id })),
                  ]}
                  value={formPcId}
                  onChange={(e) => {
                    setFormPcId(e.target.value);
                    setFormAcId('');
                    setFormWardId('');
                    setFormBoothIds([]);
                    setEditingVolunteer({ ...editingVolunteer, assignedAcId: null });
                  }}
                  required
                />
                <FormInput
                  label="Assembly Constituency (AC)"
                  name="modalAc"
                  type="select"
                  options={[
                    { label: formPcId ? 'Select AC' : 'Select PC first', value: '' },
                    ...filteredAcs.map((a: any) => ({ label: a.name, value: a.id })),
                  ]}
                  value={formAcId}
                  disabled={!formPcId}
                  onChange={(e) => {
                    setFormAcId(e.target.value);
                    setFormWardId('');
                    setFormBoothIds([]);
                    setEditingVolunteer({ ...editingVolunteer, assignedAcId: e.target.value || null });
                  }}
                  required
                />
              </div>
              {formPcId && formAcId && (
                <BoothGrid
                  booths={filteredBooths}
                  selectedIds={formBoothIds}
                  onToggle={handleToggleBooth}
                  onSelectAll={() => handleSelectAll(filteredBooths)}
                  acs={acs}
                  wards={wards}
                />
              )}
              {(!formPcId || !formAcId) && (
                <div className="p-4 text-center rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-xs text-slate-400">
                  <Building size={20} className="mx-auto mb-1 text-indigo-300" />
                  {!formPcId ? 'Select a PC to continue' : 'Select an AC to see booths'}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-LEADER: parent AC Leader → booths from that AC ────────── */}
          {isSubLeader && (
            <div className="space-y-3">
              <FormInput
                label="Reporting AC Leader"
                name="parentLeaderId"
                type="select"
                options={[
                  {
                    label: filteredParentLeaders.length === 0
                      ? 'No AC Leader found — add one first'
                      : 'Select AC Leader',
                    value: '',
                  },
                  ...filteredParentLeaders.map((l) => ({
                    label: `${l.name}${l.assignedAcId ? '' : ''}`,
                    value: l.id,
                  })),
                ]}
                value={editingVolunteer.parentLeaderId || ''}
                onChange={(e) => {
                  const parentId = e.target.value || null;
                  const parent = potentialParentLeaders.find((l) => l.id === parentId);
                  setEditingVolunteer({
                    ...editingVolunteer,
                    parentLeaderId: parentId,
                    assignedAcId: parent?.assignedAcId ?? null,
                  });
                  // Auto-set AC from the parent AC leader
                  setFormAcId(parent?.assignedAcId || '');
                  setFormBoothIds([]);
                }}
                required
              />
              {editingVolunteer.parentLeaderId && (
                <>
                  <div className="max-w-xs">
                    <FormInput
                      label="Filter by Ward (Optional)"
                      name="modalWard"
                      type="select"
                      options={[
                        { label: 'All Wards in AC', value: '' },
                        ...filteredWards.map((w: any) => ({ label: w.name, value: w.id })),
                      ]}
                      value={formWardId}
                      onChange={(e) => setFormWardId(e.target.value)}
                    />
                  </div>
                  <BoothGrid
                    booths={filteredBooths}
                    selectedIds={formBoothIds}
                    onToggle={handleToggleBooth}
                    onSelectAll={() => handleSelectAll(filteredBooths)}
                    acs={acs}
                    wards={wards}
                  />
                </>
              )}
              {!editingVolunteer.parentLeaderId && (
                <div className="p-4 text-center rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-xs text-slate-400">
                  <Building size={20} className="mx-auto mb-1 text-indigo-300" />
                  Select an AC Leader — their AC booths will appear here
                </div>
              )}
            </div>
          )}

          {/* ── SUPPORTER: parent Sub-Leader → single booth ───────────────── */}
          {isSupporter && (
            <div className="space-y-3">
              <FormInput
                label="Reporting Sub-Leader"
                name="parentLeaderId"
                type="select"
                options={[
                  {
                    label: filteredParentLeaders.length === 0
                      ? 'No Sub-Leader found — add one first'
                      : 'Select Sub-Leader',
                    value: '',
                  },
                  ...filteredParentLeaders.map((l) => ({
                    label: l.name,
                    value: l.id,
                  })),
                ]}
                value={editingVolunteer.parentLeaderId || ''}
                onChange={(e) => {
                  const parentId = e.target.value || null;
                  const parent = potentialParentLeaders.find((l) => l.id === parentId);
                  setEditingVolunteer({
                    ...editingVolunteer,
                    parentLeaderId: parentId,
                    assignedAcId: parent?.assignedAcId ?? null,
                  });
                  setFormBoothIds([]);
                }}
                required
              />
              {editingVolunteer.parentLeaderId && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Select <strong>one</strong> polling booth for this supporter
                  </p>
                  <BoothGrid
                    booths={supporterBooths}
                    selectedIds={formBoothIds}
                    singleSelect
                    onToggle={handleSingleBooth}
                    acs={acs}
                    wards={wards}
                  />
                </div>
              )}
              {!editingVolunteer.parentLeaderId && (
                <div className="p-4 text-center rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-xs text-slate-400">
                  <Building size={20} className="mx-auto mb-1 text-indigo-300" />
                  Select a Sub-Leader — their assigned booths will appear here
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
