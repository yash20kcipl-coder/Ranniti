import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchWhatsAppTemplates,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  syncMetaWhatsAppTemplates,
} from '@/redux/actions/settings';
import {
  TemplateCard,
  TemplateBuilderModal,
  WhatsAppPreviewModal,
  TestWhatsAppModal,
} from '../components';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FormInput } from '@/components/common/FormInput';
import type { WhatsAppTemplate } from '../types/settings.types';
import {
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Inbox,
} from 'lucide-react';

export const WhatsAppTemplatesSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { whatsappTemplates, loading, syncing, saving } = useAppSelector((state) => state.settings);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<WhatsAppTemplate | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<WhatsAppTemplate | null>(null);

  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [templateToTest, setTemplateToTest] = useState<WhatsAppTemplate | null>(null);

  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchWhatsAppTemplates());
  }, [dispatch]);

  const handleSyncMeta = async () => {
    await dispatch(syncMetaWhatsAppTemplates());
  };

  const handleCreateOrUpdate = async (templateData: Partial<WhatsAppTemplate>) => {
    if (templateToEdit) {
      await dispatch(updateWhatsAppTemplate(templateToEdit.id, templateData));
    } else {
      await dispatch(createWhatsAppTemplate(templateData));
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    await dispatch(deleteWhatsAppTemplate(templateToDelete.id));
    setTemplateToDelete(null);
  };

  // Client-side filtering
  const filteredTemplates = whatsappTemplates.filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (selectedStatus && t.metaStatus !== selectedStatus) return false;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
            Meta Cloud API verified templates for voter information slips, appeals, and alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncMeta}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
            title="Sync approval statuses from Meta Cloud API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync with Meta'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTemplateToEdit(null);
              setIsBuilderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
          <div className="w-40">
            <FormInput
              name="cat_filter"
              type="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory((e.target as any)?.value ?? e)}
              options={[
                { label: 'All Categories', value: '' },
                { label: 'Utility', value: 'UTILITY' },
                { label: 'Marketing', value: 'MARKETING' },
                { label: 'Authentication', value: 'AUTHENTICATION' },
              ]}
            />
          </div>

          <div className="w-40">
            <FormInput
              name="status_filter"
              type="select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus((e.target as any)?.value ?? e)}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Pending Review', value: 'PENDING' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Templates Grid or Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Loading WhatsApp templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No WhatsApp Templates Found
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedCategory || selectedStatus
              ? 'No templates match your active search filters. Try clearing the filter.'
              : 'Create your first WhatsApp voter slip or broadcast template to get started.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setTemplateToEdit(null);
              setIsBuilderOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
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
              onTestSend={(tpl) => {
                setTemplateToTest(tpl);
                setIsTestSendOpen(true);
              }}
              onEdit={(tpl) => {
                setTemplateToEdit(tpl);
                setIsBuilderOpen(true);
              }}
              onDelete={(tpl) => setTemplateToDelete(tpl)}
            />
          ))}
        </div>
      )}

      {/* Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        templateToEdit={templateToEdit}
        onSubmit={handleCreateOrUpdate}
        isLoading={saving}
      />

      {/* WhatsApp Mobile Chat Preview Modal */}
      <WhatsAppPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={templateToPreview}
        onOpenTestSend={(tpl) => {
          setTemplateToTest(tpl);
          setIsTestSendOpen(true);
        }}
      />

      {/* Test WhatsApp Message Sender Modal */}
      <TestWhatsAppModal
        isOpen={isTestSendOpen}
        onClose={() => setIsTestSendOpen(false)}
        template={templateToTest}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(templateToDelete)}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete WhatsApp Template?"
        description={`Are you sure you want to delete template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Template"
        variant="danger"
      />
    </div>
  );
};

export default WhatsAppTemplatesSection;
