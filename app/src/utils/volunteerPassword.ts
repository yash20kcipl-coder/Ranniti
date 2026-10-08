/**
 * Generates the standardized default mobile credential password preview
 * Formula: CapitalizedFirstName + Last4DigitsOfMobile + #
 * Example: Ramesh Chandra (9876543210) -> Ramesh3210#
 */
export function getVolunteerPasswordPreview(name: string, mobile: string): string {
  if (!name || !name.trim()) return '';
  const cleanName = name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
  const capitalized =
    cleanName.length > 0
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
      : 'Volunteer';
  const cleanPhone = (mobile || '').replace(/\D/g, '');
  const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '••••';
  return `${capitalized}${last4}#`;
}
