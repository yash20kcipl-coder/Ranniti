/**
 * Standard password generator for volunteer onboarding:
 * Formula: CapitalizedFirstName + Last4DigitsOfMobile + #
 * 
 * Examples:
 * - Rahul Sharma (9876543210) -> Rahul3210#
 * - Amit Patil (9123456789) -> Amit6789#
 * - Sneha (9988771122) -> Sneha1122#
 */
export function generateVolunteerDefaultPassword(name: string, mobile: string): string {
  if (!name || !name.trim()) return 'Ranniti@123';

  // Extract first word of the name, remove non-alphabetic characters
  const cleanName = name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
  const capitalized = cleanName.length > 0
    ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
    : 'Volunteer';

  // Extract last 4 digits of the phone number
  const cleanPhone = (mobile || '').replace(/\D/g, '');
  const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1234';

  return `${capitalized}${last4}#`;
}
