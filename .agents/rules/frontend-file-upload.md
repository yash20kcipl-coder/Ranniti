# Frontend Architecture Rule: File Upload Component Standard

## Guideline
- **No Manual Text Path Inputs for Files/Images**: Never use plain `<input type="text">` or text input controls for entering file, avatar, photo, party symbol logo, or document file paths manually.
- **Interactive File Upload Standard**: Always use the shared `FileUploadInput` component (`src/components/common/FileUploadInput.tsx`) or `FormInput` with `type="file"` for all file selection and upload requirements.
- **File Type & Size Validation**:
  - Enforce client-side extension validation (e.g. `allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']`).
  - Enforce MIME type validation (e.g. `accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"`).
  - Enforce maximum file size limits (default 5MB) with immediate visual error feedback.
- **Backend API Integration**: Real-time multipart form-data file upload dispatch to `/api/v1/uploads?category=...` returning normalized relative file paths and absolute public URLs.
- **User Experience**: Provide drag-and-drop file targets, upload progress indicators, instant thumbnail previews using `SafeImage`, and quick clear/change buttons.
