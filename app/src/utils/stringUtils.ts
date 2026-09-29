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
