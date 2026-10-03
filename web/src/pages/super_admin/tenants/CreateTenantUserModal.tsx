import {
  User,
  Building,
  Mail,
  Phone,
  Landmark,
  Building2,
  KeyRound,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import { provisionTenantUser } from '@/redux/actions/tenant';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchMasterCategoryData } from '@/redux/actions/master';
import { fetchTenantRolePackages } from '@/redux/actions/role';
import { FileUploadInput } from '@/components/common/FileUploadInput';

interface CreateTenantUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTenantUserModal: React.FC<CreateTenantUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [tenantRoleId, setTenantRoleId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [avatar, setAvatar] = useState<File | string | null>(null);

  // Geography selection state
  const [selectedPcIds, setSelectedPcIds] = useState<string[]>([]);
  const [selectedAcIds, setSelectedAcIds] = useState<string[]>([]);

  // Redux masters & roles
  const pcs = useAppSelector((state) => (state.master as any)?.pcs || []);
  const acs = useAppSelector((state) => (state.master as any)?.acs || []);
  const tenantRoles = useAppSelector((state) => state.role.tenantRoles || []);

  // Fetch PC, AC, and Tenant Roles options on mount/open
  useDebouncedEffect(() => {
    if (isOpen) {
      if (!pcs.length) dispatch(fetchMasterCategoryData('pcs', '/masters/pcs', false));
      if (!acs.length) dispatch(fetchMasterCategoryData('acs', '/masters/acs', false));
      if (!tenantRoles.length) dispatch(fetchTenantRolePackages());
    }
  }, 200, [isOpen]);

  const resetForm = () => {
    setStep(1);
    setName('');
    setEmail('');
    setMobile('');
    setOrganizationName('');
    setAvatar(null);
    setSelectedPcIds([]);
    setSelectedAcIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Derive candidate auto-password format preview
  const firstName = name.trim().split(' ')[0] || 'Name';
  const cleanDigits = mobile.replace(/\D/g, '').slice(-4) || '1234';
  const autoPasswordPreview = `${firstName}${cleanDigits}@`;

  // Validation per step
  const validateStep1 = () => {
    if (!name.trim()) {
      toast.error('Please enter Full Name');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid Email Address');
      return false;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit Mobile Number');
      return false;
    }
    if (!organizationName.trim()) {
      toast.error('Please enter Organization / Party Name');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedAcIds.length === 0) {
      toast.error('Please select at least one Assembly Constituency (AC)');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const togglePcSelect = (pcId: string) => {
    setSelectedPcIds((prev) => {
      const exists = prev.includes(pcId);
      const updatedPcs = exists ? prev.filter((id) => id !== pcId) : [...prev, pcId];
      // Automatically update AC selection: if PC unselected, remove its ACs
      const validAcIds = acs
        .filter((ac: any) => updatedPcs.includes(ac.pcId))
        .map((ac: any) => ac.id);
      setSelectedAcIds((prevAcs) => prevAcs.filter((id) => validAcIds.includes(id)));
      return updatedPcs;
    });
  };

  const toggleAcSelect = (acId: string) => {
    setSelectedAcIds((prev) =>
      prev.includes(acId) ? prev.filter((id) => id !== acId) : [...prev, acId]
    );
  };

  const handleSelectAllFilteredAcs = () => {
    const availableAcIds = filteredAcs.map((ac: any) => ac.id);
    const allSelected = availableAcIds.every((id: string) => selectedAcIds.includes(id));
    if (allSelected) {
      setSelectedAcIds((prev) => prev.filter((id) => !availableAcIds.includes(id)));
    } else {
      setSelectedAcIds((prev) => Array.from(new Set([...prev, ...availableAcIds])));
    }
  };

  // Filter ACs by selected PCs (or show all if no PC filtered)
  const filteredAcs = selectedPcIds.length > 0
    ? acs.filter((ac: any) => selectedPcIds.includes(ac.pcId))
    : acs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    try {
      await dispatch(
        provisionTenantUser({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          organizationName: organizationName.trim(),
          pcIds: selectedPcIds,
          acIds: selectedAcIds,
          tenantRoleId: tenantRoleId || undefined,
          avatar,
        })
      );
      toast.success(`Tenant Admin "${name}" provisioned successfully! Credentials emailed.`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create tenant user');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: '-- Select Tenant Feature Package (Optional) --', value: '' },
    ...tenantRoles.map((r) => ({
      label: `${r.roleName} (${r.allowedTabs?.webTabs?.length || 0} Tabs)`,
      value: r.id,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Tenant Admin Account"
      subtitle="Phase 1: User Account Setup & Constituency Assignment"
      maxWidth="2xl"
      isLoading={loading}
    >
      {/* Wizard Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <span
            className={`text-xs font-bold ${step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }`}
          >
            1. User Details & Photo
          </span>
          <span
            className={`text-xs font-bold ${step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }`}
          >
            2. Constituency Scope
          </span>
          <span
            className={`text-xs font-bold ${step === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }`}
          >
            3. Confirmation
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Account Info & Profile Photo */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Avatar Upload */}
          <div className="flex justify-center pb-2">
            <FileUploadInput
              name="avatar"
              variant="avatar"
              label="Tenant Admin Profile Photo"
              value={avatar}
              onChange={setAvatar}
              fallbackText={firstName.slice(0, 2).toUpperCase()}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              name="name"
              label="Full Name"
              placeholder="e.g. Rajesh Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} />}
              required
            />

            <FormInput
              name="email"
              label="Email Address (Login Identifier)"
              type="email"
              placeholder="e.g. rajesh@campaign.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              name="mobile"
              label="Mobile Number"
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              icon={<Phone size={16} />}
              required
            />

            <FormInput
              name="organizationName"
              label="Organization / Campaign Office Name"
              placeholder="e.g. Shivajinagar Campaign 2026"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              icon={<Building size={16} />}
              required
            />
          </div>

          <FormInput
            name="tenantRoleId"
            label="Tenant Feature Package (Super Admin Role)"
            type="select"
            options={roleOptions}
            value={tenantRoleId}
            onChange={(e) => setTenantRoleId(e.target.value)}
          />

          {/* Auto Password Callout */}
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
            <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-200">
                Auto-Generated Password Format:
              </span>
              <p className="text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                [FirstName][Last4DigitsOfPhone][Symbol] &rarr; e.g.{' '}
                <span className="bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-900 dark:text-indigo-100">
                  {autoPasswordPreview}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: PC / AC Selection */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          {/* PC Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Landmark size={15} className="text-indigo-500" />
                <span>Select Parliamentary Constituencies (PCs)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedPcIds.length} of {pcs.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {pcs.map((pc: any, idx: number) => {
                const isSelected = selectedPcIds.includes(pc.id);
                return (
                  <button
                    key={`${pc.id}-${idx}`}
                    type="button"
                    onClick={() => togglePcSelect(pc.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                      }`}
                  >
                    <span>{pc.name}</span>
                    {isSelected && <CheckCircle2 size={13} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AC Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 size={15} className="text-emerald-500" />
                <span>Select Assembly Constituencies (ACs) *</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredAcs}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Select All Filtered ({filteredAcs.length})
                </button>
                <span className="text-[11px] text-slate-400">
                  {selectedAcIds.length} selected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {filteredAcs.length === 0 ? (
                <div className="col-span-full py-6 text-center text-xs text-slate-400">
                  No Assembly Constituencies found for selected PC filter.
                </div>
              ) : (
                filteredAcs.map((ac: any, idx: number) => {
                  const isSelected = selectedAcIds.includes(ac.id);
                  return (
                    <button
                      key={`${ac.id}-${idx}`}
                      type="button"
                      onClick={() => toggleAcSelect(ac.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                    >
                      <span className="truncate">{ac.name}</span>
                      {isSelected ? (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 ml-1" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Summary */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Account Summary & Credentials
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email Address</span>
                <span className="font-bold text-slate-900 dark:text-white">{email}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile Number</span>
                <span className="font-bold text-slate-900 dark:text-white">{mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Organization</span>
                <span className="font-bold text-slate-900 dark:text-white">{organizationName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Role Assigned</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                  <Lock size={11} /> Tenant Admin
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned AC Scope</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedAcIds.length} Assembly Constituencies
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <Sparkles size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Welcome Email Ready:</span>
              <p className="mt-0.5 opacity-90">
                Upon submitting, a welcome email with login link and initial password will be sent to{' '}
                <strong className="underline">{email}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer ml-auto"
          >
            <span>Next: {step === 1 ? 'Constituency Scope' : 'Review'}</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer ml-auto disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>{loading ? 'Creating Account...' : 'Provision Tenant Account'}</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

export default CreateTenantUserModal;
