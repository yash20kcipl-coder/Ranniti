export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const MASTER_KEY_LABELS: Record<string, string> = {
  districts: 'Districts',
  talukas: 'Talukas (Tehsils)',
  villages: 'Villages',
  pcs: 'Parliamentary (PC)',
  acs: 'Assembly (AC)',
  wards: 'Wards (Prabhags)',
  booths: 'Polling Booths',
  religions: 'Religions',
  castes: 'Castes & Subcastes',
  parties: 'Political Parties',
  'bulk-test': 'Bulk Upload Test',
};

export function resolveBreadcrumbs(pathname: string): { title: string; breadcrumbs: BreadcrumbItem[] } {
  // Normalize path without trailing slash
  const path = pathname.replace(/\/+$/, '') || '/dashboard';

  // ── 1. Dashboard Root ───────────────────────────────────────────────────────
  if (path === '/dashboard') {
    return {
      title: 'Platform Overview',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Overview' },
      ],
    };
  }

  // ── 2. Voter Management ─────────────────────────────────────────────────────
  if (path === '/dashboard/voters') {
    return {
      title: 'Voter Directory',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Voters', href: '/dashboard/voters' },
        { label: 'Directory' },
      ],
    };
  }
  if (path === '/dashboard/voters/new' || path === '/dashboard/super-admin/voters/new') {
    return {
      title: 'Register Voter',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Voters', href: '/dashboard/voters' },
        { label: 'New Voter' },
      ],
    };
  }
  if (path.match(/\/dashboard\/(super-admin\/)?voters\/[^/]+\/edit/)) {
    return {
      title: 'Edit Voter Profile',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Voters', href: '/dashboard/voters' },
        { label: 'Edit' },
      ],
    };
  }
  if (path.match(/\/dashboard\/(super-admin\/)?voters\/[^/]+/)) {
    return {
      title: 'Voter Profile',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Voters', href: '/dashboard/voters' },
        { label: 'Details' },
      ],
    };
  }

  // ── 3. Volunteers (Campaign Team) ──────────────────────────────────────────
  if (path.startsWith('/dashboard/volunteers')) {
    return {
      title: 'Volunteers Directory',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Campaign Team', href: '/dashboard/volunteers' },
        { label: 'Volunteers' },
      ],
    };
  }

  // ── 4. Multi-Tenant Accounts ────────────────────────────────────────────────
  if (path === '/dashboard/tenants') {
    return {
      title: 'Tenant Accounts',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Multi-Tenant', href: '/dashboard/tenants' },
        { label: 'All Accounts' },
      ],
    };
  }
  if (path === '/dashboard/tenants/new') {
    return {
      title: 'Provision Tenant',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Multi-Tenant', href: '/dashboard/tenants' },
        { label: 'Provision New' },
      ],
    };
  }
  if (path.match(/\/dashboard\/tenants\/[^/]+/)) {
    return {
      title: 'Tenant Account Details',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Multi-Tenant', href: '/dashboard/tenants' },
        { label: 'Account Overview' },
      ],
    };
  }

  // ── 5. Roles & Access Control ───────────────────────────────────────────────
  if (path.startsWith('/dashboard/roles')) {
    return {
      title: 'Role Packages',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Access Control', href: '/dashboard/roles' },
        { label: 'Roles' },
      ],
    };
  }

  // ── 6. Master Data (Super Admin) ───────────────────────────────────────────
  if (path.startsWith('/dashboard/master')) {
    const segments = path.split('/');
    const tabKey = segments[3] || 'religions';
    const tabLabel = MASTER_KEY_LABELS[tabKey] || tabKey.charAt(0).toUpperCase() + tabKey.slice(1);

    return {
      title: `Master: ${tabLabel}`,
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Master Data', href: `/dashboard/master/${tabKey}` },
        { label: tabLabel },
      ],
    };
  }

  // ── 7. Tenant Master Data ──────────────────────────────────────────────────
  if (path.startsWith('/dashboard/tenant-master')) {
    const segments = path.split('/');
    const tabKey = segments[3] || 'acs';
    const tabLabel = MASTER_KEY_LABELS[tabKey] || tabKey.charAt(0).toUpperCase() + tabKey.slice(1);

    return {
      title: `Campaign Master: ${tabLabel}`,
      breadcrumbs: [
        { label: 'Campaign', href: '/dashboard' },
        { label: 'Master Data', href: `/dashboard/tenant-master/${tabKey}` },
        { label: tabLabel },
      ],
    };
  }

  // ── 8. Settings ─────────────────────────────────────────────────────────────
  if (path.startsWith('/dashboard/super-admin/settings')) {
    return {
      title: 'Platform System Settings',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Administration', href: '/dashboard/super-admin/settings' },
        { label: 'System Settings' },
      ],
    };
  }
  if (path.startsWith('/dashboard/settings')) {
    return {
      title: 'Account Settings',
      breadcrumbs: [
        { label: 'Platform', href: '/dashboard' },
        { label: 'Preferences', href: '/dashboard/settings' },
        { label: 'Settings' },
      ],
    };
  }

  // Default fallback
  const lastSegment = path.split('/').pop() || 'Dashboard';
  const formattedTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');

  return {
    title: formattedTitle,
    breadcrumbs: [
      { label: 'Platform', href: '/dashboard' },
      { label: formattedTitle },
    ],
  };
}
