/**
 * Centralized API Endpoint Definitions for Ranniti Platform
 * Tiered Security Architecture:
 * - Super Admin (/super-admin/*)
 * - Tenant (/tenant/*)
 * - Volunteer (/volunteer/*)
 */

export const API_TIERS = {
  SUPER_ADMIN: '/super-admin',
  TENANT: '/tenant',
  VOLUNTEER: '/volunteer',
} as const;

export const API_ENDPOINTS = {
  // --- AUTHENTICATION ---
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    MOBILE_LOGIN: '/mobile/auth/login',
  },

  // --- SUPER ADMIN TIER (/super-admin/*) ---
  SUPER_ADMIN: {
    BASE: API_TIERS.SUPER_ADMIN,
    TENANTS: `${API_TIERS.SUPER_ADMIN}/tenants`,
    TENANT_ROLES: `${API_TIERS.SUPER_ADMIN}/tenant-roles`,
    SETTINGS: `${API_TIERS.SUPER_ADMIN}/settings`,
    WHATSAPP_TEMPLATES: `${API_TIERS.SUPER_ADMIN}/settings/whatsapp/templates`,
    VOTERS: `${API_TIERS.SUPER_ADMIN}/voters`,
    MASTERS: {
      STATES: `${API_TIERS.SUPER_ADMIN}/masters/states`,
      DISTRICTS: `${API_TIERS.SUPER_ADMIN}/masters/districts`,
      TALUKAS: `${API_TIERS.SUPER_ADMIN}/masters/talukas`,
      VILLAGES: `${API_TIERS.SUPER_ADMIN}/masters/villages`,
      PCS: `${API_TIERS.SUPER_ADMIN}/masters/pcs`,
      ACS: `${API_TIERS.SUPER_ADMIN}/masters/acs`,
      WARDS: `${API_TIERS.SUPER_ADMIN}/masters/wards`,
      BOOTHS: `${API_TIERS.SUPER_ADMIN}/masters/booths`,
      RELIGIONS: `${API_TIERS.SUPER_ADMIN}/masters/religions`,
      CASTES: `${API_TIERS.SUPER_ADMIN}/masters/castes`,
      PARTIES: `${API_TIERS.SUPER_ADMIN}/masters/parties`,
    },
  },

  // --- TENANT TIER (/tenant/*) ---
  TENANT: {
    BASE: API_TIERS.TENANT,
    SETTINGS: `${API_TIERS.TENANT}/settings`,
    USER_ROLES: `${API_TIERS.TENANT}/user-roles`,
    WHATSAPP_TEMPLATES: `${API_TIERS.TENANT}/settings/whatsapp/templates`,
    VOTERS: `${API_TIERS.TENANT}/voters`,
    DATA_STATS: `${API_TIERS.TENANT}/data/stats`,
    MASTERS: {
      PCS: `${API_TIERS.TENANT}/pcs`,
      ACS: `${API_TIERS.TENANT}/acs`,
      WARDS: `${API_TIERS.TENANT}/wards`,
      BOOTHS: `${API_TIERS.TENANT}/booths`,
      STATES: `${API_TIERS.TENANT}/states`,
      DISTRICTS: `${API_TIERS.TENANT}/districts`,
      TALUKAS: `${API_TIERS.TENANT}/talukas`,
      VILLAGES: `${API_TIERS.TENANT}/villages`,
      RELIGIONS: `${API_TIERS.TENANT}/religions`,
      CASTES: `${API_TIERS.TENANT}/castes`,
      PARTIES: `${API_TIERS.TENANT}/parties`,
    },
  },

  // --- VOLUNTEER TIER (/volunteer/*) ---
  VOLUNTEER: {
    BASE: API_TIERS.VOLUNTEER,
    ONBOARDING: `${API_TIERS.VOLUNTEER}/onboard`,
    ASSIGNMENTS: `${API_TIERS.VOLUNTEER}/assignments`,
    VOTER_SURVEY: `${API_TIERS.VOLUNTEER}/voter-survey`,
  },
} as const;

export default API_ENDPOINTS;
