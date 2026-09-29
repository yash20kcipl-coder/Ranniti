/**
 * Common Date & Age Utilities
 */

export function parseDate(dateVal?: string | Date | number | null): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  if (typeof dateVal === 'number') {
    // If it's an Excel serial date number (e.g. 20000 to 60000)
    if (dateVal > 10000 && dateVal < 70000) {
      const utcDays = Math.floor(dateVal - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return isNaN(dateInfo.getTime()) ? null : dateInfo;
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateVal).trim();
  if (!str) return null;

  // Handle dd-MM-yyyy or dd/MM/yyyy
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle yyyy-MM-dd or standard ISO string
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  return null;
}

export function calculateAge(dob?: string | Date | number | null): number | null {
  const birthDate = parseDate(dob);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 && age < 130 ? age : null;
}

export function formatDateForDb(dob?: string | Date | number | null): string | null {
  const d = parseDate(dob);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
