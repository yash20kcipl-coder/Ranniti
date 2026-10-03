import tenantSeeds from './tenants.json';

export interface SeedAdminUserData {
  name: string;
  roleName?: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'tenant_admin' | 'pc_leader' | 'ac_leader' | 'leader' | 'sub_leader' | 'supporter' | 'deo' | 'analyst' | 'user';
  mobile?: string;
  avatar?: string;
  organizationName?: string;
  tenantDbName?: string;
  assignedPcName?: string;
}

export const initialAdminUserSeeds: SeedAdminUserData[] = [
  {
    name: 'Super Admin',
    roleName: 'Platform Super Admin',
    email: 'superadmin@ranniti.com',
    password: 'SuperAdmin@123456',
    role: 'super_admin',
    mobile: '+919876543210',
    avatar: '/uploads/avatars/superadmin.png',
  },
  ...(tenantSeeds as SeedAdminUserData[]),
];

export const initialUserSeeds = initialAdminUserSeeds;
