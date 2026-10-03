import {
  Users,
  Building,
  Mail,
  Phone,
  Landmark,
  Building2,
  ArrowLeft,
  Save,
  Sparkles,
  Database,
  ShieldCheck,
  Loader2,
  Search,
  X,
  Plus,
  Shield,
  MapPin,
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  provisionTenantUser,
  updateTenantUser,
  fetchTenantById,
} from '@/redux/actions/tenant';
import toast from 'react-hot-toast';
import { SafeImage } from '@/components/common/SafeImage';
import { FormInput } from '@/components/common/FormInput';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchMasterCategoryData } from '@/redux/actions/master';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileUploadInput } from '@/components/common/FileUploadInput';

export const TenantFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [pendingRemoveAcId, setPendingRemoveAcId] = useState<string | null>(null);
  const [pendingRemovePcId, setPendingRemovePcId] = useState<string | null>(null);
  const [originalAcIds, setOriginalAcIds] = useState<string[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [avatar, setAvatar] = useState<File | string | null>(null);
  const [selectedPcIds, setSelectedPcIds] = useState<string[]>([]);
  const [selectedAcIds, setSelectedAcIds] = useState<string[]>([]);

  // Expand/collapse states for PC cards on the main card
  const [expandedPcIds, setExpandedPcIds] = useState<string[]>([]);

  // Search & filter states for assigned constituencies on the main card
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('');
  const [activeStateFilter, setActiveStateFilter] = useState('all');

  // Add / Edit Modal States
  const [isConstituencyModalOpen, setIsConstituencyModalOpen] = useState(false);
  const [modalEditingPcId, setModalEditingPcId] = useState<string | null>(null);
  const [modalSelectedPcId, setModalSelectedPcId] = useState<string>('');
  const [tempModalAcIds, setTempModalAcIds] = useState<string[]>([]);
  const [modalPcSearch, setModalPcSearch] = useState('');
  const [modalAcSearch, setModalAcSearch] = useState('');

  // Existing database info for edit mode
  const [tenantDbName, setTenantDbName] = useState('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  // Redux master categories for PCs and ACs
  const pcs = useAppSelector((state) => (state.master as any)?.pcs || []);
  const acs = useAppSelector((state) => (state.master as any)?.acs || []);

  // Fetch PC & AC master data and existing tenant data if in Edit mode
  useDebouncedEffect(
    () => {
      // Always fetch fresh PC & AC master datasets from backend
      dispatch(fetchMasterCategoryData('pcs', '/masters/pcs', false));
      dispatch(fetchMasterCategoryData('acs', '/masters/acs', false));

      if (isEditMode && id) {
        setFetching(true);
        dispatch(fetchTenantById(id))
          .then((data: any) => {
            if (data) {
              setName(data.name || '');
              setEmail(data.email || '');
              setMobile(data.mobile || '');
              setOrganizationName(data.organizationName || '');
              const pcList = Array.isArray(data.pcIds) ? Array.from(new Set(data.pcIds)) as string[] : [];
              const acList = Array.isArray(data.acIds) ? Array.from(new Set(data.acIds)) as string[] : [];
              setSelectedPcIds(pcList);
              setSelectedAcIds(acList);
              setOriginalAcIds(acList);
              setExpandedPcIds(pcList);
              setTenantDbName(data.tenantDbName || '');
              setExistingAvatarUrl(data.avatar || null);
            }
          })
          .catch(() => {
            toast.error('Failed to load tenant details');
            navigate('/dashboard/tenants');
          })
          .finally(() => {
            setFetching(false);
          });
      }
    },
    200,
    [id, isEditMode]
  );

  // Helper: get all ACs under a specific PC ID
  const getAcsForPc = useCallback(
    (pcId: string) => acs.filter((ac: any) => ac.pcId === pcId),
    [acs]
  );

  // List of assigned PCs to display (SHOW ONLY SELECTED)
  const assignedPcs = useMemo(() => {
    const pcIdSet = new Set<string>(selectedPcIds);
    selectedAcIds.forEach((acId) => {
      const ac = acs.find((a: any) => a.id === acId);
      if (ac?.pcId) pcIdSet.add(ac.pcId);
    });

    return pcs.filter((pc: any) => pcIdSet.has(pc.id));
  }, [pcs, acs, selectedPcIds, selectedAcIds]);

  // Unique states among assigned PCs
  const assignedStates = useMemo(() => {
    return Array.from(new Set(assignedPcs.map((p: any) => p.stateName).filter(Boolean))) as string[];
  }, [assignedPcs]);

  // Filtered assigned PCs based on search and state filter
  const displayedAssignedPcs = useMemo(() => {
    let list = assignedPcs;

    if (activeStateFilter !== 'all') {
      list = list.filter((p: any) => p.stateName === activeStateFilter);
    }

    const q = assignedSearchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((pc: any) => {
      const matchPcName = pc.name?.toLowerCase().includes(q);
      const matchPcNumber = String(pc.pcNumber || '').includes(q);
      const matchState = pc.stateName?.toLowerCase().includes(q);
      if (matchPcName || matchPcNumber || matchState) return true;

      // Check if any assigned AC under this PC matches
      const pcAcs = getAcsForPc(pc.id).filter((a: any) => selectedAcIds.includes(a.id));
      return pcAcs.some((ac: any) => {
        const matchAcName = ac.name?.toLowerCase().includes(q);
        const matchAcNumber = String(ac.acNumber || '').includes(q);
        const matchDistrict = ac.districtName?.toLowerCase().includes(q);
        return matchAcName || matchAcNumber || matchDistrict;
      });
    });
  }, [assignedPcs, activeStateFilter, assignedSearchQuery, getAcsForPc, selectedAcIds]);

  // Keep all assigned PCs expanded by default so user sees selections
  useEffect(() => {
    if (assignedPcs.length > 0) {
      setExpandedPcIds((prev) => Array.from(new Set([...prev, ...assignedPcs.map((p: any) => p.id)])));
    }
  }, [assignedPcs]);

  // Auto-expand matching PCs when search query is typed
  useEffect(() => {
    if (assignedSearchQuery.trim()) {
      setExpandedPcIds((prev) => Array.from(new Set([...prev, ...displayedAssignedPcs.map((p: any) => p.id)])));
    }
  }, [assignedSearchQuery, displayedAssignedPcs]);

  // Toggle expand/collapse of individual PC card
  const toggleExpandPc = (pcId: string) => {
    setExpandedPcIds((prev) =>
      prev.includes(pcId) ? prev.filter((id) => id !== pcId) : [...prev, pcId]
    );
  };

  // Toggle all expand/collapse
  const handleToggleExpandAll = () => {
    if (expandedPcIds.length === displayedAssignedPcs.length) {
      setExpandedPcIds([]);
    } else {
      setExpandedPcIds(displayedAssignedPcs.map((p: any) => p.id));
    }
  };

  // Open modal in "Add" mode
  const handleOpenAddModal = () => {
    setModalEditingPcId(null);
    const unassigned = pcs.find((p: any) => !assignedPcs.some((ap: any) => ap.id === p.id));
    const initialPcId = unassigned?.id || pcs[0]?.id || '';
    setModalSelectedPcId(initialPcId);
    // Seed tempModalAcIds with ALL currently selected ACs so switching PCs retains prior selections
    setTempModalAcIds([...selectedAcIds]);
    setModalPcSearch('');
    setModalAcSearch('');
    setIsConstituencyModalOpen(true);
  };

  // Open modal in "Edit" mode for a specific PC
  const handleOpenEditModal = (pcId: string) => {
    setModalEditingPcId(pcId);
    setModalSelectedPcId(pcId);
    const currentAcIdsForPc = selectedAcIds.filter((acId) => {
      const ac = acs.find((a: any) => a.id === acId);
      return ac?.pcId === pcId;
    });
    setTempModalAcIds(currentAcIdsForPc);
    setModalAcSearch('');
    setIsConstituencyModalOpen(true);
  };

  // In modal: select a different PC (in Add mode)
  // Preserve ACs already checked for OTHER PCs; only re-seed the slice for the newly selected PC
  const handleSelectModalPc = (pcId: string) => {
    setModalSelectedPcId(pcId);
    setTempModalAcIds((prev) => {
      // Keep ACs that don't belong to the new PC (they were chosen under other PCs)
      const otherPcAcIds = prev.filter((acId) => {
        const ac = acs.find((a: any) => a.id === acId);
        return ac?.pcId !== pcId;
      });
      // Merge with whatever was already selected for this PC in the global selectedAcIds
      const thisNewPcAcIds = selectedAcIds.filter((acId) => {
        const ac = acs.find((a: any) => a.id === acId);
        return ac?.pcId === pcId;
      });
      return Array.from(new Set([...otherPcAcIds, ...thisNewPcAcIds]));
    });
    setModalAcSearch('');
  };

  // In modal: toggle all ACs for the currently selected PC
  const handleToggleAllModalAcs = () => {
    const currentPcAcs = getAcsForPc(modalSelectedPcId);
    const currentPcAcIds = currentPcAcs.map((a: any) => a.id);
    const allSelected = currentPcAcIds.length > 0 && currentPcAcIds.every((id: string) => tempModalAcIds.includes(id));

    if (allSelected) {
      if (isEditMode && currentPcAcIds.some((id: string) => originalAcIds.includes(id))) {
        toast.error('Some ACs have active tenant voter data. Remove them individually to confirm data purge.');
        return;
      }
      // Only remove ACs belonging to the current PC — preserve other PCs' selections
      setTempModalAcIds((prev) => prev.filter((id) => !currentPcAcIds.includes(id)));
    } else {
      // Add all current PC ACs while preserving other PCs' selections
      setTempModalAcIds((prev) => Array.from(new Set([...prev, ...currentPcAcIds])));
    }
  };

  // In modal: toggle single AC
  const handleToggleTempAc = (acId: string) => {
    if (tempModalAcIds.includes(acId)) {
      if (isEditMode && originalAcIds.includes(acId)) {
        toast.error('This AC has active voter records. Use the remove button on the main page to confirm voter data purge.');
        return;
      }
      setTempModalAcIds((prev) => prev.filter((id) => id !== acId));
    } else {
      setTempModalAcIds((prev) => [...prev, acId]);
    }
  };

  // In modal: Apply & Save button
  const handleApplyModalSelection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!modalSelectedPcId) {
      toast.error('Please select a Parliamentary Constituency');
      return;
    }

    const allAcIdsUnderPc = getAcsForPc(modalSelectedPcId).map((a: any) => a.id);

    // In edit mode: check if any CURRENTLY ACTIVE original ACs under this PC were deselected
    // Only flag ACs that are still in selectedAcIds — if they were already removed via the main
    // page remove button before this modal opened, they should not block saving.
    if (isEditMode) {
      const removedOriginals = allAcIdsUnderPc.filter(
        (id: string) =>
          originalAcIds.includes(id) &&
          selectedAcIds.includes(id) &&   // ← must still be actively assigned
          !tempModalAcIds.includes(id)
      );
      if (removedOriginals.length > 0) {
        toast.error('Cannot deselect active ACs with voter records in bulk. Remove them individually to confirm data purge.');
        return;
      }
    }

    // Update selectedAcIds: replace ACs for this PC with tempModalAcIds
    setSelectedAcIds((prev) => {
      const otherAcs = prev.filter((id) => !allAcIdsUnderPc.includes(id));
      return Array.from(new Set([...otherAcs, ...tempModalAcIds]));
    });

    // Update selectedPcIds
    setSelectedPcIds((prev) => {
      if (tempModalAcIds.length > 0 || !modalEditingPcId) {
        return Array.from(new Set([...prev, modalSelectedPcId]));
      } else {
        return prev.filter((id) => id !== modalSelectedPcId);
      }
    });

    // Keep this PC expanded
    setExpandedPcIds((prev) => Array.from(new Set([...prev, modalSelectedPcId])));
    setIsConstituencyModalOpen(false);
    toast.success('Constituencies updated');
  };

  // Main page: Remove an AC
  const removeAc = (acId: string) => {
    if (isEditMode && originalAcIds.includes(acId)) {
      setPendingRemoveAcId(acId);
    } else {
      setSelectedAcIds((prev) => prev.filter((i) => i !== acId));
    }
  };

  const confirmRemoveAc = () => {
    if (pendingRemoveAcId) {
      setSelectedAcIds((prev) => prev.filter((i) => i !== pendingRemoveAcId));
      setPendingRemoveAcId(null);
      toast.success('AC removed and scheduled for database purge');
    }
  };

  // Main page: Remove an entire PC
  const handleRemovePc = (pcId: string) => {
    const pcAcIds = getAcsForPc(pcId).map((a: any) => a.id);
    const hasOriginals = isEditMode && pcAcIds.some((id: string) => originalAcIds.includes(id));

    if (hasOriginals) {
      setPendingRemovePcId(pcId);
      return;
    }

    setSelectedPcIds((prev) => prev.filter((id) => id !== pcId));
    setSelectedAcIds((prev) => prev.filter((id) => !pcAcIds.includes(id)));
    setExpandedPcIds((prev) => prev.filter((id) => id !== pcId));
    toast.success('Removed constituency');
  };

  const confirmRemoveEntirePc = () => {
    if (!pendingRemovePcId) return;
    const pcAcIds = getAcsForPc(pendingRemovePcId).map((a: any) => a.id);
    setSelectedPcIds((prev) => prev.filter((id) => id !== pendingRemovePcId));
    setSelectedAcIds((prev) => prev.filter((id) => !pcAcIds.includes(id)));
    setExpandedPcIds((prev) => prev.filter((id) => id !== pendingRemovePcId));
    setPendingRemovePcId(null);
    toast.success('Constituency removed and voter data scheduled for purge');
  };

  // Filtered PCs for Modal Add picker
  const filteredModalPcs = useMemo(() => {
    const q = modalPcSearch.toLowerCase().trim();
    if (!q) return pcs;
    return pcs.filter((pc: any) => {
      const matchName = pc.name?.toLowerCase().includes(q);
      const matchNum = String(pc.pcNumber || '').includes(q);
      const matchState = pc.stateName?.toLowerCase().includes(q);
      return matchName || matchNum || matchState;
    });
  }, [pcs, modalPcSearch]);

  // Current PC object in modal
  const modalPc = useMemo(() => {
    return pcs.find((p: any) => p.id === modalSelectedPcId);
  }, [pcs, modalSelectedPcId]);

  // ACs belonging to the PC currently selected in modal
  const modalPcAcs = useMemo(() => {
    if (!modalSelectedPcId) return [];
    return getAcsForPc(modalSelectedPcId);
  }, [modalSelectedPcId, getAcsForPc]);

  // Filtered ACs in modal by search query
  const filteredModalAcs = useMemo(() => {
    const q = modalAcSearch.toLowerCase().trim();
    if (!q) return modalPcAcs;
    return modalPcAcs.filter((ac: any) => {
      const matchName = ac.name?.toLowerCase().includes(q);
      const matchNum = String(ac.acNumber || '').includes(q);
      const matchDistrict = ac.districtName?.toLowerCase().includes(q);
      return matchName || matchNum || matchDistrict;
    });
  }, [modalPcAcs, modalAcSearch]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Please enter full user name');
    if (!email.trim()) return toast.error('Please enter email address');
    if (!mobile.trim()) return toast.error('Please enter mobile number');
    if (!organizationName.trim()) return toast.error('Please enter organization name');
    if (selectedAcIds.length === 0) {
      return toast.error('Please assign at least one Assembly Constituency (AC)');
    }

    setSaving(true);
    try {
      // Ensure all parent PCs of selected ACs are included in payload
      const effectivePcIds = Array.from(
        new Set([
          ...selectedPcIds,
          ...selectedAcIds.map((acId) => acs.find((a: any) => a.id === acId)?.pcId).filter(Boolean),
        ])
      );

      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        organizationName: organizationName.trim(),
        pcIds: effectivePcIds,
        acIds: selectedAcIds,
      };

      if (avatar instanceof File) {
        payload.avatar = avatar;
      }

      if (isEditMode && id) {
        await dispatch(updateTenantUser(id, payload));
        toast.success('Tenant account updated successfully');
      } else {
        await dispatch(provisionTenantUser(payload));
        toast.success('Tenant account created successfully');
      }
      navigate('/dashboard/tenants');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading tenant details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Reusable PageHeader Component (Rule 18) */}
      <PageHeader
        title={isEditMode ? 'Edit Tenant Account' : 'Provision New Tenant Account'}
        subtitle={
          isEditMode
            ? 'Update campaign organization details, administrator info, and assigned Lok Sabha / Vidhan Sabha constituencies'
            : 'Setup isolated database infrastructure and assign campaign office constituencies'
        }
        icon={<Building className="w-6 h-6" />}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles size={12} className="text-amber-500" />
            {isEditMode ? 'Tenant Edit Mode' : 'New Provisioning'}
          </span>
        }
        actions={
          <Link
            to="/dashboard/tenants"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Tenants</span>
          </Link>
        }
      />

      {/* Main Form Layout - 12-Column Responsive Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (6 Cols): Organization Profile */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full space-y-5">
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Organization Profile
                    </h3>
                    <p className="text-[11px] text-slate-400">Campaign office & contact details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormInput
                    name="organizationName"
                    label="Organization / Campaign Name"
                    placeholder="e.g. Pune Central Election Samiti"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    icon={<Building2 size={16} />}
                  />

                  <FormInput
                    name="name"
                    label="Administrator Full Name"
                    placeholder="e.g. Rajesh Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    icon={<Users size={16} />}
                  />

                  <FormInput
                    name="email"
                    type="email"
                    label="Email Address (Login Username)"
                    placeholder="e.g. rajesh@campaign.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    icon={<Mail size={16} />}
                  />

                  <FormInput
                    name="mobile"
                    type="tel"
                    label="Mobile Number (10 Digits)"
                    placeholder="e.g. 9820011223"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    icon={<Phone size={16} />}
                  />
                </div>
              </div>

              {/* Campaign Avatar Upload */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Profile Photo / Campaign Symbol
                </label>
                {isEditMode && existingAvatarUrl && !avatar && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-3 border border-slate-200/60 dark:border-slate-700/60">
                    <SafeImage
                      src={existingAvatarUrl}
                      alt={name}
                      fallbackText={name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Current Profile Avatar
                      </p>
                      <p className="text-[11px] text-slate-400">Upload new image to replace</p>
                    </div>
                  </div>
                )}
                <FileUploadInput
                  name="avatar"
                  value={avatar}
                  accept="image/*"
                  maxSizeMB={5}
                  onChange={(file) => setAvatar(file)}
                />
              </div>
            </div>
          </div>

          {/* Right Column (6 Cols): Assigned Constituencies (SHOWS SELECTED ONLY) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full space-y-5">
              {/* Header with Title, Counts & Add Button */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Assigned Constituencies
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Lok Sabha (PC) & Vidhan Sabha (AC) hierarchy
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {selectedAcIds.length} {selectedAcIds.length === 1 ? 'AC' : 'ACs'} ({assignedPcs.length} {assignedPcs.length === 1 ? 'PC' : 'PCs'})
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar when assigned constituencies exist */}
              {assignedPcs.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FormInput
                        name="assignedSearch"
                        placeholder="Search assigned PC, AC, number or district..."
                        value={assignedSearchQuery}
                        onChange={(e) => setAssignedSearchQuery(e.target.value)}
                        icon={<Search size={16} />}
                      />
                    </div>
                    {assignedSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAssignedSearchQuery('')}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Clear search"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills for Multiple States */}
                  {assignedStates.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setActiveStateFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeStateFilter === 'all'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        All States ({assignedPcs.length})
                      </button>
                      {assignedStates.map((st) => {
                        const count = assignedPcs.filter((p: any) => p.stateName === st).length;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setActiveStateFilter(st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                              activeStateFilter === st
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {st} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Toolbar when items exist */}
              {assignedPcs.length > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Selected Lok Sabha Seats ({displayedAssignedPcs.length}
                    {displayedAssignedPcs.length !== assignedPcs.length ? ` of ${assignedPcs.length}` : ''})
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {expandedPcIds.length === displayedAssignedPcs.length ? 'Collapse All' : 'Expand All'}
                  </button>
                </div>
              )}

              {/* Constituencies List or Empty State: fills available space */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                {assignedPcs.length === 0 ? (
                  /* Clean Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/40">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        No Constituencies Assigned Yet
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        Assign parliamentary seats and their assembly segments to this tenant office.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Assign Constituencies</span>
                    </button>
                  </div>
                ) : displayedAssignedPcs.length === 0 ? (
                  /* No Search Matches State */
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                    <Search className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No assigned constituencies match "{assignedSearchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignedSearchQuery('');
                        setActiveStateFilter('all');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  </div>
                ) : (
                  /* Selected PC Cards List */
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[480px]">
                    {displayedAssignedPcs.map((pc: any) => {
                      const pcAcList = getAcsForPc(pc.id);
                      const selectedAcsInThisPc = pcAcList.filter((a: any) => selectedAcIds.includes(a.id));
                      const isExpanded = expandedPcIds.includes(pc.id);
                      const allAssigned = pcAcList.length > 0 && selectedAcsInThisPc.length === pcAcList.length;

                      return (
                        <div
                          key={pc.id}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          {/* Header of PC card */}
                          <div className="p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleExpandPc(pc.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                              </button>

                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                  {pc.pcNumber ? `${pc.pcNumber} - ` : ''}{pc.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                  {pc.stateName || 'Lok Sabha'} • {pcAcList.length} Assembly Segments
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Assigned Status Badge */}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  allAssigned
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                                }`}
                              >
                                {selectedAcsInThisPc.length} / {pcAcList.length} assigned
                              </span>

                              {/* Item Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(pc.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Edit ACs for this PC"
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>

                              {/* Item Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemovePc(pc.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Remove PC"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Section: Selected AC chips */}
                          {isExpanded && (
                            <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
                              {selectedAcsInThisPc.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">
                                  No assembly segments assigned yet.{' '}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(pc.id)}
                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                  >
                                    Click here to select ACs
                                  </button>
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedAcsInThisPc.map((ac: any) => (
                                    <span
                                      key={ac.id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs"
                                    >
                                      <span>
                                        {ac.acNumber ? `${ac.acNumber} - ` : ''}{ac.name}
                                      </span>
                                      {ac.districtName && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          ({ac.districtName})
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeAc(ac.id)}
                                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer"
                                        title="Remove this AC"
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Summary Bar: anchored at bottom */}
              <div className="mt-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Assigned: <strong>{selectedAcIds.length}</strong> Assembly{' '}
                    {selectedAcIds.length === 1 ? 'Constituency' : 'Constituencies'} across{' '}
                    <strong>{assignedPcs.length}</strong> Parliamentary{' '}
                    {assignedPcs.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                >
                  + Add Another PC
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PostgreSQL Schema Isolation Full-Width Banner */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/90 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white rounded-2xl p-6 shadow-sm dark:shadow-xl border border-indigo-200/80 dark:border-indigo-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base">PostgreSQL Schema Isolation</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 uppercase tracking-wider">
                    Active Security
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Multi-Tenant Database Infrastructure Specs
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-slate-700/60 min-w-[200px] shadow-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Assigned DB Schema</p>
                <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300 truncate mt-0.5">
                  {tenantDbName || 'ranniti_tenant_[firstname]_[mobile4]'}
                </p>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-indigo-100 dark:border-slate-700/60 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs min-w-[200px] shadow-xs">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Row & Table Level Security Enforcement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Form Action Footer Bar */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Changes will sync immediately with backend database records</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              to="/dashboard/tenants"
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Update Tenant' : 'Provision Tenant'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* POPUP MODAL FOR ADD NEW AND EDIT (RULE 10) */}
      <Modal
        isOpen={isConstituencyModalOpen}
        onClose={() => setIsConstituencyModalOpen(false)}
        title={modalEditingPcId ? 'Edit Assigned ACs' : 'Assign Constituencies'}
        subtitle={
          modalEditingPcId
            ? `Configure assembly segments for ${modalPc?.name || 'this PC'}`
            : 'Select a Parliamentary Constituency, then choose its Assembly Segments'
        }
        maxWidth="2xl"
        submitText={modalEditingPcId ? 'Save Changes' : 'Add to Tenant'}
        onSubmit={handleApplyModalSelection}
      >
        <div className="space-y-4">
          {/* STEP 1: SELECT PC */}
          {!modalEditingPcId ? (
            /* Add Mode: Search & Select PC */
            <div className="space-y-2.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-500" />
                <span>1. Select Parliamentary Constituency (PC)</span>
              </label>

              <FormInput
                name="modalPcSearch"
                placeholder="Search PC name, number or state..."
                value={modalPcSearch}
                onChange={(e) => setModalPcSearch(e.target.value)}
                icon={<Search size={15} />}
              />

              {/* PC Selection List */}
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredModalPcs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No Parliamentary Constituencies match "{modalPcSearch}"
                  </div>
                ) : (
                  filteredModalPcs.map((pc: any) => {
                    const isSelected = modalSelectedPcId === pc.id;
                    const isAlreadyAssigned = assignedPcs.some((ap: any) => ap.id === pc.id);
                    const acCount = getAcsForPc(pc.id).length;

                    return (
                      <button
                        key={pc.id}
                        type="button"
                        onClick={() => handleSelectModalPc(pc.id)}
                        className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                          <div className="truncate">
                            <p className="font-bold truncate">
                              {pc.pcNumber ? `${pc.pcNumber} - ` : ''}{pc.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">
                              {pc.stateName || 'Lok Sabha'} • {acCount} Assembly Segments
                            </p>
                          </div>
                        </div>

                        {isAlreadyAssigned && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                            Already Added
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode: Fixed PC Display Header */
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin size={18} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {modalPc?.pcNumber ? `${modalPc.pcNumber} - ` : ''}{modalPc?.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {modalPc?.stateName || 'Lok Sabha'} • {modalPcAcs.length} total assembly segments
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                {tempModalAcIds.length} / {modalPcAcs.length} Selected
              </span>
            </div>
          )}

          {/* STEP 2: SELECT ACs THAT ARE FROM THE SELECTED PC */}
          {modalSelectedPcId && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Select Assembly Segments (AC)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Choose which Vidhan Sabha seats to assign from this Parliamentary seat
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {tempModalAcIds.length} of {modalPcAcs.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleAllModalAcs}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {modalPcAcs.length > 0 && modalPcAcs.every((a: any) => tempModalAcIds.includes(a.id))
                      ? 'Deselect All'
                      : `Select All (${modalPcAcs.length})`}
                  </button>
                </div>
              </div>

              {/* Search ACs within this PC */}
              <FormInput
                name="modalAcSearch"
                placeholder="Filter assembly segments by name, number, or district..."
                value={modalAcSearch}
                onChange={(e) => setModalAcSearch(e.target.value)}
                icon={<Search size={15} />}
              />

              {/* AC Checklist Grid */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredModalAcs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No Assembly Constituencies match "{modalAcSearch}"
                  </div>
                ) : (
                  filteredModalAcs.map((ac: any) => {
                    const isChecked = tempModalAcIds.includes(ac.id);

                    return (
                      <button
                        key={ac.id}
                        type="button"
                        onClick={() => handleToggleTempAc(ac.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">
                              {ac.acNumber ? `${ac.acNumber} - ` : ''}{ac.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {ac.districtName || 'Vidhan Sabha'}
                            </p>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                            Assigned
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* AC Removal Confirmation — warns that voter data will be purged from tenant DB */}
      {pendingRemoveAcId && (() => {
        const ac = acs.find((a: any) => a.id === pendingRemoveAcId);
        const acLabel = ac ? `${ac.acNumber ? `${ac.acNumber} - ` : ''}${ac.name}` : 'this AC';
        return (
          <ConfirmModal
            isOpen={true}
            title="Remove Assembly Constituency?"
            description={`Removing "${acLabel}" will permanently delete all its voters, booths, and constituency data from this tenant's database. This runs in the background and cannot be undone.`}
            confirmText="Yes, Remove AC & Purge Data"
            cancelText="Cancel"
            variant="danger"
            onConfirm={confirmRemoveAc}
            onClose={() => setPendingRemoveAcId(null)}
          />
        );
      })()}

      {/* Entire PC Removal Confirmation */}
      {pendingRemovePcId && (() => {
        const pc = pcs.find((p: any) => p.id === pendingRemovePcId);
        const pcLabel = pc ? `${pc.pcNumber ? `${pc.pcNumber} - ` : ''}${pc.name}` : 'this PC';
        return (
          <ConfirmModal
            isOpen={true}
            title="Remove Parliamentary Constituency?"
            description={`Removing "${pcLabel}" will also remove all its assigned Assembly Constituencies and permanently delete voter and booth records for this tenant. This runs in the background and cannot be undone.`}
            confirmText="Yes, Remove PC & Purge Data"
            cancelText="Cancel"
            variant="danger"
            onConfirm={confirmRemoveEntirePc}
            onClose={() => setPendingRemovePcId(null)}
          />
        );
      })()}
    </div>
  );
};

export default TenantFormPage;
