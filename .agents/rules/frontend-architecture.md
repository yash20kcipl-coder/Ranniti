# Frontend Architecture & Component Rules

All web application frontend development under `web/src/` must adhere to these standards:

## Guidelines

1. **No Fallback or Initial Static Dummy Data**:
   - Never use static mock arrays or hardcoded dummy records in React components, Redux slices, or API layers.
   - Always perform actual backend API requests and handle loading spinners, error banners, or clean empty states (`data.length === 0`).

2. **All API Calls Must Be Dispatched Via Redux Actions**:
   - Never make direct HTTP/Axios calls inside React UI components (`useEffect`, form submit handlers, button clicks).
   - Encapsulate all API calls inside Redux thunk actions under `src/redux/actions/`.
   - UI components dispatch Redux thunks (`dispatch(fetchReligions())`) and read state via `useAppSelector`.

3. **Reusable Modal Component Standard**:
   - Never build ad-hoc inline modal overlays or fixed backdrop JSX inside view pages.
   - Always import and use `Modal` (`src/components/common/Modal.tsx`) for form dialogs or `ConfirmModal` (`src/components/common/ConfirmModal.tsx`) for deletion/action confirmations.

4. **Strict Single Key Access**:
   - Components and table renderers must access response properties using canonical camelCase keys (e.g., `row.religionName`, `row.casteName`).
   - Never write speculative fallback logical OR `||` chains like `row.casteName || row.caste_name || row.id`. Backend APIs must strictly provide normalized camelCase properties.

5. **Debounced API Fetching Standard (`src/hooks/useDebouncedEffect.ts`)**:
   - Never use raw `useEffect` directly for triggering API data fetches or search side-effects on component mount or dependency changes.
   - Always use `useDebouncedEffect` (`src/hooks/useDebouncedEffect.ts`) with an appropriate delay (150-250ms).

6. **Reusable Form Input Component Standard (`src/components/common/FormInput.tsx`)**:
   - Never write ad-hoc raw `<input>`, `<select>`, or `<textarea>` JSX controls directly inside UI page components, filter bars, or form views.
   - Always import and use `FormInput` (`src/components/common/FormInput.tsx`) for form controls and selects.

7. **Centralized Static Dropdown Options Standard (`src/constants/dropdownOptions.ts`)**:
   - Never write ad-hoc inline array definitions for static UI dropdown options (gender, voter types, statuses, blood groups, age ranges, living/deceased flags) inside React components or filter bars.
   - Always import and use centralized constants defined in `src/constants/dropdownOptions.ts` (e.g., `GENDER_OPTIONS`, `VOTER_TYPE_OPTIONS`, `STATUS_OPTIONS`, `IS_DEAD_OPTIONS`, `AGE_GROUP_OPTIONS`, `BLOOD_GROUP_OPTIONS`).

8. **File Upload Component Standard (No Manual Text Path Inputs for Files/Images)**:
   - Never use plain `<input type="text">` or raw text input boxes for entering user file, avatar, photo, party symbol logo, or document path strings.
   - Always use the interactive `FileUploadInput` component (`src/components/common/FileUploadInput.tsx`) or `FormInput` with `type="file"`.
   - Must enforce client/server file type validation (allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`, MIME types), max file size limits (5MB), drag-and-drop support, real-time backend API file upload dispatch, and instant image preview with clear action buttons.

9. **Reusable Safe Image Component Standard (`src/components/common/SafeImage.tsx`)**:
   - Never write raw `<img />` tags with ad-hoc `onError` inline handlers or unhandled broken image sources in UI components, views, or table renderers.
   - Always import and use `SafeImage` (`src/components/common/SafeImage.tsx`) for user avatars, party logos, symbols, or external image assets to ensure automatic loading skeletons, broken link fallbacks, and clean initials rendering.

10. **Reusable Page Header Component Standard (`src/components/common/PageHeader.tsx`)**:
    - Never write ad-hoc inline header titles, raw flex banners, or unstandardized top action button bars directly inside React UI page components or views.
    - Always import and use `PageHeader` (`src/components/common/PageHeader.tsx`) for all page headers, utilizing built-in props (`title`, `subtitle`, `icon`, `badge`, `onAddClick`, `addLabel`, `onImportClick`, `onExportClick`, `onSyncClick`, `actions`).

11. **Reusable Table Actions Component Standard (`src/components/common/TableActions.tsx`)**:
    - Never write ad-hoc inline action button groups (edit/delete/view icon buttons) or unstandardized action cells directly inside React table renderers.
    - Always import and use `TableActions` (`src/components/common/TableActions.tsx`) or `TableActionButton` for all table action columns (`onView`, `onEdit`, `onDelete`, `extra`).

12. **Clean Architecture & Dead Code Elimination**:
    - Always proactively prune and delete unused files, dead functions, temporary test scripts, orphaned scratch files, and unreferenced imports immediately after finishing code modifications or refactoring.
    - Never leave behind obsolete, commented-out, duplicate, or unreferenced code blocks in production codebase files.


