/**
 * Formats a phone number to standard Indian format: +91 00000 00000
 * Used across the entire web application.
 */
export function formatPhoneNumber(phone?: string | number | null): string {
  if (phone === null || phone === undefined) return '—';
  const str = String(phone).trim();
  if (!str || str === '-' || str === '—' || str.toLowerCase() === 'n/a') return '—';

  // Extract all digits
  const digits = str.replace(/\D/g, '');
  if (!digits) return str;

  // If exactly 10 digits
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // If 12 digits starting with 91 (standard international format for India)
  if (digits.length === 12 && digits.startsWith('91')) {
    const core = digits.slice(2);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }

  // If 11 digits starting with 0 (standard STD leading zero)
  if (digits.length === 11 && digits.startsWith('0')) {
    const core = digits.slice(1);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }

  // If more than 10 digits, take the last 10 digits
  if (digits.length > 10) {
    const core = digits.slice(-10);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }

  // For partial or shorter numbers
  return str.startsWith('+91') ? str : `+91 ${str}`;
}
