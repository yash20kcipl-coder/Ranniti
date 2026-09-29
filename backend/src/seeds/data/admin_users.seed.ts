export interface SeedAdminUserData {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'leader' | 'sub_leader' | 'deo' | 'analyst' | 'user';
  mobile?: string;
  avatar?: string;
}

export const initialAdminUserSeeds: SeedAdminUserData[] = [
  {
    name: 'Ranniti System Super Admin',
    email: 'superadmin@ranniti.com',
    password: 'SuperAdmin@123456',
    role: 'super_admin',
    mobile: '+919876543210',
    avatar: '/uploads/avatars/superadmin.png',
  },
  {
    name: 'War Room Administrator',
    email: 'admin@ranniti.com',
    password: 'Admin@123456',
    role: 'admin',
    mobile: '+919876543211',
    avatar: '/uploads/avatars/admin.png',
  },
  {
    name: 'Yash Sharma (Chief Campaign Strategist)',
    email: 'yash@ranniti.com',
    password: 'Admin@123456',
    role: 'admin',
    mobile: '+919876543212',
    avatar: '/uploads/avatars/yash.png',
  },
  {
    name: 'Rajesh Patil (Assembly Campaign Leader)',
    email: 'leader@ranniti.com',
    password: 'Leader@123456',
    role: 'leader',
    mobile: '+919876543213',
    avatar: '/uploads/avatars/leader.png',
  },
  {
    name: 'Suresh Kadam (Booth Coordinator)',
    email: 'member@ranniti.com',
    password: 'User@123456',
    role: 'sub_leader',
    mobile: '+919876543214',
    avatar: '/uploads/avatars/member.png',
  },
];

export const initialUserSeeds = initialAdminUserSeeds; // Alias for backward compatibility


