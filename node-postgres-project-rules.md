# Node.js + PostgreSQL Project — Development Rules & Skills

## 1. General Principles

* Write production-ready, maintainable, scalable code.
* Prefer simple and explicit solutions over unnecessary abstraction.
* Follow SOLID principles where they provide real value.
* Keep business logic separate from HTTP/controller logic.
* Do not duplicate business logic across controllers.
* Avoid unnecessary dependencies.
* Never introduce a library when native Node.js functionality is sufficient.
* Prefer TypeScript over JavaScript.
* Use `async/await`; avoid callback-based code unless required by a dependency.
* Never ignore errors.
* Never use `any` unless there is a documented technical reason.
* Do not commit secrets, API keys, passwords, tokens, or private credentials.

---

# 2. Workspace Architecture & Folder Structure

Ranniti uses a full-stack dual-workspace monorepo containing `backend/` (Node.js + Express + TypeScript + PostgreSQL) and `web/` (React + TypeScript + Vite + Redux Toolkit).

```text
Ranniti Workspace Root/
├── backend/                  # Node.js + Express + TypeScript + PostgreSQL Backend
│   ├── src/
│   │   ├── app.ts           # Express Application setup, middleware stack & route mounting
│   │   ├── server.ts        # HTTP Server listener, connection pool lifecycle & shutdown
│   │   ├── config/          # Environment configuration (`index.ts`)
│   │   ├── controllers/     # Thin HTTP controllers (`asyncHandler`, `ApiResponse`, `attachFileUrls`)
│   │   ├── services/        # Business logic, domain rules, & multi-query orchestration
│   │   ├── queries/         # Database access (`dbPool.ts`, `filterBuilder.ts`, `*.queries.ts`)
│   │   ├── models/          # Entity models & TypeScript interfaces (`*.model.ts`)
│   │   ├── routes/          # Express route definitions (`api/v1/...`)
│   │   ├── schemas/         # Request validation schemas (Zod/Joi)
│   │   ├── middlewares/     # Middlewares (`responseTimeLogger`, `errorHandler`, `fileUrl`)
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
└── AGENTS.md                 # Primary Workspace Guidelines & Rule Standard
```

## Mandatory Ranniti Architectural Rules

1. **File Base URLs (`backend/src/utils/fileUrl.ts`)**: Always pass file/avatar paths through `attachFileUrls(payload, keys, req)` or `toFileUrl(path, req)`. Never hardcode domain or localhost URLs in models or controllers.
2. **Database Seeding (`backend/src/seeds/`)**: Maintain seed data in `backend/src/seeds/` and run via CLI scripts (`npm run seed`). Never seed inside `app.ts` or production startup.
3. **API Performance Monitoring (`src/middlewares/responseTime.middleware.ts`)**: Every request passes through response time logging middleware. Track execution duration in `ms`.
4. **High-Volume Bulk Imports (100,000+ Records)**: Use `backend/src/utils/bulkImporter.ts` (`BulkImporter.processStream` / `processArray`) with stream processing, batch chunks (`batchSize: 2500 - 5000`), parallel concurrency (`concurrency: 4`), and non-blocking `transform` validation.
5. **Connection Safety & Lifecycle**: Wrap acquired pool clients in `try ... finally` with `client.release()`. Always call `closeDbPool()` during server shutdown.
6. **Database Schema & Documentation Syncing**: Update `backend/docs/database/tables/<table_name>.md` and `backend/docs/database/schema.md` whenever migrations alter SQL schema.
7. **Migration Naming Convention**: Name migration files in `backend/src/database/migrations/` directly in `snake_case.sql` (e.g. `create_master_tables.sql`). Never use numeric or timestamp prefixes.
8. **No Frontend Fallback / Mock Data**: Perform actual API calls. Show clean loading spinners or empty states (`data.length === 0`). Never use hardcoded fallback arrays in React components.
9. **Redux Thunk Dispatch Standard**: Encapsulate all frontend API operations inside Redux thunks (`src/redux/actions/`). React UI components dispatch actions and read via `useAppSelector`.
10. **Reusable Modal Standard**: Always use `Modal` (`src/components/common/Modal.tsx`) or `ConfirmModal` (`src/components/common/ConfirmModal.tsx`).
11. **Strict Single Key Access**: Access backend response properties using exact canonical camelCase keys (`row.casteName`). Never use speculative fallback chains (`row.casteName || row.caste_name`).

