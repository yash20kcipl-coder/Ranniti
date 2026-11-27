import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import {
  fetchSurveyLeaderboard,
  fetchSurveyAuditFeed,
  fetchVolunteerSurveyStats,
  exportSurveyLeaderboard,
  type VolunteerLeaderboardRow,
} from '@/redux/actions/survey';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { SafeImage } from '@/components/common/SafeImage';
import { TabContainer, type TabItem } from '@/components/common/TabContainer';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { TableActions, TableActionButton } from '@/components/common/TableActions';
import { VolunteerScorecardModal } from './components/VolunteerScorecardModal';
import { SurveyAuditFeedTable } from './components/SurveyAuditFeedTable';
import { SurveyPointsConfigSection } from '@/pages/tenant/settings/components/SurveyPointsConfigSection';
import {
  Award,
  Download,
  Settings,
  Trophy,
  History,
  Eye,
} from 'lucide-react';

type SurveyTabKey = 'leaderboard' | 'audit-feed';

export const TenantVolunteerSurveysPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    leaderboard,
    leaderboardLoading,
    auditItems,
    auditLoading,
    auditPage,
    auditLimit,
    totalAuditCount,
    selectedVolunteerStats,
    volunteerStatsLoading,
  } = useAppSelector((state) => state.survey);

  const [activeTab, setActiveTab] = useState<SurveyTabKey>('leaderboard');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Debounced API fetch per Rule 13
  useDebouncedEffect(
    () => {
      if (activeTab === 'leaderboard') {
        dispatch(fetchSurveyLeaderboard({ timeRange, search }));
      } else {
        dispatch(fetchSurveyAuditFeed({ search, page: auditPage, limit: auditLimit }));
      }
    },
    200,
    [activeTab, timeRange, search, auditPage]
  );

  const handleOpenVolunteerModal = (volunteerId: string) => {
    dispatch(fetchVolunteerSurveyStats(volunteerId));
    setModalOpen(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await dispatch(exportSurveyLeaderboard({ timeRange, search }));
    } finally {
      setExporting(false);
    }
  };

  const leaderboardFilterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'timeRange',
        label: 'Time Range',
        type: 'select',
        value: timeRange,
        defaultValue: '30d',
        excludeFromCount: true,
        onChange: (val) => setTimeRange(val as any),
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Last 7 Days', value: '7d' },
          { label: 'Last 30 Days', value: '30d' },
          { label: 'All Time', value: 'all' },
        ],
        isPrimary: true,
      },
    ],
    [timeRange]
  );

  const leaderboardColumns: Column<VolunteerLeaderboardRow>[] = useMemo(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        align: 'center',
        render: (row) => {
          const rankBadgeColor =
            row.rank === 1
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              : row.rank === 2
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300'
                : row.rank === 3
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200';

          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black border ${rankBadgeColor}`}
              >
                {row.rank}
              </span>
            </div>
          );
        },
      },
      {
        key: 'name',
        header: 'Volunteer',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <SafeImage
              src={row.avatar}
              alt={row.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
              fallbackText={row.name}
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              <span className="font-semibold text-[10.5px] text-slate-900 dark:text-white leading-tight truncate max-w-[180px]">
                {row.name}
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                {row.mobile}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role Tier',
        render: (row) => (
          <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {row.role}
          </span>
        ),
      },
      {
        key: 'totalScore',
        header: 'Total Score',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Award className="w-3 h-3 text-indigo-500" />
            {row.totalScore} pts
          </span>
        ),
      },
      {
        key: 'votersSurveyed',
        header: 'Voters Surveyed',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span className="font-mono text-[10px] font-semibold text-slate-900 dark:text-white">
            {row.votersSurveyed}
          </span>
        ),
      },
      {
        key: 'fieldsUpdated',
        header: 'Fields Updated',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span className="font-mono text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {row.fieldsUpdated}
          </span>
        ),
      },
      {
        key: 'categoryPoints',
        header: 'Category Points',
        align: 'center',
        render: (row) => (
          <div className="inline-flex items-center justify-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono" title="Contact Points">
              📞 {row.contactPoints}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono" title="Political Leaning Points">
              🗳️ {row.politicalPoints}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono" title="Demographic Points">
              👥 {row.demographicPoints}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const navTabs: TabItem<SurveyTabKey>[] = [
    {
      id: 'leaderboard',
      label: 'Volunteer Leaderboard',
      icon: Trophy,
      count: leaderboard.length,
    },
    {
      id: 'audit-feed',
      label: 'Live Field Updates Feed',
      icon: History,
      count: totalAuditCount,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Standardized PageHeader Component per Rule 18 */}
      <PageHeader
        title="Volunteer Survey & Scoring Leaderboard"
        subtitle="Track door-to-door survey progress, voter field enrichment points, and cadre rankings"
        icon={<Award className="w-5 h-5 text-indigo-500" />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              {exporting ? 'Exporting...' : 'Export .xlsx'}
            </button>
            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              <Settings className="w-4 h-4" />
              View Scoring Rules
            </button>
          </div>
        }
      />

      {/* Tab Container */}
      <TabContainer<SurveyTabKey>
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        views={{
          leaderboard: (
            <DataTable
              columns={leaderboardColumns}
              data={leaderboard}
              loading={leaderboardLoading}
              showHeader={false}
              selectable={false}
              filterBar={
                <FilterBar
                  embedded
                  filters={leaderboardFilterFields}
                  showDrawerButton={false}
                  showResetButton={false}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search volunteer by name or phone..."
                />
              }
              actions={(row) => (
                <TableActions
                  extra={
                    <TableActionButton
                      variant="custom"
                      icon={Eye}
                      title="View Score Breakdown"
                      onClick={() => handleOpenVolunteerModal(row.volunteerId)}
                      className="bg-indigo-50/90 text-indigo-600 border border-indigo-200/90 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-indigo-400 dark:border-slate-700"
                    />
                  }
                />
              )}
            />
          ),
          'audit-feed': (
            <SurveyAuditFeedTable
              items={auditItems}
              loading={auditLoading}
              page={auditPage}
              limit={auditLimit}
              totalCount={totalAuditCount}
              search={search}
              onSearchChange={setSearch}
              onPageChange={(p) => dispatch(fetchSurveyAuditFeed({ search, page: p, limit: auditLimit }))}
            />
          ),
        }}
      />

      {/* Volunteer Detailed Scorecard Modal */}
      <VolunteerScorecardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedVolunteerStats}
        loading={volunteerStatsLoading}
      />

      {/* Super Admin Configured Scoring Rules Modal (Read-Only) */}
      <Modal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        title="Campaign Survey Scoring Rules"
        subtitle="Platform-wide point weights configured centrally by Super Admin"
        maxWidth="5xl"
      >
        <SurveyPointsConfigSection readOnly={true} />
      </Modal>
    </div>
  );
};

export default TenantVolunteerSurveysPage;
