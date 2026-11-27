/**
 * Shared text utilities for standardizing, formatting, and sanitizing names.
 */

const MINOR_WORDS = new Set(['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'a', 'an']);

// Known acronyms that should remain uppercase
const ACRONYMS = new Set(['NTR', 'YSR', 'BJP', 'INC', 'AAP', 'BSP', 'CPI', 'CPM', 'TMC', 'DMK', 'AIADMK', 'NCP', 'JD(U)', 'RJD', 'SP', 'SHS', 'TDP', 'BRS']);

/**
 * Converts a name string to clean, standardized Title Case.
 * Handles hyphens, dots, parentheses, and skips known acronyms and minor words.
 *
 * Example:
 * "NICOBARS" -> "Nicobars"
 * "SOUTH ANDAMANS" -> "South Andamans"
 * "north and middle andaman" -> "North and Middle Andaman"
 * "dr. b.r. ambedkar konaseema" -> "Dr. B.R. Ambedkar Konaseema"
 * "NTR" -> "NTR"
 */
export function formatTitleCase(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';

  const trimmed = str.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  // Preserve known uppercase acronyms
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

    // Handle parentheses e.g. "Kaimur (Bhabua)"
    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      return `(${formatTitleCase(inner)})`;
    }

    // Handle dots like "Dr." or "B.R."
    if (word.includes('.')) {
      return word
        .split('.')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
        .join('.');
    }

    // Handle hyphens like "North-East"
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