---

# 3. Controller Rules

Controllers should be thin.

A controller should:

1. Read request data.
2. Validate input.
3. Call the service.
4. Return the response.

Controllers must NOT contain complex business logic.

### Good (Ranniti Standard)

```ts
export class MasterController {
  createReligion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    const religion = await masterService.createReligion(name);
    const response = ApiResponse.success(religion, 'Religion created successfully', 201);
    res.status(response.statusCode).json(response.body);
  });
}
```

### Avoid

```ts
async function createUser(req: Request, res: Response) {
  // validation
  // password hashing
  // duplicate checking
  // database queries
  // business rules
  // email sending
  // response formatting
}
```

Move business logic into services.

---

# 4. Service Rules

Services contain business logic.

A service may:

* Apply business rules.
* Coordinate multiple repositories.
* Manage transactions.
* Call external services.
* Transform domain data.
* Enforce authorization rules.

Services should not depend directly on Express request/response objects.

### Avoid

```ts
async function createUser(req: Request, res: Response) {}
```

### Prefer

```ts
async function createUser(input: CreateUserInput) {}
```

This makes services easier to test and reuse.

---

# 5. Repository Rules

Repositories are responsible for database interaction.

Repository code should:

* Execute SQL/query-builder/ORM operations.
* Map database records to application models where appropriate.
* Handle database-specific concerns.
* Avoid business decisions.

Example:

```ts
async function findUserByEmail(email: string) {
  return db.query(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
}
```

Do not put business rules inside repositories.

---

# 6. PostgreSQL Rules

PostgreSQL should be treated as a critical part of the application architecture.

## Always use parameterized queries

### Correct

```ts
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email],
);
```

### Never

```ts
await db.query(
  `SELECT * FROM users WHERE email = '${email}'`,
);
```

Never concatenate user input into SQL.

---

# 7. Database Schema Rules

Every table should normally have:

```sql
id
created_at
updated_at
```

Example:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Prefer:

* `UUID` for public identifiers.
* `TIMESTAMPTZ` instead of `TIMESTAMP` for application timestamps.
* `TEXT`/`VARCHAR` based on actual requirements.
* PostgreSQL constraints instead of relying only on application validation.

---

# 8. Database Constraints

Important business invariants should be enforced by PostgreSQL.

For example:

```sql
email TEXT NOT NULL UNIQUE
```

is better than only checking uniqueness in Node.js.

Use:

* `NOT NULL`
* `UNIQUE`
* `PRIMARY KEY`
* `FOREIGN KEY`
* `CHECK`
* appropriate indexes

Application validation and database constraints should complement each other.

---

# 9. Foreign Keys

Use foreign keys for relationships.

Example:

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

Choose `CASCADE`, `RESTRICT`, or `SET NULL` intentionally based on business requirements.

Never add cascading deletes without understanding their impact.

---

# 10. Indexing Rules

Do not create indexes blindly.

Add indexes for:

* Frequently searched columns.
* Foreign keys where appropriate.
* Sorting/filtering columns.
* Unique constraints.
* Common query combinations.

Example:

```sql
CREATE INDEX idx_users_created_at
ON users(created_at);
```

For multi-column queries:

```sql
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);
```

Before adding indexes to performance-critical queries, inspect query plans with:

```sql
EXPLAIN ANALYZE
```

Avoid excessive indexes because indexes increase:

* Storage.
* INSERT cost.
* UPDATE cost.
* DELETE cost.

---

