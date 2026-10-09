# `otp_verifications` Table Specification

Entity for storing and managing mobile OTP verification codes, attempt counters, rate limiting tracking, and expiration timestamps.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `mobile` | `VARCHAR(15)` | No | *None* | Target 10-digit mobile number for OTP delivery |
| `otp_code` | `VARCHAR(6)` | No | *None* | Generated OTP code (4 or 6 digits) |
| `attempts` | `INT` | Yes | `0` | Number of failed verification attempts (Max 5 allowed) |
| `is_verified` | `BOOLEAN` | Yes | `FALSE` | Flag indicating if OTP was successfully verified |
| `expires_at` | `TIMESTAMPTZ` | No | *None* | OTP expiration timestamp (5 minutes after creation) |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |

---

## ⚡ Index Specifications

| Index Name | Index Type | Target Columns / Expression | Purpose |
| :--- | :--- | :--- | :--- |
| `idx_otp_mobile_unverified` | `B-Tree` | `mobile`, `is_verified`, `expires_at` | Fast lookup for unverified active OTPs per mobile number |
