import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import type { PushTriggerConfig } from '../types/settings.types';
import {
  BellRing,
  CalendarCheck,
  Flag,
  Vote,
  AlertOctagon,
  Moon,
  Clock,
} from 'lucide-react';

interface NotificationTriggersCardProps {
  triggers: PushTriggerConfig;
  onChange: (updatedTriggers: PushTriggerConfig) => void;
}

export const NotificationTriggersCard: React.FC<NotificationTriggersCardProps> = ({
  triggers,
  onChange,
}) => {
  const updateTrigger = (field: keyof PushTriggerConfig, value: any) => {
    onChange({ ...triggers, [field]: value });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
          <BellRing className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Automated Mobile Push Triggers
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rules and scheduled push alerts dispatched to Field Workers & Booth In-charges
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Trigger 1: Daily Booth Briefing */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mt-0.5">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Daily Booth Duty Briefing
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                  Morning Routine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically notifies booth captains of pending door-to-door verification targets every morning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {triggers.dailyBriefing && (
              <div className="w-28">
                <FormInput
                  name="briefing_time"
                  type="text"
                  placeholder="07:00"
                  value={triggers.briefingTime}
                  onChange={(e) => updateTrigger('briefingTime', (e.target as any)?.value ?? e)}
                  icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>
            )}
            <FormInput
              name="daily_briefing_toggle"
              type="switch"
              value={triggers.dailyBriefing}
              onChange={(e) => updateTrigger('dailyBriefing', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Trigger 2: Voter Survey Milestones */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Voter Survey Milestones
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  50% / 80% / 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Congratulatory and status alerts dispatched when a booth achieves verification milestones.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="survey_milestones_toggle"
              type="switch"
              value={triggers.surveyMilestones}
              onChange={(e) => updateTrigger('surveyMilestones', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Trigger 3: Election Day Hourly Turnout */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mt-0.5">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Poll Day Hourly Turnout Reminders
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                  Election Day Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sends high-priority alerts every 2 hours between 07:00 AM - 06:00 PM for booth agents to report voter turnout percentage.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="poll_day_turnout_toggle"
              type="switch"
              value={triggers.pollDayTurnout}
              onChange={(e) => updateTrigger('pollDayTurnout', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Trigger 4: Urgent War Room Broadcasts */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mt-0.5">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Urgent War Room Broadcasts
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                  High Priority Siren
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bypasses standard silent modes on mobile apps for emergency announcements from Campaign War Room.
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <FormInput
              name="urgent_broadcasts_toggle"
              type="switch"
              value={triggers.urgentBroadcasts}
              onChange={(e) => updateTrigger('urgentBroadcasts', (e.target as any)?.value ?? e)}
            />
          </div>
        </div>

        {/* Delivery Control: Quiet Hours (DND) */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 mt-0.5">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quiet Hours (Do Not Disturb)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Suppress non-critical routine notifications during night hours so volunteers aren't disturbed.
                </p>
              </div>
            </div>

            <FormInput
              name="quiet_hours_toggle"
              type="switch"
              value={triggers.quietHoursEnabled}
              onChange={(e) => updateTrigger('quietHoursEnabled', (e.target as any)?.value ?? e)}
            />
          </div>

          {triggers.quietHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/80">
              <FormInput
                name="quiet_start"
                type="text"
                label="Quiet Hours Start"
                placeholder="22:00"
                value={triggers.quietHoursStart}
                onChange={(e) => updateTrigger('quietHoursStart', (e.target as any)?.value ?? e)}
                icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
              />

              <FormInput
                name="quiet_end"
                type="text"
                label="Quiet Hours End"
                placeholder="06:30"
                value={triggers.quietHoursEnd}
                onChange={(e) => updateTrigger('quietHoursEnd', (e.target as any)?.value ?? e)}
                icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTriggersCard;
