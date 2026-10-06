import {
  Search,
  Bell,
  LogOut,
  Shield,
  ChevronDown,
  Menu,
  X,
  PanelLeftOpen,
  Layers,
  Settings,
} from 'lucide-react';
import { logout } from '@/redux/actions/auth';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export interface TopbarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title = 'Dashboard',
  breadcrumbs,
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user.myprofile);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real-time notification data
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Master Sync Completed', desc: 'Districts and AC records up to date', time: '5m ago', unread: true },
    { id: '2', title: 'New Booth User Added', desc: 'Booth agent linked to Ward 14', time: '1h ago', unread: true },
    { id: '3', title: 'Voter Import Succeeded', desc: '2,500 new voters processed', time: '3h ago', unread: false },
    { id: '4', title: 'System Security Audit Clean', desc: 'Zero anomalies detected', time: '1d ago', unread: false },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

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

  return (
    <header className="h-16 bg-white dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all shrink-0 shadow-sm dark:shadow-none">
      {/* LEFT SECTION: Toggle Buttons, Mobile Brand, Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
              className="hidden lg:flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              title="Expand sidebar (⌘B)"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={19} className="text-indigo-500 dark:text-indigo-400 hover:scale-105 transition-transform" />
            </button>
            <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
          </>
        )}

        {/* Mobile Logo Branding (shown when sidebar is hidden on small screens) */}
        {/* <div className="flex items-center gap-2 lg:hidden">
          <img src="/favicon.svg" alt="Ranniti" className="w-7 h-7 rounded-lg shadow-sm" />
          <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Ranniti</span>
        </div> */}

        {/* Title & Breadcrumbs */}
        <div className="text-left hidden sm:block truncate">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-0.5 tracking-wide">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {b.href ? (
                    <Link to={b.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-slate-600 dark:text-slate-300 font-semibold' : ''}>
                      {b.label}
                    </span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* RIGHT ACTION CONTROLS */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Toggle */}
        <button
          type="button"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Desktop Global Search Bar */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search voters, booths, masters..."
            className="w-full pl-9 pr-12 py-1.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-400 rounded font-mono shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Live Ops Status Pill (Hidden on mobile) */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 rounded-xl text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Operations</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle size="sm" />

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-600/25 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 rounded-full font-semibold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border transition-all text-left ${n.unread
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-500/50'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold ${n.unread ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-center">
                <Link
                  to="/dashboard/notice"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>View All System Notices</span>
                  <ChevronDown size={12} className="-rotate-90" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 hover:opacity-90 transition-all cursor-pointer p-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-600/30 ring-1 ring-white/10">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold capitalize mt-1">
                {user?.roleName || user?.role || 'Super Admin'}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 hidden sm:block ${showProfileMenu ? 'rotate-180 text-slate-700 dark:text-white' : ''
                }`}
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-left space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || ''}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || ''}</p>
                <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-md text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 w-fit">
                  <Shield size={11} className="text-indigo-500 dark:text-indigo-400" />
                  <span>{user?.roleName || (user?.role ? `${user.role.replace('_', ' ')} Role` : 'Super Admin Role')}</span>
                </div>
              </div>

              <Link
                to="/dashboard/settings"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <Link
                to="/dashboard/master"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <Layers size={15} className="text-slate-400" />
                <span>Master Intelligence</span>
              </Link>

              <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex items-center gap-2 md:hidden z-30 shadow-xl">
          <Search size={16} className="text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search voters, booths, masters..."
            autoFocus
            className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </header>
  );
};

export const Header = Topbar;
export type HeaderProps = TopbarProps;
export default Topbar;