# 11. Transactions

Use transactions whenever multiple database operations must succeed or fail together.

Example:

```ts
const client = await pool.connect();

try {
  await client.query('BEGIN');

  // operation 1
  // operation 2
  // operation 3

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

Never manually simulate transactions in application memory.

---

# 12. Transaction Rules

A transaction should be:

* As short as possible.
* Focused on database operations.
* Rolled back on failure.
* Released correctly.

Do not perform slow external API calls inside a database transaction unless absolutely necessary.

---

# 13. API Design

Use RESTful conventions unless the project explicitly requires another style.

Example:

```text
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

Use API versioning when appropriate:

```text
/api/v1/...
```

---

# 14. HTTP Status Codes

Use meaningful HTTP status codes.

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
503 Service Unavailable
```

Do not return `200` for every situation.

---

# 15. Response Format

Use a consistent response structure.

### Success

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

For list APIs:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Do not expose internal database errors directly to clients.

---

# 16. Validation

Validate all external input.

External input includes:

* `req.body`
* `req.params`
* `req.query`
* Headers
* Webhooks
* External API responses
* File uploads

Use a schema validation library such as:

* Zod
* Joi
* Valibot

Example:

```ts
const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8),
});
```

Never assume client input is valid.

---

# 17. Authentication

Authentication must be implemented centrally.

Do not duplicate authentication logic across controllers.

For JWT-based authentication:

```text
Request
  ↓
Auth Middleware
  ↓
Token Verification
  ↓
User Identification
  ↓
Authorization
  ↓
Controller
```

Never trust a user ID supplied by the client when it can be derived from authenticated identity.

---

# 18. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Implement authorization separately.

Example:

```ts
if (user.role !== 'admin') {
  throw new ForbiddenError();
}
```

For resource ownership:

```ts
if (resource.userId !== currentUser.id) {
  throw new ForbiddenError();
}
```

Never rely only on frontend authorization.

---

# 19. Password Security

Never store plain-text passwords.

Use a strong password hashing algorithm such as:

* Argon2id
* bcrypt

Example:

```ts
const passwordHash = await argon2.hash(password);
```

Never log:

```text
password
passwordHash
accessToken
refreshToken
authorization headers
```

---

# 20. Environment Variables

All environment-specific configuration must come from environment variables.

Example:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://...

JWT_SECRET=...

REDIS_URL=...
```

Never hardcode secrets.

Create typed environment configuration:

```ts
const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT ?? 3000),
};
```

Validate required environment variables during application startup.

Fail fast when required configuration is missing.

---

# 21. Error Handling

Use centralized error handling.

Create typed application errors:

```ts
class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
```

Example:

```ts
throw new AppError(
  'USER_NOT_FOUND',
  404,
  'User not found',
);
```

Do not use:

```ts
throw new Error('Something went wrong');
```

for every business error.

---

# 22. Never Leak Internal Errors

Do not send:

```json
{
  "error": "PostgresError: relation users does not exist..."
}
```

to users.

Instead:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

Log the detailed error internally.

---

# 23. Logging

Use structured logging.

Recommended libraries:

* Pino
* Winston

Example:

```ts
logger.info(
  {
    userId,
    requestId,
  },
  'User created',
);
```

Avoid:

```ts
console.log(user);
```

especially in production.

Never log secrets or sensitive personal information.

---

# 24. Request IDs

Every request should have a request/correlation ID.

Example:

```text
requestId: 7c9d...
```

Include it in logs so a request can be traced across:

```text
HTTP request
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
PostgreSQL
   ↓
External service
```

---

# 25. Security Rules

Always consider:

* SQL injection
* XSS
* CSRF where applicable
* SSRF
* Broken authentication
* Broken authorization
* Rate limiting
* Brute-force attacks
* Excessive request payloads
* File upload attacks
* Dependency vulnerabilities

Use security middleware where appropriate.

For Express applications, consider:

```ts
helmet()
```

