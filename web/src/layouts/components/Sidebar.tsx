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
} from 'lucide-react';
import React, { } from 'react';
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
}

export const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/voters', label: 'Voter Directory', icon: Vote },
  { path: '/dashboard/volunteers', label: 'Volunteers', icon: UserCheck },
  { path: '/dashboard/tenants', label: 'Tenant Accounts', icon: Users },
  { path: '/dashboard/master', label: 'Master Data', icon: Database, isMaster: true },
  { path: '/dashboard/tenant-master', label: 'Master Data', icon: Database, isTenantMaster: true },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-20 h-screen lg:h-full shrink-0
          bg-slate-100 dark:bg-slate-900/98
          backdrop-blur-xl
          border-r border-slate-200 dark:border-slate-800/80
          flex flex-col justify-between
          transition-[width,transform] duration-300 ease-in-out
          shadow-lg lg:shadow-none dark:shadow-2xl ${
          /* Mobile Drawer Translation */
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${
          /* Desktop Width */
          isSidebarCollapsed ? 'lg:w-20 w-72' : 'lg:w-68 w-72'
          }`}
      >
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {/* LOGO & BRAND HEADER */}
          <div className="h-16 border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0">
            {/* Expanded State (or Mobile Drawer): Show Full ranniti-logo.png */}
            <div className={`items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'hidden lg:hidden' : 'flex'}`}>
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                {/* Logo pill: gradient bg in light mode for visibility, transparent in dark */}
                <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 dark:bg-none dark:from-transparent dark:to-transparent dark:bg-transparent transition-all duration-200">
                  <img
                    src="/ranniti-logo.png"
                    alt="Ranniti"
                    className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </div>
              </Link>
            </div>

            {/* Collapsed Desktop State: Show Square favicon.svg Icon */}
            {isSidebarCollapsed && (
              <div className="hidden lg:flex w-full items-center justify-center">
                <button
                  type="button"
                  onClick={onToggleSidebarCollapse}
                  title="Expand Sidebar (⌘B)"
                  className="w-10 h-10 rounded-xl p-1 bg-gradient-to-tr from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 shadow-md shadow-indigo-600/20 flex items-center justify-center hover:scale-105 transition-all cursor-pointer group"
                >
                  <img
                    src="/favicon.svg"
                    alt="Ranniti Icon"
                    className="w-7 h-7 rounded-lg group-hover:rotate-6 transition-transform"
                  />
                </button>
              </div>
            )}

            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              onClick={onCloseMobileSidebar}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

            {/* Desktop Collapse Icon in Header (When Expanded) */}
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={onToggleSidebarCollapse}
                title="Collapse Sidebar (⌘B)"
                className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/70 rounded-lg transition-colors cursor-pointer"
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>

          {/* SIDEBAR NAVIGATION ITEMS */}
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-4 space-y-1.5 no-scrollbar">
            {navItems
              .filter((item) => {
                const role = user?.role || '';
                const isSuperAdmin = role === 'super_admin';

                if (item.path === '/dashboard/tenants') return isSuperAdmin;
                if (item.path === '/dashboard/volunteers') return !isSuperAdmin; // Tenant admin only
                if (item.isMaster) return isSuperAdmin;       // Super admin: full master data
                if (item.isTenantMaster) {                    // Tenant: role-scoped master data
                  if (isSuperAdmin) return false;
                  const allowed = (user as any)?.allowedMasterSubTabs as string[] | undefined;
                  return !allowed || allowed.length > 0;
                }
                return true;                                  // Dashboard, Voters, Settings — everyone
              })
              .map((item) => {
                const role = user?.role || '';
                const isSuperAdmin = role === 'super_admin';
                // Super admin goes to /super-admin/settings; tenant goes to /settings/*
                const targetPath = item.path === '/dashboard/settings' && isSuperAdmin
                  ? '/dashboard/super-admin/settings'
                  : item.path;

                const Icon = item.icon;
                const isMasterItem = item.isMaster;
                const isTenantMasterItem = item.isTenantMaster;
                const isActive = isMasterItem
                  ? isMasterPath
                  : isTenantMasterItem
                    ? location.pathname.startsWith('/dashboard/tenant-master')
                    : location.pathname === targetPath || location.pathname.startsWith(targetPath + '/');

                /* MASTER DATA ACCORDION ITEM */
                if (isMasterItem) {
                  return (
                    <div key={item.path} className="space-y-1">
                      {/* Collapsed desktop button with flyout / tooltip */}
                      {isSidebarCollapsed ? (
                        <div className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              onToggleSidebarCollapse();
                              navigate(`/dashboard/master/${activeTabKey}`);
                            }}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer ${isActive
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20'
                              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                              }`}
                          >
                            <Icon size={20} />
                          </button>

                          {/* Hover Tooltip in collapsed mode */}
                          <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <span>Master Data</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                              8
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Expanded master data header */
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isMasterPath) {
                                navigate(`/dashboard/master/${activeTabKey}`);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                                  }`}
                              >
                                8
                              </span>
                            </div>
                          </button>

                          {/* MASTER SUB-SECTIONS (Always Open) */}
                          <div className="ml-3 pl-3 border-l-2 border-indigo-500/30 space-y-3 py-2 animate-in fade-in duration-200">
                            {masterSections.map((section) => {
                              const SectionIcon = section.icon;
                              return (
                                <div key={section.title} className="space-y-1 text-left">
                                  <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400/80 flex items-center gap-1.5">
                                    <SectionIcon size={11} className="text-indigo-500 dark:text-indigo-400" />
                                    <span>{section.title}</span>
                                  </div>
                                  {section.items.map((sub) => {
                                    const SubIcon = sub.icon;
                                    const subPath = `/dashboard/master/${sub.key}`;
                                    const isSubActive =
                                      location.pathname === subPath || (isMasterPath && activeTabKey === sub.key);
                                    return (
                                      <Link
                                        key={sub.key}
                                        to={subPath}
                                        onClick={() => {
                                          dispatch(setMasterTab(sub.key));
                                          onCloseMobileSidebar();
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left cursor-pointer ${isSubActive
                                          ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 font-semibold border border-indigo-300 dark:border-indigo-500/40 shadow-xs'
                                          : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                                          }`}
                                      >
                                        <SubIcon
                                          size={13}
                                          className={isSubActive ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}
                                        />
                                        <span className="truncate">{sub.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                /* TENANT MASTER DATA ACCORDION ITEM */
                if (isTenantMasterItem) {
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

                  const totalTenantSubItemsCount = availableItems.reduce(
                    (acc, sec) => acc + sec.items.length,
                    0
                  );
                  const firstAllowedTab = availableItems[0]?.items[0]?.key || 'acs';

                  return (
                    <div key={item.path} className="space-y-1">
                      {/* Collapsed desktop button with flyout / tooltip */}
                      {isSidebarCollapsed ? (
                        <div className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              onToggleSidebarCollapse();
                              navigate(`/dashboard/tenant-master/${firstAllowedTab}`);
                            }}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer ${isActive
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20'
                              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                              }`}
                          >
                            <Icon size={20} />
                          </button>

                          {/* Hover Tooltip in collapsed mode */}
                          <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <span>Master Data</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                              {totalTenantSubItemsCount}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Expanded master data header */
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isTenantMasterPath) {
                                navigate(`/dashboard/tenant-master/${firstAllowedTab}`);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                              : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                                  }`}
                              >
                                {totalTenantSubItemsCount}
                              </span>
                            </div>
                          </button>

                          {/* TENANT MASTER SUB-SECTIONS (Always Open) */}
                          <div className="ml-3 pl-3 border-l-2 border-indigo-500/30 space-y-3 py-2 animate-in fade-in duration-200">
                            {availableItems.map((section) => {
                              const SectionIcon = section.icon;
                              return (
                                <div key={section.title} className="space-y-1 text-left">
                                  <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400/80 flex items-center gap-1.5">
                                    <SectionIcon size={11} className="text-indigo-500 dark:text-indigo-400" />
                                    <span>{section.title}</span>
                                  </div>
                                  {section.items.map((sub) => {
                                    const SubIcon = sub.icon;
                                    const subPath = `/dashboard/tenant-master/${sub.key}`;
                                    const isSubActive =
                                      location.pathname === subPath ||
                                      (location.pathname === '/dashboard/tenant-master' && firstAllowedTab === sub.key);
                                    return (
                                      <Link
                                        key={sub.key}
                                        to={subPath}
                                        onClick={onCloseMobileSidebar}
                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left cursor-pointer ${isSubActive
                                          ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 font-semibold border border-indigo-300 dark:border-indigo-500/40 shadow-xs'
                                          : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                                          }`}
                                      >
                                        <SubIcon
                                          size={13}
                                          className={isSubActive ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}
                                        />
                                        <span className="truncate">{sub.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                /* STANDARD NAV ITEM */
                return (
                  <div key={item.path} className="relative group flex justify-center">
                    <Link
                      to={targetPath}
                      onClick={onCloseMobileSidebar}
                      className={`flex items-center rounded-xl text-xs font-semibold transition-all w-full cursor-pointer ${isSidebarCollapsed
                        ? 'lg:w-12 lg:h-12 lg:justify-center px-3.5 py-2.5'
                        : 'px-3.5 py-2.5 gap-3'
                        } ${isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-white/10'
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white'} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>

                    {/* Hover Tooltip in collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <span>{item.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </nav>

          {/* USER FOOTER */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-200/50 dark:bg-slate-900/60 shrink-0">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  title={`${user?.name || ''} (${user?.email || ''})`}
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-600/30 ring-1 ring-white/20"
                >
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 text-left">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-600/20 ring-1 ring-white/10 shrink-0">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {user?.name || ''}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={17} />
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
