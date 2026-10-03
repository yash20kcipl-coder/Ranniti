import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const ALL_ROLES = [
  'super_admin',
  'admin',
  'tenant_admin',
  'pc_leader',
  'ac_leader',
  'leader',
  'sub_leader',
  'supporter',
  'deo',
  'analyst',
  'user',
] as const;

export const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ALL_ROLES).default('user'),
    roleName: z.string().nullable().optional(),
    mobile: z.string().optional(),
    avatar: z.string().nullable().optional(),
    tenantDbName: z.string().nullable().optional(),
    parentLeaderId: z.string().uuid().nullable().optional(),
    assignedAcId: z.string().uuid().nullable().optional(),
    assignedBoothIds: z.array(z.string().uuid()).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

