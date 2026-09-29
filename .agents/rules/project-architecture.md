# Project Architecture & Folder Structure Rule

The Ranniti repository is structured as a full-stack dual-workspace monorepo containing `backend/` and `web/`. All development must strictly adhere to the layered folder structure below.

## Directory Structure Overview

```text
Ranniti Workspace Root/
├── backend/                  # Node.js + Express + TypeScript + PostgreSQL Backend
│   ├── src/
│   │   ├── app.ts           # Express Application setup, middleware stack & routes
│   │   ├── server.ts        # HTTP Server entry, lifecycle & graceful shutdown
│   │   ├── config/          # Environment configuration (`index.ts`)
│   │   ├── controllers/     # Thin HTTP controllers (`asyncHandler`, `ApiResponse`, `attachFileUrls`)
│   │   ├── services/        # Business logic, domain rules, transaction orchestration
│   │   ├── queries/         # SQL query access (`dbPool.ts`, `filterBuilder.ts`, `*.queries.ts`)
│   │   ├── models/          # Entity models & TypeScript interfaces
│   │   ├── routes/          # Express route definitions (`api/v1/...`)
│   │   ├── schemas/         # Request validation schemas (Zod/Joi)
│   │   ├── middlewares/     # Middleware (`responseTimeLogger`, `errorHandler`, `fileUrl`)
│   │   ├── utils/           # Utilities (`fileUrl.ts`, `bulkImporter.ts`, `apiError.ts`, `apiResponse.ts`)
│   │   ├── database/
│   │   │   └── migrations/  # SQL schema migrations (`snake_case.sql` WITHOUT timestamp prefixes)
│   │   └── seeds/           # CLI data seeding scripts (`npm run seed`)
│   └── docs/database/       # Schema reference docs (`schema.md`, `tables/*.md`)
│
├── web/                      # React + TypeScript + Vite + Redux Toolkit Frontend
│   ├── src/
│   │   ├── main.tsx         # Frontend React DOM entry point
│   │   ├── App.tsx          # App root component with Redux provider & Router
│   │   ├── pages/           # Page UI components (Master, Dashboard, Booth, etc.)
│   │   ├── components/      # Shared components (`common/Modal.tsx`, `common/ConfirmModal.tsx`)
│   │   ├── redux/           # Redux Toolkit state (`store.ts`, `actions/`, `slices/`)
│   │   ├── services/        # API integration client services (invoked only by Redux thunks)
│   │   ├── routes/          # Frontend routing configuration
│   │   ├── layouts/         # Page layouts (MainLayout, MasterLayout, AuthLayout)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # Frontend TypeScript interfaces
│   │   └── utils/           # Utility functions & formatters
│
├── .agents/                  # Antigravity Agent Rules & Skills
│   ├── rules/               # Modular workspace agent rules
│   └── skills/              # Specialized domain skill workbooks
│
└── AGENTS.md                 # Core Workspace Architectural Guidelines
```

## Layer Constraints
- **Controllers** must be thin: read req -> validate -> call service -> format `ApiResponse` -> return res.
- **Services** encapsulate all business logic, transactions, and multi-table queries.
- **Queries / Repositories** execute parameterized SQL via `dbPool.ts`. Never write raw database calls directly in controllers.
- **Frontend Components** must dispatch Redux actions and consume store data via `useAppSelector`. Never make direct HTTP requests inside React UI components.
