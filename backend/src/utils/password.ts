import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generates a human-readable auto-password for tenant users.
 * Format: FirstName + "@" + last4DigitsOfMobile
 * Example: "Amit Chavan" + "+919860055667" → "Amit@5667"
 */
export const generateTenantPassword = (fullName: string, mobile: string): string => {
  const firstName = (fullName.trim().split(/\s+/)[0] || 'User')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 15);
  const capitalized =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const digits = mobile.replace(/\D/g, '').slice(-4).padStart(4, '0');

  return `${capitalized}@${digits}`;
};