Add rate limiting to authentication and other sensitive endpoints.

---

# 26. Pagination

Never return unlimited database records.

Bad:

```sql
SELECT * FROM users;
```

for potentially large datasets.

Use:

```text
?page=1&limit=20
```

and enforce maximum limits.

Example:

```ts
const limit = Math.min(requestedLimit, 100);
```

For very large datasets or frequently changing data, consider cursor-based pagination.

---

# 27. Sorting and Filtering

Never directly inject client-provided column names into SQL.

Bad:

```ts
`ORDER BY ${req.query.sort}`
```

Use an allowlist:

```ts
const allowedSortFields = {
  name: 'name',
  createdAt: 'created_at',
};
```

Then map the client value to a trusted SQL identifier.

---

# 28. Database Migrations

Database schema changes must be version-controlled.

Never manually modify production schema without a migration.

Example:

```text
migrations/
├── 001_create_users.sql
├── 002_create_roles.sql
├── 003_add_user_status.sql
└── 004_create_indexes.sql
```

Every schema change should have a migration.

Migrations should be:

* Reproducible.
* Version-controlled.
* Reviewable.
* Safe to execute.

---

# 29. Seed Data

Keep development/test seed data separate from production data.

Example:

```text
database/
├── migrations/
└── seeds/
    ├── development/
    └── test/
```

Never put real user credentials or production data in seeds.

---

# 30. SQL Style

Use readable SQL.

Prefer:

```sql
SELECT
    id,
    email,
    created_at
FROM users
WHERE id = $1;
```

instead of:

```sql
select * from users where id=$1
```

Avoid `SELECT *` in application queries when a stable column set is known.

Explicit columns make API/database changes safer.

---

# 31. Database Connection Pool

Use a PostgreSQL connection pool.

Do not create a new database connection for every request.

Example:

```ts
const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
});
```

Configure pool size based on:

* Application instances.
* PostgreSQL capacity.
* Query workload.

Do not blindly increase pool size.

---

# 32. N+1 Query Prevention

Avoid patterns such as:

```text
Get 100 users
    ↓
Query posts for user 1
Query posts for user 2
Query posts for user 3
...
```

Prefer:

* Joins.
* Batch queries.
* Aggregation.
* Data loaders where appropriate.

Always inspect database query counts for frequently used endpoints.

---

# 33. TypeScript Rules

Enable strict mode:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Avoid:

```ts
const data: any = ...
```

Prefer:

```ts
const data: User = ...
```

Use:

```ts
unknown
```

instead of `any` when the type is genuinely unknown.

---

# 34. Naming

Use descriptive names.

### Files

```text
user.service.ts
user.repository.ts
user.controller.ts
```

### Functions

```ts
findUserById()
createUser()
updateUserProfile()
deleteUser()
```

Avoid:

```ts
doStuff()
handleData()
process()
```

unless the meaning is genuinely clear.

---

# 35. Async Code

Prefer:

```ts
try {
  const user = await userService.findById(id);
} catch (error) {
  ...
}
```

Avoid unnecessary promise nesting.

Do not mix:

```ts
.then()
```

and:

```ts
await
```

without a reason.

---

# 36. External Services

External API calls should be isolated behind service/client modules.

Example:

```text
services/
├── email/
├── payment/
├── storage/
└── notification/
```

Do not scatter HTTP requests throughout controllers.

Use:

* Timeouts.
* Retries where safe.
* Error handling.
* Circuit-breaking strategies where necessary.
* Idempotency for retryable operations.

Never retry non-idempotent operations blindly.

---

# 37. Caching

Do not add caching without understanding:

* Cache invalidation.
* TTL.
* Consistency requirements.
* Memory usage.

Use Redis or another dedicated cache when appropriate.

Never treat cache as the source of truth unless the architecture explicitly requires it.

PostgreSQL remains the source of truth for persistent relational data unless otherwise designed.

---

# 38. Testing

Every important business rule should have tests.

Use three levels:

