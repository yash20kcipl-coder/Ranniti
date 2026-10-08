import Contacts from 'react-native-contacts';
import { DeviceContactItem } from '../store/reducers/contactSync';

/**
 * Reads address book contacts from the physical device using react-native-contacts.
 * Filters and extracts valid Indian 10-digit mobile numbers.
 */
export const fetchDeviceContacts = async (): Promise<DeviceContactItem[]> => {
  try {
    const rawList = await Contacts.getAll();
    if (!Array.isArray(rawList)) return [];

    const contactMap = new Map<string, DeviceContactItem>();

    for (const c of rawList) {
      const name =
        `${c.givenName || ''} ${c.familyName || ''}`.trim() || c.displayName || 'Contact';
      const phoneNumbers = c.phoneNumbers || [];

      for (const p of phoneNumbers) {
        if (!p.number) continue;
        const cleanDigits = p.number.replace(/\D/g, '');
        if (cleanDigits.length < 10) continue;
        const normalized10 = cleanDigits.slice(-10);

        // Filter valid Indian mobile numbers [6, 7, 8, 9]
        if (/^[6-9]\d{9}$/.test(normalized10)) {
          if (!contactMap.has(normalized10)) {
            contactMap.set(normalized10, {
              id: c.recordID ? `${c.recordID}-${normalized10}` : `${name}-${normalized10}`,
              name,
              phone: p.number,
              isMatched: false,
            });
          }
        }
      }
    }

    return Array.from(contactMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('[ContactReader] Failed to read contacts from device:', error);
    return [];
  }
};
