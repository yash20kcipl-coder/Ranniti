import {
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { VariableChips } from './VariableChips';
import { Modal } from '@/components/common/Modal';
import { FormInput } from '@/components/common/FormInput';
import React, { useState, useEffect } from 'react';
import type { WhatsAppTemplate, WhatsAppButton } from '../types/settings.types';

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit: WhatsAppTemplate | null;
  onSubmit: (templateData: Partial<WhatsAppTemplate>) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS = [
  { label: 'Utility (Voter Slip / Alerts)', value: 'UTILITY' },
  { label: 'Marketing (Broadcasts / Appeals)', value: 'MARKETING' },
  { label: 'Authentication (Staff OTP)', value: 'AUTHENTICATION' },
];

const LANGUAGE_OPTIONS = [
  { label: 'Hindi (hi)', value: 'hi' },
  { label: 'Marathi (mr)', value: 'mr' },
  { label: 'English (en)', value: 'en' },
  { label: 'Gujarati (gu)', value: 'gu' },
  { label: 'Telugu (te)', value: 'te' },
  { label: 'Tamil (ta)', value: 'ta' },
  { label: 'Bengali (bn)', value: 'bn' },
];

const HEADER_TYPE_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Text Header', value: 'TEXT' },
  { label: 'Image Header', value: 'IMAGE' },
];

