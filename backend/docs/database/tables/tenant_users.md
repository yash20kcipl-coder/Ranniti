# `tenant_users` Table Specification

Entity for tenant field cadre, including PC Leaders, AC Leaders, Sector Sub-Leaders, and Booth Supporters, isolated inside each Tenant DB (`ranniti_tenant_*`).

---

## 📊 Table Structure & Columns

| Column Name        | Data Type      | Nullable | Default             | Description / Constraints                                                                                  |
| :-------------------| :---------------| :---------| :--------------------| :---------------------------------------------------------------------------------------------------------|
| `id`               | `UUID`         | No       | `gen_random_uuid()` | Primary Key                                                                                                |
| `name`             | `VARCHAR(255)` | No       | *None*              | Full volunteer/leader name                                                                                 |
| `email`            | `VARCHAR(255)` | No       | *None*              | Unique login email address                                                                                 |
| `password_hash`    | `VARCHAR(255)` | No       | *None*              | Bcrypt hashed password                                                                                     |
| `role`             | `VARCHAR(30)`  | No       | *None*              | Role check: `pc_leader`, `ac_leader`, `leader`, `sub_leader`, `supporter`                                  |
| `role_name`        | `VARCHAR(100)` | Yes      | `NULL`              | Human-readable title description                                                                           |
| `mobile`           | `VARCHAR(15)`  | Yes      | `NULL`              | User contact number                                                                                        |
| `avatar`           | `VARCHAR(500)` | Yes      | `NULL`              | Profile picture relative path                                                                              |
| `status`           | `VARCHAR(20)`  | Yes      | `'active'`          | Status check: `active`, `inactive`, `suspended`                                                            |
| `tenant_db_name`   | `VARCHAR(150)` | Yes      | `NULL`              | Name of dedicated PostgreSQL database                                                                      |
| `parent_leader_id` | `UUID`         | Yes      | `NULL`              | Foreign key to `tenant_users(id)` representing managing leader/sub-leader                                 |
| `assigned_ac_id`   | `UUID`         | Yes      | `NULL`              | Foreign key to `assembly_constituencies(id)` representing assigned AC                                      |
| `accessible_tabs`  | `JSONB`        | Yes      | `NULL`              | Custom JSON tab and screen access overrides (`web_tabs`, `mobile_screens`)                                |
| `created_at`       | `TIMESTAMPTZ`  | No       | `NOW()`             | Record creation timestamp                                                                                  |
| `updated_at`       | `TIMESTAMPTZ`  | No       | `NOW()`             | Record update timestamp                                                                                    |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `tenant_users_email_key` | `B-Tree (Unique)` | `email` | Enforce unique email addresses within tenant |
| `idx_tenant_users_email` | `B-Tree` | `email` | Fast mobile authentication login lookup |
| `idx_tenant_users_mobile` | `B-Tree` | `mobile` | Fast mobile phone login lookup |
| `idx_tenant_users_role` | `B-Tree` | `role` | Fast role hierarchy filtering |
| `idx_tenant_users_parent_leader_id` | `B-Tree` | `parent_leader_id` | Fast lookup for subordinate team members |
| `idx_tenant_users_assigned_ac_id` | `B-Tree` | `assigned_ac_id` | Fast lookup for assembly constituency assignments |
