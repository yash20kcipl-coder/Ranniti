export interface TenantAssignment {
  id: string;
  userId: string;
  organizationName: string;
  tenantDbName: string;
  pcIds: string[];
  acIds: string[];
  status: 'pending' | 'provisioning' | 'active' | 'failed' | 'suspended';
  provisioningProgress: number;
  totalVotersCopied: number;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantUserInput {
  // Account details
  name: string;
  email: string;
  mobile: string;
  organizationName: string;
  avatar?: string | null;
  // Constituency scope
  stateId?: string;
  pcIds: string[];
  acIds: string[];
}

export interface TenantUserWithAssignment {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string | null;
  tenantDbName?: string | null;
  status?: string;
  assignment?: TenantAssignment | null;
  createdAt: Date;
  updatedAt: Date;
}
