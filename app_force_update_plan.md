# 🚀 Super Admin App Force Update Implementation Plan

## 1. Executive Summary & Architectural Blueprint

This document specifies the end-to-end architectural plan to implement **App Force Update & Maintenance Management** in the **Ranniti** platform. 

This feature empowers Super Administrators to dynamically control app version thresholds (minimum required version, latest available version, store URLs, custom release notes, force update toggles, and emergency maintenance mode) for both **Android** and **iOS** platforms from the Web Super Admin Portal. The mobile application evaluates these rules during app startup to seamlessly enforce soft update prompts or hard update lock screens.

```mermaid
graph TD
    A[Super Admin Web Portal] -->|Dispatch Redux Action| B[PUT /api/v1/super-admin/app-versions/:id]
    B --> C[Super Admin Controller & Queries]
    C -->|Upsert & Cache Invalidate| D[(PostgreSQL Master DB: app_versions)]
    D -->|Cache in Redis| E[CacheService ranniti:app_versions]
    F[React Native Mobile App] -->|Startup Hook useVersionCheck| G[GET /api/v1/app-versions]
    G --> E
    E -->|Return Version Config| F
    F -->|Compare Installed vs Min/Latest| H{Version Status}
    H -->|Maintenance Enabled| I[Maintenance Screen Lock]
    H -->|Installed < Min Version OR Force Update = true| J[Hard Update Modal (Blocking)]
    H -->|Installed < Latest Version| K[Soft Update Modal (Dismissible)]
    H -->|Installed >= Latest Version| L[Allow App Usage]
```

---

## 2. Database Schema Design

### 2.1 Table: `app_versions`
Migration File: `backend/src/database/migrations/create_app_versions_table.sql`

```sql
CREATE TABLE IF NOT EXISTS app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL UNIQUE, -- 'android' | 'ios'
    min_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    latest_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    force_update BOOLEAN NOT NULL DEFAULT false,
    update_title VARCHAR(255) DEFAULT 'App Update Available',
    update_message TEXT DEFAULT 'A new version of Ranniti is available. Update now to enjoy the latest features and security enhancements.',
    store_url VARCHAR(500) NOT NULL DEFAULT '',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT DEFAULT 'Ranniti is currently undergoing scheduled maintenance. Please check back shortly.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant platform lookup
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions (platform);
```

---

## 3. Backend API Architecture

### 3.1 REST Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/app-versions` | `GET` | Public | Returns version rules for both Android & iOS (cached in Redis for fast mobile response). |
| `/api/v1/super-admin/app-versions` | `GET` | SuperAdmin JWT | Fetches version records for admin dashboard display. |
| `/api/v1/super-admin/app-versions/:id` | `PUT` | SuperAdmin JWT | Updates version limits, store URLs, maintenance mode, or force update flags. |

### 3.2 Query Layer (`backend/src/queries/appVersion.queries.ts`)
- Implements `getAppVersions()`, `updateAppVersion()`, and auto-seeding defaults if table is empty.
- Invalidates Redis cache key `ranniti:app_versions` upon any modification.

---

## 4. Frontend Architecture (Web Super Admin Portal)

### 4.1 State Management (Redux)
- **Slice**: `web/src/redux/slices/appVersionSlice.ts`
- **Actions**: `fetchAppVersions()`, `updateAppVersionConfig()` in `web/src/redux/actions/appVersion.ts`

### 4.2 Super Admin UI Component
- Component: `web/src/components/settings/AppVersionSection.tsx`
- Integrated as a dedicated tab (`app-versions`) inside `SuperAdminSettingsPage.tsx`.
- Uses standard components: `FormInput`, `PageHeader`, `Modal`, `ConfirmModal`, `SafeImage`.

---

## 5. Mobile App Integration (React Native)

### 5.1 Version Comparison Hook (`app/src/hooks/useVersionCheck.ts`)
- Compares installed version (`appVersion.android` / `appVersion.ios` from `app/src/utils/version.ts`) against response from `/api/v1/app-versions`.
- Returns version status: `'loading' | 'allowed' | 'force-update' | 'recommended-update' | 'maintenance'`.

### 5.2 UI Overlays & Localization
- Component: `app/src/components/AppUpdateModal.tsx` & `VersionCheckOverlay.tsx`.
- Strictly localization-compliant via `app/src/languages/en.ts` and `app/src/languages/hi.ts` using `useLanguage()`.

---

## 6. Implementation Checklist & Verification

1. ✅ Create SQL Migration `create_app_versions_table.sql` & execute table setup.
2. ✅ Update database documentation in `backend/docs/database/tables/app_versions.md` & `backend/docs/database/schema.md`.
3. ✅ Create backend queries, controllers, and routes (`appVersion.routes.ts` & public endpoint in `health.routes.ts` or `appVersion.public.routes.ts`).
4. ✅ Add seed script in `backend/src/seeds/seedAppVersions.ts`.
5. ✅ Build Redux slice and actions in Web Super Admin frontend.
6. ✅ Implement `AppVersionSection.tsx` component in Web Super Admin Settings.
7. ✅ Ensure complete Mobile App integration (`useVersionCheck.ts`, `AppUpdateModal.tsx`, localization keys in `en.ts`/`hi.ts`).
8. ✅ Empirical testing & verification.
