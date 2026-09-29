# Node.js + Express + TypeScript Production Architecture

A robust, modular, and scalable Node.js REST API template built with Express, TypeScript, Zod, and software design best practices.

---

## 📁 Project Directory Structure

```text
backend/
├── src/
│   ├── config/             # App configuration & environment parsing
│   │   └── index.ts
│   ├── controllers/        # Request handlers (processes HTTP request/response)
│   │   ├── health.controller.ts
│   │   └── user.controller.ts
│   ├── middlewares/        # Custom Express middlewares
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── models/             # Data models & interfaces
│   │   └── user.model.ts
│   ├── routes/             # API Route definitions & routing table
│   │   ├── health.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── schemas/            # Zod validation schemas
│   │   └── user.schema.ts
│   ├── services/           # Business logic layer (decoupled from HTTP)
│   │   └── user.service.ts
│   ├── utils/              # Reusable helper utilities
│   │   ├── apiError.ts
│   │   ├── apiResponse.ts
│   │   ├── asyncHandler.ts
│   │   └── logger.ts
│   ├── app.ts              # Express application setup
│   └── server.ts           # HTTP server entrypoint & graceful shutdown
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # NPM dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Documentation
```

---

## 🏗️ Architecture Design Principles

1. **Separation of Concerns (Layered Architecture)**:
   - **Routes**: Define endpoint URLs and attach middlewares + controllers.
   - **Controllers**: Handle HTTP requests, call services, and return formatted responses.
   - **Services**: Contain business logic, domain rules, and data operations (independent of Express).
   - **Models**: Define data structures, interfaces, and database schemas.
   - **Middlewares**: Cross-cutting concerns like input validation, authentication, and error handling.

2. **Type Safety & Validation**:
   - Strict TypeScript configuration (`strict: true`).
   - Request body, query, and params validation using **Zod**.

3. **Centralized Error Handling**:
   - `ApiError` class for consistent HTTP error status codes.
   - `asyncHandler` wrapper eliminates tedious `try/catch` boilerplate in controllers.
   - `errorHandler` middleware formats error output based on environment (`development` vs `production`).

4. **Production Readiness**:
   - Security headers with `helmet`.
   - Cross-Origin Resource Sharing with `cors`.
   - Environment variable management using `dotenv`.
   - Graceful shutdown handling for `SIGTERM` and `SIGINT` signals.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run in Development Mode
Starts server with auto-reloading via `tsx`:
```bash
npm run dev
```

### 4. Type Check & Build
```bash
# Type check without emitting files
npm run typecheck

# Build to JS dist folder
npm run build
```

### 5. Start Production Server
```bash
npm start
```

---

## 🌐 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check & system status |
| `GET` | `/api/v1/users` | List all users |
| `GET` | `/api/v1/users/:id` | Get user by ID |
| `POST` | `/api/v1/users` | Create new user (validated with Zod) |
| `PUT` | `/api/v1/users/:id` | Update user details |
| `DELETE` | `/api/v1/users/:id` | Delete user by ID |
