import {
  Search,
  Bell,
  LogOut,
  Shield,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  PanelLeftOpen,
  Layers,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { logout } from '@/redux/actions/auth';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import type { BreadcrumbItem } from '../utils/breadcrumbs';

export interface TopbarProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title = 'Platform Overview',
  breadcrumbs = [],
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onOpenCommandPalette,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.myprofile);
  const auditFeed = useAppSelector((state) => state.dashboard.auditFeed);
  const importJobs = useAppSelector((state) => state.dashboard.importJobs);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Calculate active background import jobs count
  const activeJobsCount = importJobs.filter(
    (j) => j.status === 'processing' || j.status === 'pending'
  ).length;

  // Unread audit records count (capped to recent items)
  const unreadCount = auditFeed.length;

  // Click outside listener for popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all shrink-0">
      {/* LEFT SECTION: Toggles & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Sidebar Expand Toggle (Shown only when sidebar is collapsed) */}
        {isSidebarCollapsed && (
          <>
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="hidden lg:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Expand sidebar (⌘B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className="hidden lg:block h-4 w-px bg-slate-200 dark:bg-slate-800" />
          </>
        )}

        {/* Dynamic Title & Breadcrumbs */}
        <div className="text-left hidden sm:flex flex-col min-w-0">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-0.5 tracking-wide">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {b.href ? (
                    <Link
                      to={b.href}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-xs"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span
                      className={`truncate max-w-xs ${
                        i === breadcrumbs.length - 1
                          ? 'text-slate-700 dark:text-slate-300 font-semibold'
                          : ''
                      }`}
                    >
                      {b.label}
                    </span>
                  )}
                  {i < breadcrumbs.length - 1 && (
                    <ChevronRight size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* RIGHT ACTION CONTROLS */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar / Command Palette Trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpenCommandPalette}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenCommandPalette?.()}
          className="relative hidden md:flex items-center w-52 lg:w-64 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-pointer transition-all group"
        >
          <Search size={14} className="mr-2 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          <span className="truncate select-none">Quick jump or search...</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Open search palette"
        >
          <Search size={18} />
        </button>

        {/* Live Operations & Background Jobs Status Pill */}
        {activeJobsCount > 0 ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{activeJobsCount} Import Job{activeJobsCount > 1 ? 's' : ''} Active</span>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Operations</span>
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle size="sm" />

        {/* Notification Bell with Dropdown (Rule 8 Compliant with Real Redux Data) */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Activity & Audit
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30 rounded-full font-semibold">
                      {unreadCount} Recent
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 overscroll-contain">
                {auditFeed.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/70" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All systems quiet</p>
                    <p className="text-[11px] mt-0.5">No recent activity logged in this session</p>
                  </div>
                ) : (
                  auditFeed.slice(0, 8).map((record) => (
                    <div
                      key={record.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {record.action}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                          {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {record.entityType && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {record.entityType} {record.entityId ? `#${record.entityId.slice(0, 8)}` : ''}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>View Platform Activity Log</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative border-l border-slate-200/80 dark:border-slate-800/80 pl-3 sm:pl-3.5" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-all cursor-pointer p-1 rounded-xl focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-indigo-600/30 ring-1 ring-white/10 shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize">
                {user?.roleName || user?.role || 'Super Admin'}
              </p>
            </div>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-150 hidden sm:block ${
                showProfileMenu ? 'rotate-180 text-slate-700 dark:text-white' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl p-2 z-50 text-left space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
                <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 rounded-md text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 w-fit">
                  <Shield size={10} className="text-indigo-500 dark:text-indigo-400" />
                  <span>{user?.roleName || (user?.role ? `${user.role.replace('_', ' ')}` : 'Super Admin')}</span>
                </div>
              </div>

              <Link
                to={isSuperAdmin ? '/dashboard/super-admin/settings' : '/dashboard/settings'}
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <Settings size={14} className="text-slate-400" />
                <span>Account Settings</span>
              </Link>

              {isSuperAdmin && (
                <Link
                  to="/dashboard/master"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <Layers size={14} className="text-slate-400" />
                  <span>Master Intelligence</span>
                </Link>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const Header = Topbar;
export type HeaderProps = TopbarProps;
export default Topbar;
