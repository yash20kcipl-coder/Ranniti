import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import {
  fetchSurveyLeaderboard,
  fetchVolunteerSurveyStats,
  exportSurveyLeaderboard,
  type VolunteerLeaderboardRow,
} from '@/redux/actions/survey';
import { fetchTenantBoothOptions } from '@/redux/actions/voterTenant';
import { VOLUNTEER_ROLE_OPTIONS } from '@/constants/dropdownOptions';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import type { Option } from '@/components/common/FormInput';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { SafeImage } from '@/components/common/SafeImage';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { TableActions, TableActionButton } from '@/components/common/TableActions';
import { VolunteerScorecardModal } from './components/VolunteerScorecardModal';
import { SurveyPointsConfigSection } from '@/pages/tenant/settings/components/SurveyPointsConfigSection';
import {
  Award,
  Download,
  Settings,
  Eye,
  Users,
  CheckCircle2,
  Sparkles,
  Phone,
  Vote,
  Shield,
  UserCheck,
  UserCog,
} from 'lucide-react';

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pc_leader: { label: 'PC Leader', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: Shield },
  ac_leader: { label: 'AC Leader', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: Award },
  sub_leader: { label: 'Sub-Leader', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: Users },
  supporter: { label: 'Volunteer', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: UserCheck },
  tenant_user: { label: 'Tenant User', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: UserCog },
};

export const TenantVolunteerSurveysPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    leaderboard,
    leaderboardLoading,
    selectedVolunteerStats,
    volunteerStatsLoading,
  } = useAppSelector((state) => state.survey);

  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [boothId, setBoothId] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [boothOptions, setBoothOptions] = useState<Option[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load booth options once on mount per Rule 13
  useDebouncedEffect(
    () => {
      dispatch(fetchTenantBoothOptions({ saveToStore: false }))
        .then((opts: any) => {
          if (Array.isArray(opts)) {
            setBoothOptions(opts);
          }
        })
        .catch(() => { });
    },
    150,
    [dispatch]
  );

  // Debounced API fetch per Rule 13
  useDebouncedEffect(
    () => {
      dispatch(
        fetchSurveyLeaderboard({
          timeRange,
          boothId: boothId || undefined,
          role: role || undefined,
          search,
        })
      );
    },
    200,
    [timeRange, boothId, role, search]
  );

  const handleOpenVolunteerModal = (volunteerId: string) => {
    dispatch(fetchVolunteerSurveyStats(volunteerId));
    setModalOpen(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await dispatch(
        exportSurveyLeaderboard({
          timeRange,
          boothId: boothId || undefined,
          role: role || undefined,
          search,
        })
      );
    } finally {
      setExporting(false);
    }
  };

  const handleResetFilters = () => {
    setTimeRange('30d');
    setBoothId('');
    setRole('');
    setSearch('');
  };

  const kpiStats = useMemo(() => {
    let totalPoints = 0;
    let totalVoters = 0;
    let totalFields = 0;
    let activeVolunteers = 0;

    for (const row of leaderboard) {
      totalPoints += row.totalScore || 0;
      totalVoters += row.votersSurveyed || 0;
      totalFields += row.fieldsUpdated || 0;
      if ((row.fieldsUpdated || 0) > 0) {
        activeVolunteers += 1;
      }
    }

    return {
      totalPoints,
      totalVoters,
      totalFields,
      activeVolunteers,
    };
  }, [leaderboard]);

  const leaderboardFilterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'timeRange',
        label: 'Time Range',
        type: 'select',
        value: timeRange,
        defaultValue: '30d',
        excludeFromCount: true,
        onChange: (val) => setTimeRange((val || '30d') as any),
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Last 7 Days', value: '7d' },
          { label: 'Last 30 Days', value: '30d' },
          { label: 'All Time', value: 'all' },
        ],
        isPrimary: true,
      },
      {
        key: 'role',
        label: 'Role Tier',
        type: 'select',
        value: role,
        placeholder: 'All Roles',
        onChange: (val) => setRole(val || ''),
        options: VOLUNTEER_ROLE_OPTIONS,
        isPrimary: true,
      },
      {
        key: 'boothId',
        label: 'Polling Booth',
        type: 'select',
        value: boothId,
        placeholder: 'All Booths',
        onChange: (val) => setBoothId(val || ''),
        options: boothOptions,
        isPrimary: false,
      },
    ],
    [timeRange, boothId, role, boothOptions]
  );

  const leaderboardColumns: Column<VolunteerLeaderboardRow>[] = useMemo(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        align: 'center',
        width: '64px',
        render: (row) => {
          const rankBadgeColor =
            row.rank === 1
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              : row.rank === 2
                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300'
                : row.rank === 3
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black border ${rankBadgeColor}`}
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
          <button
            type="button"
            onClick={() => handleOpenVolunteerModal(row.volunteerId)}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <SafeImage
              src={row.avatar}
              alt={row.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
              fallbackText={row.name}
            />
            <div className="flex flex-col min-w-0 justify-center gap-0.5">
              <span className="font-semibold text-[11px] text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate max-w-[160px]">
                {row.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatPhoneNumber(row.mobile)}
              </span>
            </div>
          </button>
        ),
      },
      {
        key: 'role',
        header: 'Role Tier',
        render: (row) => {
          const cfg = ROLE_BADGES[row.role] || {
            label: row.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            icon: UserCheck,
          };
          const RoleIcon = cfg.icon;
          return (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${cfg.color}`}>
              <RoleIcon size={11} className="shrink-0" />
              {cfg.label}
            </span>
          );
        },
      },
      {
        key: 'totalScore',
        header: 'Score',
        sortable: true,
        align: 'center',
        render: (row) => {
          const hasScore = row.totalScore > 0;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono border whitespace-nowrap ${hasScore
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700/80'
                }`}
            >
              <Award className={`w-3 h-3 ${hasScore ? 'text-indigo-500' : 'text-slate-400'}`} />
              {row.totalScore} pts
            </span>
          );
        },
      },
      {
        key: 'votersSurveyed',
        header: 'Voters',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span
            className={`font-mono text-[11px] font-semibold ${row.votersSurveyed > 0
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            {row.votersSurveyed}
          </span>
        ),
      },
      {
        key: 'fieldsUpdated',
        header: 'Fields',
        sortable: true,
        align: 'center',
        render: (row) => (
          <span
            className={`font-mono text-[11px] font-medium ${row.fieldsUpdated > 0
                ? 'text-slate-700 dark:text-slate-300'
                : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            {row.fieldsUpdated}
          </span>
        ),
      },
      {
        key: 'categoryPoints',
        header: 'Breakdown',
        align: 'center',
        render: (row) => (
          <div className="inline-flex items-center justify-center gap-1 text-[10px]">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono border ${row.contactPoints > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200/60 dark:border-slate-800'
                }`}
              title="Contact Points (Mobile, Email)"
            >
              <Phone className="w-2.5 h-2.5" />
              {row.contactPoints}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono border ${row.politicalPoints > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200/60 dark:border-slate-800'
                }`}
              title="Political Points (Party, Influencers)"
            >
              <Vote className="w-2.5 h-2.5" />
              {row.politicalPoints}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono border ${row.demographicPoints > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200/60 dark:border-slate-800'
                }`}
              title="Demographic Points (Caste, Religion, Profession)"
            >
              <Users className="w-2.5 h-2.5" />
              {row.demographicPoints}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Standardized PageHeader Component per Rule 18 */}
      <PageHeader
        title="Volunteer Survey & Scoring Leaderboard"
        subtitle="Track door-to-door survey progress, voter field enrichment points, and volunteer rankings"
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

      {/* Survey KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Points Awarded</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {kpiStats.totalPoints.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Voters Surveyed</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {kpiStats.totalVoters.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Fields Enriched</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {kpiStats.totalFields.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Active Surveyors</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {kpiStats.activeVolunteers.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {leaderboard.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Volunteer Survey Leaderboard Table */}
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
            showDrawerButton={boothOptions.length > 0}
            showResetButton={Boolean(boothId || role || search || timeRange !== '30d')}
            onReset={handleResetFilters}
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
