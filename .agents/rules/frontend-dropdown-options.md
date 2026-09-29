# Centralized Static Dropdown Options Standard

All static UI dropdown options across the web application MUST use the single-source-of-truth constants file `src/constants/dropdownOptions.ts`.

## Rules

1. **No Ad-Hoc Inline Option Arrays**:
   - Never define inline array literals for static options (such as gender, voter types, statuses, blood groups, age ranges, or living/deceased flags) inside React page components, form views, or filter bars.

2. **Always Use `src/constants/dropdownOptions.ts`**:
   - Import static options directly from `@/constants/dropdownOptions`:
     - `GENDER_OPTIONS` / `FORM_GENDER_OPTIONS`
     - `VOTER_TYPE_OPTIONS` / `FORM_VOTER_TYPE_OPTIONS`
     - `STATUS_OPTIONS`
     - `IS_DEAD_OPTIONS`
     - `AGE_GROUP_OPTIONS`
     - `BLOOD_GROUP_OPTIONS`

3. **Type Safety & Consistency**:
   - Ensures uniform option labels, canonical string values, type safety, and clean maintenance across forms, filter bars, and modal dialogs in the application.
