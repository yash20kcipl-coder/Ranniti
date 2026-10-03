# Workspace Guidelines & Rules

## Backend Architecture Rules

### 1. File Base URLs (`src/utils/fileUrl.ts`)
- Always use `backend/src/utils/fileUrl.ts` (`toFileUrl` or `attachFileUrls`) whenever transforming or returning file/image/avatar URLs in backend API controllers and services.
- Never hardcode hostnames or base URLs directly in database models, services, or controllers.
- Ensure all relative file paths (e.g. `/uploads/avatars/...`) pass through `attachFileUrls(payload, keys, req)` before being sent to the client.

### 2. Database Seeding
- Maintain seed data under `backend/src/seeds/`.
- Never seed data directly in production or during server initialization (`server.ts` / `app.ts`).
- Execute seeding via discrete CLI runner scripts using `npm run seed`.

### 3. API Performance & Response Time Logging
- All incoming requests must be monitored with response time tracking middleware (`src/middlewares/responseTime.middleware.ts`).
- Log execution duration in milliseconds (`ms`) and emit warning logs for slow requests exceeding threshold limits.

### 4. High-Volume Bulk Imports (100,000+ Records)
- Always use `backend/src/utils/bulkImporter.ts` (`BulkImporter.processStream` or `BulkImporter.processArray`) when handling bulk data imports.
- Never load entire 100k+ record datasets directly into memory arrays; stream CSV/JSON input and insert in batch chunks (`batchSize: 2500` to `5000`) with parallel concurrency (`concurrency: 4`).
- Ensure non-blocking validation using the `transform` hook so malformed records do not abort the entire batch stream.

### 5. Connection Safety & Resource Lifecycle (Zero Open Connections)
- Never leave database connections, pool clients, file streams, or network sockets dangling.
- Always use connection pools (`src/queries/dbPool.ts`) with configured `idleTimeoutMillis` and `connectionTimeoutMillis`.
- If acquiring a dedicated pool client (`await dbPool.connect()`), always wrap execution in `try ... finally` and invoke `client.release()` in `finally`.
- Always invoke `closeDbPool()` during server graceful shutdown (`SIGTERM`, `SIGINT`) or CLI script termination.

### 6. Database Schema & Documentation Syncing (`backend/docs/database/`)
- Whenever any database migration, table schema, column, constraint, or index is added, altered, or removed, Antigravity MUST automatically update the schema reference documentation in individual table files under `backend/docs/database/tables/<table_name>.md` and update `backend/docs/database/schema.md`.
- Keep schema table documentation files 100% in sync with migration SQL files.

### 7. Migration File Naming Convention (`backend/src/database/migrations/`)
- Never add numeric or timestamp prefixes (e.g. `17000..._`) to migration filenames under `backend/src/database/migrations/`.
- Name migration files directly using descriptive `snake_case` (e.g. `create_voters_table.sql`, `create_master_tables.sql`).

## Frontend Architecture Rules

### 8. No Fallback or Initial Static Dummy Data
- Never use initial static mock arrays or hardcoded dummy fallback data in frontend components, Redux slices, or API integration layers.
- Always perform actual API requests against backend endpoints and handle real empty/loading/error states.
- If backend data is unavailable or loading, show clean loading spinners or empty states rather than rendering hardcoded fake records.

### 9. All API Calls Must Be Dispatched Via Redux Actions
- Never make direct HTTP/Axios service API calls inside React UI components (`useEffect`, form handlers, button onClick handlers).
- Encapsulate all backend API operations (GET, POST, PUT, DELETE, etc.) inside Redux thunk actions under `src/redux/actions/`.
- React components must dispatch Redux actions (e.g. `dispatch(fetchMasterCategoryData(...))`) and consume data from the Redux store via `useAppSelector`.

### 10. Reusable Modal Component Standard (`src/components/common/Modal.tsx`)
- Never write ad-hoc inline modal overlays or fixed backdrop JSX blocks inside UI page or view components.
- Always import and use the shared `Modal` component (`src/components/common/Modal.tsx`) for form dialogs, detail popups, and user inputs, or `ConfirmModal` (`src/components/common/ConfirmModal.tsx`) for deletion/action confirmations.

### 11. Strict Single Key Access (No Fallback Logical OR `||` Chains for API Props)
- Frontend components and table renderers must access backend response properties using the single canonical camelCase key (e.g. `row.pcName`, `row.stateName`, `row.districtName`).
- Never write speculative fallback chains using logical OR (e.g. `row.pcName || row.pc_name || row.pcId`). Backend APIs must strictly provide clean, normalized camelCase response properties.

### 12. Reusable Safe Image Component Standard (`src/components/common/SafeImage.tsx`)
- Never write raw `<img />` tags with ad-hoc `onError` inline handlers or unhandled broken image sources in UI components, views, or table renderers.
- Always import and use the shared `SafeImage` component (`src/components/common/SafeImage.tsx`) for user avatars, party logos, symbols, or external image assets to ensure automatic loading skeletons, broken link fallbacks, and clean initials rendering.

