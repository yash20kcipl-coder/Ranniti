import {
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Phone,
  CornerDownLeft,
  Plus,
} from 'lucide-react';
import {
  WhatsAppPreviewModal,
} from './components';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import type { WhatsAppTemplate } from '@/types/settings.types';
import { TableActions } from '@/components/common/TableActions';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FilterBar, type FilterField } from '@/components/common/FilterBar';
import { normalizeTemplateTextToLabels } from './components/VariableChips';

interface WhatsAppTemplatesSectionProps {
  onFetchTemplates?: () => void;
  onDeleteTemplate?: (id: string) => Promise<unknown>;
  templates?: WhatsAppTemplate[];
  loading?: boolean;
}

export const WhatsAppTemplatesSection: React.FC<WhatsAppTemplatesSectionProps> = ({
  onFetchTemplates,
  onDeleteTemplate,
  templates: customTemplates,
  loading: customLoading,
}) => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const storeSettings = useAppSelector((state) => state.settings);
  const loading = customLoading ?? storeSettings?.loading ?? false;
  const templates = customTemplates ?? storeSettings?.whatsappTemplates ?? [];
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [templateToPreview, setTemplateToPreview] = useState<WhatsAppTemplate | null>(null);

  useDebouncedEffect(() => {
    if (onFetchTemplates) {
      onFetchTemplates();
    }
  }, 500, []);

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    if (onDeleteTemplate) {
      await onDeleteTemplate(templateToDelete.id);
    }
    setTemplateToDelete(null);
  };

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (templates || []).filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (query) {
        const matchName = t.name?.toLowerCase().includes(query);
        const matchBody = t.bodyText?.toLowerCase().includes(query);
        const matchMeta = t.metaTemplateId?.toLowerCase().includes(query);
        if (!matchName && !matchBody && !matchMeta) return false;
      }
      return true;
    });
  }, [templates, selectedCategory, search]);

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        value: selectedCategory,
        defaultValue: '',
        excludeFromCount: true,
        isPrimary: true,
        onChange: setSelectedCategory,
        options: [
          { label: 'All Categories', value: '' },
          { label: 'Utility (Voter Slips, Polling)', value: 'UTILITY' },
          { label: 'Marketing (Appeals, Rallies)', value: 'MARKETING' },
          { label: 'Authentication', value: 'AUTHENTICATION' },
        ],
      },
    ],
    [selectedCategory]
  );

  // Column definitions for DataTable
  const columns: Column<WhatsAppTemplate>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Template & Language',
        sortable: true,
        render: (tpl) => (
          <div className="flex items-start gap-2.5 py-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xs shrink-0 mt-0.5">
              <MessageSquare size={15} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs text-slate-900 dark:text-white font-mono leading-tight">
                  {tpl.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                  {tpl.language}
                </span>
              </div>
              {tpl.metaTemplateId ? (
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                  ID: {tpl.metaTemplateId}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 italic mt-0.5">Custom template</span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category & Format',
        sortable: true,
        render: (tpl) => {
          const categoryConfig: Record<string, string> = {
            UTILITY:
              'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            MARKETING:
              'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            AUTHENTICATION:
              'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          };
          const catClass =
            categoryConfig[tpl.category] ||
            'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

          return (
            <div className="flex flex-col gap-1 items-start">
              <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase border ${catClass}`}>
                {tpl.category}
              </span>
              {tpl.headerType !== 'NONE' ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                  {tpl.headerType} Header
                </span>
              ) : (
                <span className="text-[9.5px] text-slate-400 italic">No header</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'metaStatus',
        header: 'Review Status',
        sortable: true,
        render: (tpl) => {
          switch (tpl.metaStatus) {
            case 'APPROVED':
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Approved
                </span>
              );
            case 'PENDING':
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                  Under Review
                </span>
              );
            case 'REJECTED':
              return (
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Rejected
                  </span>
                  {tpl.metaRejectionReason && (
                    <span
                      className="text-[9.5px] text-rose-600 dark:text-rose-400 line-clamp-1 max-w-[140px]"
                      title={tpl.metaRejectionReason}
                    >
                      {tpl.metaRejectionReason}
                    </span>
                  )}
                </div>
              );
            default:
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Draft
                </span>
              );
          }
        },
      },
      {
        key: 'bodyText',
        header: 'Message Content',
        render: (tpl) => {
          const normalizedBody = normalizeTemplateTextToLabels(
            tpl.bodyText ? tpl.bodyText.replace(/\\n/g, '\n') : ''
          );
          return (
            <div className="flex flex-col gap-1 max-w-sm">
              {tpl.headerContent && (
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {tpl.headerType === 'TEXT'
                    ? tpl.headerContent.replace(/^https?:\/\/[^/]+\//, '')
                    : tpl.headerContent}
                </span>
              )}
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2 font-sans">
                {normalizedBody}
              </p>
              {tpl.footerText && (
                <span className="text-[9.5px] text-slate-400 italic truncate">
                  {tpl.footerText}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'variables',
        header: 'Tokens & Interactive CTA',
        render: (tpl) => {
          const hasVariables = tpl.variables && tpl.variables.length > 0;
          const hasButtons = tpl.buttons && tpl.buttons.length > 0;

          return (
            <div className="flex flex-col gap-1.5 max-w-xs">
              {hasVariables && (
                <div className="flex flex-wrap items-center gap-1">
                  {tpl.variables.slice(0, 3).map((token, idx) => {
                    const friendlyToken =
                      token === '1'
                        ? 'voter_name'
                        : token === '2'
                          ? 'booth_name'
                          : token === '3'
                            ? 'section_no'
                            : token === '4'
                              ? 'serial_no'
                              : token === '5'
                                ? 'polling_date'
                                : token;
                    return (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-mono text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40"
                      >
                        {`{{${friendlyToken}}}`}
                      </span>
                    );
                  })}
                  {tpl.variables.length > 3 && (
                    <span className="text-[9.5px] text-slate-400 font-semibold">
                      +{tpl.variables.length - 3} more
                    </span>
                  )}
                </div>
              )}
              {hasButtons && (
                <div className="flex flex-wrap items-center gap-1">
                  {tpl.buttons.map((btn, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {btn.type === 'URL' && <ExternalLink className="w-2.5 h-2.5 text-blue-500" />}
                      {btn.type === 'PHONE_NUMBER' && <Phone className="w-2.5 h-2.5 text-emerald-500" />}
                      {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-2.5 h-2.5 text-indigo-500" />}
                      <span className="truncate max-w-[80px]">{btn.text}</span>
                    </span>
                  ))}
                </div>
              )}
              {!hasVariables && !hasButtons && (
                <span className="text-[10px] text-slate-400 italic">Static text only</span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Standard DataTable for WhatsApp Message Templates with Embedded FilterBar */}
      <DataTable<WhatsAppTemplate>
        columns={columns}
        loading={loading}
        data={filteredTemplates}
        showHeader={false}
        selectable={false}
        filterBar={
          <FilterBar
            embedded
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search templates by name, keyword, or body..."
            filters={filterFields}
            showDrawerButton={false}
            showResetButton={false}
            onReset={() => {
              setSearch('');
              setSelectedCategory('');
            }}
            extraActions={
              <button
                type="button"
                onClick={() => navigate('/dashboard/whatsapp-templates/new')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Template</span>
              </button>
            }
          />
        }
        actions={(tpl) => (
          <TableActions
            onView={() => {
              setTemplateToPreview(tpl);
              setIsPreviewOpen(true);
            }}
            onEdit={() => navigate(`/dashboard/whatsapp-templates/${tpl.id}/edit`)}
            onDelete={() => setTemplateToDelete(tpl)}
          />
        )}
      />

      {/* WhatsApp Mobile Chat Preview Modal */}
      <WhatsAppPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={templateToPreview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        variant="danger"
        title="Delete Message Template?"
        confirmText="Delete Template"
        isOpen={Boolean(templateToDelete)}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={handleConfirmDelete}
        description={`Are you sure you want to delete template "${templateToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default WhatsAppTemplatesSection;
