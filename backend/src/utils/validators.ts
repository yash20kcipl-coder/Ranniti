import { z } from 'zod';

/**
 * Reusable Zod schema that enforces strict clean text strings:
 * - Trims whitespace
 * - Rejects any string containing `<` or `>` (preventing HTML injection / script injection)
 * - Restricts length
 */
export const safeString = (label: string, max = 255) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} cannot exceed ${max} characters`)
    .refine((val) => !/[<>]/.test(val), {
      message: `${label} cannot contain HTML tags or '<' / '>' characters`,
    });

/**
 * Optional clean string validator
 */
export const optionalSafeString = (label: string, max = 255) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters`)
    .refine((val) => !val || !/[<>]/.test(val), {
      message: `${label} cannot contain HTML tags or '<' / '>' characters`,
    })
    .optional()
    .nullable();

/**
 * Standard Indian 10-digit mobile number validator
 */
export const mobileNumberValidator = z
  .string({ required_error: 'Mobile number is required' })
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number starting with 6-9');

/**
 * Zod validation schema for mobile team member onboarding
 */
export const onboardTeamMemberSchema = z.object({
  body: z.object({
    name: safeString('Name', 100),
    role: safeString('Role', 50),
    email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number').optional().nullable().or(z.literal('')),
    password: z.string().optional().nullable(),
    parentLeaderId: z.string().optional().nullable(),
    assignedAcId: z.string().optional().nullable(),
    assignedBoothIds: z.array(z.string()).optional().nullable(),
    accessibleTabs: z.array(z.string()).optional().nullable(),
  }),
});

