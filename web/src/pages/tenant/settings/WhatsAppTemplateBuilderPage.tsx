import {
  ArrowLeft,
  Sparkles,
  Save,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Type,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Tag,
  ShieldCheck,
  MoreVertical,
  Camera,
  Smile,
  Mic,
  Paperclip,
  CheckCheck,
  CornerDownLeft,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  fetchTenantWhatsAppTemplates,
  createTenantWhatsAppTemplate,
  updateTenantWhatsAppTemplate,
} from '@/redux/actions/settings';
import toast from 'react-hot-toast';
import { FormInput } from '@/components/common/FormInput';
import { SafeImage } from '@/components/common/SafeImage';
import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import type { WhatsAppTemplate, WhatsAppButton } from '@/types/settings.types';
import {
  AVAILABLE_VARIABLES,
  resolveVariableInfo,
  normalizeTemplateTextToLabels,
} from '@/components/settings/components/VariableChips';

export interface WhatsAppTemplateBuilderPageProps {
  templateToEdit?: WhatsAppTemplate | null;
  onBack?: () => void;
  onSubmit?: (templateData: Partial<WhatsAppTemplate>) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS = [
  { label: 'Utility (Voter Slips, Polling Alerts, Logistics)', value: 'UTILITY' },
  { label: 'Marketing (Broadcasts, Rally Invites, Appeals)', value: 'MARKETING' },
  { label: 'Authentication (Staff OTP, Security Verification)', value: 'AUTHENTICATION' },
];

const LANGUAGE_OPTIONS = [
  { label: 'Hindi (hi)', value: 'hi' },
  { label: 'Marathi (mr)', value: 'mr' },
  { label: 'English (en)', value: 'en' },
  { label: 'Gujarati (gu)', value: 'gu' },
  { label: 'Bengali (bn)', value: 'bn' },
  { label: 'Telugu (te)', value: 'te' },
  { label: 'Tamil (ta)', value: 'ta' },
  { label: 'Kannada (kn)', value: 'kn' },
  { label: 'Punjabi (pa)', value: 'pa' },
];

const HEADER_TYPE_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Text Header (Bold Title)', value: 'TEXT' },
  { label: 'Image Header (Banner / Symbol)', value: 'IMAGE' },
  { label: 'Document Header (PDF Slip)', value: 'DOCUMENT' },
  { label: 'Video Header (Campaign Clip)', value: 'VIDEO' },
];

// Election campaign pre-configured template presets
export const TEMPLATE_PRESETS = [
  {
    name: 'digital_voter_slip_hi',
    label: 'मतदाता पर्ची (Hindi Voter Slip)',
    description: 'Official digital voter slip with booth, part, and serial number in Hindi',
    category: 'UTILITY' as const,
    language: 'hi',
    headerType: 'TEXT' as const,
    headerContent: 'मतदाता पर्ची - चुनाव 2026',
    bodyText:
      'नमस्ते {{voter_name}}, आपका मतदान केंद्र {{booth_name}} है। भाग/वार्ड संख्या {{section_no}}, क्रमांक संख्या #{{serial_no}}। मतदान दिवस {{polling_date}} को सपरिवार मतदान अवश्य करें।',
    footerText: 'रणनीति इलेक्शन सेल',
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'स्थान मैप देखें' },
    ],
  },
  {
    name: 'digital_voter_slip_en',
    label: 'Digital Voter Slip (English)',
    description: 'Official digital voter slip with booth, part, and serial number in English',
    category: 'UTILITY' as const,
    language: 'en',
    headerType: 'TEXT' as const,
    headerContent: 'Digital Voter Slip - Election 2026',
    bodyText:
      'Namaste {{voter_name}}, your polling station is {{booth_name}}. Part/Ward: {{section_no}}, Serial No: #{{serial_no}}. Polling Date: {{polling_date}}. Please cast your valuable vote with your family.',
    footerText: 'Ranniti Election Cell',
    buttons: [
      { type: 'QUICK_REPLY' as const, text: 'View Polling Station' },
    ],
  },
];

