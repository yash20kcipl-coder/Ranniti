export type FieldRole = 'pc_leader' | 'ac_leader' | 'leader' | 'sub_leader' | 'supporter';

export interface FieldUser {
  id: string;
  name: string;
  email: string;
  role: FieldRole;
  roleName?: string | null;
  mobile?: string;
  avatar?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  tenantDbName?: string | null;
  parentLeaderId?: string | null;
  assignedAcId?: string | null;
  assignedBoothIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PC / AC Campaign Leader (Multi-PC, Multi-AC, Multi-Ward Booth Assignments)
 */
export interface LeaderUser extends FieldUser {
  role: 'pc_leader' | 'ac_leader' | 'leader';
}

/**
 * Booth Coordinator / Sub-Leader (Ward & Multi-Booth Scope)
 */
export interface SubLeaderUser extends FieldUser {
  role: 'sub_leader';
}

/**
 * Field Supporter (Single Booth Scope)
 */
export interface SupporterUser extends FieldUser {
  role: 'supporter';
}

export type CreateFieldUserInput = Omit<FieldUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFieldUserInput = Partial<CreateFieldUserInput>;