### 13. Debounced API Fetching Standard (`src/hooks/useDebouncedEffect.ts`)
- Never use raw `useEffect` directly for triggering API data fetches or search side-effects on component mount or dependency changes.
- Always use `useDebouncedEffect` (`src/hooks/useDebouncedEffect.ts`) with an appropriate delay (e.g. 150-250ms). This prevents duplicate API network requests caused by React 18+ StrictMode mount/unmount/remount cycles.

### 14. Reusable Form Input Component Standard (`src/components/common/FormInput.tsx`)
- Never write ad-hoc raw `<input>`, `<select>`, or `<textarea>` JSX controls directly inside UI page components, filter bars, or form views.
- Always import and use the shared `FormInput` component (`src/components/common/FormInput.tsx`) for all user input fields, select dropdowns, search inputs, checkboxes, switches, and form controls.
- Ensures consistent visual design, accessible labels, error indicators, icon integration, and uniform right chevron arrow styling for all select dropdowns across the application.

### 15. Centralized Static Dropdown Options Standard (`src/constants/dropdownOptions.ts`)
- Never write ad-hoc inline array definitions for static UI dropdown options (such as gender, voter types, statuses, blood groups, age ranges, living/deceased flags) directly inside React page components, form views, or filter bars.
- Always import and use the centralized static dropdown option constants defined in `src/constants/dropdownOptions.ts` (e.g. `GENDER_OPTIONS`, `VOTER_TYPE_OPTIONS`, `STATUS_OPTIONS`, `IS_DEAD_OPTIONS`, `AGE_GROUP_OPTIONS`, `BLOOD_GROUP_OPTIONS`).
- Maintains uniform option labels, values, type safety, and single-source-of-truth across forms, filter bars, and modal dialogs in the application.

### 16. File Upload Component Standard (No Manual Text Path Inputs for Files/Images)
- Never use plain `<input type="text">` or raw text input boxes for user file, avatar, photo, party symbol logo, or document path entries.
- Always use the interactive `FileUploadInput` component (`src/components/common/FileUploadInput.tsx`) or `FormInput` with `type="file"` for all file uploads.
- Must enforce strict file type validation (e.g. `accept="image/*"`, allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`), max file size limit validation (e.g. 5MB), drag-and-drop support, real-time backend API file upload dispatch, and instant image preview with clear action buttons.

### 17. Clean Architecture & Dead Code Elimination (Remove Unused Files & Code)
- Always proactively prune and delete unused files, dead functions, temporary test scripts, orphaned scratch files, and unreferenced imports immediately after finishing code modifications or refactoring.
- Never leave behind obsolete, commented-out, duplicate, or unreferenced code blocks in production codebase files.
- Ensure all modules, components, actions, schemas, types, and dependencies across both backend and frontend are actively utilized, free of dead code, and strictly maintained.

### 18. Reusable Page Header Component Standard (`src/components/common/PageHeader.tsx`)
- Never write ad-hoc inline header titles, raw flex banners, or unstandardized top action button bars directly inside React UI page components or views.
- Always import and use the shared `PageHeader` component (`src/components/common/PageHeader.tsx`) for all page headers, utilizing built-in props (`title`, `subtitle`, `icon`, `badge`, `onAddClick`, `addLabel`, `onImportClick`, `onExportClick`, `onSyncClick`, `actions`).

### 19. Reusable Table Actions Component Standard (`src/components/common/TableActions.tsx`)
- Never write ad-hoc inline action button groups (edit/delete/view icon buttons) or unstandardized action cells directly inside React table renderers.
- Always import and use the shared `TableActions` component (`src/components/common/TableActions.tsx`) or `TableActionButton` for all table action columns (`onView`, `onEdit`, `onDelete`, `extra`).

### 20. Reusable Skeleton Loading Component Standard (`app/src/components/Skeleton.tsx`)
- Never write ad-hoc custom pulse views, static gray boxes, or custom animated opacity blocks for loading state placeholders inside React Native mobile screens or components.
- Always import and use the shared `Skeleton` component (`app/src/components/Skeleton.tsx` / `../../components/Skeleton`) for all screen shimmer placeholders, loading cards, list item skeletons, and image loading placeholders.
- Enforces smooth reanimated opacity transitions, theme-aware border/background colors, and consistent loading placeholder design across all mobile application screens.

### 21. Screen-Specific Component Architecture Standard (`app/src/screens/<ScreenName>/components/`)
- Screen-specific subcomponents that are exclusively used within a particular screen must be placed inside a `components/` folder directly under that screen's folder (e.g., `app/src/screens/Dashboard/components/` or `app/src/screens/<ScreenName>/components/`).
- Shared global components used across multiple screens must continue to be placed in `app/src/components/`.
- Screen index files (`index.tsx`) must remain clean, modular, and concise by delegating section layouts to dedicated subcomponents.