```text
Unit Tests
    ↓
Integration Tests
    ↓
E2E Tests
```

### Unit tests

Test:

* Services.
* Business rules.
* Utilities.

### Integration tests

Test:

* PostgreSQL queries.
* Repositories.
* Transactions.

### E2E tests

Test:

```text
HTTP request
    ↓
Middleware
    ↓
Controller
    ↓
Service
    ↓
Database
```

---

# 39. Test Database

Integration tests should use a dedicated PostgreSQL database.

Never run destructive tests against development or production databases.

Prefer isolated test data and deterministic cleanup.

---

# 40. Testing Database Transactions

Test failure scenarios.

For example:

```text
Create order
    ↓
Create payment
    ↓
Payment fails
    ↓
Rollback order
```

Verify that the database remains consistent.

---

# 41. API Documentation

Document public APIs.

Use OpenAPI/Swagger where appropriate.

Document:

* Endpoint.
* Method.
* Authentication.
* Request body.
* Query parameters.
* Response.
* Error responses.

---

# 42. Git Rules

Use small, focused commits.

Good:

```text
feat: add user registration
fix: handle duplicate email
refactor: extract user repository
test: add user service tests
```

Avoid:

```text
update stuff
changes
fix
final
```

Never commit:

```text
.env
.env.local
node_modules/
logs/
coverage/
```

unless explicitly required.

---

# 43. Code Review Rules

Before merging code, verify:

* No secrets.
* No SQL injection risks.
* Input validation exists.
* Authorization is enforced.
* Errors are handled.
* Database queries are parameterized.
* Transactions are correct.
* Tests are included.
* No unnecessary dependencies.
* No obvious N+1 queries.
* Logging does not expose sensitive data.
* API responses follow project conventions.

---

# 44. Performance Rules

Do not optimize based on assumptions.

Measure first.

Check:

* Database query execution time.
* `EXPLAIN ANALYZE`.
* API response time.
* Memory usage.
* CPU usage.
* Connection pool utilization.

Optimize the actual bottleneck.

---

# 45. Graceful Shutdown

The application must gracefully close resources.

On shutdown:

```text
Stop accepting requests
        ↓
Finish active requests
        ↓
Close database pool
        ↓
Close Redis connections
        ↓
Close other resources
        ↓
Exit
```

Handle:

```text
SIGTERM
SIGINT
```

especially for Docker/Kubernetes deployments.

---

# 46. Health Checks

Provide health endpoints.

Example:

```text
GET /health
GET /health/ready
```

Distinguish:

```text
liveness
readiness
```

Readiness should verify dependencies required to serve traffic, such as PostgreSQL.

Do not expose sensitive infrastructure information in public health responses.

---

# 47. Background Jobs

Long-running tasks should not block HTTP requests.

Examples:

```text
Email sending
Report generation
Image processing
Notifications
Data synchronization
```

Use a queue/background worker architecture when appropriate.

Example:

```text
API
 ↓
Queue
 ↓
Worker
 ↓
PostgreSQL / External API
```

---

# 48. Idempotency

Operations involving payments, orders, subscriptions, or external side effects should consider idempotency.

For example:

```http
Idempotency-Key: abc123
```

The same request should not accidentally create two orders/payments.

---

# 49. Time and Dates

Store timestamps in PostgreSQL using:

```sql
TIMESTAMPTZ
```

Store/communicate timestamps in UTC.

Convert to local timezone only at the presentation layer unless business requirements require otherwise.

Never rely on server local timezone.

---

# 50. Business Logic Rules

Business rules must have one source of truth.

Avoid:

```text
Frontend validation
Backend validation
Controller business logic
Repository business logic
Database trigger
```

all implementing slightly different versions of the same rule.

The backend service should own application business rules, while PostgreSQL should enforce data integrity constraints.

---

# 51. AI Coding Rules

When modifying this project:

