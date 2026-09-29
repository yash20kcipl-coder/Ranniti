/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║         RANNITI DESIGN SYSTEM — THEME TOKENS  (TypeScript)        ║
 * ║                                                                    ║
 * ║  JavaScript / inline-style mirror of styles/theme.css.            ║
 * ║  Use these tokens whenever you need dynamic colours in JS:        ║
 * ║    • react-hot-toast custom styles                                 ║
 * ║    • Chart.js / Recharts datasets                                  ║
 * ║    • Canvas / WebGL drawing                                        ║
 * ║    • Dynamic SVG fills                                             ║
 * ║                                                                    ║
 * ║  For static Tailwind class usage, use dark: prefix instead.       ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */

export type ThemeMode = 'light' | 'dark';

/* ─────────────────────────────────────────────────────────────────────
   Token shape
   ───────────────────────────────────────────────────────────────────── */
export interface ThemeTokens {
  /* Canvas */
  canvas: string;
  canvasSubtle: string;

  /* Surface */
  surface: string;
  surfaceRaised: string;
  surfaceOverlay: string;

  /* Borders */
  border: string;
  borderStrong: string;
  borderSubtle: string;

  /* Text */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  /* Accent */
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentBorder: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;

  /* Inputs */
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  inputPlaceholder: string;
  inputText: string;

  /* Interactive */
  hoverSurface: string;
  activeSurface: string;
  selectedText: string;

  /* Table */
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowHover: string;
  tableDivider: string;
  tableCellText: string;

  /* Sidebar */
  sidebarBg: string;
  sidebarBorder: string;
  navText: string;
  navTextActive: string;
  navBgActive: string;
  navIconActive: string;

  /* Topbar */
  topbarBg: string;
  topbarBorder: string;

  /* Shadows */
  shadowCard: string;
  shadowRaised: string;
  shadowOverlay: string;
  shadowAccent: string;

