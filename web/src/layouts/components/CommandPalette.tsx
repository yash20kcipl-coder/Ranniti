import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Vote,
  UserCheck,
  Users,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  MapPin,
  Building,
  Home,
  Landmark,
  Building2,
  Layers,
  HeartHandshake,
  Flag,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMasterTab } from '@/redux/actions/masterSuperAdmin';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Quick Actions' | 'Master Intelligence';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.myprofile);
  const isSuperAdmin = user?.role === 'super_admin';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const commands: CommandItem[] = [
    // ── Navigation ────────────────────────────────────────────────────────
    {
      id: 'nav-dashboard',
      title: 'Platform Dashboard',
      subtitle: 'Metrics, recent activity & infrastructure overview',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'overview', 'stats', 'analytics', 'kpi'],
    },
    {
      id: 'nav-voters',
      title: 'Voter Directory',
      subtitle: 'Search, filter and manage electoral voter lists',
      category: 'Navigation',
      icon: Vote,
      action: () => navigate('/dashboard/voters'),
      keywords: ['voter', 'elector', 'booth', 'epic', 'search'],
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'nav-tenants',
            title: 'Tenant Accounts',
            subtitle: 'Multi-tenant political client instances',
            category: 'Navigation' as const,
            icon: Users,
            action: () => navigate('/dashboard/tenants'),
            keywords: ['clients', 'tenants', 'organizations', 'campaigns'],
          },
        ]
      : [
          {
            id: 'nav-volunteers',
            title: 'Campaign Volunteers',
            subtitle: 'Field agents, booth karyakartas and team',
            category: 'Navigation' as const,
            icon: UserCheck,
            action: () => navigate('/dashboard/volunteers'),
            keywords: ['volunteers', 'workers', 'agents', 'field'],
          },
        ]),
    {
      id: 'nav-settings',
      title: 'Settings & Preferences',
      subtitle: isSuperAdmin ? 'Platform configurations and audit' : 'Account and campaign settings',
      category: 'Navigation',
      icon: Settings,
      action: () => navigate(isSuperAdmin ? '/dashboard/super-admin/settings' : '/dashboard/settings'),
      keywords: ['config', 'password', 'theme', 'profile', 'security'],
    },

    // ── Quick Actions ─────────────────────────────────────────────────────
    {
      id: 'act-new-voter',
      title: 'Register New Voter',
      subtitle: 'Add a new verified voter profile to the directory',
      category: 'Quick Actions',
      icon: PlusCircle,
      action: () => navigate('/dashboard/voters/new'),
      keywords: ['add voter', 'create voter', 'new profile'],
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'act-new-tenant',
            title: 'Provision New Tenant',
            subtitle: 'Create a new multi-tenant campaign workspace',
            category: 'Quick Actions' as const,
            icon: PlusCircle,
            action: () => navigate('/dashboard/tenants/new'),
            keywords: ['create tenant', 'onboard client', 'new workspace'],
          },
        ]
      : []),
    {
      id: 'act-toggle-theme',
      title: 'Toggle Light / Dark Mode',
      subtitle: 'Switch application color appearance',
      category: 'Quick Actions',
      icon: document.documentElement.classList.contains('dark') ? Sun : Moon,
      action: toggleTheme,
      keywords: ['dark mode', 'light mode', 'theme', 'appearance'],
    },

    // ── Master Intelligence (Super Admin or Tenant Master) ────────────────
    ...(isSuperAdmin
      ? [
          {
            id: 'master-districts',
            title: 'Master Districts',
            subtitle: 'Administrative district boundaries',
            category: 'Master Intelligence' as const,
            icon: MapPin,
            action: () => {
              dispatch(setMasterTab('districts'));
              navigate('/dashboard/master/districts');
            },
            keywords: ['geography', 'districts', 'region'],
          },
          {
            id: 'master-talukas',
            title: 'Master Talukas (Tehsils)',
            subtitle: 'Tehsil and block level divisions',
            category: 'Master Intelligence' as const,
            icon: Building,
            action: () => {
              dispatch(setMasterTab('talukas'));
              navigate('/dashboard/master/talukas');
            },
            keywords: ['taluka', 'tehsil', 'block'],
          },
          {
            id: 'master-villages',
            title: 'Master Villages',
            subtitle: 'Rural and local village demarcations',
            category: 'Master Intelligence' as const,
            icon: Home,
            action: () => {
              dispatch(setMasterTab('villages'));
              navigate('/dashboard/master/villages');
            },
            keywords: ['village', 'gram', 'settlement'],
          },
          {
            id: 'master-pcs',
            title: 'Parliamentary Constituencies (PC)',
            subtitle: 'Lok Sabha election divisions',
            category: 'Master Intelligence' as const,
            icon: Landmark,
            action: () => {
              dispatch(setMasterTab('pcs'));
              navigate('/dashboard/master/pcs');
            },
            keywords: ['pc', 'parliamentary', 'lok sabha', 'mp'],
          },
          {
            id: 'master-acs',
            title: 'Assembly Constituencies (AC)',
            subtitle: 'Vidhan Sabha election divisions',
            category: 'Master Intelligence' as const,
            icon: Building2,
            action: () => {
              dispatch(setMasterTab('acs'));
              navigate('/dashboard/master/acs');
            },
            keywords: ['ac', 'assembly', 'vidhan sabha', 'mla'],
          },
          {
            id: 'master-wards',
            title: 'Wards & Prabhags',
            subtitle: 'Municipal and municipal council wards',
            category: 'Master Intelligence' as const,
            icon: Layers,
            action: () => {
              dispatch(setMasterTab('wards'));
              navigate('/dashboard/master/wards');
            },
            keywords: ['ward', 'prabhag', 'corporation'],
          },
          {
            id: 'master-booths',
            title: 'Polling Booths',
            subtitle: 'Booth centers and physical polling stations',
            category: 'Master Intelligence' as const,
            icon: Vote,
            action: () => {
              dispatch(setMasterTab('booths'));
              navigate('/dashboard/master/booths');
            },
            keywords: ['booth', 'polling station', 'karyakarta'],
          },
          {
            id: 'master-religions',
            title: 'Religions Demographics',
            subtitle: 'Master religion demographic definitions',
            category: 'Master Intelligence' as const,
            icon: HeartHandshake,
            action: () => {
              dispatch(setMasterTab('religions'));
              navigate('/dashboard/master/religions');
            },
            keywords: ['religion', 'faith', 'demographics'],
          },
          {
            id: 'master-castes',
            title: 'Castes & Subcastes',
            subtitle: 'Social caste structure classifications',
            category: 'Master Intelligence' as const,
            icon: Users,
            action: () => {
              dispatch(setMasterTab('castes'));
              navigate('/dashboard/master/castes');
            },
            keywords: ['caste', 'subcaste', 'community'],
          },
          {
            id: 'master-parties',
            title: 'Political Parties',
            subtitle: 'Recognized political party entities & symbols',
            category: 'Master Intelligence' as const,
            icon: Flag,
            action: () => {
              dispatch(setMasterTab('parties'));
              navigate('/dashboard/master/parties');
            },
            keywords: ['party', 'parties', 'bjp', 'inc', 'symbol'],
          },
        ]
      : [
          {
            id: 'tenant-master-acs',
            title: 'Assembly Constituencies (AC)',
            subtitle: 'Assigned Vidhan Sabha boundaries',
            category: 'Master Intelligence' as const,
            icon: Building2,
            action: () => navigate('/dashboard/tenant-master/acs'),
            keywords: ['ac', 'assembly', 'vidhan sabha'],
          },
          {
            id: 'tenant-master-wards',
            title: 'Wards & Prabhags',
            subtitle: 'Assigned municipal ward sectors',
            category: 'Master Intelligence' as const,
            icon: Layers,
            action: () => navigate('/dashboard/tenant-master/wards'),
            keywords: ['ward', 'prabhag'],
          },
          {
            id: 'tenant-master-booths',
            title: 'Polling Booths',
            subtitle: 'Assigned voting booth stations',
            category: 'Master Intelligence' as const,
            icon: Vote,
            action: () => navigate('/dashboard/tenant-master/booths'),
            keywords: ['booth', 'polling station'],
          },
        ]),
  ];

  // Filter commands by search term
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const cleanQuery = query.toLowerCase().trim();
    const titleMatch = cmd.title.toLowerCase().includes(cleanQuery);
    const subtitleMatch = cmd.subtitle?.toLowerCase().includes(cleanQuery);
    const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(cleanQuery));
    return titleMatch || subtitleMatch || keywordMatch;
  });

  // Clamp selection index
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search pages, booths, actions..."
            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md shadow-xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Command List Results */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2 space-y-1 overscroll-contain"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Command size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No commands found for "{query}"</p>
              <p className="text-[11px] mt-0.5 text-slate-400">Try searching for "voters", "booths", or "dashboard"</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-slate-900 dark:text-white border border-indigo-200/70 dark:border-indigo-500/30 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {cmd.title}
                      </p>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                      {cmd.category}
                    </span>
                    {isSelected && (
                      <ArrowRight size={13} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span>Ranniti Command Center</span>
        </div>
      </div>
    </div>
  );
};
