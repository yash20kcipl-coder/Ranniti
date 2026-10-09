import {
  LayoutDashboard,
  Database,
  Users,
  UserCheck,
  Settings,
  Vote,
  MapPin,
  Map,
  Building,
  Home,
  Landmark,
  Building2,
  Layers,
  HeartHandshake,
  Flag,
  LogOut,
  X,
  PanelLeftClose,
  FlaskConical,
  Shield,
} from 'lucide-react';
import React from 'react';
import { NavPill } from './NavPill';
import { logout } from '@/redux/actions/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMasterTab } from '@/redux/actions/masterSuperAdmin';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isMaster?: boolean;
  isTenantMaster?: boolean;
  section: 'operations' | 'administration' | 'system';
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'operations' },
  { path: '/dashboard/voters', label: 'Voter Directory', icon: Vote, section: 'operations' },
  { path: '/dashboard/volunteers', label: 'Volunteers', icon: UserCheck, section: 'operations' },
  { path: '/dashboard/tenants', label: 'Tenant Accounts', icon: Users, section: 'operations' },
  { path: '/dashboard/master', label: 'Master Data', icon: Database, isMaster: true, section: 'administration' },
  { path: '/dashboard/tenant-master', label: 'Master Data', icon: Database, isTenantMaster: true, section: 'administration' },
  { path: '/dashboard/roles', label: 'Role Packages', icon: Shield, section: 'administration' },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings, section: 'system' },
];

export const masterSections = [
  {
    title: 'Geography & Divisions',
    icon: MapPin,
    items: [
      { key: 'districts', label: 'Districts', icon: Map },
      { key: 'talukas', label: 'Talukas (Tehsils)', icon: Building },
      { key: 'villages', label: 'Villages', icon: Home },
      { key: 'pcs', label: 'Parliamentary (PC)', icon: Landmark },
      { key: 'acs', label: 'Assembly (AC)', icon: Building2 },
      { key: 'wards', label: 'Wards (Prabhags)', icon: Layers },
      { key: 'booths', label: 'Polling Booths', icon: Vote },
    ],
  },
  {
    title: 'Demographics',
    icon: Users,
    items: [
      { key: 'religions', label: 'Religions', icon: HeartHandshake },
      { key: 'castes', label: 'Castes & Subcastes', icon: UserCheck },
    ],
  },
  {
    title: 'Political & Entities',
    icon: Flag,
    items: [
      { key: 'parties', label: 'Political Parties', icon: Flag },
    ],
  },
  {
    title: 'Testing & Tools',
    icon: FlaskConical,
    items: [
      { key: 'bulk-test', label: 'Bulk Upload Test Run', icon: FlaskConical },
    ],
  },
];

export const tenantMasterSections = [
  {
    title: 'Geography & Divisions',
    icon: MapPin,
    items: [
      { key: 'acs', label: 'Assembly (AC)', icon: Building2 },
      { key: 'wards', label: 'Wards (Prabhags)', icon: Layers },
      { key: 'booths', label: 'Polling Booths', icon: Vote },
    ],
  },
];

