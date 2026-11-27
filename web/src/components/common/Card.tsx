import React, { forwardRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────────
   Card Types & Built-in Style Class Dictionaries
   All design tokens are resolved directly via Tailwind CSS & theme.css variables:
   - --card-radius (defaults to 20px matching modern redesigns)
   - --card-border-width (defaults to 1px)
   - --card-shadow (clean ambient occlusion for light & dark)
   ───────────────────────────────────────────────────────────────────────────── */

export type CardRadiusPreset =
  | 'default'
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | 'full';

export type CardBorderWidthPreset =
  | 'default'
  | 'none'
  | 'thin'
  | 'medium'
  | 'thick'
  | 'bold';

export type CardShadowPreset =
  | 'none'
  | 'clean'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'glow'
  | 'hover';

export type CardShadowColorPreset =
  | 'neutral'
  | 'slate'
  | 'indigo'
  | 'amber'
  | 'rose';

export type CardVariantPreset =
  | 'default'
  | 'glass'
  | 'elevated'
  | 'subtle'
  | 'bordered'
  | 'flat';

export type CardPaddingPreset =
  | 'none'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl';

export type CardAccentPreset =
  | 'none'
  | 'primary'
  | 'secondary'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'blue'
  | 'cyan';

export type CardSkeletonVariant =
  | 'default'
  | 'tiles'
  | 'stats'
  | 'chart'
  | 'table'
  | 'simple';

const CARD_RADIUS_CLASSES: Record<CardRadiusPreset, string> = {
  default: 'rounded-[var(--card-radius,20px)]',
  none: 'rounded-none',
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-[20px]',
  full: 'rounded-full',
};

const CARD_BORDER_WIDTH_CLASSES: Record<CardBorderWidthPreset, string> = {
  default: 'border-[length:var(--card-border-width,1px)]',
  none: 'border-0',
  thin: 'border',
  medium: 'border-[1.5px]',
  thick: 'border-2',
  bold: 'border-[3px]',
};

const CARD_SHADOW_CLASSES: Record<CardShadowPreset, string> = {
  none: 'shadow-none border border-slate-200/80 dark:border-slate-800/80',
  clean:
    'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_14px_rgba(15,23,42,0.05)] dark:shadow-none border border-[#E3E8F0] dark:border-slate-800',
  sm:
    'shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)] dark:shadow-none border border-slate-200/80 dark:border-slate-800/80',
  md:
    'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_14px_rgba(15,23,42,0.05)] dark:shadow-none border border-[#E3E8F0] dark:border-slate-800',
  lg:
    'shadow-[0_10px_25px_-4px_rgba(15,23,42,0.06),0_4px_8px_-2px_rgba(15,23,42,0.03)] dark:shadow-[0_10px_30px_-4px_rgba(0,0,0,0.45)] border border-slate-200/90 dark:border-slate-800/90',
  xl:
    'shadow-[0_20px_35px_-6px_rgba(15,23,42,0.08),0_8px_16px_-3px_rgba(15,23,42,0.03)] dark:shadow-[0_20px_45px_-6px_rgba(0,0,0,0.55)] border border-slate-200 dark:border-slate-800',
  glow:
    'shadow-[0_0_20px_-2px_rgba(99,102,241,0.18)] dark:shadow-[0_0_25px_-2px_rgba(129,140,248,0.22)] border border-indigo-200/80 dark:border-indigo-900/60',
  hover:
    'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_14px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_24px_-4px_rgba(15,23,42,0.08)] dark:shadow-none dark:hover:shadow-[0_14px_30px_-4px_rgba(0,0,0,0.5)] border border-[#E3E8F0] dark:border-slate-800 hover:border-indigo-300/80 dark:hover:border-indigo-700/80 hover:-translate-y-0.5 transition-all duration-200',
};

const CARD_VARIANT_CLASSES: Record<CardVariantPreset, string> = {
  default: 'bg-white dark:bg-slate-900',
  glass: 'bg-white dark:bg-slate-900',
  elevated: 'bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-900/90',
  subtle: 'bg-[#FAFBFD] dark:bg-slate-900/60',
  bordered: 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700',
  flat: 'bg-slate-100/70 dark:bg-slate-800/50 border-transparent',
};

const CARD_PADDING_CLASSES: Record<CardPaddingPreset, string> = {
  none: 'p-0',
  xs: 'p-2.5',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
  xl: 'p-8 sm:p-9',
};

const CARD_ACCENT_CLASSES: Record<CardAccentPreset, string> = {
  none: '',
  primary: 'border-t-4 border-t-indigo-600 dark:border-t-indigo-500',
  secondary: 'border-t-4 border-t-[#b22220] dark:border-t-rose-500',
  indigo: 'border-t-4 border-t-indigo-600 dark:border-t-indigo-500',
  emerald: 'border-t-4 border-t-emerald-600 dark:border-t-emerald-500',
  amber: 'border-t-4 border-t-amber-500 dark:border-t-amber-400',
  rose: 'border-t-4 border-t-rose-600 dark:border-t-rose-500',
  purple: 'border-t-4 border-t-purple-600 dark:border-t-purple-500',
  blue: 'border-t-4 border-t-blue-600 dark:border-t-blue-500',
  cyan: 'border-t-4 border-t-cyan-500 dark:border-t-cyan-400',
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component Props
   ───────────────────────────────────────────────────────────────────────────── */

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Main body content */
  children?: React.ReactNode;

  /** Header title text or element */
  title?: React.ReactNode;

  /** Header secondary subtitle or description */
  subtitle?: React.ReactNode;

  /** Leading icon rendered next to title (automatically wrapped in styled icon pill) */
  icon?: React.ReactNode;

  /** Status badge or chip placed on the right side of the header */
  badge?: React.ReactNode;

  /** Action buttons, links, or controls placed on the right side of header */
  action?: React.ReactNode;
  headerActions?: React.ReactNode;

  /** Footer content placed at the bottom */
  footer?: React.ReactNode;

  /**
   * Visual surface variant
   * @default 'default'
   */
  variant?: CardVariantPreset;

  /**
   * Shadow elevation preset
   * @default 'md'
   */
  shadow?: CardShadowPreset;

  /**
   * Border radius preset (defaults to 20px)
   * @default 'default'
   */
  radius?: CardRadiusPreset;

  /**
   * Border width preset
   * @default 'default'
   */
  borderWidth?: CardBorderWidthPreset | number;

  /**
   * Optional custom shadow color tint.
   */
  shadowColor?: CardShadowColorPreset | string;

  /**
   * Internal content padding.
   * @default 'md'
   */
  padding?: CardPaddingPreset;

  /**
   * Colored top accent bar preset.
   * @default 'none'
   */
  accent?: CardAccentPreset;

  /**
   * Custom hex / RGB color for the top accent border
   */
  accentColor?: string;

  /**
   * If true, enables hover elevation lift (-translate-y-0.5) and cursor-pointer.
   * @default false
   */
  hoverable?: boolean;

  /**
   * Skeleton loader state. When true, renders an animated placeholder structure.
   * @default false
   */
  loading?: boolean;

  /**
   * Skeleton layout variant when `loading={true}`.
   * - `default`: Standard card skeleton with header, content blocks, and footer
   * - `tiles`: 2-column grid of 8 tiles with icons & progress tracks (Field completeness)
   * - `stats`: Top 2 stat boxes, progress track, 3 readiness rows, tip box (Cadre deployment)
   * - `chart`: Top metrics row, horizontal bars with percentage chips (Party / Age / Gender)
   * - `table`: Structured table skeleton
   * - `simple`: Minimalistic KPI placeholder
   * @default 'default'
   */
  skeletonVariant?: CardSkeletonVariant;

  /**
   * Custom skeleton element to render inside the card shell when `loading={true}`.
   */
  skeleton?: React.ReactNode;

  /** Class names for sub-sections */
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton Sub-layouts
   ───────────────────────────────────────────────────────────────────────────── */

export const CardSkeleton: React.FC<{
  variant?: CardSkeletonVariant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  hasHeader?: boolean;
  hasFooter?: boolean;
}> = ({
  variant = 'default',
  title,
  subtitle,
  icon,
  hasHeader = true,
  hasFooter = true,
}) => {
    return (
      <div className="flex flex-col justify-between h-full w-full">
        {/* Header Skeleton */}
        {hasHeader && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6] dark:border-slate-800/80 animate-pulse">
            <div className="flex items-center gap-3 min-w-0">
              {icon ? (
                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center shrink-0 opacity-70">
                  {icon}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              )}
              <div className="space-y-1.5 min-w-0">
                {title ? (
                  <div className="text-[16px] leading-[22px] font-bold text-[#0F172A] dark:text-white tracking-[-0.01em] truncate opacity-70">
                    {title}
                  </div>
                ) : (
                  <div className="h-4 w-36 sm:w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                )}
                {subtitle ? (
                  <div className="text-[13px] leading-[18px] text-[#475569] dark:text-slate-400 truncate opacity-70">
                    {subtitle}
                  </div>
                ) : (
                  <div className="h-3 w-48 sm:w-64 bg-slate-200/70 dark:bg-slate-800/60 rounded-md" />
                )}
              </div>
            </div>
            <div className="h-7 w-24 sm:w-32 bg-slate-200/80 dark:bg-slate-800/80 rounded-full shrink-0 ml-3" />
          </div>
        )}

        {/* Body Skeleton */}
        <div className="flex-1 p-5 animate-pulse">
          {variant === 'tiles' ? (
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-3.5 border border-[#E3E8F0] dark:border-slate-800/90 rounded-[14px] bg-[#FAFBFD] dark:bg-slate-800/40 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-2.5 w-32 bg-slate-200/70 dark:bg-slate-800/60 rounded" />
                      </div>
                      <div className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" />
                    </div>
                    <div className="h-2 rounded-[4px] bg-slate-200/70 dark:bg-slate-700/80 overflow-hidden mt-3" />
                  </div>
                ))}
              </div>
              {/* Tip Box placeholder */}
              <div className="p-3.5 rounded-[12px] bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 mt-auto">
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded" />
                </div>
              </div>
            </div>
          ) : variant === 'stats' ? (
            <div className="flex flex-col h-full justify-between gap-4">
              {/* 2 Big Stat Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#FAFBFD] dark:bg-slate-800/40 border border-[#E3E8F0] dark:border-slate-800 space-y-2">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-36 bg-slate-200/70 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="p-3.5 sm:p-4 rounded-[16px] bg-[#FAFBFD] dark:bg-slate-800/40 border border-[#E3E8F0] dark:border-slate-800 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-36 bg-slate-200/70 dark:bg-slate-800/60 rounded" />
                </div>
              </div>

              {/* Header & Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pt-1">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-3 rounded-[6px] bg-slate-200 dark:bg-slate-700/80 w-full" />
              </div>

              {/* 3 Readiness Rows */}
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 sm:px-3.5 sm:py-2.5 rounded-[12px] bg-[#FAFBFD] dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-2.5 w-40 bg-slate-200/70 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded shrink-0" />
                  </div>
                ))}
              </div>

              {/* Tip Box */}
              <div className="p-3.5 rounded-[12px] bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 mt-auto">
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-full bg-slate-200/70 dark:bg-slate-700/60 rounded" />
                </div>
              </div>
            </div>
          ) : variant === 'chart' ? (
            <div className="flex flex-col h-full justify-between space-y-5">
              {/* Top metrics row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-[10px]" />
              </div>

              {/* Share bars */}
              <div className="space-y-3 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 sm:w-32 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-[3px] bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="flex-1 h-3.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-300 dark:bg-slate-700"
                        style={{ width: `${Math.max(15, 90 - i * 14)}%` }}
                      />
                    </div>
                    <div className="w-20 flex justify-end gap-1.5">
                      <div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-3.5 w-8 bg-slate-200/70 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : variant === 'simple' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
              </div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-40 bg-slate-200/70 dark:bg-slate-800 rounded" />
            </div>
          ) : (
            /* Default multi-element skeleton */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-[14px] border border-slate-200/60 dark:border-slate-800 p-4 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-200/70 dark:bg-slate-700/60 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-[12px] border border-slate-200/60 dark:border-slate-800" />
                <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-[12px] border border-slate-200/60 dark:border-slate-800" />
              </div>
              <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 w-full" />
            </div>
          )}
        </div>

        {/* Footer Skeleton */}
        {hasFooter && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#EEF1F6] dark:border-slate-800/80 bg-[#FAFBFD] dark:bg-slate-900/60 animate-pulse">
            <div className="h-3 w-48 sm:w-64 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
            <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        )}
      </div>
    );
  };

