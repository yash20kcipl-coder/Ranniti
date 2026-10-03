# PostgreSQL Database Schema Directory

All database tables are documented individually in separate Markdown files under the [`tables/`](./tables/) directory.

---

## 📚 Master & Entity Tables Index

| Table Name                         | File Link                                                                     | Description                                                                                |
| :-----------------------------------| :------------------------------------------------------------------------------| :-------------------------------------------------------------------------------------------|
| **`states`**                       | [`states.md`](./tables/states.md)                                             | State entities master                                                                      |
| **`districts`**                    | [`districts.md`](./tables/districts.md)                                       | Administrative districts master                                                            |
| **`talukas`**                      | [`talukas.md`](./tables/talukas.md)                                           | Administrative talukas (tehsils) master                                                    |
| **`villages`**                     | [`villages.md`](./tables/villages.md)                                         | Administrative villages master (independent voter residence data)                          |
| **`parliamentary_constituencies`** | [`parliamentary_constituencies.md`](./tables/parliamentary_constituencies.md) | Lok Sabha parliamentary constituencies master                                              |
| **`assembly_constituencies`**      | [`assembly_constituencies.md`](./tables/assembly_constituencies.md)           | Vidhan Sabha assembly constituencies master                                                |
| **`wards`**                        | [`wards.md`](./tables/wards.md)                                               | Electoral wards / prabhags under Assembly Constituencies                                   |
| **`booths`**                       | [`booths.md`](./tables/booths.md)                                             | Polling booth locations under Wards and ACs                                                |
| **`parties`**                      | [`parties.md`](./tables/parties.md)                                           | Political parties and symbol logos master                                                  |
| **`religions`**                    | [`religions.md`](./tables/religions.md)                                       | Religions master entity reference                                                          |
| **`castes`**                       | [`castes.md`](./tables/castes.md)                                             | Castes & subcastes master hierarchy                                                        |
| **`voters`**                       | [`voters.md`](./tables/voters.md)                                             | Core voter records, polling booths, constituency data, family mapping & household network  |
| **`admin_users`**                  | [`admin_users.md`](./tables/admin_users.md)                                   | System user accounts, admin profiles, authorization roles, parent leader hierarchy         |
| `user_booth_assignments`           | [`user_booth_assignments.md`](./tables/user_booth_assignments.md)             | Junction table mapping leaders, sub-leaders, and supporters to polling booths              |
| **`campaign_settings`**            | [`campaign_settings.md`](./tables/campaign_settings.md)                       | Campaign settings, FCM/APNs push triggers, Meta WhatsApp API config                        |
| **`whatsapp_templates`**           | [`whatsapp_templates.md`](./tables/whatsapp_templates.md)                     | Multi-lingual WhatsApp templates, dynamic variables, and Meta status                       |
| **`tenant_assignments`**           | [`tenant_assignments.md`](./tables/tenant_assignments.md)                     | Tenant user database provisioning state and assigned PC/AC geography                       |
| **`tenant_roles`**                 | [`tenant_roles.md`](./tables/tenant_roles.md)                                 | Tier 1 Super Admin Tenant feature access packages & tab ceilings                           |
| **`tenant_user_roles`**            | [`tenant_user_roles.md`](./tables/tenant_user_roles.md)                       | Tier 2 Tenant User Roles (PC/AC Leaders, Sub-Leaders, Supporters) & voter edit permissions |
| **`tenant_sync_outbox`**           | [`tenant_sync_outbox.md`](./tables/tenant_sync_outbox.md)                     | Transactional outbox queue for resilient Tenant DB -> Master DB auto-updates               |
| **`audit_logs`**                   | [`audit_logs.md`](./tables/audit_logs.md)                                     | Security audit trail, administrative action tracking, and event logging                   |


---

## 🔑 Key & Index Architecture
* [**Unique Keys & Constraints Reference**](./unique_keys_reference.md): Full reference of primary keys, unique constraints, and composite unique keys across all tables.