export interface SidebarProps {
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.user.myprofile);
  const masterState = useAppSelector((state) => state.master as any);
  const activeTabKey = masterState?.activeTab || 'religions';

  const isMasterPath = location.pathname.startsWith('/dashboard/master');
  const isTenantMasterPath = location.pathname.startsWith('/dashboard/tenant-master');

  const totalMasterCount = masterSections.reduce((acc, sec) => acc + sec.items.length, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={onCloseMobileSidebar}
          onKeyDown={(e) => e.key === 'Escape' && onCloseMobileSidebar()}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-20 h-screen lg:h-full shrink-0
          bg-white/95 dark:bg-slate-900/95
          backdrop-blur-xl
          border-r border-slate-200/80 dark:border-slate-800/80
          flex flex-col justify-between
          transition-[width,transform] duration-200 ease-in-out
          shadow-xl lg:shadow-none ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-18 w-72' : 'lg:w-68 w-72'
        }`}
      >
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {/* LOGO & BRAND HEADER */}
          <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0">
            {/* Expanded State (or Mobile Drawer) */}
            <div className={`items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'hidden lg:hidden' : 'flex'}`}>
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 p-1.5 flex items-center justify-center shadow-xs shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
                  <img
                    src="/favicon.svg"
                    alt="Ranniti"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                    Ranniti
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/30 rounded-md">
                      HQ
                    </span>
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
                    Electoral Operations
                  </span>
                </div>
              </Link>
            </div>

            {/* Collapsed Desktop State: Brand Mark Icon */}
            {isSidebarCollapsed && (
              <div className="hidden lg:flex w-full items-center justify-center">
                <button
                  type="button"
                  onClick={onToggleSidebarCollapse}
                  title="Expand Sidebar (⌘B)"
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 p-2 flex items-center justify-center shadow-xs shadow-indigo-600/30 hover:scale-105 transition-all cursor-pointer group"
                >
                  <img
                    src="/favicon.svg"
                    alt="Ranniti Icon"
                    className="w-full h-full object-contain"
                  />
                </button>
              </div>
            )}

            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={19} />
            </button>

            {/* Desktop Collapse Icon (When Expanded) */}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                title="Collapse Sidebar (⌘B)"
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeftClose size={17} />
              </button>
            )}
          </div>

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-4 no-scrollbar">
            {/* GROUP 1: OPERATIONS */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Operations
                </div>
              )}
              {navItems
                .filter((item) => {
                  if (item.section !== 'operations') return false;
                  if (item.path === '/dashboard/tenants') return isSuperAdmin;
                  if (item.path === '/dashboard/volunteers') return !isSuperAdmin;
                  return true;
                })
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/dashboard'
                      ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                  return (
                    <NavPill
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobileSidebar}
                      label={item.label}
                      icon={Icon}
                      isActive={isActive}
                      isCollapsed={isSidebarCollapsed}
                    />
                  );
                })}
            </div>

            {/* GROUP 2: ADMINISTRATION */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Administration
                </div>
              )}
              {navItems
                .filter((item) => {
                  if (item.section !== 'administration') return false;
                  if (item.path === '/dashboard/roles') return isSuperAdmin;
                  if (item.isMaster) return isSuperAdmin;
                  if (item.isTenantMaster) {
                    if (isSuperAdmin) return false;
                    const allowed = (user as any)?.allowedMasterSubTabs as string[] | undefined;
                    return !allowed || allowed.length > 0;
                  }
                  return true;
                })
                .map((item) => {
                  const Icon = item.icon;

                  /* ── SUPER ADMIN MASTER ACCORDION ─────────────────────── */
                  if (item.isMaster) {
                    const isActive = isMasterPath;
                    return (
                      <NavPill
                        key={item.path}
                        label={item.label}
                        icon={Icon}
                        isActive={isActive}
                        isCollapsed={isSidebarCollapsed}
                        badge={totalMasterCount}
                        onClick={() => {
                          if (isSidebarCollapsed) {
                            navigate(`/dashboard/master/${activeTabKey}`);
                          } else if (!isMasterPath) {
                            navigate(`/dashboard/master/${activeTabKey}`);
                          }
                        }}
                      >
                        <div className="space-y-3 py-1 text-left">
                          {masterSections.map((section) => {
                            const SectionIcon = section.icon;
                            return (
                              <div key={section.title} className="space-y-1">
                                <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400/90 flex items-center gap-1.5">
                                  <SectionIcon size={10} className="text-indigo-500 dark:text-indigo-400" />
                                  <span>{section.title}</span>
                                </div>
                                <div className="space-y-0.5">
                                  {section.items.map((sub) => {
                                    const subPath = `/dashboard/master/${sub.key}`;
                                    const isSubActive =
                                      location.pathname === subPath || (isMasterPath && activeTabKey === sub.key);
                                    return (
                                      <NavPill
                                        key={sub.key}
                                        variant="sub-pill"
                                        to={subPath}
                                        onClick={() => {
                                          dispatch(setMasterTab(sub.key));
                                          onCloseMobileSidebar();
                                        }}
                                        label={sub.label}
                                        icon={sub.icon}
                                        isActive={isSubActive}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </NavPill>
                    );
                  }

                  /* ── TENANT MASTER ACCORDION ─────────────────────────── */
                  if (item.isTenantMaster) {
                    const userAllowedSubTabs = ((user as any)?.allowedMasterSubTabs as string[] | undefined) ?? [
                      'acs',
                      'wards',
                      'booths',
                    ];
                    const availableItems = tenantMasterSections
                      .map((sec) => ({
                        ...sec,
                        items: sec.items.filter((sub) => userAllowedSubTabs.includes(sub.key)),
                      }))
                      .filter((sec) => sec.items.length > 0);

                    const totalTenantSubCount = availableItems.reduce(
                      (acc, sec) => acc + sec.items.length,
                      0
                    );
                    const firstAllowedTab = availableItems[0]?.items[0]?.key || 'acs';
                    const isActive = isTenantMasterPath;

                    return (
                      <NavPill
                        key={item.path}
                        label={item.label}
                        icon={Icon}
                        isActive={isActive}
                        isCollapsed={isSidebarCollapsed}
                        badge={totalTenantSubCount}
                        onClick={() => {
                          if (isSidebarCollapsed) {
                            navigate(`/dashboard/tenant-master/${firstAllowedTab}`);
                          } else if (!isTenantMasterPath) {
                            navigate(`/dashboard/tenant-master/${firstAllowedTab}`);
                          }
                        }}
                      >
                        <div className="space-y-3 py-1 text-left">
                          {availableItems.map((section) => {
                            const SectionIcon = section.icon;
                            return (
                              <div key={section.title} className="space-y-1">
                                <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400/90 flex items-center gap-1.5">
                                  <SectionIcon size={10} className="text-indigo-500 dark:text-indigo-400" />
                                  <span>{section.title}</span>
                                </div>
                                <div className="space-y-0.5">
                                  {section.items.map((sub) => {
                                    const subPath = `/dashboard/tenant-master/${sub.key}`;
                                    const isSubActive =
                                      location.pathname === subPath ||
                                      (location.pathname === '/dashboard/tenant-master' && firstAllowedTab === sub.key);
                                    return (
                                      <NavPill
                                        key={sub.key}
                                        variant="sub-pill"
                                        to={subPath}
                                        onClick={onCloseMobileSidebar}
                                        label={sub.label}
                                        icon={sub.icon}
                                        isActive={isSubActive}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </NavPill>
                    );
                  }

                  /* Standard Admin Item (e.g. Roles) */
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavPill
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobileSidebar}
                      label={item.label}
                      icon={Icon}
                      isActive={isActive}
                      isCollapsed={isSidebarCollapsed}
                    />
                  );
                })}
            </div>

            {/* GROUP 3: SYSTEM */}
            <div className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  System
                </div>
              )}
              {navItems
                .filter((item) => item.section === 'system')
                .map((item) => {
                  const targetPath = item.path === '/dashboard/settings' && isSuperAdmin
                    ? '/dashboard/super-admin/settings'
                    : item.path;
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(targetPath);

                  return (
                    <NavPill
                      key={item.path}
                      to={targetPath}
                      onClick={onCloseMobileSidebar}
                      label={item.label}
                      icon={Icon}
                      isActive={isActive}
                      isCollapsed={isSidebarCollapsed}
                    />
                  );
                })}
            </div>
          </nav>

          {/* USER PROFILE FOOTER */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  title={`${user?.name || ''} (${user?.email || ''})`}
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-indigo-600/30 ring-1 ring-white/20"
                >
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 text-left">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-indigo-600/20 ring-1 ring-white/10">
                      {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
