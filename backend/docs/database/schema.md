# PostgreSQL Database Schema Directory

All database tables are documented individually in separate Markdown files under the [`tables/`](./tables/) directory.

---

## 📚 Master & Entity Tables Index

| Table Name | File Link | Description |
| :--- | :--- | :--- |
| **`states`** | [`states.md`](./tables/states.md) | State entities master |
| **`districts`** | [`districts.md`](./tables/districts.md) | Administrative districts master |
| **`religions`** | [`religions.md`](./tables/religions.md) | Religious demographic classifications master |
| **`castes`** | [`castes.md`](./tables/castes.md) | Caste names and social categories (General/OBC/SC/ST) |
| **`booths`** | [`booths.md`](./tables/booths.md) | Polling booth locations and voter counts master |
| **`organizations`** | [`organizations.md`](./tables/organizations.md) | Organization client accounts and campaign instances master |
| **`voters`** | [`voters.md`](./tables/voters.md) | Core voter records, polling booths, constituency data |
| **`admin_users`** | [`admin_users.md`](./tables/admin_users.md) | System user accounts, admin profiles, and authorization roles |
| **`sync_outbox`** | [`sync_outbox.md`](./tables/sync_outbox.md) | Transactional outbox pattern events for multi-tenant bi-directional sync |

