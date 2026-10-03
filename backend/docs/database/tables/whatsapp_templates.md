# `whatsapp_templates` Table Specification

Template repository for WhatsApp Business API messages including voter slips, manifesto broadcasts, meeting notices, and karyakarta mobilization messages with dynamic variables and Meta status tracking.

---

## 📊 Table Structure & Columns

| Column Name | Data Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `meta_template_id` | `VARCHAR(100)` | Yes | `NULL` | Meta assigned Template ID |
| `name` | `VARCHAR(100)` | No | *None* | Template unique slug name (e.g. `voter_parchi_slip`) |
| `category` | `VARCHAR(30)` | No | `'UTILITY'` | Category check: `UTILITY`, `MARKETING`, `AUTHENTICATION` |
| `language` | `VARCHAR(20)` | No | `'hi'` | Language code (e.g. `en`, `hi`, `mr`, `gu`) |
| `header_type` | `VARCHAR(20)` | No | `'NONE'` | Header format: `NONE`, `TEXT`, `IMAGE`, `DOCUMENT`, `VIDEO` |
| `header_content` | `TEXT` | Yes | `NULL` | Header text or media URL |
| `body_text` | `TEXT` | No | *None* | Main message body text with dynamic tokens (`{{1}}`, `{{voter_name}}`) |
| `footer_text` | `TEXT` | Yes | `NULL` | Optional footer disclaimer (e.g. 'Reply STOP to opt out') |
| `buttons` | `JSONB` | No | `'[]'::jsonb` | Interactive buttons (Quick replies, CTA URL, Phone number) |
| `variables` | `JSONB` | No | `'[]'::jsonb` | Extracted dynamic variable token names |
| `meta_status` | `VARCHAR(30)` | No | `'APPROVED'` | Status check: `APPROVED`, `PENDING`, `REJECTED`, `PAUSED`, `DRAFT` |
| `meta_rejection_reason` | `TEXT` | Yes | `NULL` | Reason text provided by Meta review if rejected |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

---

## ⚡ Index & Constraint Specifications

| Index / Constraint Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- |
| `whatsapp_templates_pkey` | `Primary Key` | `id` | Unique identifier |
| `uq_whatsapp_templates_name_lang` | `Unique Constraint` | `name, language` | Enforce unique template per language |
| `idx_whatsapp_templates_status` | `B-Tree` | `meta_status` | Fast filtering by approval status |
| `idx_whatsapp_templates_category` | `B-Tree` | `category` | Fast filtering by message category |
