export type AdminTab = 'dashboard' | 'student' | 'staff' | 'fee' | 'academic' | 'schedule' | 'notice' | 'event' | 'settings';

export interface RouteConfig {
  id: AdminTab;
  label: string;
  path: string;
}

export const ADMIN_ROUTES: RouteConfig[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'student', label: 'Students', path: '/dashboard/student' },
  { id: 'staff', label: 'Staff Management', path: '/dashboard/staff' },
  { id: 'fee', label: 'Fee Management', path: '/dashboard/fee' },
  { id: 'academic', label: 'Academics', path: '/dashboard/academic' },
  { id: 'schedule', label: 'Schedule', path: '/dashboard/schedule' },
  { id: 'notice', label: 'Notices', path: '/dashboard/notice' },
  { id: 'event', label: 'Events', path: '/dashboard/events' },
  { id: 'settings', label: 'Settings', path: '/dashboard/settings' },
];