export const TemplateBuilderModal: React.FC<TemplateBuilderModalProps> = ({
  isOpen,
  onClose,
  templateToEdit,
  onSubmit,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
  const [language, setLanguage] = useState('hi');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<WhatsAppButton[]>([]);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setCategory(templateToEdit.category);
      setLanguage(templateToEdit.language);
      setHeaderType(templateToEdit.headerType as any);
      let cleanHeader = templateToEdit.headerContent || '';
      if (templateToEdit.headerType === 'TEXT') {
        cleanHeader = cleanHeader.replace(/^https?:\/\/[^/]+\//, '');
      }
      setHeaderContent(cleanHeader);
      setBodyText(templateToEdit.bodyText ? templateToEdit.bodyText.replace(/\\n/g, '\n') : '');
      setFooterText(templateToEdit.footerText || '');
      setButtons(templateToEdit.buttons || []);
    } else {
      setName('');
      setCategory('UTILITY');
      setLanguage('hi');
      setHeaderType('NONE');
      setHeaderContent('');
      setBodyText('');
      setFooterText('');
      setButtons([
        { type: 'QUICK_REPLY', text: 'मैंने वोट दिया ✅' },
      ]);
    }
    setError(null);
  }, [templateToEdit, isOpen]);

  // Insert variable tag at active cursor position
  const handleInsertVariable = (token: string) => {
    setBodyText((prev) => `${prev} ${token} `);
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) {
      setError('WhatsApp templates permit up to 3 interactive buttons.');
      return;
    }
    setButtons([...buttons, { type: 'QUICK_REPLY', text: 'Reply Option' }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, idx) => idx !== index));
  };

  const handleUpdateButton = (index: number, field: keyof WhatsAppButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!bodyText.trim()) {
      setError('Body message text is required');
      return;
    }

    setError(null);
    try {
      await onSubmit({
        name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        category,
        language,
        headerType,
        headerContent: headerType !== 'NONE' ? headerContent : null,
        bodyText: bodyText.trim(),
        footerText: footerText.trim() || null,
        buttons,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save WhatsApp template');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={templateToEdit ? 'Edit WhatsApp Template' : 'Create New WhatsApp Template'}
      subtitle="Configure Meta Business template with dynamic voter variables and interactive buttons"
      maxWidth="2xl"
      onSubmit={handleSubmitForm}
      submitText={isLoading ? 'Saving...' : templateToEdit ? 'Update Template' : 'Create & Submit'}
      cancelText="Cancel"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput
            name="tpl_name"
            label="Template Name"
            placeholder="e.g. voter_slip_slip"
            value={name}
            onChange={(e) => setName((e.target as any)?.value ?? e)}
            required
            helperText="Lowercase alphanumeric & underscores only"
          />

          <FormInput
            name="tpl_category"
            type="select"
            label="Category"
            value={category}
            onChange={(e) => setCategory((e.target as any)?.value ?? e)}
            options={CATEGORY_OPTIONS}
            required
          />

          <FormInput
            name="tpl_language"
            type="select"
            label="Language"
            value={language}
            onChange={(e) => setLanguage((e.target as any)?.value ?? e)}
            options={LANGUAGE_OPTIONS}
            required
          />
        </div>

        {/* Header Configuration */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Message Header (Optional)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              name="tpl_header_type"
              type="select"
              label="Header Type"
              value={headerType}
              onChange={(e) => setHeaderType((e.target as any)?.value ?? e)}
              options={HEADER_TYPE_OPTIONS}
            />

            {headerType !== 'NONE' && (
              <FormInput
                name="tpl_header_content"
                type="text"
                label={headerType === 'TEXT' ? 'Header Title Text' : 'Image URL'}
                placeholder={headerType === 'TEXT' ? 'e.g. 🗳️ Official Voter Information' : 'https://example.com/banner.png'}
                value={headerContent}
                onChange={(e) => setHeaderContent((e.target as any)?.value ?? e)}
                required
              />
            )}
          </div>
        </div>

        {/* Message Body with Variable Chips */}
        <div className="space-y-2">
          <VariableChips onInsert={handleInsertVariable} />

          <FormInput
            name="tpl_body_text"
            type="textarea"
            label="Message Body Text"
            placeholder="Type your WhatsApp message. Click variable chips above to insert dynamic voter placeholders..."
            value={bodyText}
            onChange={(e) => setBodyText((e.target as any)?.value ?? e)}
            rows={5}
            required
            helperText="Supports formatting: *bold*, _italic_, ~strike~, and {{dynamic_variable}} tokens"
          />
        </div>

        {/* Footer Disclaimer */}
        <FormInput
          name="tpl_footer_text"
          label="Footer Disclaimer (Optional)"
          placeholder="e.g. Reply STOP to opt out | Ranniti Election Desk"
          value={footerText}
          onChange={(e) => setFooterText((e.target as any)?.value ?? e)}
          helperText="Small subtle text displayed at the bottom of the message"
        />

        {/* Interactive Buttons */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Interactive Buttons ({buttons.length}/3)
              </span>
            </div>
            {buttons.length < 3 && (
              <button
                type="button"
                onClick={handleAddButton}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Button</span>
              </button>
            )}
          </div>

          {buttons.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No interactive buttons added yet.</p>
          ) : (
            <div className="space-y-2">
              {buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="w-32 flex-shrink-0">
                    <FormInput
                      name={`btn_type_${idx}`}
                      type="select"
                      value={btn.type}
                      onChange={(e) => handleUpdateButton(idx, 'type', (e.target as any)?.value ?? e)}
                      options={[
                        { label: 'Quick Reply', value: 'QUICK_REPLY' },
                        { label: 'Website Link', value: 'URL' },
                        { label: 'Call Phone', value: 'PHONE_NUMBER' },
                      ]}
                    />
                  </div>

                  <div className="flex-1">
                    <FormInput
                      name={`btn_text_${idx}`}
                      type="text"
                      placeholder="Button text"
                      value={btn.text}
                      onChange={(e) => handleUpdateButton(idx, 'text', (e.target as any)?.value ?? e)}
                      required
                    />
                  </div>

                  {btn.type === 'URL' && (
                    <div className="flex-1">
                      <FormInput
                        name={`btn_url_${idx}`}
                        type="text"
                        placeholder="https://maps.google.com/..."
                        value={btn.url || ''}
                        onChange={(e) => handleUpdateButton(idx, 'url', (e.target as any)?.value ?? e)}
                        required
                        icon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                      />
                    </div>
                  )}

                  {btn.type === 'PHONE_NUMBER' && (
                    <div className="flex-1">
                      <FormInput
                        name={`btn_phone_${idx}`}
                        type="tel"
                        placeholder="+919876543210"
                        value={btn.phoneNumber || ''}
                        onChange={(e) => handleUpdateButton(idx, 'phoneNumber', (e.target as any)?.value ?? e)}
                        required
                        icon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveButton(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer self-center"
                    title="Remove button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TemplateBuilderModal;
