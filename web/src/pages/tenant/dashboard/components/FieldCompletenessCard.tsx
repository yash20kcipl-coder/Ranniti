import React, { useMemo } from 'react';
import {
  ClipboardCheck,
  Phone,
  Vote,
  Users,
  Home,
  BookOpen,
  Briefcase,
  UserCheck,
  Lightbulb,
} from 'lucide-react';
import { Card, CardFooterLink } from '@/components/common/Card';
import type { TenantDashboardOverviewPayload } from '@/redux/actions/tenantDashboardOverview';

interface FieldCompletenessCardProps {
  data: TenantDashboardOverviewPayload | null;
  loading: boolean;
}

const FIELD_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  mobile_no: Phone,
  party_id: Vote,
  caste_id: Users,
  family_id: Home,
  house_no: Home,
  religion_id: BookOpen,
  profession: Briefcase,
  influencer: UserCheck,
};

export const FieldCompletenessCard: React.FC<FieldCompletenessCardProps> = ({ data, loading }) => {
  const completeness = data?.fieldCompleteness;
  const overallScore = completeness?.overallScore || 0;
  const fields = completeness?.fields || [];
  const totalVoters = data?.totalVoters || 0;

  const scoreBadge = useMemo(() => {
    if (overallScore >= 75) {
      return {
        label: `${overallScore}% ready`,
        pill: 'bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 border border-transparent dark:border-emerald-800/40',
        dot: 'bg-[#16A34A]',
      };
    }
    if (overallScore >= 25) {
      return {
        label: `${overallScore}% in progress`,
        pill: 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-transparent dark:border-amber-800/40',
        dot: 'bg-[#F59E0B]',
      };
    }
    return {
      label: `${overallScore}% needs attention`,
      pill: 'bg-[#FFE4E6] dark:bg-rose-950/60 text-[#9F1239] dark:text-rose-300 border border-transparent dark:border-rose-800/40',
      dot: 'bg-[#BE123C]',
    };
  }, [overallScore]);

  const getFieldTone = (percentage: number, filledCount: number) => {
    if (filledCount === 0 || percentage === 0) {
      return {
        iconBg: 'bg-[#EEF1F6] dark:bg-slate-800',
        iconInk: 'text-[#64748B] dark:text-slate-400',
        barBg: 'bg-[#94A3B8] dark:bg-slate-600',
        pill: 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-transparent dark:border-slate-700/60',
      };
    }
    if (percentage < 25) {
      return {
        iconBg: 'bg-[#FFE4E6] dark:bg-rose-950/50',
        iconInk: 'text-[#BE123C] dark:text-rose-400',
        barBg: 'bg-[#E11D48] dark:bg-rose-500',
        pill: 'bg-[#FFE4E6] dark:bg-rose-950/60 text-[#9F1239] dark:text-rose-300 border border-transparent dark:border-rose-900/40',
      };
    }
    if (percentage < 100) {
      return {
        iconBg: 'bg-[#FEF3C7] dark:bg-amber-950/50',
        iconInk: 'text-[#B45309] dark:text-amber-400',
        barBg: 'bg-[#F59E0B] dark:bg-amber-500',
        pill: 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-transparent dark:border-amber-900/40',
      };
    }
    return {
      iconBg: 'bg-[#DCFCE7] dark:bg-emerald-950/50',
      iconInk: 'text-[#15803D] dark:text-emerald-400',
      barBg: 'bg-[#16A34A] dark:bg-emerald-500',
      pill: 'bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#166534] dark:text-emerald-300 border border-transparent dark:border-emerald-900/40',
    };
  };

  const unstartedFields = useMemo(() => {
    return fields.filter((f) => f.filledCount === 0 || f.percentage === 0);
  }, [fields]);

  const unstartedText = useMemo(() => {
    if (unstartedFields.length === 0) return '';
    const names = unstartedFields.map((f) => f.label.toLowerCase());
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    if (names.length <= 4) {
      return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    }
    return `${names.slice(0, 3).join(', ')} and ${names.length - 3} other details`;
  }, [unstartedFields]);

  if (loading || !data) {
    return (
      <Card
        loading
        skeletonVariant="tiles"
        title="Important voter details filled"
        subtitle="How complete your voter profiles are"
        icon={<ClipboardCheck size={20} className="text-[#4338CA] dark:text-indigo-400" />}
        className="flex flex-col justify-between h-full min-h-[620px]"
      />
    );
  }

  return (
    <Card
      title="Important voter details filled"
      subtitle="How complete your voter profiles are"
      icon={<ClipboardCheck size={20} className="text-[#4338CA] dark:text-indigo-400" />}
      badge={
        <span
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full ${scoreBadge.pill}`}
        >
          <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${scoreBadge.dot}`} />
          {scoreBadge.label}
        </span>
      }
      headerClassName="border-[#EEF1F6] dark:border-slate-800/80"
      footerClassName="bg-[#FAFBFD] dark:bg-slate-900/60 border-[#EEF1F6] dark:border-slate-800/80"
      footer={
        <CardFooterLink
          hint="Volunteers earn points for filling in missing details"
          label="Volunteer surveys"
          to="/dashboard/surveys"
        />
      }
      className="flex flex-col justify-between h-full min-h-[620px]"
    >
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center my-auto">
          <ClipboardCheck size={36} className="text-slate-300 dark:text-slate-600 mb-2.5" />
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">
            No voter details to measure yet
          </p>
          <p className="text-[13px] text-slate-400 mt-1 max-w-xs">
            Add or import voters to see how complete your records are.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between gap-4">
          {/* Grid of details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field) => {
              const Icon = FIELD_ICONS[field.key] || ClipboardCheck;
              const tone = getFieldTone(field.percentage, field.filledCount);

              return (
                <div
                  key={field.key}
                  title={field.hint}
                  className="p-3 sm:p-3.5 dark:border-slate-800/90 rounded-[14px] bg-[#FAFBFD] dark:bg-slate-800/90 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 ${tone.iconBg} ${tone.iconInk}`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-[#0F172A] dark:text-white leading-[16px] truncate">
                        {field.label}
                      </div>
                      <div className="text-[10px] text-[#475569] dark:text-slate-400 leading-[14px] tabular-nums truncate">
                        {field.filledCount === 0
                          ? 'None filled yet'
                          : `${field.filledCount.toLocaleString()} of ${totalVoters.toLocaleString()} voters`}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 min-w-[45px] text-center rounded-full text-[10px] font-bold tabular-nums shrink-0 ${tone.pill}`}
                    >
                      {field.percentage}%
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="h-2 rounded-[4px] bg-[#E8ECF3] dark:bg-slate-700/80 overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-[4px] transition-all duration-500 ${tone.barBg}`}
                      style={{ width: `${Math.min(100, Math.max(0, field.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Tip Box */}
          {unstartedFields.length > 0 ? (
            <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-[12px] bg-[#FFFBEB] dark:bg-amber-950/30 dark:border-amber-800/50 text-[13px] leading-[19px] mt-auto">
              <Lightbulb size={20} className="text-[#B45309] dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#78350F] dark:text-amber-200">
                  {unstartedFields.length}{' '}
                  {unstartedFields.length === 1 ? "detail hasn't" : "details haven't"} been started yet
                </div>
                <div className="text-[#92400E] dark:text-amber-300/90 text-[12.5px] mt-0.5">
                  {unstartedText} {unstartedFields.length === 1 ? 'is at 0%' : 'are all at 0%'}.
                  Ask volunteers to fill {unstartedFields.length === 1 ? 'this' : 'these'} in first.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-[12px] bg-[#ECFDF5] dark:bg-emerald-950/30 dark:border-emerald-800/50 text-[13px] leading-[19px] mt-auto">
              <ClipboardCheck size={20} className="text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#065F46] dark:text-emerald-200">
                  All voter details have active progress
                </div>
                <div className="text-[#166534] dark:text-emerald-300/90 text-[12.5px] mt-0.5">
                  Great coverage! Continue regular door-to-door surveys to bring all records to 100%.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
