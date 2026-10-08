/**
 * Indian Telecom (TRAI / DoT) Phone Sanitizer Utility
 * Sanitizes and normalizes phone numbers against the Indian National Numbering Plan (NNP).
 * Valid Indian mobile numbers are strictly 10 digits starting with 6, 7, 8, or 9.
 */

export interface SanitizedContact {
  phone: string; // Exactly 10 digits: ^[6-9]\d{9}$
  contactName: string; // Cleaned address book name (max 150 chars)
}

/**
 * Normalizes a single phone number into a 10-digit Indian mobile number.
 * Returns null if the number is not a valid Indian mobile number.
 */
export function normalizeIndianMobile(rawPhone: string | null | undefined): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  // Strip all non-digit characters
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 10) return null;

  let candidate10 = '';
  if (digits.length === 10) {
    candidate10 = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    candidate10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    candidate10 = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    candidate10 = digits.slice(3);
  } else if (digits.length === 13 && digits.startsWith('910')) {
    candidate10 = digits.slice(3);
  } else {
    // If longer with extra country codes/prefixes, take the last 10 digits
    candidate10 = digits.slice(-10);
  }

  // Validate TRAI standard: Indian mobile numbers strictly start with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(candidate10)) {
    return candidate10;
  }

  return null;
}

/**
 * Sanitizes and deduplicates an array of contacts or phone numbers.
 * Preserves the cleanest contact name for each unique 10-digit phone number.
 */
export function sanitizeIndianContacts(
  rawList: Array<{ name?: string; phone?: string } | string>
): SanitizedContact[] {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }

  const phoneMap = new Map<string, string>();

  for (const item of rawList) {
    let rawPhone = '';
    let rawName = '';

    if (typeof item === 'string') {
      rawPhone = item;
      rawName = '';
    } else if (item && typeof item === 'object') {
      rawPhone = item.phone || '';
      rawName = item.name || '';
    }

    const cleanPhone = normalizeIndianMobile(rawPhone);
    if (!cleanPhone) continue;

    const trimmedName = rawName.trim().slice(0, 150);

    // Keep the first descriptive name encountered
    if (!phoneMap.has(cleanPhone) || (!phoneMap.get(cleanPhone) && trimmedName)) {
      phoneMap.set(cleanPhone, trimmedName || 'Contact');
    }
  }

  return Array.from(phoneMap.entries()).map(([phone, contactName]) => ({
    phone,
    contactName,
  }));
}
