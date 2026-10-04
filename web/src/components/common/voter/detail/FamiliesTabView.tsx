import React, { useState } from 'react';
import {
  Home,
  Users,
  Search,
  Sparkles,
  Crown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FormInput } from '@/components/common/FormInput';
import { SafeImage } from '@/components/common/SafeImage';
import { AutoMapFamilyModal } from './AutoMapFamilyModal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { fetchFamiliesAction } from '@/redux/actions/familyMapping';
import { FamilyMemberDetailModal } from './FamilyMemberDetailModal';

export interface FamiliesTabViewProps {
  booths: Array<{ id: string; name: string; boothNumber?: number }>;
  initialBoothId?: string;
}

export const FamiliesTabView: React.FC<FamiliesTabViewProps> = ({ booths, initialBoothId = '' }) => {
  const dispatch = useAppDispatch();
  const { families, pagination, loading } = useAppSelector((state) => state.familyMapping);

  // Filter state
  const [search, setSearch] = useState('');
  const [boothId, setBoothId] = useState(initialBoothId);
  const [minMembers, setMinMembers] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [autoMapModalOpen, setAutoMapModalOpen] = useState(false);
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch families debounced (Rule 13)
  useDebouncedEffect(
    () => {
      dispatch(
        fetchFamiliesAction({
          search: search.trim() || undefined,
          boothId: boothId || undefined,
          minMembers: minMembers ? Number(minMembers) : undefined,
          page,
          limit: 12,
        })
      );
    },
    200,
    [search, boothId, minMembers, page]
  );

  const boothOptions = [
    { label: 'All Polling Booths', value: '' },
    ...booths.map((b) => ({
      label: `Booth #${b.boothNumber ?? ''} - ${b.name}`,
      value: b.id,
    })),
  ];

  const minMemberOptions = [
    { label: 'All Family Sizes', value: '' },
    { label: '2+ Members', value: '2' },
    { label: '3+ Members', value: '3' },
    { label: '4+ Members', value: '4' },
    { label: '5+ Members (Large)', value: '5' },
  ];

  const openWhatsApp = (phone: string, headName: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Namaste ${headName} ji, greetings from our campaign office.`);
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Household & Family Networks
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                  {pagination.total} Households
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grouped voter households led by designated Family Heads
              </p>
            </div>
          </div>

          {/* CTA: Run Auto-Mapping */}
          <button
            type="button"
            onClick={() => setAutoMapModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Map Families (Booth Clustering)
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <FormInput
            name="familySearch"
            type="text"
            placeholder="Search Family ID, Head Name, EPIC, Mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />

          <FormInput
            name="familyBoothId"
            type="select"
            options={boothOptions}
            value={boothId}
            onChange={(e) => {
              setBoothId(e.target.value);
              setPage(1);
            }}
          />

          <FormInput
            name="familyMinMembers"
            type="select"
            options={minMemberOptions}
            value={minMembers}
            onChange={(e) => {
              setMinMembers(e.target.value);
              setPage(1);
            }}
          />

          <div className="flex items-center justify-end">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Families Grid Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : families.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 w-fit mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Home className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No households mapped yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Run the automated family mapping tool to cluster voters into household units by address and house number.
          </p>
          <button
            type="button"
            onClick={() => setAutoMapModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Run Family Auto-Mapping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {families.map((fam) => {
            const total = Number(fam.totalMembers) || 1;
            const supporters = Number(fam.supportersCount) || 0;
            const neutral = Number(fam.neutralCount) || 0;
            const opposition = Number(fam.oppositionCount) || 0;

            return (
              <div
                key={fam.headId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Family ID & House Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                      {fam.familyId || `FAM-${fam.headEpicNo}`}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      House: <strong className="text-slate-800 dark:text-slate-200">{fam.houseNo || 'N/A'}</strong>
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {total} Members
                  </span>
                </div>

                {/* Head of Family Profile */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <SafeImage
                      src={fam.headAvatar}
                      alt={fam.headName}
                      fallbackText={fam.headName}
                      className="w-12 h-12 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm"
                    />
                    <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-amber-400 text-slate-900 shadow">
                      <Crown className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {fam.headName}
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        ⭐ {fam.influenceScore} Inf
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{fam.headEpicNo}</span>
                      <span>•</span>
                      <span>{fam.headGender || 'N/A'}, {fam.headAge}y</span>
                    </div>

                    {fam.headMobileNo && (
                      <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                        📞 {fam.headMobileNo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Support Summary Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Support Sentiment</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{supporters} Supp</span>
                      <span className="text-slate-400 font-medium">•</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{neutral} Neut</span>
                      <span className="text-slate-400 font-medium">•</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">{opposition} Opp</span>
                    </div>
                  </div>

                  {/* Tri-color progress */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                    <div className="bg-emerald-500" style={{ width: `${(supporters / total) * 100}%` }} />
                    <div className="bg-slate-300 dark:bg-slate-600" style={{ width: `${(neutral / total) * 100}%` }} />
                    <div className="bg-rose-500" style={{ width: `${(opposition / total) * 100}%` }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHeadId(fam.headId);
                      setDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Manage Family ({fam.linkedMembersCount} linked)
                  </button>

                  {fam.headMobileNo && (
                    <button
                      type="button"
                      onClick={() => openWhatsApp(fam.headMobileNo, fam.headName)}
                      title="Send WhatsApp message to Head of Family"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-all border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} families
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-Map Modal */}
      <AutoMapFamilyModal
        isOpen={autoMapModalOpen}
        onClose={() => setAutoMapModalOpen(false)}
        booths={booths}
        selectedBoothId={boothId}
        onSuccess={() => {
          dispatch(fetchFamiliesAction({ boothId: boothId || undefined, page: 1, limit: 12 }));
        }}
      />

      {/* Member Details Modal */}
      <FamilyMemberDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedHeadId(null);
        }}
        headId={selectedHeadId}
        onSuccess={() => {
          dispatch(fetchFamiliesAction({ boothId: boothId || undefined, page, limit: 12 }));
        }}
      />
    </div>
  );
};
