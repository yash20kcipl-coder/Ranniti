# `admin_users` Table Specification

Entity for system admin users, super admins, organization campaign managers, leaders, DEOs, and analysts.

---

## 📊 Table Structure & Columns

| Column Name        | Data Type      | Nullable | Default             | Description / Constraints                                                                                                                   |
| :-------------------| :---------------| :---------| :--------------------| :--------------------------------------------------------------------------------------------------------------------------------------------|
| `id`               | `UUID`         | No       | `gen_random_uuid()` | Primary Key                                                                                                                                 |
| `name`             | `VARCHAR(255)` | No       | *None*              | Full user name                                                                                                                              |
| `email`            | `VARCHAR(255)` | No       | *None*              | Unique login email address                                                                                                                  |
| `password_hash`    | `VARCHAR(255)` | No       | *None*              | Bcrypt hashed password                                                                                                                      |
| `role`             | `VARCHAR(30)`  | No       | `'user'`            | Role check: `super_admin`, `admin`, `tenant_admin`, `pc_leader`, `ac_leader`, `leader`, `sub_leader`, `supporter`, `deo`, `analyst`, `user` |
| `role_name`        | `VARCHAR(100)` | Yes      | `NULL`              | Human-readable role / title description (e.g. 'Chief Campaign Strategist')                                                                  |
| `mobile`           | `VARCHAR(15)`  | Yes      | `NULL`              | User contact number                                                                                                                         |
| `avatar`           | `VARCHAR(500)` | Yes      | `NULL`              | Profile picture relative path                                                                                                               |
| `status`           | `VARCHAR(20)`  | Yes      | `'active'`          | Status check: `active`, `inactive`, `suspended`                                                                                             |
| `tenant_db_name`   | `VARCHAR(150)` | Yes      | `NULL`              | Name of dedicated PostgreSQL database provisioned for tenant user                                                                           |
| `parent_leader_id` | `UUID`         | Yes      | `NULL`              | Foreign key to `admin_users(id)` representing managing leader/sub-leader                                                                    |
| `assigned_ac_id`   | `UUID`         | Yes      | `NULL`              | Foreign key to `acs(id)` representing assigned assembly constituency                                                                        |
| `created_at`       | `TIMESTAMPTZ`  | No       | `NOW()`             | Record creation timestamp                                                                                                                   |
| `updated_at`       | `TIMESTAMPTZ`  | No       | `NOW()`             | Record update timestamp                                                                                                                     |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `admin_users_email_key` | `B-Tree (Unique)` | `email` | Enforce unique email addresses |
| `idx_admin_users_email` | `B-Tree` | `email` | Fast authentication login lookup |
| `idx_admin_users_parent_leader_id` | `B-Tree` | `parent_leader_id` | Fast lookup for subordinate team members |
| `idx_admin_users_assigned_ac_id` | `B-Tree` | `assigned_ac_id` | Fast lookup for assembly constituency assignments |

