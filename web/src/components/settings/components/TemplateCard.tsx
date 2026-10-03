import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Send,
  Edit2,
  Trash2,
  ExternalLink,
  CornerDownLeft,
  Phone,
} from 'lucide-react';
import React from 'react';
import type { WhatsAppTemplate } from '@/types/settings.types';

interface TemplateCardProps {
  template: WhatsAppTemplate;
  onPreview: (template: WhatsAppTemplate) => void;
  onTestSend: (template: WhatsAppTemplate) => void;
  onEdit: (template: WhatsAppTemplate) => void;
  onDelete: (template: WhatsAppTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onTestSend,
  onEdit,
  onDelete,
}) => {
  const getStatusBadge = () => {
    switch (template.metaStatus) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            Under Meta Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Draft
          </span>
        );
    }
  };

  const getCategoryColor = () => {
    switch (template.category) {
      case 'UTILITY':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'MARKETING':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* Top Header Row */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate font-mono">
              {template.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getCategoryColor()}`}>
                {template.category}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                {template.language}
              </span>
              {template.headerType !== 'NONE' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {template.headerType} Header
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        {/* Rejection Reason if any */}
        {template.metaStatus === 'REJECTED' && template.metaRejectionReason && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            <span className="font-semibold">Rejection Reason: </span>
            <span>{template.metaRejectionReason}</span>
          </div>
        )}

        {/* Message Content Preview Box */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-2">
          {template.headerContent && (
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1.5 truncate">
              {template.headerType === 'TEXT'
                ? template.headerContent.replace(/^https?:\/\/[^/]+\//, '')
                : template.headerContent}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4 font-sans">
            {template.bodyText ? template.bodyText.replace(/\\n/g, '\n') : ''}
          </p>

          {template.footerText && (
            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800 truncate">
              {template.footerText}
            </p>
          )}

          {/* Action Buttons Badges */}
          {template.buttons && template.buttons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {template.buttons.map((btn, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  {btn.type === 'URL' && <ExternalLink className="w-2.5 h-2.5 text-blue-500" />}
                  {btn.type === 'PHONE_NUMBER' && <Phone className="w-2.5 h-2.5 text-emerald-500" />}
                  {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-2.5 h-2.5 text-indigo-500" />}
                  <span>{btn.text}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Variables Cloud */}
        {template.variables && template.variables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400">Tokens:</span>
            {template.variables.map((token, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
              >
                {`{{${token}}}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Preview Live on Mobile Chat"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => onTestSend(template)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title="Send Test WhatsApp Message"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Test Send</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Template"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(template)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete Template"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
