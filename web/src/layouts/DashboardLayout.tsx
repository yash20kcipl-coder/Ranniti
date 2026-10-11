import { useAppDispatch } from '@/redux/hooks';
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { resolveBreadcrumbs } from './utils/breadcrumbs';
import { Sidebar, Topbar, CommandPalette } from './components';
import { checkAndSyncTenantDatasets } from '@/redux/actions/syncActions';
import { BackgroundImportWidget } from '@/components/common/BackgroundImportWidget';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';

export const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ranniti_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Sync manifest check on layout mount
  useDebouncedEffect(() => {
    dispatch(checkAndSyncTenantDatasets());
  }, 200, [dispatch]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Save desktop sidebar collapsed preference
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ranniti_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcuts: ⌘B (sidebar toggle) & ⌘K (command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: ⌘B or Ctrl+B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
      // Open command palette: ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamically resolve high-contrast breadcrumb trail & title
  const { title, breadcrumbs } = resolveBreadcrumbs(location.pathname);

  return (
    <div className="h-screen w-full bg-[#eef4fa] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex overflow-hidden antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 font-slab">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* SIDEBAR */}
      <Sidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={toggleSidebarCollapse}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <Topbar
          title={title}
          breadcrumbs={breadcrumbs}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* SCROLLABLE MAIN CANVAS */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 outline-none bg-[#F4F6F9] dark:bg-[#0a0f1d]"
        >
          <div key={location.pathname} className="mx-auto w-full animate-tab-fade">
            <Outlet />
          </div>
        </main>

        {/* GLOBAL BACKGROUND IMPORT MONITOR WIDGET */}
        <BackgroundImportWidget />

        {/* ⌘K COMMAND PALETTE MODAL */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
