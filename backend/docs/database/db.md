# Database Architecture Specification (`db.md`)

This document defines the definitive PostgreSQL multi-tenant database architecture, table placement rules, data isolation boundaries, and deletion/retention policies for the **Ranniti Political Campaign & Voter Analytics Platform**.

---

## 🏛️ High-Level Multi-Tenant Architecture

Ranniti employs a **Database-per-Tenant** isolation model combined with a central **Master DB** and an in-memory **Redis Cache Layer**:

```
                                 ┌─────────────────────────┐
                                 │     Incoming Request    │
                                 └────────────┬────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         │                                         │
                 [Super Admin Path]                         [Tenant User Path]
                         │                                         │
                         ▼                                         ▼
               ┌───────────────────┐                     ┌───────────────────┐
               │    Redis Cache    │                     │    Redis Cache    │
               │  ranniti:master:* │                     │  ranniti:tenant:* │
               └─────────┬─────────┘                     └─────────┬─────────┘
                         │ (Cache Miss)                            │ (Cache Miss)
                         ▼                                         ▼
               ┌───────────────────┐                     ┌───────────────────┐
               │     Master DB     │                     │  Tenant DB Pool   │
               │   (ranniti_db)    │                     │(TenantPoolManager)│
               └───────────────────┘                     └─────────┬─────────┘
                                                                   │
                                                                   ▼
                                                         ┌───────────────────┐
                                                         │     Tenant DB     │
                                                         │ (ranniti_tenant_*)│
                                                         └───────────────────┘
```

---

## 📊 Complete Table Placement & Deletion Matrix

| Table Name | Master DB (`ranniti_db`) | Tenant DB (`ranniti_tenant_*`) | Classification | Status & Action | Purpose / Explanation |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **`admin_users`** | ✅ **YES** | ❌ **NO** | **Master Exclusive** | **Retain (Master Only)** | Central super admin authentication repository (email, password hash, role). Must be central for pre-login authentication. |
| **`tenants`** | ✅ **YES** | ❌ **NO** | **Master Exclusive** | **Retain (Master Only)** | Dedicated standalone tenant organizations, administrator accounts, assigned State, PC, ACs, and Tenant DB names. |
| **`tenant_roles`** | ✅ **YES** | ❌ **NO** | **Master Exclusive** | **Retain (Master Only)** | Super Admin SaaS subscription tiers & allowed tab packages for tenants. |
| **`pgmigrations`** | ✅ **YES** | ❌ **NO** | **Master Exclusive** | **Retain (Master Only)** | Migration history tracker for Master DB schema migrations. |
| **`sync_outbox`** | ❌ **DELETED** | ❌ **NO** | **Dead / Orphaned** | **DROPPED** | Dead legacy table (0 rows). Dropped via `DROP TABLE IF EXISTS sync_outbox;`. Replaced by `tenant_sync_outbox`. |
| **`tenant_user_roles`** | ⚠️ *Optional Template* | ✅ **YES** | **Tenant Exclusive** | **Active in Tenant DB** | Tenant volunteer roles (`PC Leader`, `AC Leader`, `Sub-Leader`, `Supporter`) and granular tab/voter permissions. Seeded automatically per tenant. |
| **`campaign_settings`** | ⚠️ *Super Admin Fallback*| ✅ **YES** | **Tenant Exclusive** | **Active in Tenant DB** | Tenant campaign settings (candidate photo, party logo, FCM/APNS push keys, Meta WhatsApp WABA credentials, field rules). |
| **`whatsapp_templates`** | ⚠️ *Global Fallback* | ✅ **YES** | **Tenant Exclusive** | **Active in Tenant DB** | Campaign-specific Meta WhatsApp messaging templates and sync status. |
| **`tenant_sync_outbox`** | ❌ **NO** | ✅ **YES** | **Tenant Exclusive** | **Active in Tenant DB** | Offline-first transactional outbox queue for mobile field volunteers syncing records to Tenant DB. |
| **`voters`** | ⚠️ *Master Seed Pool* | ✅ **YES** | **Tenant Data** | **Partitioned per Tenant** | Millions of voter records. Master DB holds national/state seed pool; Tenant DB holds isolated campaign voter roll with custom tags and family relations. |
| **`parliamentary_constituencies`** | ✅ **YES** | ✅ **YES** | **Geography Reference** | **Master + Tenant Partition** | National PC catalog in Master DB; assigned PC copied into Tenant DB for offline operation and foreign keys. |
| **`assembly_constituencies`** | ✅ **YES** | ✅ **YES** | **Geography Reference** | **Master + Tenant Partition** | National AC catalog in Master DB; tenant's assigned ACs copied into Tenant DB. |
| **`wards`** | ✅ **YES** | ✅ **YES** | **Geography Reference** | **Master + Tenant Partition** | Electoral wards/prabhags under ACs. |
| **`booths`** | ✅ **YES** | ✅ **YES** | **Geography Reference** | **Master + Tenant Partition** | Polling booths under wards and ACs. |
| **`user_booth_assignments`** | ✅ **YES** | ⚠️ *Optional* | **Junction** | **Retain in Master DB** | Maps field volunteers (`admin_users`) to assigned polling booths. |
| **`states`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | State reference catalog. |
| **`districts`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | District reference catalog. |
| **`talukas`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | Taluka (tehsil) reference catalog. |
| **`villages`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | Village residence reference catalog. |
| **`religions`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | Standard religion classification master. |
| **`castes`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | Caste and subcaste categorization master. |
| **`parties`** | ✅ **YES** | ✅ **YES** | **Lookup Master** | **Master + Tenant Partition** | Political parties and symbol logos. |