/* ─────────────────────────────────────────────────────────────────────────────
   Main Card Component
   ───────────────────────────────────────────────────────────────────────────── */

const CardComponent = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      title,
      subtitle,
      icon,
      badge,
      action,
      headerActions,
      footer,
      variant = 'default',
      shadow = 'md',
      radius = 'default',
      borderWidth = 'default',
      shadowColor,
      padding = 'md',
      accent = 'none',
      accentColor,
      hoverable = false,
      loading = false,
      skeletonVariant = 'default',
      skeleton,
      onClick,
      className = '',
      headerClassName = '',
      contentClassName = '',
      footerClassName = '',
      style,
      ...restProps
    },
    ref
  ) => {
    // Consolidate action slots
    const resolvedActions = action || headerActions;
    const hasHeader = Boolean(title || subtitle || icon || badge || resolvedActions);
    const hasFooter = Boolean(footer);
    const isInteractive = Boolean(onClick || hoverable);

    // Keyboard accessibility for clickable cards
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
      restProps.onKeyDown?.(e);
    };

    // Border radius, border width, shadow, variant and padding classes
    const radiusClass = CARD_RADIUS_CLASSES[radius] || CARD_RADIUS_CLASSES.default;
    const borderWidthClass =
      typeof borderWidth === 'string'
        ? CARD_BORDER_WIDTH_CLASSES[borderWidth] || CARD_BORDER_WIDTH_CLASSES.default
        : '';
    const shadowClass = CARD_SHADOW_CLASSES[shadow] || CARD_SHADOW_CLASSES.md;
    const variantClass = CARD_VARIANT_CLASSES[variant] || CARD_VARIANT_CLASSES.default;
    const paddingClass = CARD_PADDING_CLASSES[padding] || CARD_PADDING_CLASSES.md;
    const accentClass = accentColor ? '' : CARD_ACCENT_CLASSES[accent] || '';

    // Dynamic style with custom accent color, border width, or custom inline style
    const customBorderWidthStyle: React.CSSProperties =
      typeof borderWidth === 'number' ? { borderWidth: `${borderWidth}px` } : {};

    const customShadowColorStyle: React.CSSProperties =
      shadowColor ? ({ '--shadow-color': shadowColor } as React.CSSProperties) : {};

    const combinedStyle: React.CSSProperties = {
      ...(accentColor ? { borderTopColor: accentColor, borderTopWidth: 4 } : {}),
      ...customBorderWidthStyle,
      ...customShadowColorStyle,
      ...style,
    };

    /* ── Skeleton Loading State ─────────────────────────────────────────── */
    if (loading) {
      return (
        <div
          ref={ref}
          className={`relative overflow-hidden flex flex-col justify-between ${variantClass} ${radiusClass} ${borderWidthClass} ${shadowClass} ${accentClass} ${className}`}
          style={combinedStyle}
          {...restProps}
        >
          {skeleton ? (
            skeleton
          ) : (
            <CardSkeleton
              icon={icon}
              title={title}
              subtitle={subtitle}
              hasHeader={hasHeader}
              hasFooter={hasFooter}
              variant={skeletonVariant}
            />
          )}
        </div>
      );
    }

    /* ── Render Live Card ────────────────────────────────────────────────── */
    return (
      <div
        ref={ref}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        style={combinedStyle}
        className={`relative overflow-hidden flex flex-col justify-between transition-all duration-200 ${variantClass} ${radiusClass} ${borderWidthClass} ${shadowClass} ${accentClass} ${isInteractive
          ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]'
          : ''
          } ${className}`}
        {...restProps}
      >
        {/* Built-in Header (if header props provided) */}
        {hasHeader && (
          <div
            className={`flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6] dark:border-slate-800/80 ${headerClassName}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#4338CA] dark:text-indigo-400 flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-[14px] leading-[18px] font-bold text-[#0F172A] dark:text-white tracking-[-0.01em] truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[12px] leading-[14px] text-[#475569] dark:text-slate-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
              {badge &&
                (typeof badge === 'string' ? (
                  <span className="text-[13px] font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {badge}
                  </span>
                ) : (
                  badge
                ))}
              {resolvedActions}
            </div>
          </div>
        )}

        {/* Content Body */}
        {children && (
          <div
            className={`flex-1 ${hasHeader && padding !== 'none' ? 'px-5 py-4' : paddingClass
              } ${contentClassName}`}
          >
            {children}
          </div>
        )}

        {/* Built-in Footer (if footer prop provided) */}
        {footer && (
          <div
            className={`px-5 py-3 border-t border-[#EEF1F6] dark:border-slate-800/80 bg-[#FAFBFD] dark:bg-slate-900/60 flex items-center justify-between text-xs ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

CardComponent.displayName = 'Card';

/* ─────────────────────────────────────────────────────────────────────────────
   Compound Subcomponents
   ───────────────────────────────────────────────────────────────────────────── */

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6] dark:border-slate-800/80 ${className}`}
    {...props}
  >
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex-1 px-5 py-4 ${className}`} {...props}>
    {children}
  </div>
);

CardContent.displayName = 'CardContent';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-5 py-3 border-t border-[#EEF1F6] dark:border-slate-800/80 bg-[#FAFBFD] dark:bg-slate-900/60 flex items-center justify-between text-xs ${className}`}
    {...props}
  >
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';

/* ─────────────────────────────────────────────────────────────────────────────
   CardFooterLink — standardised footer row used by every dashboard card.
   Renders:  [hint text]  ·  [CTA button →]
   Usage:
     <CardFooterLink
       hint="Volunteers earn points for filling in missing details"
       label="Volunteer surveys"
       to="/dashboard/surveys"
     />
     — or use `onClick` instead of `to` for a callback:
     <CardFooterLink hint="…" label="Manage team" onClick={handleClick} />
   ───────────────────────────────────────────────────────────────────────────── */

export interface CardFooterLinkProps {
  /** Left-side hint / context text */
  hint: React.ReactNode;
  /** CTA button label (right side) */
  label?: React.ReactNode;
  /** Navigate to this route when button is clicked (uses react-router). */
  to?: string;
  /** Callback — used when `to` is not provided or for extra side-effects. */
  onClick?: () => void;
  /** Extra className on the outer wrapper div */
  className?: string;
  /** Extra className on the CTA button */
  buttonClassName?: string;
  /** Replace the default ChevronRight icon */
  icon?: React.ReactNode;
}

export const CardFooterLink: React.FC<CardFooterLinkProps> = ({
  hint,
  label,
  to,
  onClick,
  className = '',
  buttonClassName = '',
  icon,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick?.();
    if (to) navigate(to);
  };

  return (
    <div className={`flex items-center justify-between gap-4 text-xs w-full ${className}`}>
      {/* Left: hint text */}
      <span className="text-[12px] text-[#475569] dark:text-slate-400 leading-[1.5]">
        {hint}
      </span>

      {/* Right: CTA button */}
      {label && (
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1 min-h-[40px] px-2.5 -mr-2.5 rounded-lg text-[13px] font-semibold text-[#4338CA] dark:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer shrink-0 ${buttonClassName}`}
        >
          {label}
          {icon !== undefined ? icon : <ChevronRight size={14} strokeWidth={2.4} />}
        </button>
      )}
    </div>
  );
};

CardFooterLink.displayName = 'CardFooterLink';

export const Card = CardComponent;
