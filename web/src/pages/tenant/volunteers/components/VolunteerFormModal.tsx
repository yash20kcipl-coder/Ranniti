import React, { useMemo } from 'react';
import { Vote, Lock, Building, ArrowDown } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import type { VolunteerRecord } from '@/redux/reducers/volunteer';
import { FORM_VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';

/** Roles that are valid parents for each role */
const VALID_PARENT_ROLES: Record<string, string[]> = {
  pc_leader: [],                              // PC Leader reports to no one
  ac_leader: ['pc_leader'],                   // AC Leader reports to PC Leader
  sub_leader: ['pc_leader', 'ac_leader'],     // Sub Leader reports to PC or AC Leader
  supporter:  ['pc_leader', 'ac_leader', 'sub_leader'], // Supporter reports to any leader
};

const ROLE_HIERARCHY_HINT: Record<string, string> = {
  pc_leader: 'PC Leader has no parent — reports directly to Campaign Admin.',
  ac_leader: 'AC Leader must report to a PC Leader.',
  sub_leader: 'Sub-Leader reports to a PC Leader or AC Leader.',
  supporter: 'Supporter reports to a PC Leader, AC Leader, or Sub-Leader.',
};

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
  onRoleChange?: () => void;
}

export const VolunteerFormModal: React.FC<VolunteerFormModalProps> = ({
  isOpen,
  onClose,
  editingVolunteer,
  setEditingVolunteer,
  onSubmit,
  isLoading,
  potentialParentLeaders,
  pcs,
  acs,
  wards,
  booths,
  formPcId,
  setFormPcId,
  formAcId,
  setFormAcId,
  formWardId,
  setFormWardId,
  formBoothIds,
  setFormBoothIds,
}) => {
  // ACs filtered by selected PC
  const filteredModalAcs = useMemo(() => {
    if (!formPcId) return acs;
    return acs.filter((a: any) => a.pcId === formPcId);
  }, [acs, formPcId]);

  // Wards filtered by selected AC
  const filteredModalWards = useMemo(() => {
    if (!formAcId) return [];
    return wards.filter((w: any) => w.acId === formAcId);
  }, [wards, formAcId]);

  // Booths filtered by selected AC and Ward (only populated when both PC and AC are selected)
  const filteredModalBooths = useMemo(() => {
    if (!formPcId || !formAcId) return [];
    return booths.filter((b: any) => {
      if (b.acId !== formAcId) return false;
      if (formWardId && b.wardId !== formWardId) return false;
      return true;
    });
  }, [booths, formPcId, formAcId, formWardId]);

  const currentRole = (editingVolunteer?.role || 'supporter') as string;
  const validParentRoles = VALID_PARENT_ROLES[currentRole] ?? [];
  const isPcLeader = currentRole === 'pc_leader';

  // Filtered parent leaders based on the currently selected role
  const filteredParentLeaders = useMemo(() => {
    if (isPcLeader) return [];
    return potentialParentLeaders.filter(
      (l) => l.id !== editingVolunteer?.id && validParentRoles.includes(l.role)
    );
  }, [potentialParentLeaders, editingVolunteer?.id, validParentRoles, isPcLeader]);

  const handleToggleBooth = (boothId: string) => {
    setFormBoothIds((prev) =>
      prev.includes(boothId) ? prev.filter((id) => id !== boothId) : [...prev, boothId]
    );
  };

  const handleSelectAllVisibleBooths = () => {
    const visibleIds = filteredModalBooths.map((b: any) => b.id);
    const allSelected = visibleIds.every((id: string) => formBoothIds.includes(id));
    if (allSelected) {
      setFormBoothIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...formBoothIds, ...visibleIds]));
      setFormBoothIds(merged);
    }
  };

  if (!editingVolunteer) return null;

  const isTerritoryReady = Boolean(formPcId && formAcId);

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
            onChange={(val) =>
              setEditingVolunteer({
                ...editingVolunteer,
                avatar: val,
              })
            }
            variant="avatar"
            fallbackText={editingVolunteer.name || 'VT'}
            accept="image/*"
            category="avatars"
            placeholder="Upload volunteer photo (JPG, PNG, WebP up to 5MB)"
          />
        </div>

        {/* Row 1: Full Name & Email Address */}
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

        {/* Row 2: Mobile Number & Role Category */}
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
              setEditingVolunteer({
                ...editingVolunteer,
                role: newRole,
                // Clear parent when role changes to avoid invalid hierarchy
                parentLeaderId: null,
              });
            }}
            required
          />
        </div>

        {/* Row 3: Reporting Leader (role-filtered) */}
        <div className="space-y-1.5">
          {/* Hierarchy hint badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <ArrowDown size={12} className="text-indigo-400" />
            <span className="font-medium">{ROLE_HIERARCHY_HINT[currentRole]}</span>
          </div>

          <FormInput
            label={isPcLeader ? 'Reporting Leader (Not Applicable for PC Leader)' : 'Reporting Leader'}
            name="parentLeaderId"
            type="select"
            disabled={isPcLeader}
            options={
              isPcLeader
                ? [{ label: '— Direct to Campaign Admin —', value: '' }]
                : [
                    {
                      label:
                        filteredParentLeaders.length === 0
                          ? `No ${validParentRoles.join(' / ')} found — add one first`
                          : 'Select Reporting Leader',
                      value: '',
                    },
                    ...filteredParentLeaders.map((l) => ({
                      label: `${l.name}  ·  ${l.role.replace('_', ' ').toUpperCase()}`,
                      value: l.id,
                    })),
                  ]
            }
            value={editingVolunteer.parentLeaderId || ''}
            onChange={(e) =>
              setEditingVolunteer({
                ...editingVolunteer,
                parentLeaderId: e.target.value || null,
              })
            }
          />
        </div>

        {/* Auto-Generated Password Preview Banner */}
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

        {/* Polling Booth Territory Assignment Section */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Vote size={15} /> Polling Booth Territory Assignment
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Select Parliamentary & Assembly Constituency to assign polling booths for localized voter canvassing
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
              {formBoothIds.length} Booths Selected
            </span>
          </div>

          {/* Cascading PC & AC Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <FormInput
              label="Parliamentary Constituency (PC) *"
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
              }}
              required
            />

            <FormInput
              label="Assembly Constituency (AC) *"
              name="modalAc"
              type="select"
              options={[
                { label: formPcId ? 'Select AC' : 'Select PC first', value: '' },
                ...filteredModalAcs.map((a: any) => ({ label: a.name, value: a.id })),
              ]}
              value={formAcId}
              onChange={(e) => {
                setFormAcId(e.target.value);
                setFormWardId('');
              }}
              disabled={!formPcId}
              required
            />
          </div>

          {/* Booths and Ward filter only show when both PC and AC are selected */}
          {isTerritoryReady ? (
            <div className="space-y-3 pt-1">
              <div className="max-w-md">
                <FormInput
                  label="Filter by Ward / Prabhag (Optional)"
                  name="modalWard"
                  type="select"
                  options={[
                    { label: 'All Wards in AC', value: '' },
                    ...filteredModalWards.map((w: any) => ({ label: w.name, value: w.id })),
                  ]}
                  value={formWardId}
                  onChange={(e) => setFormWardId(e.target.value)}
                />
              </div>

              {/* Booth Multi-Select Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Available Polling Booths ({filteredModalBooths.length})
                  </span>
                  {filteredModalBooths.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleBooths}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Select All in View
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 max-h-48 overflow-y-auto gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {filteredModalBooths.length === 0 ? (
                    <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                      No polling booths found for this constituency selection.
                    </div>
                  ) : (
                    filteredModalBooths.map((booth: any) => {
                      const isSelected = formBoothIds.includes(booth.id);
                      return (
                        <div
                          key={booth.id}
                          onClick={() => handleToggleBooth(booth.id)}
                          className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="truncate">
                            Booth {booth.boothNumber ? `${booth.boothNumber} - ` : ''}{booth.name}
                          </span>
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white shrink-0 ml-1 ${
                              isSelected ? 'bg-indigo-600' : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <span className="text-[9px] font-bold">✓</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Prompt message when PC or AC is not selected */
            <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-slate-900/60 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-xs">
              <Building size={24} className="mx-auto mb-2 text-indigo-400 opacity-70" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {!formPcId
                  ? 'Please select Parliamentary Constituency (PC)'
                  : 'Please select Assembly Constituency (AC)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Polling booths will be displayed once both PC and AC are selected.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