  /* Scrollbar */
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

/* ─────────────────────────────────────────────────────────────────────
   LIGHT tokens
   ───────────────────────────────────────────────────────────────────── */
export const lightTokens: ThemeTokens = {
  /* Canvas */
  canvas:             '#f8fafc',
  canvasSubtle:       '#f1f5f9',

  /* Surface */
  surface:            '#ffffff',
  surfaceRaised:      '#f8fafc',
  surfaceOverlay:     'rgba(255, 255, 255, 0.92)',

  /* Borders */
  border:             '#e2e8f0',
  borderStrong:       '#cbd5e1',
  borderSubtle:       '#f1f5f9',

  /* Text */
  textPrimary:        '#0f172a',
  textSecondary:      '#475569',
  textMuted:          '#94a3b8',
  textOnAccent:       '#ffffff',

  /* Accent */
  accent:             '#6366f1',
  accentHover:        '#4f46e5',
  accentMuted:        'rgba(99, 102, 241, 0.10)',
  accentBorder:       'rgba(99, 102, 241, 0.25)',
  accentSecondary:    '#a855f7',
  accentSuccess:      '#10b981',
  accentWarning:      '#f59e0b',
  accentDanger:       '#ef4444',

  /* Inputs */
  inputBg:            '#ffffff',
  inputBorder:        '#cbd5e1',
  inputFocus:         '#6366f1',
  inputPlaceholder:   '#94a3b8',
  inputText:          '#0f172a',

  /* Interactive */
  hoverSurface:       '#f1f5f9',
  activeSurface:      '#e0e7ff',
  selectedText:       '#4338ca',

  /* Table */
  tableHeaderBg:      'rgba(241, 245, 249, 0.80)',
  tableHeaderText:    '#475569',
  tableRowHover:      'rgba(248, 250, 252, 0.80)',
  tableDivider:       '#e2e8f0',
  tableCellText:      '#1e293b',

  /* Sidebar */
  sidebarBg:          '#ffffff',
  sidebarBorder:      '#e2e8f0',
  navText:            '#64748b',
  navTextActive:      '#4338ca',
  navBgActive:        'rgba(99, 102, 241, 0.08)',
  navIconActive:      '#6366f1',

  /* Topbar */
  topbarBg:           'rgba(255, 255, 255, 0.85)',
  topbarBorder:       '#e2e8f0',

  /* Shadows */
  shadowCard:         '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowRaised:       '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  shadowOverlay:      '0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
  shadowAccent:       '0 8px 24px rgba(99, 102, 241, 0.25)',

  /* Scrollbar */
  scrollbarThumb:     'rgba(100, 116, 139, 0.25)',
  scrollbarThumbHover:'rgba(100, 116, 139, 0.45)',
};

/* ─────────────────────────────────────────────────────────────────────
   DARK tokens
   ───────────────────────────────────────────────────────────────────── */
export const darkTokens: ThemeTokens = {
  /* Canvas */
  canvas:             '#020617',
  canvasSubtle:       '#0f172a',

  /* Surface */
  surface:            '#0f172a',
  surfaceRaised:      '#1e293b',
  surfaceOverlay:     'rgba(15, 23, 42, 0.92)',

  /* Borders */
  border:             '#1e293b',
  borderStrong:       '#334155',
  borderSubtle:       '#0f172a',

  /* Text */
  textPrimary:        '#f1f5f9',
  textSecondary:      '#94a3b8',
  textMuted:          '#64748b',
  textOnAccent:       '#ffffff',

  /* Accent */
  accent:             '#818cf8',
  accentHover:        '#6366f1',
  accentMuted:        'rgba(99, 102, 241, 0.15)',
  accentBorder:       'rgba(99, 102, 241, 0.30)',
  accentSecondary:    '#c084fc',
  accentSuccess:      '#34d399',
  accentWarning:      '#fbbf24',
  accentDanger:       '#f87171',

  /* Inputs */
  inputBg:            'rgba(15, 23, 42, 0.90)',
  inputBorder:        '#1e293b',
  inputFocus:         '#6366f1',
  inputPlaceholder:   '#64748b',
  inputText:          '#f1f5f9',

  /* Interactive */
  hoverSurface:       'rgba(30, 41, 59, 0.60)',
  activeSurface:      'rgba(99, 102, 241, 0.15)',
  selectedText:       '#a5b4fc',

  /* Table */
  tableHeaderBg:      'rgba(2, 6, 23, 0.60)',
  tableHeaderText:    '#94a3b8',
  tableRowHover:      'rgba(30, 41, 59, 0.40)',
  tableDivider:       'rgba(30, 41, 59, 0.60)',
  tableCellText:      '#e2e8f0',

  /* Sidebar */
  sidebarBg:          'rgba(15, 23, 42, 0.95)',
  sidebarBorder:      '#1e293b',
  navText:            '#94a3b8',
  navTextActive:      '#a5b4fc',
  navBgActive:        'rgba(99, 102, 241, 0.15)',
  navIconActive:      '#818cf8',

  /* Topbar */
  topbarBg:           'rgba(15, 23, 42, 0.85)',
  topbarBorder:       'rgba(30, 41, 59, 0.80)',

  /* Shadows */
  shadowCard:         '0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20)',
  shadowRaised:       '0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.25)',
  shadowOverlay:      '0 20px 60px rgba(0,0,0,0.70), 0 8px 20px rgba(0,0,0,0.40)',
  shadowAccent:       '0 8px 24px rgba(99, 102, 241, 0.35)',

  /* Scrollbar */
  scrollbarThumb:     'rgba(148, 163, 184, 0.20)',
  scrollbarThumbHover:'rgba(148, 163, 184, 0.35)',
};

/* ─────────────────────────────────────────────────────────────────────
   Helper: get tokens for current mode
   ───────────────────────────────────────────────────────────────────── */
export const getThemeTokens = (mode: ThemeMode): ThemeTokens =>
  mode === 'dark' ? darkTokens : lightTokens;

/* ─────────────────────────────────────────────────────────────────────
   Static brand palette (same in both themes — do not override)
   ───────────────────────────────────────────────────────────────────── */
export const brandPalette = {
  indigo:   { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
  purple:   { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
  emerald:  { 400: '#34d399', 500: '#10b981', 600: '#059669' },
  amber:    { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  red:      { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
  slate:    {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

export default { lightTokens, darkTokens, getThemeTokens, brandPalette };