---

## 🗑️ Tables to Delete / Dropped SQL Summary

### 1. Dropped Dead Tables
- **`sync_outbox`** in `ranniti_db` was dropped:
  ```sql
  DROP TABLE IF EXISTS sync_outbox CASCADE;
  ```

### 2. Candidate Tables for Pruning from Master DB
If your production architecture mandates that **Master DB stores zero tenant runtime data**:
- **`voters` in Master DB**: Can be dropped or truncated if tenants upload their own electoral rolls directly via `.xlsx` bulk import.
- **`campaign_settings` & `whatsapp_templates` in Master DB**: Can be dropped if Super Admin does not maintain a fallback preview.

---

## ⚡ Data Flow & Routing Rules

1. **Request Identification:**
   - Every authenticated request decodes the JWT payload containing `req.user.tenantDbName`.
   - If `tenantDbName` is present, all tenant queries route to the isolated tenant database via [`TenantPoolManager`](file:///Users/mac-yash/Documents/GitHub/Ranniti/backend/src/utils/tenantPoolManager.ts).
   - If `tenantDbName` is null or the route is under `/api/v1/super-admin/`, queries route to Master DB (`ranniti_db`).

2. **Zero Master DB Touch for Tenant Requests:**
   - Tenant routes (`/api/v1/tenant/settings`, `/api/v1/tenant/acs`, `/api/v1/tenant/roles`, `/api/v1/tenant/booths`, etc.) execute 0 queries against Master DB.
   - Master DB permission tables (`tenants`, `user_booth_assignments`) are bypassed during tenant requests because the tenant database is already physically isolated.

3. **Redis Caching Strategy:**
   - **Tenant Settings:** `ranniti:settings:{tenantDbName}` (TTL: 3600s, invalidated on update).
   - **Tenant Roles:** `ranniti:roles:{tenantDbName}` (TTL: 3600s, invalidated on update).
   - **Tenant WhatsApp:** `ranniti:wa_templates:{tenantDbName}` (TTL: 3600s).
   - **Tenant Geography & Lookups:** `ranniti:tenant:{tenantDbName}:{category}:*` (TTL: 3600s).

4. **Telemetry & Auditing:**
   - All responses include the custom header `X-Data-Source`:
     - `X-Data-Source: Redis` on cache hits.
     - `X-Data-Source: Tenant DB (<db_name>)` on tenant DB reads.
     - `X-Data-Source: Master DB` on Super Admin master DB reads.
