import {
  Plus,
  Search,
  MessageSquare,
  Inbox,
} from 'lucide-react';
import {
  TemplateCard,
  WhatsAppPreviewModal,
} from './components';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { FormInput } from '@/components/common/FormInput';
import type { WhatsAppTemplate } from '@/types/settings.types';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

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
  const storeSettings = useAppSelector((state) => state.settings);

  const templates = customTemplates ?? storeSettings?.whatsappTemplates ?? [];
  const loading = customLoading ?? storeSettings?.loading ?? false;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const navigate = useNavigate();

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<WhatsAppTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);

  // Initial load on mount
  useDebouncedEffect(() => {
    if (onFetchTemplates) { onFetchTemplates() }
  }, 500, []);

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    if (onDeleteTemplate) {
      await onDeleteTemplate(templateToDelete.id);
    }
    setTemplateToDelete(null);
  };

  // Client-side filtering
  const filteredTemplates = (templates || []).filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.bodyText.toLowerCase().includes(q) ||
        (t.headerContent && t.headerContent.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              WhatsApp Message Templates
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Campaign message templates with dynamic voter tokens for direct voter messaging and slips
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard/whatsapp-templates/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <FormInput
            name="template_search"
            type="text"
            placeholder="Search templates by name, keyword, or body..."
            value={search}
            onChange={(e) => setSearch((e.target as any)?.value ?? e)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-48">
            <FormInput
              name="cat_filter"
              type="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory((e.target as any)?.value ?? e)}
              options={[
                { label: 'All Categories', value: '' },
                { label: 'Utility (Voter Slips, Polling)', value: 'UTILITY' },
                { label: 'Marketing (Appeals, Rallies)', value: 'MARKETING' },
                { label: 'Authentication', value: 'AUTHENTICATION' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Templates Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800/60 space-y-2">
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No Message Templates Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedCategory
              ? 'No templates match your active search filters. Try clearing the filter.'
              : 'Create your first WhatsApp voter slip or broadcast template to get started.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/whatsapp-templates/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={(tpl) => {
                setTemplateToPreview(tpl);
                setIsPreviewOpen(true);
              }}
              onEdit={(tpl) => navigate(`/dashboard/whatsapp-templates/${tpl.id}/edit`)}
              onDelete={(tpl) => setTemplateToDelete(tpl)}
            />
          ))}
        </div>
      )}

      {/* WhatsApp Mobile Chat Preview Modal */}
      <WhatsAppPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={templateToPreview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(templateToDelete)}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Message Template?"
        description={`Are you sure you want to delete template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Template"
        variant="danger"
      />
    </div>
  );
};

export default WhatsAppTemplatesSection;
