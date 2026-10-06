// Tenant — a standalone organization account managed by the super admin.
// Stored in the dedicated `tenants` table (NOT in admin_users).
export interface Tenant {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  mobile?: string | null;
  avatar?: string | null;
  organizationName: string;
  tenantDbName: string;
  pcIds: string[];
  acIds: string[];
  tenantRoleId?: string | null;
  tenantRoleName?: string | null;
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'suspended';
  provisioningProgress: number;
  totalVotersCopied: number;
  currentStep: string;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  name: string;
  email: string;
  mobile: string;
  organizationName: string;
  avatar?: string | null;
  pcIds: string[];
  acIds: string[];
  tenantRoleId?: string | null;
}