export const WhatsAppTemplateBuilderPage: React.FC<WhatsAppTemplateBuilderPageProps> = ({
  templateToEdit: propTemplateToEdit,
  onBack,
  onSubmit,
  isLoading,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { whatsappTemplates = [], saving: storeSaving = false } = useAppSelector(
    (state) => state.settings
  );

  const activeTemplate = useMemo(() => {
    if (propTemplateToEdit !== undefined) return propTemplateToEdit;
    if (id) {
      return whatsappTemplates.find((t) => t.id === id) || null;
    }
    return null;
  }, [propTemplateToEdit, id, whatsappTemplates]);

  useEffect(() => {
    if (id && whatsappTemplates.length === 0) {
      dispatch(fetchTenantWhatsAppTemplates());
    }
  }, [id, whatsappTemplates.length, dispatch]);

  const handleBack = onBack || (() => navigate('/dashboard/settings?tab=whatsapp-templates'));
  const isSaving = isLoading !== undefined ? isLoading : storeSaving;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
  const [language, setLanguage] = useState('hi');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<WhatsAppButton[]>([]);

  // Sample values map for dynamic preview & Meta documentation
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [showSimulatedData, setShowSimulatedData] = useState(true);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (activeTemplate) {
      setName(activeTemplate.name);
      setCategory(activeTemplate.category);
      setLanguage(activeTemplate.language);
      setHeaderType(activeTemplate.headerType as any);
      let cleanHeader = activeTemplate.headerContent || '';
      if (activeTemplate.headerType === 'TEXT') {
        cleanHeader = cleanHeader.replace(/^https?:\/\/[^/]+\//, '');
      }
      setHeaderContent(normalizeTemplateTextToLabels(cleanHeader));
      const rawBody = activeTemplate.bodyText ? activeTemplate.bodyText.replace(/\\n/g, '\n') : '';
      setBodyText(normalizeTemplateTextToLabels(rawBody));
      setFooterText(activeTemplate.footerText || '');
      setButtons(activeTemplate.buttons || []);
    } else if (!id) {
      // Default new template state
      setName('');
      setCategory('UTILITY');
      setLanguage('hi');
      setHeaderType('TEXT');
      setHeaderContent('🗳️ Official Voter Slip 2026');
      setBodyText(
        'नमस्ते {{voter_name}},\n\nआपका मतदान केंद्र: {{booth_name}}\nमतदाता क्रमांक: {{serial_no}}\nमतदान दिनांक: {{polling_date}}\n\nकृपया समय पर मतदान करें।'
      );
      setFooterText('रणनीति इलेक्शन डेस्क');
      setButtons([{ type: 'QUICK_REPLY', text: 'मैंने वोट दिया ✅' }]);
    }
  }, [activeTemplate, id]);

  // Extract all {{variable}} keys from header and body text
  const detectedVariables = useMemo(() => {
    const combined = `${headerContent || ''} ${bodyText || ''}`;
    const matches = combined.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))));
  }, [headerContent, bodyText]);

  // Auto-fill default sample values for newly detected variables
  useEffect(() => {
    setSampleValues((prev) => {
      const next = { ...prev };
      detectedVariables.forEach((v) => {
        if (!next[v]) {
          const info = resolveVariableInfo(v);
          next[v] = info.sampleValue;
        }
      });
      return next;
    });
  }, [detectedVariables]);

  // Meta Compliance Warnings
  const _metaValidationErrors = useMemo(() => {
    const issues: string[] = [];
    if (!name.trim()) issues.push('Template Name is required');
    if (!bodyText.trim()) issues.push('Body Message Text is required');

    // Name syntax rule: lowercase alphanumeric and underscores
    if (name && !/^[a-z0-9_]+$/.test(name)) {
      issues.push('Template Name can only contain lowercase letters, numbers, and underscores');
    }

    // Check consecutive variables
    if (/\{\{[a-zA-Z0-9_]+\}\}\{\{[a-zA-Z0-9_]+\}\}/.test(bodyText)) {
      issues.push('Consecutive variables without spaces (e.g. {{1}}{{2}}) will be rejected by Meta');
    }

    // Check character length limits
    if (headerType === 'TEXT' && headerContent.length > 60) {
      issues.push(`Text Header exceeds 60 characters (${headerContent.length}/60)`);
    }
    if (bodyText.length > 1024) {
      issues.push(`Body text exceeds 1024 characters (${bodyText.length}/1024)`);
    }
    if (footerText.length > 60) {
      issues.push(`Footer exceeds 60 characters (${footerText.length}/60)`);
    }

    // Buttons limit check
    if (buttons.length > 3) {
      issues.push('WhatsApp allows a maximum of 3 buttons');
    }
    buttons.forEach((btn, idx) => {
      if (!btn.text.trim()) issues.push(`Button #${idx + 1} text cannot be empty`);
      if (btn.text.length > 25) issues.push(`Button #${idx + 1} exceeds 25 characters (${btn.text.length}/25)`);
      if (btn.type === 'URL' && (!btn.url || !btn.url.trim())) {
        issues.push(`Button #${idx + 1} URL cannot be empty`);
      }
      if (btn.type === 'PHONE_NUMBER' && (!btn.phoneNumber || !btn.phoneNumber.trim())) {
        issues.push(`Button #${idx + 1} phone number cannot be empty`);
      }
    });

    return issues;
  }, [name, bodyText, headerType, headerContent, footerText, buttons]);

  // Insert variable tag at active cursor position in textarea
  const handleInsertVariable = (token: string) => {
    setBodyText((prev) => `${prev} ${token} `);
  };

  // Text formatting insertion (*bold*, _italic_, ~strike~, ```code```)
  const handleFormatText = (wrapper: string) => {
    setBodyText((prev) => `${prev} ${wrapper}text${wrapper} `);
  };

  // Add interactive button
  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' = 'QUICK_REPLY') => {
    if (buttons.length >= 3) {
      toast.error('WhatsApp templates allow a maximum of 3 buttons.');
      return;
    }
    const newBtn: WhatsAppButton =
      type === 'QUICK_REPLY'
        ? { type: 'QUICK_REPLY', text: 'Quick Reply' }
        : type === 'URL'
          ? { type: 'URL', text: 'Visit Website', url: 'https://' }
          : { type: 'PHONE_NUMBER', text: 'Call Helpline', phoneNumber: '+91' };

    setButtons([...buttons, newBtn]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, idx) => idx !== index));
  };

  const handleUpdateButton = (index: number, field: keyof WhatsAppButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  // Load selected preset template
  const handleApplyPreset = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setName(preset.name);
    setCategory(preset.category);
    setLanguage(preset.language);
    setHeaderType(preset.headerType);
    setHeaderContent(normalizeTemplateTextToLabels(preset.headerContent || ''));
    setBodyText(normalizeTemplateTextToLabels(preset.bodyText));
    setFooterText(preset.footerText || '');
    setButtons(preset.buttons || []);
    setIsPresetsModalOpen(false);
    toast.success(`Loaded "${preset.label}" template preset!`);
  };

  // Compute live rendered body with simulated sample values
  const renderedBody = useMemo(() => {
    let text = bodyText || '';
    if (!showSimulatedData) return text;

    detectedVariables.forEach((v) => {
      const reg = new RegExp(`\\{\\{${v}\\}\\}`, 'g');
      const info = resolveVariableInfo(v);
      const val = sampleValues[v] || info.sampleValue || `[${v}]`;
      text = text.replace(reg, val);
    });

    // Fallbacks for any remaining numbered tokens
    text = text.replace(/\{\{1\}\}/g, sampleValues['1'] || 'रमेश कुमार शर्मा');
    text = text.replace(/\{\{2\}\}/g, sampleValues['2'] || 'प्राथमिक विद्यालय, कक्ष क्र. 2');
    text = text.replace(/\{\{3\}\}/g, sampleValues['3'] || 'वार्ड क्र. 12');
    text = text.replace(/\{\{4\}\}/g, sampleValues['4'] || '348');
    text = text.replace(/\{\{5\}\}/g, sampleValues['5'] || '15 नवंबर 2026');

    return text;
  }, [bodyText, showSimulatedData, detectedVariables, sampleValues]);

  // Compute live rendered header text
  const renderedHeader = useMemo(() => {
    if (headerType !== 'TEXT' || !headerContent) return null;
    let text = headerContent;
    if (!showSimulatedData) return text;

    detectedVariables.forEach((v) => {
      const reg = new RegExp(`\\{\\{${v}\\}\\}`, 'g');
      const val = sampleValues[v] || `[${v}]`;
      text = text.replace(reg, val);
    });
    return text;
  }, [headerType, headerContent, showSimulatedData, detectedVariables, sampleValues]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a unique template name');
      toast.error('Please enter a unique template name');
      return;
    }
    if (!bodyText.trim()) {
      setError('Template message body text is required');
      toast.error('Template message body text is required');
      return;
    }

    setError(null);
    const payload = {
      name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category,
      language,
      headerType,
      headerContent: headerType !== 'NONE' ? headerContent : null,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() || null,
      buttons,
      variables: detectedVariables,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else if (activeTemplate?.id || id) {
        const targetId = (activeTemplate?.id || id)!;
        await dispatch(updateTenantWhatsAppTemplate(targetId, payload));
        toast.success('Template updated successfully!');
      } else {
        await dispatch(createTenantWhatsAppTemplate(payload));
        toast.success('Template created and registered successfully!');
      }
      handleBack();
    } catch (err: any) {
      setError(err?.message || 'Failed to save WhatsApp template');
      toast.error(err?.message || 'Failed to save WhatsApp template');
    }
  };

  const handleCopyPreview = () => {
    const fullText = `${renderedHeader ? `*${renderedHeader}*\n\n` : ''}${renderedBody}${footerText ? `\n\n_${footerText}_` : ''
      }`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Preview text copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDiscardModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Back to Templates"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTemplate ? `Edit Template: ${activeTemplate.name}` : 'Create New WhatsApp Template'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Campaign Message Builder
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure election message templates with dynamic voter tokens and interactive buttons
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPresetsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Use Pre-Built Preset</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDiscardModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : activeTemplate ? 'Update Template' : 'Create Template'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Form (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Validation Notice Banner */}
          {(error || _metaValidationErrors.length > 0) && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Validation Notice: </span>
                <span>{error || _metaValidationErrors[0]}</span>
              </div>
            </div>
          )}

          {/* Card 1: Template Metadata */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Type className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Template Details & Category
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 1 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <FormInput
                  name="tpl_name"
                  label="Template Name"
                  placeholder="e.g. voter_slip_slip"
                  value={name}
                  onChange={(e) => {
                    const raw = (e.target as any)?.value ?? e;
                    setName(raw.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                  }}
                  required
                  helperText="Lowercase alphanumeric & underscores only"
                />
              </div>

              <div className="sm:col-span-1">
                <FormInput
                  name="tpl_category"
                  type="select"
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory((e.target as any)?.value ?? e)}
                  options={CATEGORY_OPTIONS}
                  required
                />
              </div>

              <div className="sm:col-span-1">
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
            </div>
          </div>

          {/* Card 2: Header Configuration */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Message Header (Optional)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 2 of 5</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                name="tpl_header_type"
                type="select"
                label="Header Media Type"
                value={headerType}
                onChange={(e) => {
                  const val = (e.target as any)?.value ?? e;
                  setHeaderType(val);
                  if (val === 'NONE') setHeaderContent('');
                }}
                options={HEADER_TYPE_OPTIONS}
              />

              {headerType === 'TEXT' && (
                <div>
                  <FormInput
                    name="tpl_header_content"
                    type="text"
                    label="Header Title Text"
                    placeholder="e.g. 🗳️ Official Voter Slip 2026"
                    value={headerContent}
                    onChange={(e) => setHeaderContent((e.target as any)?.value ?? e)}
                    required
                    helperText={`${headerContent.length}/60 characters max`}
                  />
                </div>
              )}

              {headerType === 'IMAGE' && (
                <div className="sm:col-span-2 space-y-2">
                  <FileUploadInput
                    label="Upload Header Banner Image"
                    value={headerContent}
                    onChange={(val) => {
                      if (typeof val === 'string') {
                        setHeaderContent(val);
                      } else if (!val) {
                        setHeaderContent('');
                      }
                    }}
                    accept="image/*"
                    placeholder="Choose or drop template banner image (JPG, PNG, WebP)"
                  />
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400">Or specify direct image URL:</span>
                    <FormInput
                      name="tpl_header_image_url"
                      type="text"
                      placeholder="https://example.com/campaign-banner.png"
                      value={headerContent}
                      onChange={(e) => setHeaderContent((e.target as any)?.value ?? e)}
                    />
                  </div>
                </div>
              )}

              {(headerType === 'DOCUMENT' || headerType === 'VIDEO') && (
                <div className="sm:col-span-2">
                  <FormInput
                    name="tpl_header_media_url"
                    type="text"
                    label={headerType === 'DOCUMENT' ? 'Document URL (PDF)' : 'Video URL (MP4)'}
                    placeholder="https://example.com/sample.pdf"
                    value={headerContent}
                    onChange={(e) => setHeaderContent((e.target as any)?.value ?? e)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Message Body & Rich Formatting */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  3. Message Body & Variables
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 3 of 5</span>
            </div>

            {/* Quick Formatting Bar */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-2">Formatting:</span>
                <button
                  type="button"
                  onClick={() => handleFormatText('*')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer font-bold inline-flex items-center gap-1"
                  title="Bold (*text*)"
                >
                  <Bold className="w-3.5 h-3.5" />
                  <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('_')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer italic inline-flex items-center gap-1"
                  title="Italic (_text_)"
                >
                  <Italic className="w-3.5 h-3.5" />
                  <span>Italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('~')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer line-through inline-flex items-center gap-1"
                  title="Strikethrough (~text~)"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span>Strike</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('```')}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer font-mono inline-flex items-center gap-1"
                  title="Monospace (```text```)"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                <span className={bodyText.length > 950 ? 'text-amber-500 font-bold' : ''}>
                  {bodyText.length}
                </span>
                /1024 chars
              </div>
            </div>

            {/* Categorized Variable Inserter */}
            {/* Categorized Variable Inserter */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Click to Insert Dynamic Voter Token:
                </span>
                <span className="text-[11px] text-slate-400">Auto-mapped from database per voter</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleInsertVariable(`{{${v.key}}}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 shadow-xs transition-all cursor-pointer group"
                    title={`${v.label} (${v.hindiLabel}) — ${v.description} (e.g. "${v.sampleValue}")`}
                  >
                    <Tag className="w-2.5 h-2.5 text-indigo-500" />
                    <span className="font-bold">{`{{${v.key}}}`}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans border-l border-indigo-200 dark:border-indigo-800 pl-1.5">
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Body Textarea */}
            <div>
              <FormInput
                name="tpl_body_text"
                type="textarea"
                label="Message Body Text"
                placeholder="Type your WhatsApp message. Click variable chips above to insert dynamic voter placeholders..."
                value={bodyText}
                onChange={(e) => setBodyText((e.target as any)?.value ?? e)}
                onBlur={() => setBodyText((prev) => normalizeTemplateTextToLabels(prev))}
                rows={7}
                required
                helperText="Use dynamic tokens like {{voter_name}}, {{booth_name}}, {{serial_no}} to personalize messages per voter"
              />
            </div>

            {/* Live Token Representation Card - Shows exactly what {{1}}, {{2}}, {{4}} represent */}
            {detectedVariables.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-500" />
                    Dynamic Tokens in Message & What They Represent:
                  </span>
                  <span className="text-[11px] text-slate-400">Auto-filled from database per voter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {detectedVariables.map((v) => {
                    const info = resolveVariableInfo(v);
                    return (
                      <div
                        key={v}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
                      >
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 mt-0.5">
                          {`{{${v}}}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {info.label}
                            </span>
                            {info.hindiLabel && info.hindiLabel !== info.label && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                ({info.hindiLabel})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {info.description}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Database:</span>
                            <code className="text-indigo-600 dark:text-indigo-400 font-mono truncate">
                              {info.dbField}
                            </code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Sample Variable Values (Meta Review Requirement) */}
          {detectedVariables.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      4. Sample Values for Live Preview
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Sample values to preview how your message will look when sent to voters
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">Step 4 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detectedVariables.map((v) => {
                  const info = resolveVariableInfo(v);
                  return (
                    <div key={v} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono inline-flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800">
                            {`{{${v}}}`}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200 font-sans font-semibold">
                            {info.label} {info.hindiLabel ? `(${info.hindiLabel})` : ''}
                          </span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={info.dbField}>
                          {info.dbField}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={sampleValues[v] || ''}
                        onChange={(e) => setSampleValues({ ...sampleValues, [v]: e.target.value })}
                        placeholder={`e.g. ${info.sampleValue}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card 5: Footer & Interactive Action Buttons */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <CornerDownLeft className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  5. Footer & Interactive Buttons
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Step 5 of 5</span>
            </div>

            {/* Footer Text */}
            <FormInput
              name="tpl_footer_text"
              label="Footer Disclaimer (Optional)"
              placeholder="e.g. Reply STOP to opt out | Ranniti Election Desk"
              value={footerText}
              onChange={(e) => setFooterText((e.target as any)?.value ?? e)}
              helperText={`${footerText.length}/60 characters max. Subdued legal/opt-out message.`}
            />

            {/* Buttons Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Interactive Buttons ({buttons.length}/3)
                  </span>
                  <span className="text-[11px] text-slate-400">Quick Reply, Website URL, or Phone Call</span>
                </div>

                {buttons.length < 3 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddButton('QUICK_REPLY')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Quick Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddButton('URL')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Website Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddButton('PHONE_NUMBER')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Phone Call</span>
                    </button>
                  </div>
                )}
              </div>

              {buttons.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                  No interactive buttons configured yet. Add up to 3 buttons to drive voter engagement.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs shadow-xs"
                    >
                      <div className="w-36 flex-shrink-0">
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
                          placeholder="Button Label (Max 25 chars)"
                          value={btn.text}
                          onChange={(e) => handleUpdateButton(idx, 'text', (e.target as any)?.value ?? e)}
                          required
                          helperText={`${btn.text.length}/25`}
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
                        className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer self-center"
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
        </div>

        {/* Right Column: Live Sticky WhatsApp Mobile Mockup (5 Columns) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          {/* Mockup Control Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Live WhatsApp Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSimulatedData(!showSimulatedData)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${showSimulatedData
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
              >
                {showSimulatedData ? 'Sample Data' : 'Raw Tokens'}
              </button>

              <button
                type="button"
                onClick={handleCopyPreview}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Copy rendered message preview"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Authentic WhatsApp Phone Outer Shell */}
          <div className="mx-auto w-full max-w-[360px] rounded-[40px] bg-slate-900 p-3.5 shadow-2xl border-4 border-slate-800 relative">
            {/* Phone Top Notch / Speaker */}
            <div className="flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-white/70">
              <span>9:41</span>
              <div className="w-24 h-3.5 bg-black rounded-full" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* WhatsApp Screen Body */}
            <div className="w-full rounded-[28px] bg-[#0b141a] overflow-hidden flex flex-col h-[520px] text-slate-100 shadow-inner relative font-sans">
              {/* WhatsApp Business Top Bar */}
              <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-[#2a3942] z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0 border border-emerald-400/40">
                    <SafeImage src={null} alt="Campaign Logo" fallbackText="RC" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-slate-100 truncate max-w-[130px]">
                        Ranniti Campaign Desk
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                    </div>
                    <p className="text-[10px] text-emerald-400 leading-none">Official Business Account</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300 pr-1">
                  <Phone className="w-3.5 h-3.5" />
                  <MoreVertical className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Wallpaper Background Pattern */}
              <div
                className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#0b141a]"
                style={{
                  backgroundImage:
                    'radial-gradient(#1f2c34 1px, transparent 1px), radial-gradient(#1f2c34 1px, #0b141a 1px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 10px',
                }}
              >
                {/* Date Header Stamp */}
                <div className="text-center my-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-slate-400 font-medium shadow-xs">
                    TODAY
                  </span>
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="max-w-[94%] ml-auto bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-sm shadow-md overflow-hidden text-xs">
                  {/* Header Component */}
                  {headerType === 'TEXT' && renderedHeader && (
                    <div className="px-3 pt-2.5 font-bold text-xs text-emerald-200 border-b border-emerald-700/40 pb-1.5">
                      {renderedHeader}
                    </div>
                  )}

                  {headerType === 'IMAGE' && (
                    <div className="w-full h-36 bg-emerald-950/60 relative overflow-hidden flex items-center justify-center border-b border-emerald-700/40">
                      {headerContent ? (
                        <SafeImage src={headerContent} alt="Header Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-emerald-300/80">
                          <Camera className="w-6 h-6" />
                          <span className="text-[10px]">Campaign Banner Image</span>
                        </div>
                      )}
                    </div>
                  )}

                  {headerType === 'DOCUMENT' && (
                    <div className="p-3 bg-emerald-900/60 border-b border-emerald-700/40 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold block truncate">Official_Voter_Slip.pdf</span>
                        <span className="text-[10px] text-emerald-300/70">Document attachment</span>
                      </div>
                    </div>
                  )}

                  {/* Body Content with formatted paragraphs */}
                  <div className="p-3 whitespace-pre-line text-xs leading-relaxed text-slate-100 select-text">
                    {renderedBody || (
                      <span className="text-slate-400 italic">Your message body will appear here...</span>
                    )}
                  </div>

                  {/* Footer Disclaimer */}
                  {footerText && (
                    <div className="px-3 pb-1 text-[10px] text-slate-300/70 italic">
                      {footerText}
                    </div>
                  )}

                  {/* Timestamp & Double Blue Ticks */}
                  <div className="px-2.5 pb-1.5 flex items-center justify-end gap-1 text-[10px] text-emerald-200/80">
                    <span>10:42 AM</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  </div>

                  {/* Interactive Buttons Below Bubble */}
                  {buttons && buttons.length > 0 && (
                    <div className="border-t border-emerald-700/50 bg-[#005243] divide-y divide-emerald-700/50">
                      {buttons.map((btn, idx) => (
                        <div
                          key={idx}
                          className="py-2.5 px-3 text-center text-xs font-semibold text-[#53bdeb] flex items-center justify-center gap-1.5 hover:bg-emerald-700/30 transition-colors"
                        >
                          {btn.type === 'URL' && <ExternalLink className="w-3 h-3 text-[#53bdeb]" />}
                          {btn.type === 'PHONE_NUMBER' && <Phone className="w-3 h-3 text-[#53bdeb]" />}
                          {btn.type === 'QUICK_REPLY' && <CornerDownLeft className="w-3 h-3 text-[#53bdeb]" />}
                          <span>{btn.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Simulated Bottom Message Input Bar */}
              <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-[#2a3942]">
                <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center justify-between text-slate-400 text-xs">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4" />
                    <span className="text-[11px] text-slate-400">Message</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" />
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                  <Mic className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Templates Modal */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Select Election Template Preset
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a pre-configured template to populate the builder instantly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPresetsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {TEMPLATE_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {preset.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span>{preset.language.toUpperCase()} • {preset.buttons.length} Buttons</span>
                    <span>Click to Apply →</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPresetsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      <ConfirmModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onConfirm={handleBack}
        title="Discard Unsaved Changes?"
        message="Are you sure you want to leave the template builder? Any unsaved progress will be lost."
        confirmText="Discard & Leave"
        cancelText="Continue Editing"
        variant="warning"
      />
    </div>
  );
};

export default WhatsAppTemplateBuilderPage;
