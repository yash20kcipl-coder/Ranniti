/**
 * Intelligently extracts the natural first name for friendly greetings,
 * bypassing common academic and social honorifics gracefully.
 */
export const getCleanFirstName = (fullName: string | undefined | null): string => {
  if (!fullName) return "";
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";

  const honorifics = new Set([
    'mr.', 'mrs.', 'ms.', 'dr.', 'prof.',
    'mr', 'mrs', 'ms', 'dr', 'prof'
  ]);

  // If current slot holds an honorific, gracefully slide to the next contiguous block
  if (parts.length > 1 && honorifics.has(parts[0].toLowerCase())) {
    return parts[1];
  }

  return parts[0];
};

/**
 * Formats a numeric currency amount into Rupee currency format (INR)
 */
export const formatCurrency = (amount: number): string => {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
};

const MINOR_WORDS = new Set(['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an']);
const ACRONYMS = new Set(['NTR', 'YSR', 'BJP', 'INC', 'AAP', 'BSP', 'CPI', 'CPM', 'TMC', 'DMK', 'AIADMK', 'NCP', 'JD(U)', 'RJD', 'SP', 'SHS', 'TDP', 'BRS']);

/**
 * Converts a name string to clean, standardized Title Case.
 */
export function formatTitleCase(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';

  const trimmed = str.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  if (ACRONYMS.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  const words = trimmed.split(' ');

  const titleCased = words.map((word, index) => {
    const upper = word.toUpperCase();
    if (ACRONYMS.has(upper)) {
      return upper;
    }

    const lower = word.toLowerCase();
    if (index > 0 && MINOR_WORDS.has(lower)) {
      return lower;
    }

    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      return `(${formatTitleCase(inner)})`;
    }

    if (word.includes('.')) {
      return word
        .split('.')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('.');
    }

    if (word.includes('-')) {
      return word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('-');
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return titleCased.join(' ');
}