1. First understand the existing architecture.
2. Do not rewrite working architecture unnecessarily.
3. Reuse existing utilities and services.
4. Search the codebase before creating a new utility.
5. Follow existing naming conventions.
6. Follow existing database conventions.
7. Do not introduce a new dependency without justification.
8. Do not change database schema without a migration.
9. Do not modify unrelated files.
10. Preserve backward compatibility unless explicitly requested.
11. Add tests for meaningful behavior changes.
12. Check TypeScript compilation after changes.
13. Check linting after changes.
14. Check affected tests after changes.
15. Explain important architectural decisions.

---

# 52. AI Database Rules

Before modifying PostgreSQL:

1. Inspect the existing schema.
2. Identify foreign-key relationships.
3. Check existing indexes.
4. Check existing migrations.
5. Understand existing constraints.
6. Avoid destructive changes.
7. Create a migration for schema changes.
8. Consider existing production data.
9. Consider rollback strategy.
10. Test the migration.

Never execute destructive SQL merely to make a development error disappear.

Never suggest:

```sql
DROP DATABASE
```

or:

```sql
DROP TABLE
```

as a first-line solution.

---

# 53. AI Debugging Rules

When debugging:

```text
1. Reproduce
2. Identify exact error
3. Find root cause
4. Inspect related code
5. Make the smallest safe change
6. Run tests
7. Verify regression
```

Do not hide errors with:

```ts
try {
  ...
} catch {
  return null;
}
```

unless silently ignoring the failure is an intentional business requirement.

---

# 54. Dependency Rules

Before adding a package, ask:

1. Is it actually necessary?
2. Does Node.js already provide this functionality?
3. Is the package actively maintained?
4. Does it introduce security risks?
5. Does it increase bundle/deployment size?
6. Does it duplicate an existing dependency?

Prefer fewer, well-maintained dependencies.

---

# 55. Production Readiness Checklist

Before production deployment:

```text
[ ] TypeScript builds successfully
[ ] Lint passes
[ ] Unit tests pass
[ ] Integration tests pass
[ ] E2E tests pass
[ ] Environment variables validated
[ ] Database migrations tested
[ ] Database backups configured
[ ] Authentication verified
[ ] Authorization verified
[ ] Rate limiting configured
[ ] Security headers configured
[ ] Logging configured
[ ] Error monitoring configured
[ ] Health checks configured
[ ] Graceful shutdown implemented
[ ] PostgreSQL connection pool configured
[ ] API documentation updated
[ ] Secrets removed from source code
[ ] Debug logging removed
[ ] CORS configured correctly
[ ] Production NODE_ENV configured
```

---

# 56. Golden Rules

Always follow these rules:

### Rule 1

**Never trust client input.**

### Rule 2

**Never concatenate user input into SQL.**

### Rule 3

**Never store passwords in plain text.**

### Rule 4

**Never expose internal errors to users.**

### Rule 5

**Never put complex business logic inside controllers.**

### Rule 6

**Never change PostgreSQL schema without a migration.**

### Rule 7

**Never hardcode secrets.**

### Rule 8

**Never return unlimited database records.**

### Rule 9

**Never ignore errors silently.**

### Rule 10

**Never optimize without measuring.**

### Rule 11

**Keep PostgreSQL responsible for data integrity.**

### Rule 12

**Keep business rules in the service/domain layer.**

### Rule 13

**Keep database access in repositories/data-access modules.**

### Rule 14

**Keep controllers thin.**

### Rule 15

**Prefer readable, boring, predictable code over clever code.**

---

# Final Development Philosophy

The project should prioritize:

```text
Correctness
    ↓
Security
    ↓
Maintainability
    ↓
Testability
    ↓
Performance
    ↓
Developer Experience
```

Do not sacrifice correctness or security for premature optimization.

Every feature should be designed with:

```text
API
 ↓
Validation
 ↓
Authorization
 ↓
Business Logic
 ↓
Database
 ↓
Error Handling
 ↓
Testing
 ↓
Observability
```

in mind.
