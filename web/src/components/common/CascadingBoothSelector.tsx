




import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { FormInput } from './FormInput';
import { Layers, MapPin, Landmark, Vote, Loader2 } from 'lucide-react';

export interface CascadingBoothSelectorProps {
  role: 'pc_leader' | 'ac_leader' | 'leader' | 'sub_leader' | 'supporter';
  onBoothSelectionChange: (selectedBoothIds: string[]) => void;
}

export const CascadingBoothSelector: React.FC<CascadingBoothSelectorProps> = ({
  role,
  onBoothSelectionChange,
}) => {
  const [loadingPcs, setLoadingPcs] = useState(false);
  const [loadingAcs, setLoadingAcs] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingBooths, setLoadingBooths] = useState(false);

  const [pcs, setPcs] = useState<any[]>([]);
  const [acs, setAcs] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [booths, setBooths] = useState<any[]>([]);

  const [selectedPcId, setSelectedPcId] = useState('');
  const [selectedAcId, setSelectedAcId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBoothIds, setSelectedBoothIds] = useState<string[]>([]);

  // Fetch PCs for PC Leader
  useEffect(() => {
    if (role === 'pc_leader') {
      setLoadingPcs(true);
      api
        .get('/masters/pcs')
        .then((res) => setPcs(res.data?.data || res.data || []))
        .catch(() => setPcs([]))
        .finally(() => setLoadingPcs(false));
    }
  }, [role]);

  // Fetch ACs
  useEffect(() => {
    setLoadingAcs(true);
    const url = selectedPcId ? `/masters/acs?pcId=${selectedPcId}` : '/masters/acs';
    api
      .get(url)
      .then((res) => setAcs(res.data?.data || res.data || []))
      .catch(() => setAcs([]))
      .finally(() => setLoadingAcs(false));
  }, [selectedPcId]);

  // Fetch Wards
  useEffect(() => {
    setLoadingWards(true);
    const url = selectedAcId ? `/masters/wards?acId=${selectedAcId}` : '/masters/wards';
    api
      .get(url)
      .then((res) => setWards(res.data?.data || res.data || []))
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [selectedAcId]);

  // Fetch Booths
  useEffect(() => {
    setLoadingBooths(true);
    const params: string[] = [];
    if (selectedWardId) params.push(`wardId=${selectedWardId}`);
    if (selectedAcId) params.push(`acId=${selectedAcId}`);
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    api
      .get(`/masters/booths${queryString}`)
      .then((res) => setBooths(res.data?.data || res.data || []))
      .catch(() => setBooths([]))
      .finally(() => setLoadingBooths(false));
  }, [selectedWardId, selectedAcId]);

  const handleBoothToggle = (boothId: string) => {
    if (role === 'supporter') {
      // Single Booth selection for Supporter
      const updated = [boothId];
      setSelectedBoothIds(updated);
      onBoothSelectionChange(updated);
    } else {
      // Multi-booth selection
      const exists = selectedBoothIds.includes(boothId);
      const updated = exists
        ? selectedBoothIds.filter((id) => id !== boothId)
        : [...selectedBoothIds, boothId];
      setSelectedBoothIds(updated);
      onBoothSelectionChange(updated);
    }
  };

  const pcOptions = [
    { label: 'Select Parliamentary Constituency', value: '' },
    ...pcs.map((p) => ({ label: p.pcName || p.name, value: p.id })),
  ];

  const acOptions = [
    { label: 'Select Assembly Constituency', value: '' },
    ...acs.map((a) => ({ label: a.acName || a.name, value: a.id })),
  ];

  const wardOptions = [
    { label: 'Select Electoral Ward (Prabhag)', value: '' },
    ...wards.map((w) => ({ label: w.wardName || w.name, value: w.id })),
  ];

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={14} className="text-indigo-500" />
          <span>Geographic Assignment ({role.replace('_', ' ').toUpperCase()})</span>
        </h4>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
          {selectedBoothIds.length} Booths Selected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {role === 'pc_leader' && (
          <FormInput
            type="select"
            name="pcId"
            label="Parliamentary (PC)"
            value={selectedPcId}
            onChange={(e) => setSelectedPcId(e.target.value)}
            options={pcOptions}
            icon={<Landmark size={14} />}
            disabled={loadingPcs}
          />
        )}

        {(role === 'pc_leader' || role === 'ac_leader' || role === 'leader') && (
          <FormInput
            type="select"
            name="acId"
            label="Assembly (AC)"
            value={selectedAcId}
            onChange={(e) => setSelectedAcId(e.target.value)}
            options={acOptions}
            icon={<Layers size={14} />}
            disabled={loadingAcs}
          />
        )}

        <FormInput
          type="select"
          name="wardId"
          label="Electoral Ward (Prabhag)"
          value={selectedWardId}
          onChange={(e) => setSelectedWardId(e.target.value)}
          options={wardOptions}
          icon={<MapPin size={14} />}
          disabled={loadingWards}
        />
      </div>

      {/* Polling Booth List Selector */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {role === 'supporter' ? 'Select Single Booth:' : 'Select Polling Booths:'}
          </span>
          {loadingBooths && (
            <span className="text-[11px] text-indigo-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Loading Booths...
            </span>
          )}
        </div>

        {booths.length === 0 && !loadingBooths ? (
          <p className="text-slate-400 text-center py-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            Select a Ward or AC above to populate available booths.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 no-scrollbar">
            {booths.map((booth) => {
              const isSelected = selectedBoothIds.includes(booth.id);
              return (
                <div
                  key={booth.id}
                  onClick={() => handleBoothToggle(booth.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Vote size={14} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>
                      Booth #{booth.boothNumber || booth.number}: {booth.boothNameEn || booth.name}
                    </span>
                  </div>
                  <input
                    type={role === 'supporter' ? 'radio' : 'checkbox'}
                    checked={isSelected}
                    onChange={() => { }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
