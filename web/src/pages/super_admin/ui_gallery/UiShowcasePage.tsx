import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Vote,
  ShieldCheck,
  TrendingUp,
  Download,
  Calendar,
  Lock,
  Mail,
  User,
  ExternalLink,
  Copy,
  Check,
  Paintbrush,
  Maximize2,
  Sun,
  Moon,
  RotateCcw,
  Save,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal, type ConfirmVariant } from '@/components/common/ConfirmModal';
import { FormInput } from '@/components/common/FormInput';
import { SafeImage } from '@/components/common/SafeImage';
import { TableActions } from '@/components/common/TableActions';
import { CountUp } from '@/components/common/CountUp';
import { FileUploadInput } from '@/components/common/FileUploadInput';
import {
  Card,
  type CardRadiusPreset,
  type CardBorderWidthPreset,
  type CardShadowPreset,
  type CardShadowColorPreset,
  type CardVariantPreset,
  type CardAccentPreset,
} from '@/components/common/Card';

/* ─────────────────────────────────────────────────────────────────────────────
   UI Gallery Token Presets & Constants
   All base styling is built into Tailwind CSS & theme.css.
   ───────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_LIGHT_PAGE_BG = '#F4F6F9';
export const DEFAULT_DARK_PAGE_BG = '#0A0F1D';

export const CARD_BORDER_RADIUS: Record<CardRadiusPreset, string> = {
  default: '16px',
  none: '0px',
  xs: '6px',
  sm: '10px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
  '3xl': '32px',
  full: '9999px',
};

export const CARD_BORDER_WIDTH: Record<CardBorderWidthPreset, string> = {
  default: '1px',
  none: '0px',
  thin: '1px',
  medium: '1.5px',
  thick: '2px',
  bold: '3px',
};

export const CARD_SHADOW_VALUES: Record<CardShadowPreset, { light: string; dark: string }> = {
  none: { light: 'none', dark: 'none' },
  clean: {
    light: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
    dark: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },
  sm: {
    light: '0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
    dark: '0 2px 8px rgba(0, 0, 0, 0.28)',
  },
  md: {
    light: '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
    dark: '0 4px 20px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.20)',
  },
  lg: {
    light: '0 10px 25px -4px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.03)',
    dark: '0 10px 30px -4px rgba(0, 0, 0, 0.45), 0 4px 10px -2px rgba(0, 0, 0, 0.25)',
  },
  xl: {
    light: '0 20px 35px -6px rgba(0, 0, 0, 0.08), 0 8px 16px -3px rgba(0, 0, 0, 0.03)',
    dark: '0 20px 45px -6px rgba(0, 0, 0, 0.55)',
  },
  glow: {
    light: '0 0 20px -2px rgba(99, 102, 241, 0.18)',
    dark: '0 0 25px -2px rgba(129, 140, 248, 0.22)',
  },
  hover: {
    light: '0 2px 6px rgba(0, 0, 0, 0.04)',
    dark: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },
};

export interface PageBgPreset {
  id: string;
  name: string;
  value: string;
  isDark: boolean;
  description: string;
}

export const PAGE_BG_PRESETS: PageBgPreset[] = [
  { id: 'ice-gray', name: 'Ice Gray (Default)', value: '#F4F6F9', isDark: false, description: 'Clean modern enterprise canvas with soft contrast' },
  { id: 'pure-white', name: 'Pure White', value: '#FFFFFF', isDark: false, description: 'Minimalist crisp look (Apple/Stripe style)' },
  { id: 'slate-50', name: 'Slate Canvas', value: '#F8FAFC', isDark: false, description: 'Ultra subtle cool gray tint' },
  { id: 'cool-gray', name: 'Cool Neutral', value: '#F1F5F9', isDark: false, description: 'Higher card-to-page separation' },
  { id: 'zinc-50', name: 'Soft Zinc', value: '#FAFAFA', isDark: false, description: 'Warm monochrome neutral' },
  { id: 'indigo-tint', name: 'Indigo Mist', value: '#F6F7FB', isDark: false, description: 'Subtle brand lavender tone' },
  { id: 'deep-slate', name: 'Deep Slate (Default)', value: '#0A0F1D', isDark: true, description: 'Rich dark navy slate background' },
  { id: 'midnight-950', name: 'Midnight Slate', value: '#020617', isDark: true, description: 'Tailwind slate-950 high contrast dark mode' },
  { id: 'slate-900', name: 'Slate 900', value: '#0F172A', isDark: true, description: 'Softer deep navy canvas' },
  { id: 'oled-black', name: 'True Black (OLED)', value: '#000000', isDark: true, description: 'Pure black for ultra high contrast' },
  { id: 'navy-midnight', name: 'Navy Midnight', value: '#0B1120', isDark: true, description: 'Deep royal blue midnight tone' },
];

const applyPageBackground = (color: string, targetMode?: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const isCurrentDark = document.documentElement.classList.contains('dark');
  const mode = targetMode || (isCurrentDark ? 'dark' : 'light');
  try {
    if (mode === 'dark') {
      localStorage.setItem('ranniti_page_bg_dark', color);
    } else {
      localStorage.setItem('ranniti_page_bg_light', color);
    }
  } catch {
    // Ignore storage errors
  }
  if ((mode === 'dark' && isCurrentDark) || (mode === 'light' && !isCurrentDark)) {
    document.documentElement.style.setProperty('--page-bg', color);
    document.body.style.backgroundColor = color;
    const main = document.getElementById('main-content');
    if (main) main.style.backgroundColor = color;
  }
};

const applyGlobalCardRadius = (radius: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--card-radius', radius);
  document.documentElement.style.setProperty('--radius-base', radius);
  try {
    localStorage.setItem('ranniti_card_radius', radius);
  } catch {
    // Ignore
  }
};

const applyGlobalCardBorderWidth = (width: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--card-border-width', width);
  try {
    localStorage.setItem('ranniti_card_border_width', width);
  } catch {
    // Ignore
  }
};

const applyGlobalCardShadow = (shadowPreset: CardShadowPreset) => {
  if (typeof document === 'undefined') return;
  const shadowValue = CARD_SHADOW_VALUES[shadowPreset] || CARD_SHADOW_VALUES.md;
  const isDark = document.documentElement.classList.contains('dark');
  const activeValue = isDark ? shadowValue.dark : shadowValue.light;
  document.documentElement.style.setProperty('--card-shadow', activeValue);
  try {
    localStorage.setItem('ranniti_card_shadow', shadowPreset);
  } catch {
    // Ignore
  }
};

export const UiShowcasePage: React.FC = () => {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'cards' | 'forms' | 'modals' | 'tables' | 'palette'>('cards');

  // Interactive Live Card Controls
  const [activeRadius, setActiveRadius] = useState<CardRadiusPreset>(() => {
    try {
      const saved = localStorage.getItem('ranniti_card_radius_preset') as CardRadiusPreset;
      return saved || 'default';
    } catch {
      return 'default';
    }
  });
  const [activeBorderWidth, setActiveBorderWidth] = useState<CardBorderWidthPreset>(() => {
    try {
      const saved = localStorage.getItem('ranniti_card_border_width_preset') as CardBorderWidthPreset;
      return saved || 'default';
    } catch {
      return 'default';
    }
  });
  const [activeShadow, setActiveShadow] = useState<CardShadowPreset>(() => {
    try {
      const saved = localStorage.getItem('ranniti_card_shadow') as CardShadowPreset;
      return saved || 'md';
    } catch {
      return 'md';
    }
  });
  const [activeShadowColor, setActiveShadowColor] = useState<CardShadowColorPreset>('neutral');
  const [activeVariant, setActiveVariant] = useState<CardVariantPreset>('glass');
  const [activeAccent, setActiveAccent] = useState<CardAccentPreset>('indigo');

  // Track if changes are unsaved or saved
  const [isSaved, setIsSaved] = useState(true);

  // Separate Light and Dark Page Background Live State
  const [lightPageBg, setLightPageBg] = useState(() => {
    try {
      return localStorage.getItem('ranniti_page_bg_light') || localStorage.getItem('ranniti_page_bg') || DEFAULT_LIGHT_PAGE_BG;
    } catch {
      return DEFAULT_LIGHT_PAGE_BG;
    }
  });

  const [darkPageBg, setDarkPageBg] = useState(() => {
    try {
      return localStorage.getItem('ranniti_page_bg_dark') || DEFAULT_DARK_PAGE_BG;
    } catch {
      return DEFAULT_DARK_PAGE_BG;
    }
  });

  const [customLightBgHex, setCustomLightBgHex] = useState(lightPageBg);
  const [customDarkBgHex, setCustomDarkBgHex] = useState(darkPageBg);

  // Modal demo states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    variant: ConfirmVariant;
    title: string;
    description: string;
  }>({
    isOpen: false,
    variant: 'danger',
    title: '',
    description: '',
  });

  // Form input test states
  const [textValue, setTextValue] = useState('Narendra Modi');
  const [selectValue, setSelectValue] = useState('pc');
  const [switchValue, setSwitchValue] = useState(true);
  const [checkboxValue, setCheckboxValue] = useState(true);
  const [dateValue, setDateValue] = useState('2026-11-24');
  const [textareaValue, setTextareaValue] = useState('Ranniti Electoral Campaign Management System — High performance UI architecture.');

  // Code snippet copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    toast.success('Snippet copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handle Light Page Background Change
  const handleSelectLightBg = (color: string) => {
    setLightPageBg(color);
    setCustomLightBgHex(color);
    applyPageBackground(color, 'light');
    setIsSaved(false);
    toast.success(`Light mode background set to ${color}`);
  };

  // Handle Dark Page Background Change
  const handleSelectDarkBg = (color: string) => {
    setDarkPageBg(color);
    setCustomDarkBgHex(color);
    applyPageBackground(color, 'dark');
    setIsSaved(false);
    toast.success(`Dark mode background set to ${color}`);
  };

  // Handle Global Radius Apply
  const handleApplyGlobalRadius = (r: CardRadiusPreset) => {
    setActiveRadius(r);
    const val = CARD_BORDER_RADIUS[r];
    applyGlobalCardRadius(val);
    try {
      localStorage.setItem('ranniti_card_radius_preset', r);
    } catch {
      // ignore
    }
    setIsSaved(false);
    toast.success(`Card border radius preview updated to ${val}`);
  };

  // Handle Global Border Width Apply
  const handleApplyGlobalBorderWidth = (w: CardBorderWidthPreset) => {
    setActiveBorderWidth(w);
    const val = CARD_BORDER_WIDTH[w];
    applyGlobalCardBorderWidth(val);
    try {
      localStorage.setItem('ranniti_card_border_width_preset', w);
    } catch {
      // ignore
    }
    setIsSaved(false);
    toast.success(`Card border width preview updated to ${val}`);
  };

  // Handle Global Shadow Apply
  const handleApplyGlobalShadow = (s: CardShadowPreset) => {
    setActiveShadow(s);
    applyGlobalCardShadow(s);
    setIsSaved(false);
    toast.success(`Card shadow preset preview set to '${s}'`);
  };

  // Master Save Changes handler
  const handleSaveChanges = () => {
    // 1. Page Backgrounds for both Light & Dark
    applyPageBackground(lightPageBg, 'light');
    applyPageBackground(darkPageBg, 'dark');

    // 2. Card Radius
    const radiusVal = CARD_BORDER_RADIUS[activeRadius];
    applyGlobalCardRadius(radiusVal);
    try {
      localStorage.setItem('ranniti_card_radius_preset', activeRadius);
    } catch {
      // ignore
    }

    // 3. Card Border Width
    const borderWidthVal = CARD_BORDER_WIDTH[activeBorderWidth];
    applyGlobalCardBorderWidth(borderWidthVal);
    try {
      localStorage.setItem('ranniti_card_border_width_preset', activeBorderWidth);
    } catch {
      // ignore
    }

    // 4. Card Shadow
    applyGlobalCardShadow(activeShadow);

    setIsSaved(true);
    toast.success('🎉 All UI changes (Light BG, Dark BG, Radius & Shadow) saved and applied across the entire website successfully!');
  };

  // Reset to System Defaults
  const handleResetDefaults = () => {
    handleSelectLightBg(DEFAULT_LIGHT_PAGE_BG);
    handleSelectDarkBg(DEFAULT_DARK_PAGE_BG);
    handleApplyGlobalRadius('default');
    handleApplyGlobalBorderWidth('default');
    handleApplyGlobalShadow('md');
    setIsSaved(true);
    toast.success('Reset to default system theme settings.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="UI Component Gallery & Design System"
        subtitle="Live catalog of cards, inputs, dialogs, tables, and typography tokens across the Ranniti application."
        icon={<Palette className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const el = document.documentElement;
                const isDark = el.classList.contains('dark');
                if (isDark) {
                  el.classList.remove('dark');
                  localStorage.theme = 'light';
                } else {
                  el.classList.add('dark');
                  localStorage.theme = 'dark';
                }
                toast.success(`Theme switched to ${isDark ? 'Light' : 'Dark'} mode`);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Toggle Light / Dark
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
              title="Reset all settings to system defaults"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        }
      />

      {/* ── Category Navigation Tabs ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        {[
          { id: 'cards', label: 'Cards, Shadows & Page BG', icon: Layers },
          { id: 'forms', label: 'Form Controls & Inputs', icon: Sliders },
          { id: 'modals', label: 'Modals & Confirmations', icon: ExternalLink },
          { id: 'tables', label: 'Tables, Badges & Actions', icon: Vote },
          { id: 'palette', label: 'Color Tokens & Typography', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CARDS, SHADOWS, BORDER WIDTH & PAGE BACKGROUND              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cards' && (
        <div className="space-y-6">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION A: DUAL PAGE BACKGROUND CHANGER (LIGHT & DARK INDEPENDENT) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card
            variant="glass"
            shadow="md"
            accent="indigo"
            title="Page Background Customizer (Independent Light & Dark Theme Backgrounds)"
            subtitle="Configure distinct background colors for both Light and Dark modes. Switching themes dynamically loads its respective saved color."
            icon={<Paintbrush size={18} className="text-indigo-600 dark:text-indigo-400" />}
            badge={
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Light: {lightPageBg}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Dark: {darkPageBg}
                </span>
              </div>
            }
          >
            <div className="space-y-6">
              {/* 1. Light Mode Presets & Custom Color */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun size={15} className="text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Light Theme Canvas Background
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    Active Light: {lightPageBg}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {PAGE_BG_PRESETS.filter((p) => !p.isDark).map((preset) => {
                    const isSelected = lightPageBg.toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectLightBg(preset.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'ring-2 ring-amber-500 border-amber-500 shadow-sm bg-amber-50/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: preset.value }}
                          />
                          {isSelected && <Check size={14} className="text-amber-600 font-bold" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                            {preset.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {preset.value}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Light Color picker */}
                <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Custom Light Hex:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customLightBgHex}
                        onChange={(e) => handleSelectLightBg(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customLightBgHex}
                        onChange={(e) => setCustomLightBgHex(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSelectLightBg(customLightBgHex);
                        }}
                        placeholder="#F4F6F9"
                        className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectLightBg(customLightBgHex)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectLightBg(DEFAULT_LIGHT_PAGE_BG)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset Light Default ({DEFAULT_LIGHT_PAGE_BG})
                  </button>
                </div>
              </div>

              {/* 2. Dark Mode Presets & Custom Color */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon size={15} className="text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Dark Theme Canvas Background
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Active Dark: {darkPageBg}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {PAGE_BG_PRESETS.filter((p) => p.isDark).map((preset) => {
                    const isSelected = darkPageBg.toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectDarkBg(preset.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm bg-indigo-50/20 dark:bg-indigo-950/40'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700 shadow-2xs"
                            style={{ backgroundColor: preset.value }}
                          />
                          {isSelected && <Check size={14} className="text-indigo-400 font-bold" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                            {preset.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {preset.value}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Dark Color picker */}
                <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Custom Dark Hex:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customDarkBgHex}
                        onChange={(e) => handleSelectDarkBg(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={customDarkBgHex}
                        onChange={(e) => setCustomDarkBgHex(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSelectDarkBg(customDarkBgHex);
                        }}
                        placeholder="#0A0F1D"
                        className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectDarkBg(customDarkBgHex)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectDarkBg(DEFAULT_DARK_PAGE_BG)}
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    <RotateCcw size={12} /> Reset Dark Default ({DEFAULT_DARK_PAGE_BG})
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION B: GLOBAL BORDER RADIUS & BORDER WIDTH CONTROLLER     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card
            variant="glass"
            shadow="md"
            accent="emerald"
            title="Global Border Radius & Border Width (One-File Control for Whole Project)"
            subtitle="Change border radius or border width below. Click 'Apply to Entire Website' to persist across all cards, modals, form inputs, buttons, and panels."
            icon={<Maximize2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Border Radius Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Project Border Radius: <span className="text-indigo-600 font-mono">{CARD_BORDER_RADIUS[activeRadius]}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleApplyGlobalRadius(activeRadius)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Apply to Entire Project &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['none', 'sm', 'md', 'lg', 'xl', '2xl'] as CardRadiusPreset[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setActiveRadius(r)}
                        className={`px-2 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${activeRadius === r
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="font-bold capitalize">{r}</div>
                        <div className="text-[10px] opacity-75 font-mono">{CARD_BORDER_RADIUS[r]}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Source in code: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">--radius-base</code> in <code>theme.css</code> & Tailwind <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">rounded-[var(--card-radius)]</code>
                  </p>
                </div>

                {/* 2. Border Width Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Border Width: <span className="text-emerald-600 font-mono">{CARD_BORDER_WIDTH[activeBorderWidth]}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleApplyGlobalBorderWidth(activeBorderWidth)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Apply to Entire Website &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['none', 'thin', 'medium', 'thick', 'bold'] as CardBorderWidthPreset[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setActiveBorderWidth(w)}
                        className={`px-2 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${activeBorderWidth === w
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="font-bold capitalize">{w}</div>
                        <div className="text-[10px] opacity-75 font-mono">{CARD_BORDER_WIDTH[w]}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Source in code: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">--card-border-width</code> in <code>theme.css</code>
                  </p>
                </div>
              </div>

              {/* Surface Variant & Accent Bar Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Surface Variant: <span className="text-emerald-600 font-mono">{activeVariant}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['default', 'glass', 'elevated', 'subtle', 'bordered', 'flat'] as CardVariantPreset[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setActiveVariant(v)}
                        className={`px-2 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer capitalize transition-all ${activeVariant === v
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Top Accent Bar: <span className="text-emerald-600 font-mono">{activeAccent}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['none', 'indigo', 'emerald', 'amber', 'rose', 'purple'] as CardAccentPreset[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setActiveAccent(a)}
                        className={`px-2 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer capitalize transition-all ${activeAccent === a
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION C: REFINED SHADOW STYLES & SHADOW COLOR TINTS         */}
          {/* ───────────────────────────────────────────────────────────── */}
          <Card
            variant="glass"
            shadow="md"
            accent="amber"
            title="Option 4: Refined Multi-Layer Shadow & Shadow Color Tints"
            subtitle="Airy ambient occlusion with pure black low-opacity layers (0.02 - 0.05) in light mode and smooth depth in dark mode."
            icon={<Sliders size={18} className="text-amber-500" />}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shadow Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                      Shadow Elevation Preset: <span className="text-amber-600 font-mono">{activeShadow}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleApplyGlobalShadow(activeShadow)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Apply to Entire Website &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'clean', label: 'Clean (Airy)', desc: 'Apple/Linear style' },
                      { id: 'sm', label: 'Subtle Sm', desc: 'Micro elevation' },
                      { id: 'md', label: 'Medium Md', desc: '⭐ Balanced Default' },
                      { id: 'lg', label: 'Elevated Lg', desc: 'Floating depth' },
                      { id: 'xl', label: 'Prominent Xl', desc: 'High modal depth' },
                      { id: 'glow', label: 'Indigo Glow', desc: 'Subtle brand radiance' },
                      { id: 'hover', label: 'Dynamic Hover', desc: 'Lifts on mouse hover' },
                      { id: 'none', label: 'Flat (None)', desc: 'Border only' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setActiveShadow(s.id as CardShadowPreset);
                          handleApplyGlobalShadow(s.id as CardShadowPreset);
                        }}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${activeShadow === s.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="text-xs font-bold">{s.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow Color Tints */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Shadow Color Tint: <span className="text-amber-600 font-mono">{activeShadowColor}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'neutral', name: 'Neutral Black', desc: 'No color tint (Pure)' },
                      { id: 'slate', name: 'Cool Slate', desc: 'Deep cool gray' },
                      { id: 'indigo', name: 'Brand Indigo', desc: 'Subtle blue tint' },
                      { id: 'amber', name: 'Warm Amber', desc: 'Subtle bronze tint' },
                      { id: 'rose', name: 'Subtle Rose', desc: 'Soft pink tint' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveShadowColor(c.id as CardShadowColorPreset)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${activeShadowColor === c.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                      >
                        <div className="text-xs font-bold">{c.name}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION D: LIVE INTERACTIVE PREVIEW CARDS                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Live Preview of Active Card Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target Interactive Card */}
              <Card
                radius={activeRadius}
                borderWidth={activeBorderWidth}
                shadow={activeShadow}
                shadowColor={activeShadowColor}
                variant={activeVariant}
                accent={activeAccent}
                title="Live Target Card"
                subtitle={`Border: ${CARD_BORDER_WIDTH[activeBorderWidth]} • Radius: ${CARD_BORDER_RADIUS[activeRadius]}`}
                icon={<ShieldCheck size={18} />}
                badge="Configured"
                footer={
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-slate-500 font-mono">Shadow: {activeShadow}</span>
                    <span className="text-indigo-600 font-bold font-mono">Tint: {activeShadowColor}</span>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    <CountUp to={142850} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Notice how clean and feather-light this shadow is. No muddy dirty gray patches. Crisp border definition!
                  </p>
                </div>
              </Card>

              {/* Hoverable Card with Action */}
              <Card
                hoverable
                radius={activeRadius}
                borderWidth={activeBorderWidth}
                shadow="hover"
                variant="glass"
                accent="emerald"
                title="Interactive Hoverable Card"
                subtitle="Smooth lift with elevated shadow (-translate-y-0.5)"
                icon={<TrendingUp size={18} className="text-emerald-500" />}
                badge="+24.8%"
                onClick={() => toast.success('Interactive Card Clicked!')}
                footer={
                  <div className="flex items-center justify-between w-full text-xs">
                    <span className="text-slate-500">Hover or click to test</span>
                    <span className="text-emerald-600 font-bold">Action Trigger &rarr;</span>
                  </div>
                }
              >
                <div className="space-y-2">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    Field Outreach Metric
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Includes keyboard accessibility (Enter/Space support and proper ARIA role).
                  </p>
                </div>
              </Card>

              {/* Skeleton Loading Card State */}
              <Card
                loading={true}
                radius={activeRadius}
                borderWidth={activeBorderWidth}
                shadow={activeShadow}
                title="Loading Skeleton State"
                subtitle="Built-in animated placeholder"
              />
            </div>
          </div>

          {/* Quick Copy Snippet */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="font-mono">
              <span className="text-indigo-400">&lt;Card</span>{' '}
              <span className="text-emerald-400">radius</span>=&quot;{activeRadius}&quot;{' '}
              <span className="text-emerald-400">borderWidth</span>=&quot;{activeBorderWidth}&quot;{' '}
              <span className="text-emerald-400">shadow</span>=&quot;{activeShadow}&quot;{' '}
              <span className="text-emerald-400">variant</span>=&quot;{activeVariant}&quot;&gt;
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopyCode(
                  `<Card radius="${activeRadius}" borderWidth="${activeBorderWidth}" shadow="${activeShadow}" variant="${activeVariant}">\n  Body content here\n</Card>`,
                  'configured-card'
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors"
            >
              {copiedKey === 'configured-card' ? <Check size={14} /> : <Copy size={14} />}
              Copy JSX
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: FORMS & INPUT CONTROLS                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <Card
            variant="glass"
            shadow="md"
            title="FormInput Component Standard (Rule 14)"
            subtitle="Standardized inputs with accessible labels, error indicators, icon integration, and uniform styling."
            icon={<Sliders size={18} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Text Input with Icon */}
              <FormInput
                label="Full Name (with Icon)"
                placeholder="Enter voter or leader name..."
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                icon={<User size={15} />}
                helperText="Primary identifier on electoral rolls"
              />

              {/* Email with validation styling */}
              <FormInput
                label="Email Address"
                type="email"
                placeholder="volunteer@campaign.org"
                icon={<Mail size={15} />}
              />

              {/* Password with Eye toggle */}
              <FormInput
                label="Security Password"
                type="password"
                placeholder="Enter secure password"
                icon={<Lock size={15} />}
              />

              {/* Standard Select Dropdown */}
              <FormInput
                label="Constituency Level (Select)"
                type="select"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { label: 'Parliamentary Constituency (PC)', value: 'pc' },
                  { label: 'Assembly Constituency (AC)', value: 'ac' },
                  { label: 'Municipal Ward', value: 'ward' },
                  { label: 'Polling Booth', value: 'booth' },
                ]}
              />

              {/* Date Input */}
              <FormInput
                label="Election Polling Date"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                icon={<Calendar size={15} />}
              />

              {/* Input with Error State */}
              <FormInput
                label="Voter Epic ID (Simulated Error)"
                placeholder="ABC1234567"
                value="INVALID-EPIC"
                error="EPIC code format is invalid (must be 3 letters + 7 digits)"
              />

              {/* Textarea */}
              <div className="md:col-span-2">
                <FormInput
                  label="Campaign Strategy Remarks"
                  type="textarea"
                  rows={3}
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  placeholder="Enter strategic booth observations..."
                />
              </div>

              {/* Checkboxes & Switches */}
              <div className="space-y-4 pt-4">
                <FormInput
                  label="Verified Voter"
                  type="checkbox"
                  value={checkboxValue}
                  onChange={() => setCheckboxValue(!checkboxValue)}
                  helperText="Has phone & address KYC verification"
                />

                <FormInput
                  label="SMS Broadcast Notifications"
                  type="switch"
                  value={switchValue}
                  onChange={() => setSwitchValue(!switchValue)}
                  helperText="Send automated WhatsApp & SMS alerts"
                />
              </div>
            </div>
          </Card>

          {/* File Upload Component Standard (Rule 16) */}
          <Card
            variant="glass"
            shadow="md"
            title="FileUploadInput Component Standard (Rule 16)"
            subtitle="Drag-and-drop validation, max file limits, avatar photo uploader, and preview controls."
            icon={<Download size={18} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Document / Photo Dropzone
                </h4>
                <FileUploadInput
                  label="Document Upload"
                  placeholder="Upload candidate affidavit, voter slip, or party logo (PNG, JPG, max 5MB)"
                  onChange={(val) => {
                    const preview = typeof val === 'string' ? val : val?.name;
                    toast.success('Document uploaded: ' + (preview || 'File selected'));
                  }}
                />
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Circular Avatar / Profile Uploader
                </h4>
                <FileUploadInput
                  variant="avatar"
                  fallbackText="NM"
                  onChange={(val) => {
                    const preview = typeof val === 'string' ? val : val?.name;
                    toast.success('Avatar updated: ' + (preview || 'File selected'));
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: MODALS & CONFIRM DIALOGS                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'modals' && (
        <div className="space-y-6">
          <Card
            variant="glass"
            shadow="md"
            title="Reusable Modal Component Standards (Rule 10 & Rule 24)"
            subtitle="Accessible modals with backdrops, keyboard escape handling, and variants (danger, warning, info, success)."
            icon={<ExternalLink size={18} />}
          >
            <div className="space-y-6">
              {/* Form Modal Launcher */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Standard Form Dialog (<code className="text-indigo-600 font-mono">Modal.tsx</code>)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Used for creating/editing voters, booths, parties, or managing master records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
                >
                  Open Form Modal
                </button>
              </div>

              {/* Confirm Modal Variants */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  4 Confirmation Modal Variants (<code className="text-indigo-600 font-mono">ConfirmModal.tsx</code>)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Danger */}
                  <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                      <Trash2 size={16} /> Danger Action
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      For deleting records or permanent data wipe.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModalConfig({
                          isOpen: true,
                          variant: 'danger',
                          title: 'Delete Polling Booth #42?',
                          description: 'Are you sure you want to delete this booth? All linked voter assignments will be unmapped.',
                        })
                      }
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Test Danger Dialog
                    </button>
                  </div>

                  {/* Warning */}
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <AlertTriangle size={16} /> Warning Action
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      For risky state changes or overriding settings.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModalConfig({
                          isOpen: true,
                          variant: 'warning',
                          title: 'Reset Election Cycle Data?',
                          description: 'This will reset real-time voter turnout counters back to 0% for today.',
                        })
                      }
                      className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Test Warning Dialog
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Info size={16} /> Information Notice
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      For notifying users about sync status or updates.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModalConfig({
                          isOpen: true,
                          variant: 'info',
                          title: 'Sync Master Data to Cloud?',
                          description: 'All 182 Assembly Constituencies will be synchronized with the latest election boundary updates.',
                        })
                      }
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Test Info Dialog
                    </button>
                  </div>

                  {/* Success */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle2 size={16} /> Success Confirmation
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      For confirming approval or publishing items.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModalConfig({
                          isOpen: true,
                          variant: 'success',
                          title: 'Publish Election Results?',
                          description: 'Official results will immediately become visible to all campaign volunteers on the mobile app.',
                        })
                      }
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Test Success Dialog
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Render Active Form Modal */}
          <Modal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            title="Create New Campaign Entity"
            subtitle="Standard Form Dialog adhering to Rule 10 Modal guidelines"
            submitText="Submit & Save"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Record saved successfully!');
              setIsFormModalOpen(false);
            }}
          >
            <div className="space-y-4 py-2">
              <FormInput label="Entity Name" placeholder="e.g. South Gujarat Command Center" required />
              <FormInput
                label="Assigned Region"
                type="select"
                options={[
                  { label: 'Surat District', value: 'surat' },
                  { label: 'Ahmedabad District', value: 'ahmedabad' },
                  { label: 'Vadodara District', value: 'vadodara' },
                ]}
              />
              <FormInput label="Operational Notes" type="textarea" rows={2} placeholder="Add brief notes..." />
            </div>
          </Modal>

          {/* Render Active Confirm Modal */}
          <ConfirmModal
            isOpen={confirmModalConfig.isOpen}
            onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
            onConfirm={() => {
              toast.success(`Action confirmed for "${confirmModalConfig.title}"`);
              setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
            }}
            variant={confirmModalConfig.variant}
            title={confirmModalConfig.title}
            description={confirmModalConfig.description}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: TABLES, BADGES & ACTIONS                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <Card
            variant="glass"
            shadow="md"
            title="Table Typography & Status Badges"
            subtitle="Standardized typography classes and status chip badges used across all list views."
            icon={<Vote size={18} />}
          >
            <div className="space-y-6">
              {/* Badges preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Chip Badges (<code className="text-indigo-600 font-mono">.table-badge-*</code>)
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="table-badge table-badge-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active / Verified
                  </span>
                  <span className="table-badge table-badge-warning">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending Verification
                  </span>
                  <span className="table-badge table-badge-info">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    In Progress
                  </span>
                  <span className="table-badge table-badge-danger">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Deceased / Blocked
                  </span>
                  <span className="table-badge table-badge-neutral">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Unassigned / Neutral
                  </span>
                </div>
              </div>

              {/* Action Buttons (Rule 19) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Standard Table Actions (<code className="text-indigo-600 font-mono">TableActions.tsx</code> per Rule 19)
                </h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Hover over icons to test vibrant interaction colors:
                  </span>
                  <TableActions
                    onView={() => toast('View Record Triggered')}
                    onEdit={() => toast.success('Edit Record Triggered')}
                    onDelete={() => toast.error('Delete Record Triggered')}
                  />
                </div>
              </div>

              {/* Sample Mini Data Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Normalized Table Row Rendering (Rule 11)
                </h4>
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="table-header px-4 py-2.5">Candidate / Voter</th>
                        <th className="table-header px-4 py-2.5">Constituency</th>
                        <th className="table-header px-4 py-2.5">EPIC No</th>
                        <th className="table-header px-4 py-2.5">Status</th>
                        <th className="table-header px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {[
                        {
                          name: 'Rajesh Patel',
                          role: 'Polling Agent',
                          constituency: '154-Surat West AC',
                          epic: 'GJR9823412',
                          badge: 'Active',
                          badgeClass: 'table-badge-success',
                          avatar: '',
                        },
                        {
                          name: 'Amit Shah',
                          role: 'Key Influencer',
                          constituency: 'Gandhinagar PC',
                          epic: 'GJR1102934',
                          badge: 'Verified',
                          badgeClass: 'table-badge-info',
                          avatar: '',
                        },
                        {
                          name: 'Pooja Verma',
                          role: 'Cadre Volunteer',
                          constituency: 'Ward 12, Booth 4',
                          epic: 'GJR5549012',
                          badge: 'Pending KYC',
                          badgeClass: 'table-badge-warning',
                          avatar: '',
                        },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="table-cell">
                            <div className="flex items-center gap-2.5">
                              <SafeImage
                                src={row.avatar}
                                fallbackText={row.name}
                                alt={row.name}
                                className="w-7 h-7 rounded-full"
                              />
                              <div>
                                <div className="table-primary">{row.name}</div>
                                <div className="table-secondary">{row.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="table-secondary">{row.constituency}</span>
                          </td>
                          <td className="table-cell">
                            <span className="table-mono">{row.epic}</span>
                          </td>
                          <td className="table-cell">
                            <span className={`table-badge ${row.badgeClass}`}>{row.badge}</span>
                          </td>
                          <td className="table-cell text-right">
                            <TableActions
                              onView={() => toast(`Viewing ${row.name}`)}
                              onEdit={() => toast.success(`Editing ${row.name}`)}
                              onDelete={() => toast.error(`Deleting ${row.name}`)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: COLOR TOKENS & TYPOGRAPHY                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'palette' && (
        <div className="space-y-6">
          <Card
            variant="glass"
            shadow="md"
            title="Design System Color Tokens"
            subtitle="System colors defined in styles/theme.css and styles/theme.ts."
            icon={<Palette size={18} />}
          >
            <div className="space-y-6">
              {[
                {
                  title: 'Brand & Accents',
                  swatches: [
                    { name: 'Indigo 600 (Primary)', hex: '#4f46e5', bg: 'bg-[#4f46e5]' },
                    { name: 'Indigo 500 (Brand)', hex: '#6366f1', bg: 'bg-[#6366f1]' },
                    { name: 'Purple 500', hex: '#a855f7', bg: 'bg-[#a855f7]' },
                    { name: 'Ranniti Red (Secondary)', hex: '#b22220', bg: 'bg-[#b22220]' },
                  ],
                },
                {
                  title: 'Feedback & Status',
                  swatches: [
                    { name: 'Emerald (Success)', hex: '#10b981', bg: 'bg-[#10b981]' },
                    { name: 'Amber (Warning)', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
                    { name: 'Rose (Danger)', hex: '#ef4444', bg: 'bg-[#ef4444]' },
                    { name: 'Blue (Info)', hex: '#3b82f6', bg: 'bg-[#3b82f6]' },
                  ],
                },
                {
                  title: 'Canvas & Slate Neutrals',
                  swatches: [
                    { name: 'Slate 50 (Light Canvas)', hex: '#f8fafc', bg: 'bg-[#f8fafc]', border: true },
                    { name: 'Slate 200 (Borders)', hex: '#e2e8f0', bg: 'bg-[#e2e8f0]' },
                    { name: 'Slate 600 (Secondary Text)', hex: '#475569', bg: 'bg-[#475569]' },
                    { name: 'Slate 900 (Dark Surface)', hex: '#0f172a', bg: 'bg-[#0f172a]' },
                    { name: 'Slate 950 (Dark Canvas)', hex: '#020617', bg: 'bg-[#020617]' },
                  ],
                },
              ].map((group) => (
                <div key={group.title} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {group.swatches.map((s) => (
                      <div
                        key={s.name}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2.5"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg ${s.bg} shrink-0 ${s.border ? 'border border-slate-300' : ''
                            }`}
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">{s.hex}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {/* ── Sticky Bottom "Save Changes" Bar (Only on Cards/Theme Tab) ── */}
      {activeTab === 'cards' && (
        <div className="fixed bottom-6 right-8 z-40 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-5 py-3 transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2.5 mr-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {isSaved ? 'Theme Saved' : 'Unsaved Theme Changes'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Radius: {CARD_BORDER_RADIUS[activeRadius]} • Shadow: {activeShadow} • Light BG: {lightPageBg} • Dark BG: {darkPageBg}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isSaved ? <CheckCircle size={15} /> : <Save size={15} />}
            <span>Save Changes</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UiShowcasePage;
