import { z } from 'zod';

export const createAdminUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z
      .enum(['super_admin', 'admin', 'leader', 'sub_leader', 'deo', 'analyst', 'user'])
      .default('user'),
    organizationId: z.string().uuid().optional(),
    mobile: z.string().optional(),
  }),
});

export const updateAdminUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Admin User ID format'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z
      .enum(['super_admin', 'admin', 'leader', 'sub_leader', 'deo', 'analyst', 'user'])
      .optional(),
    mobile: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
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

