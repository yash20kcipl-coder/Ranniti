# `admin_users` Table Specification

Entity for system admin users, super admins, organization campaign managers, leaders, DEOs, and analysts.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `organization_id` | `UUID` | Yes | `NULL` | Foreign Key referencing `organizations(id)` |
| `name` | `VARCHAR(255)` | No | *None* | Full user name |
| `email` | `VARCHAR(255)` | No | *None* | Unique login email address |
| `password_hash` | `VARCHAR(255)` | No | *None* | Bcrypt hashed password |
| `role` | `VARCHAR(30)` | No | `'user'` | Role check: `super_admin`, `admin`, `leader`, `sub_leader`, `deo`, `analyst`, `user` |
| `mobile` | `VARCHAR(15)` | Yes | `NULL` | User contact number |
| `avatar` | `VARCHAR(500)` | Yes | `NULL` | Profile picture relative path |
| `status` | `VARCHAR(20)` | Yes | `'active'` | Status check: `active`, `inactive`, `suspended` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `admin_users_email_key` | `B-Tree (Unique)` | `email` | Enforce unique email addresses |
| `idx_admin_users_email` | `B-Tree` | `email` | Fast authentication login lookup |
| `idx_admin_users_organization` | `B-Tree` | `organization_id` | Fast filtering users by campaign organization |

