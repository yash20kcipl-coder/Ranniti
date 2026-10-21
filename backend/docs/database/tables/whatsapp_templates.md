# `whatsapp_templates` Table Specification (Tenant DBs)

> [!NOTE]
> Tenant-isolated WhatsApp message templates maintained independently on each Tenant DB for candidate campaigns and field volunteer outreach. Starter defaults are seeded upon tenant provisioning.

## Columns

| Column | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key |
| `meta_template_id` | `VARCHAR(100)` | Yes | `NULL` | WhatsApp Meta Cloud API template identifier |
| `name` | `VARCHAR(100)` | No | | Template unique slug/name |
| `category` | `VARCHAR(30)` | No | `'UTILITY'` | Template category (`UTILITY`, `MARKETING`, `AUTHENTICATION`) |
| `language` | `VARCHAR(20)` | No | `'hi'` | Template language code (e.g. `hi`, `en`) |
| `header_type` | `VARCHAR(20)` | No | `'NONE'` | Header type (`NONE`, `TEXT`, `IMAGE`, `DOCUMENT`, `VIDEO`) |
| `header_content` | `TEXT` | Yes | `NULL` | Header text or media URL |
| `body_text` | `TEXT` | No | | Main template body text with `{{var}}` placeholders |
| `footer_text` | `TEXT` | Yes | `NULL` | Optional template footer text |
| `buttons` | `JSONB` | No | `'[]'::jsonb` | Interactive buttons configuration |
| `variables` | `JSONB` | No | `'[]'::jsonb` | Extracted dynamic variable list |
| `meta_status` | `VARCHAR(30)` | No | `'APPROVED'` | Approval status (`APPROVED`, `PENDING`, `REJECTED`, `PAUSED`, `DRAFT`) |
| `meta_rejection_reason` | `TEXT` | Yes | `NULL` | Reason if rejected by Meta |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Record update timestamp |

## Constraints & Indexes

- `uq_whatsapp_templates_name_lang`: `UNIQUE (name, language)`
- `idx_whatsapp_templates_status`: `INDEX (meta_status)`
- `idx_whatsapp_templates_category`: `INDEX (category)`

