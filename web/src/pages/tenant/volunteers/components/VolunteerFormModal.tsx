import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Building,
  Search,
  Camera,
  Check,
  Users,
  MapPin,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import type { VolunteerRecord } from '@/redux/reducers/volunteer';
import { FORM_VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchVolunteerBooths } from '@/redux/actions/volunteer';

// ─── Role Hierarchy & Helper Guidance ─────────────────────────────────────────
const VALID_PARENT_ROLES: Record<string, string[]> = {
  pc_leader: [],
  ac_leader: ['pc_leader'],
  sub_leader: ['ac_leader'],
  supporter: ['sub_leader'],
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  pc_leader: 'PC Leaders lead the whole constituency and report directly to the Campaign Admin.',
  ac_leader: 'AC Coordinators look after one assembly area and report to the PC Leader.',
  sub_leader: 'Sub-Leaders lead and manage polling booths and report to an AC Leader.',
  supporter: 'Supporters work at assigned polling booths and report to a Sub-Leader.',
};

// ─── Component Props ──────────────────────────────────────────────────────────
export interface VolunteerFormModalProps {
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
  formPcId: string;
  setFormPcId: (val: string) => void;
  formAcId: string;
  setFormAcId: (val: string) => void;
  formWardId: string;
  setFormWardId: (val: string) => void;
  formBoothIds: string[];
  setFormBoothIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  formPcId,
  setFormPcId,
  formAcId,
  setFormAcId,
  formWardId,
  setFormWardId,
  formBoothIds,
  setFormBoothIds,
}) => {
  const dispatch = useAppDispatch();
  const { availableBooths = [], boothsLoading = false } = useAppSelector((state) => state.volunteer);
  const [boothSearch, setBoothSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Sync preview avatar when editingVolunteer.avatar changes
  useEffect(() => {
    if (editingVolunteer?.avatar instanceof File) {
      const url = URL.createObjectURL(editingVolunteer.avatar);
      setPreviewAvatar(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof editingVolunteer?.avatar === 'string' && editingVolunteer.avatar) {
      setPreviewAvatar(editingVolunteer.avatar);
    } else {
      setPreviewAvatar(null);
    }
  }, [editingVolunteer?.avatar]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setEditingVolunteer({ ...editingVolunteer, avatar: file });
  };

  const handleRemoveAvatar = () => {
    setEditingVolunteer({ ...editingVolunteer, avatar: null });
    setPreviewAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fetch booths dynamically based on geography selection
  useEffect(() => {
    if (!isOpen) return;
    if (formAcId) {
      dispatch(fetchVolunteerBooths({ acId: formAcId }));
    } else if (formPcId) {
      dispatch(fetchVolunteerBooths({ pcId: formPcId }));
    } else {
      dispatch(fetchVolunteerBooths());
    }
  }, [dispatch, isOpen, formAcId, formPcId]);

  // Default PC if single PC available and none selected yet
  useEffect(() => {
    if (isOpen && pcs.length === 1 && !formPcId) {
      setFormPcId(pcs[0].id);
    }
  }, [isOpen, pcs, formPcId, setFormPcId]);

  // Default AC if single AC available and none selected yet
  useEffect(() => {
    if (isOpen && acs.length === 1 && !formAcId) {
      setFormAcId(acs[0].id);
    }
  }, [isOpen, acs, formAcId, setFormAcId]);

  const currentRole = (editingVolunteer?.role || 'supporter') as string;
  const isPcLeader = currentRole === 'pc_leader';
  const isAcLeader = currentRole === 'ac_leader';
  const isSubLeader = currentRole === 'sub_leader';
  const isSupporter = currentRole === 'supporter';

  // ── Parent leaders filtered by selected role ────────────────────────────────
  const validParentRoles = VALID_PARENT_ROLES[currentRole] ?? [];
  const filteredParentLeaders = useMemo(() => {
    if (isPcLeader) return [];
    return potentialParentLeaders.filter(
      (l) => l.id !== editingVolunteer?.id && validParentRoles.includes(l.role)
    );
  }, [potentialParentLeaders, editingVolunteer?.id, validParentRoles, isPcLeader]);

  // Auto-derive PC / AC when parent leader changes
  useEffect(() => {
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

  // Cascading ACs & Wards
  const filteredAcs = useMemo(() => {
    if (!formPcId) return acs;
    return acs.filter((a: any) => a.pcId === formPcId || a.pc_id === formPcId);
  }, [acs, formPcId]);

  const acMap = useMemo(() => new Map((acs || []).map((a: any) => [a.id, a.name])), [acs]);
  const wardMap = useMemo(() => new Map((wards || []).map((w: any) => [w.id, w.name])), [wards]);

  // Candidate booths based on role scope
  const candidateBooths = useMemo(() => {
    // 1. If supporter: booths from parent Sub-Leader
    if (isSupporter) {
      const parent = potentialParentLeaders.find((l) => l.id === editingVolunteer?.parentLeaderId);
      if (parent && Array.isArray(parent.assignedBoothIds) && parent.assignedBoothIds.length > 0) {
        return availableBooths.filter((b: any) => parent.assignedBoothIds!.includes(b.id));
      }
    }

    // 2. Filter by formAcId if selected
    if (formAcId) {
      return availableBooths.filter((b: any) => {
        const bAcId = b.acId || b.ac_id;
        const bWardId = b.wardId || b.ward_id;
        if (bAcId !== formAcId) return false;
        if (formWardId && bWardId !== formWardId) return false;
        return true;
      });
    }

    // 3. Filter by formPcId if selected
    if (formPcId) {
      const pcAcIds = acs
        .filter((a: any) => (a.pcId || a.pc_id) === formPcId)
        .map((a: any) => a.id);
      return availableBooths.filter((b: any) => pcAcIds.includes(b.acId || b.ac_id));
    }

    return availableBooths;
  }, [isSupporter, potentialParentLeaders, editingVolunteer?.parentLeaderId, availableBooths, formAcId, formWardId, formPcId, acs]);

  // Filtered candidate booths matching search query
  const searchedBooths = useMemo(() => {
    if (!boothSearch.trim()) return candidateBooths;
    const q = boothSearch.trim().toLowerCase();
    return candidateBooths.filter((booth: any) => {
      const bNum = String(booth.boothNumber ?? booth.booth_number ?? '').toLowerCase();
      const bName = String(booth.name || '').toLowerCase();
      const bBuilding = String(booth.locationBuilding || booth.location_building || '').toLowerCase();
      const bAcId = booth.acId || booth.ac_id;
      const bWardId = booth.wardId || booth.ward_id;
      const acName = String(booth.acName || acMap.get(bAcId) || '').toLowerCase();
      const wardName = String(booth.wardName || wardMap.get(bWardId) || '').toLowerCase();

      return (
        bNum.includes(q) ||
        bName.includes(q) ||
        bBuilding.includes(q) ||
        acName.includes(q) ||
        wardName.includes(q) ||
        `booth ${bNum}`.includes(q)
      );
    });
  }, [candidateBooths, boothSearch, acMap, wardMap]);

  // ── Booth Toggling Helpers ──────────────────────────────────────────────────
  const handleToggleBooth = (boothId: string) => {
    if (isSupporter) {
      setFormBoothIds([boothId]);
      return;
    }
    setFormBoothIds((prev) =>
      prev.includes(boothId) ? prev.filter((id) => id !== boothId) : [...prev, boothId]
    );
  };

  const allFilteredSelected =
    searchedBooths.length > 0 && searchedBooths.every((b: any) => formBoothIds.includes(b.id));

  const handleToggleAll = () => {
    if (isSupporter) return;
    if (allFilteredSelected) {
      const unselectIds = searchedBooths.map((b: any) => b.id);
      setFormBoothIds((prev) => prev.filter((id) => !unselectIds.includes(id)));
    } else {
      const selectIds = searchedBooths.map((b: any) => b.id);
      setFormBoothIds((prev) => Array.from(new Set([...prev, ...selectIds])));
    }
  };

  // ── Validation & Dynamic Assistance ─────────────────────────────────────────
  const volunteerName = editingVolunteer?.name || '';
  const volunteerMobile = editingVolunteer?.mobile || '';
  const mobileDigits = volunteerMobile.replace(/\D/g, '').slice(0, 10);
  const nameOk = volunteerName.trim().length > 1;
  const phoneOk = mobileDigits.length === 10;
  const boothsOk = formBoothIds.length > 0;
  const parentOk = isPcLeader || Boolean(editingVolunteer?.parentLeaderId) || filteredParentLeaders.length === 0;

  const isValid = nameOk && phoneOk && boothsOk && parentOk;

  // Validation feedback checklist
  const missingFields: string[] = [];
  if (!nameOk) missingFields.push('a name');
  if (!phoneOk) missingFields.push('a 10-digit mobile number');
  if (!isPcLeader && filteredParentLeaders.length > 0 && !editingVolunteer?.parentLeaderId) {
    missingFields.push('a reporting leader');
  }
  if (!boothsOk) missingFields.push('at least one booth');

  // Compute initials for avatar preview
  const nameParts = volunteerName.trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.length
    ? (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase()
    : 'VT';

  if (!editingVolunteer) return null;

  return (
    <Modal
      maxWidth="5xl"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      contentPadding="none"
      isSubmitDisabled={!isValid}
      subtitle="Choose their role and area, and we'll set up their mobile login."
      submitText={editingVolunteer?.id ? 'Update volunteer' : 'Add volunteer'}
      title={editingVolunteer?.id ? 'Edit volunteer details' : 'Add a new volunteer'}
      cancelText="Cancel"
      footerMessage={
        isValid ? (
          <span className="text-[13px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <Check size={14} className="stroke-[2.5]" />
            Ready to add. Login: <strong className="font-semibold">+91 {mobileDigits}</strong>
          </span>
        ) : (
          <span className="text-[13px] text-slate-500 dark:text-slate-400">
            Still needed: <strong className="text-slate-700 dark:text-slate-300 font-medium">{missingFields.join(', ')}</strong>.
          </span>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[400px_minmax(0,1fr)] min-h-[520px] max-h-[90vh] md:max-h-[700px]">
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN: WHO (Profile & Credentials)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 border-b md:border-b-0 md:border-r border-[#EEF1F6] dark:border-slate-800 overflow-y-auto flex flex-col gap-4 bg-white dark:bg-slate-900">
          {/* 1. Profile photo */}
          <div className="flex items-center gap-3.5 pb-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-14 h-14 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3730A3] dark:text-indigo-300 flex items-center justify-center font-bold text-lg shrink-0 border border-indigo-200/60 dark:border-indigo-800/40 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-all shadow-xs"
              title="Click to choose photo"
            >
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt={volunteerName || 'Volunteer'}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={16} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[#0F172A] dark:text-white">
                Profile photo
              </div>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border-[.5] border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[9px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Camera size={13} className="text-slate-500 dark:text-slate-400" />
                  {previewAvatar ? 'Change photo' : 'Upload photo'}
                </button>
                {previewAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[12px] font-medium text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Full Name */}
          <FormInput
            label="Full name"
            required
            placeholder="e.g. Rahul Sharma"
            value={volunteerName}
            onChange={(e) => setEditingVolunteer({ ...editingVolunteer, name: e.target.value })}
          />

          {/* 3. Mobile Number */}
          <FormInput
            label="Mobile number"
            required
            type="tel"
            placeholder="9876543210"
            value={mobileDigits}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
              setEditingVolunteer({ ...editingVolunteer, mobile: cleaned });
            }}
            icon={<span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 select-none">+91</span>}
            helperText={
              mobileDigits.length === 0
                ? "They'll use this number to log in to the mobile app."
                : phoneOk
                  ? '✓ Looks good. This will be their mobile login.'
                  : `${10 - mobileDigits.length} more digit${10 - mobileDigits.length === 1 ? '' : 's'} needed.`
            }
          />

          {/* 4. Email */}
          <FormInput
            label="Email"
            type="email"
            placeholder="rahul@example.com"
            value={editingVolunteer?.email || ''}
            onChange={(e) => setEditingVolunteer({ ...editingVolunteer, email: e.target.value })}
          />

          {/* 5. Role Selection */}
          <FormInput
            label="Role"
            required
            type="select"
            searchable={false}
            clearable={false}
            value={currentRole}
            options={FORM_VOLUNTEER_ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            onChange={(e) => {
              const newRole = e.target.value as VolunteerRecord['role'];
              const roleOption = FORM_VOLUNTEER_ROLE_OPTIONS.find((o) => o.value === newRole);
              const newRoleName = roleOption ? roleOption.label : 'Campaign Supporter';
              setEditingVolunteer({
                ...editingVolunteer,
                role: newRole,
                roleName: newRoleName,
                parentLeaderId: null,
              });
              setFormAcId('');
              setFormWardId('');
              setFormBoothIds([]);
            }}
            helperText={ROLE_DESCRIPTIONS[currentRole] || ''}
          />

          {/* 6. Reporting Leader Selector (when applicable) */}
          {!isPcLeader && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <FormInput
                label={
                  isAcLeader
                    ? 'Reporting PC Leader'
                    : isSubLeader
                      ? 'Reporting AC Leader'
                      : 'Reporting Sub-Leader'
                }
                required
                type="select"
                searchable={true}
                clearable={false}
                placeholder={
                  filteredParentLeaders.length === 0
                    ? `No ${isAcLeader ? 'PC Leader' : isSubLeader ? 'AC Leader' : 'Sub-Leader'} found`
                    : `Select ${isAcLeader ? 'PC Leader' : isSubLeader ? 'AC Leader' : 'Sub-Leader'}`
                }
                value={editingVolunteer?.parentLeaderId || ''}
                options={filteredParentLeaders.map((l) => ({
                  value: l.id,
                  label: `${l.name} ${l.mobile ? `(${l.mobile})` : ''}`,
                }))}
                onChange={(e) => {
                  const parentId = e.target.value || null;
                  const parent = potentialParentLeaders.find((l) => l.id === parentId);
                  setEditingVolunteer({
                    ...editingVolunteer,
                    parentLeaderId: parentId,
                    assignedAcId: parent?.assignedAcId ?? editingVolunteer.assignedAcId ?? null,
                  });
                  if (parent?.assignedAcId) {
                    setFormAcId(parent.assignedAcId);
                  }
                  setFormBoothIds([]);
                }}
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT COLUMN: WHERE (Territory & Polling Booths)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 pb-3 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
          {/* Header Row: Where will they work? + count pill */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[15px] leading-[22px] font-bold text-[#0F172A] dark:text-white">
              Where will they work?
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${formBoothIds.length > 0
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'bg-[#E0E7FF] dark:bg-indigo-950/60 text-[#3730A3] dark:text-indigo-300'
                }`}
            >
              {formBoothIds.length === 1 ? '1 booth' : `${formBoothIds.length} booths`} selected
            </span>
          </div>

          {/* Territory Selectors (PC & AC) */}
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Parliamentary constituency"
              required
              type="select"
              searchable={true}
              clearable={false}
              placeholder="Select constituency"
              value={formPcId}
              options={pcs.map((p: any) => ({
                value: p.id,
                label: `${p.name} ${p.pcNumber ? `(#${p.pcNumber})` : ''}`,
              }))}
              onChange={(e) => {
                setFormPcId(e.target.value);
                setFormAcId('');
                setFormWardId('');
                setFormBoothIds([]);
              }}
            />

            <FormInput
              label="Assembly area"
              type="select"
              searchable={true}
              clearable={true}
              disabled={!formPcId && pcs.length > 1}
              placeholder="All assembly areas"
              value={formAcId}
              options={filteredAcs.map((a: any) => ({
                value: a.id,
                label: `${a.name} ${a.acNumber ? `(#${a.acNumber})` : ''}`,
              }))}
              onChange={(e) => {
                setFormAcId(e.target.value || '');
                setFormWardId('');
                setFormBoothIds([]);
                setEditingVolunteer({
                  ...editingVolunteer,
                  assignedAcId: e.target.value || null,
                });
              }}
              onClear={() => {
                setFormAcId('');
                setFormWardId('');
                setFormBoothIds([]);
                setEditingVolunteer({
                  ...editingVolunteer,
                  assignedAcId: null,
                });
              }}
            />
          </div>

          {/* Polling Booths Header Row */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white">
              Polling booths{' '}
              <span className="font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                ({candidateBooths.length} available)
              </span>
            </span>
            {!isSupporter && searchedBooths.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="min-h-[32px] px-2.5 rounded-lg text-[13px] font-semibold text-[#4338CA] dark:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {allFilteredSelected
                  ? 'Clear selection'
                  : boothSearch.trim()
                    ? `Select these ${searchedBooths.length}`
                    : 'Select all'}
              </button>
            )}
          </div>

          {/* Booth Search Bar */}
          <FormInput
            type="text"
            placeholder="Search by booth number, station, building or ward"
            value={boothSearch}
            onChange={(e) => setBoothSearch(e.target.value)}
            icon={<Search size={15} className="text-slate-400" />}
            clearable={true}
            onClear={() => setBoothSearch('')}
            className="mt-2"
          />

          {/* Scrollable Booths Grid */}
          <div className="flex-1 min-h-[220px] max-h-[350px] overflow-y-auto mt-3 pr-1 space-y-2">
            {boothsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <div className="w-5 h-5 border-2 border-[#4338CA] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading polling booths...</span>
              </div>
            ) : candidateBooths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-1">
                <Building size={26} className="text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No booths available
                </p>
                <p className="text-xs max-w-xs text-slate-500">
                  {isSupporter && !editingVolunteer?.parentLeaderId
                    ? 'Select a Sub-Leader first to see their assigned booths.'
                    : !formPcId
                      ? 'Select a constituency above to see its polling booths.'
                      : 'No polling booths found for this selection.'}
                </p>
              </div>
            ) : searchedBooths.length === 0 ? (
              <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1">
                <p>No booths match "{boothSearch}". Try a booth number or station name.</p>
                <button
                  type="button"
                  onClick={() => setBoothSearch('')}
                  className="text-[12px] font-semibold text-[#4338CA] dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchedBooths.map((booth: any) => {
                  const isChecked = formBoothIds.includes(booth.id);
                  const boothNo = booth.boothNumber ?? booth.booth_number ?? '';
                  const stationName = booth.name || booth.locationBuilding || booth.location_building || 'Polling Station';
                  const bAcId = booth.acId || booth.ac_id;
                  const acLabel = booth.acName || acMap.get(bAcId);
                  const bWardId = booth.wardId || booth.ward_id;
                  const wardLabel = booth.wardName || wardMap.get(bWardId) || (booth.wardNumber || booth.ward_number ? `Ward ${booth.wardNumber || booth.ward_number}` : null);
                  const totalVoters = booth.totalVoters ?? booth.total_voters ?? booth.voterCount;

                  return (
                    <div
                      key={booth.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleBooth(booth.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleBooth(booth.id);
                        }
                      }}
                      className={`group relative flex items-start gap-3 p-3.5 rounded-[14px] border cursor-pointer select-none transition-all ${isChecked
                        ? 'border-[#4338CA] bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/40 dark:to-slate-800/90 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 hover:border-indigo-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/90'
                        }`}
                    >
                      {/* Custom Circular Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked
                          ? 'bg-[#4338CA] text-white border border-[#4338CA] shadow-2xs'
                          : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400'
                          }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title & AC Badge */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[14px] font-bold ${isChecked
                              ? 'text-[#4338CA] dark:text-indigo-300'
                              : 'text-[#0F172A] dark:text-white'
                              }`}
                          >
                            Booth {boothNo}
                          </span>
                          {acLabel && (
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/50">
                              {acLabel}
                            </span>
                          )}
                        </div>

                        {/* Station / Location Name */}
                        <p className="text-[12.5px] text-slate-600 dark:text-slate-400 truncate mt-1">
                          {stationName}
                        </p>

                        {/* Colorful Metadata Chips: Ward & Voter Count */}
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {wardLabel && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/40">
                              <MapPin size={11} className="shrink-0 text-purple-600 dark:text-purple-400" />
                              <span className="truncate max-w-[140px]">{wardLabel}</span>
                            </span>
                          )}
                          {totalVoters !== null && totalVoters !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40 tabular-nums">
                              <Users size={11} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{Number(totalVoters).toLocaleString()} voters</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal >
  );
};

export default VolunteerFormModal;
