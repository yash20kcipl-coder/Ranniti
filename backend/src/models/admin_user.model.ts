import type { FieldRole, FieldUser, LeaderUser, SubLeaderUser, SupporterUser } from './volunteer.model';

/**
 * Web Platform System & Tenant Administrator Roles
 */
export type SystemAdminRole = 'super_admin' | 'tenant_admin';

/**
 * Web Platform Administrative User Account
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: SystemAdminRole;
  roleName?: string | null;
  mobile?: string;
  avatar?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  tenantDbName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Union type for any account stored in admin_users table
 */
export type AnyUser = AdminUser | FieldUser;
export type UserRole = SystemAdminRole | FieldRole;

export type CreateAdminUserInput = Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAdminUserInput = Partial<CreateAdminUserInput>;

// Re-export Field / Volunteer Models
export type { FieldRole, FieldUser, LeaderUser, SubLeaderUser, SupporterUser };

// Backward-compatible type aliases
export type User = AdminUser;
export type CreateUserInput = CreateAdminUserInput;
export type UpdateUserInput = UpdateAdminUserInput;
