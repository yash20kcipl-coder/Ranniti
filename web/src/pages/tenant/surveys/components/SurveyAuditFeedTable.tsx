import React, { useMemo } from 'react';
import { SafeImage } from '@/components/common/SafeImage';
import type { SurveyAuditFeedRow } from '@/redux/actions/survey';
import { ArrowRight, Clock, User, Award } from 'lucide-react';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';

interface SurveyAuditFeedTableProps {
  items: SurveyAuditFeedRow[];
  loading: boolean;
  page: number;
  limit: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export const SurveyAuditFeedTable: React.FC<SurveyAuditFeedTableProps> = ({
  items,
  loading,
  page,
  limit,
  totalCount,
  onPageChange,
  search,
  onSearchChange,
}) => {
  const columns: Column<SurveyAuditFeedRow>[] = useMemo(
    () => [
      {
        key: 'volunteer',
        header: 'Volunteer',
        render: (item) => (
          <div className="flex items-center gap-2.5">
            <SafeImage
              src={item.volunteerAvatar}
              alt={item.volunteerName}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
              fallbackText={item.volunteerName}
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              <span className="font-semibold text-[10.5px] text-slate-900 dark:text-white leading-tight truncate max-w-[170px]">
                {item.volunteerName}
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                {item.volunteerMobile}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'voter',
        header: 'Voter / Booth',
        render: (item) => (
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-semibold text-[10.5px] text-slate-900 dark:text-white leading-tight truncate max-w-[170px]">
                {item.voterName || 'Unknown Voter'}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono">
              EPIC: {item.voterEpicNo} {item.boothName ? `• ${item.boothName}` : ''}
            </span>
          </div>
        ),
      },
      {
        key: 'field',
        header: 'Enriched Field',
        render: (item) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {item.fieldLabel || item.fieldName}
          </span>
        ),
      },
      {
        key: 'valueChange',
        header: 'Value Change (Old ➔ New)',
        render: (item) => (
          <div className="flex items-center gap-1.5 max-w-xs text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
              {item.oldValue ? item.oldValue : <em className="text-slate-400">Empty</em>}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold truncate max-w-[120px] border border-emerald-100 dark:border-emerald-900">
              {item.newValue ? item.newValue : <em className="text-slate-400">Removed</em>}
            </span>
          </div>
        ),
      },
      {
        key: 'points',
        header: 'Points',
        align: 'center',
        render: (item) =>
          item.pointsAwarded > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Award className="w-3 h-3" />
              +{item.pointsAwarded} pts
            </span>
          ) : (
            <span className="text-[9.5px] text-slate-400 font-mono">0 pts</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Timestamp',
        align: 'right',
        render: (item) => (
          <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {new Date(item.createdAt).toLocaleString()}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      showHeader={false}
      selectable={false}
      filterBar={
        <FilterBar
          embedded
          showDrawerButton={false}
          showResetButton={false}
          searchValue={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search updates by volunteer, voter, or EPIC..."
        />
      }
      serverPagination={{
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        onPageChange,
      }}
    />
  );
};
