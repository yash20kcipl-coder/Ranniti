import React from 'react';
import { TABLE_STYLES, getTableBadgeClass, type TableBadgeVariant } from '../../styles/tableStyles';

export interface TableTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'span' | 'div' | 'p';
  children: React.ReactNode;
}

/**
 * Standard Primary Text component for table cells (Names, Titles, Main Identifiers).
 */
export const TablePrimaryText: React.FC<TableTextProps> = ({
  as: Component = 'span',
  children,
  className = '',
  ...props
}) => {
  return (
    <Component className={`${TABLE_STYLES.primary} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
};

/**
 * Standard Secondary Subtext component for table cells (Parent Geography, Role, Subtitles).
 */
export const TableSecondaryText: React.FC<TableTextProps> = ({
  as: Component = 'span',
  children,
  className = '',
  ...props
}) => {
  return (
    <Component className={`${TABLE_STYLES.secondary} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
};

/**
 * Standard Monospace Text component for table cells (Serial numbers, codes, IDs, counts).
 */
export const TableMonoText: React.FC<
  TableTextProps & { bold?: boolean; muted?: boolean; accent?: boolean }
> = ({
  as: Component = 'span',
  children,
  className = '',
  bold,
  muted,
  accent,
  ...props
}) => {
    const baseClass = bold
      ? TABLE_STYLES.monoPrimary
      : muted
        ? TABLE_STYLES.monoMuted
        : accent
          ? TABLE_STYLES.monoAccent
          : TABLE_STYLES.mono;

    return (
      <Component className={`${baseClass} ${className}`.trim()} {...props}>
        {children}
      </Component>
    );
  };

export interface TableBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TableBadgeVariant;
  children: React.ReactNode;
}

/**
 * Standard Badge Pill component for status, tags, and categorical indicators in tables.
 */
export const TableBadge: React.FC<TableBadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
  ...props
}) => {
  return (
    <span className={getTableBadgeClass(variant, className)} {...props}>
      {children}
    </span>
  );
};
