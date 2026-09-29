export interface AdminUser {
  id: string;
  organizationId?: string | null;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'leader' | 'sub_leader' | 'deo' | 'analyst' | 'user';
  mobile?: string;
  avatar?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAdminUserInput = Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAdminUserInput = Partial<CreateAdminUserInput>;

// Backward-compatible type aliases
export type User = AdminUser;
export type CreateUserInput = CreateAdminUserInput;
export type UpdateUserInput = UpdateAdminUserInput;

