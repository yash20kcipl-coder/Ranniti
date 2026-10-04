import { z } from 'zod';
import { ALL_ROLES } from './auth.schema';

export const createAdminUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional().or(z.literal('')),
    role: z.enum(ALL_ROLES).default('supporter'),
    roleName: z.string().nullable().optional(),
    mobile: z.string().optional(),
    avatar: z.string().nullable().optional(),
    tenantDbName: z.string().nullable().optional(),
    parentLeaderId: z.string().uuid().nullable().optional(),
    assignedAcId: z.string().uuid().nullable().optional(),
    assignedBoothIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateAdminUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Admin User ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(ALL_ROLES).optional(),
    roleName: z.string().nullable().optional(),
    mobile: z.string().optional(),
    avatar: z.string().nullable().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    parentLeaderId: z.string().uuid().nullable().optional(),
    assignedAcId: z.string().uuid().nullable().optional(),
    assignedBoothIds: z.array(z.string().uuid()).optional(),
  }),
});

export const getAdminUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Admin User ID format'),
  }),
});

// Backward-compatibility exports
export const createUserSchema = createAdminUserSchema;
export const updateUserSchema = updateAdminUserSchema;
export const getUserByIdSchema = getAdminUserByIdSchema;

