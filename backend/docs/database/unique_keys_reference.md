# 🔑 Database Unique Keys & Constraints Reference

Comprehensive reference guide of all **Primary Keys**, **Single-Column Unique Keys**, and **Composite Unique Constraints** across all tables in the PostgreSQL database.

---

## 📋 Summary Table of Unique Constraints

| Table Name | Constraint Name | Key Type | Target Columns | Purpose & Business Rule |
| :--- | :--- | :--- | :--- | :--- |
| **`voters`** | `voters_pkey` | Primary Key | `id` | Universal UUID record identifier |
| **`voters`** | `voters_epic_no_key` | Unique Key | `epic_no` | Ensures each ECI Voter Card (EPIC) is globally unique across all electoral rolls |
| **`admin_users`** | `admin_users_pkey` | Primary Key | `id` | System user UUID identifier |
| **`admin_users`** | `admin_users_email_key` | Unique Key | `email` | User login credential; prevents duplicate email registration |
| **`states`** | `states_pkey` | Primary Key | `id` | State UUID identifier |
| **`states`** | `unq_state_name` | Unique Key | `name` | Prevents duplicate state records (e.g. "Maharashtra") |
| **`districts`** | `districts_pkey` | Primary Key | `id` | District UUID identifier |
| **`districts`** | `unq_district_state_name` | Composite Unique | `(state_id, name)` | Prevents duplicate district names within the same state |
| **`parliamentary_constituencies`** | `parliamentary_constituencies_pkey` | Primary Key | `id` | PC UUID identifier |
| **`parliamentary_constituencies`** | `unq_pc_state_number` | Composite Unique | `(state_id, pc_number)` | ECI PC number must be unique within a state |
| **`assembly_constituencies`** | `assembly_constituencies_pkey` | Primary Key | `id` | AC UUID identifier |
| **`assembly_constituencies`** | `unq_ac_pc_number` | Composite Unique | `(pc_id, ac_number)` | Assembly constituency number must be unique under its PC |
| **`talukas`** | `talukas_pkey` | Primary Key | `id` | Taluka UUID identifier |
| **`talukas`** | `unq_taluka_district_name` | Composite Unique | `(district_id, name)` | Prevents duplicate taluka names within the same district |
| **`villages`** | `villages_pkey` | Primary Key | `id` | Village UUID identifier |
| **`villages`** | `unq_village_taluka_name` | Composite Unique | `(taluka_id, name)` | Prevents duplicate village names within the same taluka |
| **`wards`** | `wards_pkey` | Primary Key | `id` | Ward UUID identifier |
| **`wards`** | `unq_ward_ac_number` | Composite Unique | `(ac_id, ward_number)` | Ward number must be strictly unique within an AC |
| **`booths`** | `booths_pkey` | Primary Key | `id` | Booth UUID identifier |
| **`booths`** | `unq_booth_ac_number` | Composite Unique | `(ac_id, booth_number)` | Polling booth number must be strictly unique within an AC |
| **`religions`** | `religions_pkey` | Primary Key | `id` | Religion UUID identifier |
| **`religions`** | `religions_name_key` | Unique Key | `name` | Prevents duplicate religion entries |
| **`castes`** | `castes_pkey` | Primary Key | `id` | Caste UUID identifier |
| **`castes`** | `castes_name_key` | Unique Key | `name` | Prevents duplicate caste entries |
| **`parties`** | `parties_pkey` | Primary Key | `id` | Party UUID identifier |
| **`parties`** | `parties_name_key` | Unique Key | `name` | Prevents duplicate party registration |

---

## 🔍 Detailed Table Breakdown

### 1. `voters`
* **`id` (Primary Key):** UUID primary identifier.
* **`epic_no` (Unique):** ECI Electoral Card ID (e.g. `ABC1234567`). Must be unique. Bulk imports leverage `ON CONFLICT (epic_no) DO UPDATE` to safely upsert existing voters without duplicates.

### 2. `admin_users`
* **`id` (Primary Key):** UUID primary identifier.
* **`email` (Unique):** User login email address.

### 3. `states`
* **`id` (Primary Key):** UUID primary identifier.
* **`name` (Unique):** Official state name.

### 4. `districts`
* **`id` (Primary Key):** UUID primary identifier.
* **`state_id + name` (Composite Unique):** Same district name cannot be added twice under the same state.

### 5. `parliamentary_constituencies`
* **`id` (Primary Key):** UUID primary identifier.
* **`state_id + pc_number` (Composite Unique):** Official ECI constituency number unique per state.

### 6. `assembly_constituencies`
* **`id` (Primary Key):** UUID primary identifier.
* **`pc_id + ac_number` (Composite Unique):** Assembly segment number unique within its parent Parliamentary Constituency.

### 7. `booths`
* **`id` (Primary Key):** UUID primary identifier.
* **`ac_id + booth_number` (Composite Unique):** Polling station booth number unique per Assembly Constituency.

### 8. `religions`
* **`id` (Primary Key):** UUID primary identifier.
* **`name` (Unique):** Religion name.

### 9. `castes`
* **`id` (Primary Key):** UUID primary identifier.
* **`name` (Unique):** Caste or community name.

### 10. `parties`
* **`id` (Primary Key):** UUID primary identifier.
* **`name` (Unique):** Political party full name.
