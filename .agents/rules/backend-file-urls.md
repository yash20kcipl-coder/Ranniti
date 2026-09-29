# Backend File URL Standard Rule

Always use the file URL utility module located at `backend/src/utils/fileUrl.ts` (`toFileUrl` or `attachFileUrls`) whenever handling file paths, image paths, avatars, or media URLs in backend API controllers and services.

## Guidelines
1. **Never Hardcode Base URLs**: Do not manually concatenate `http://localhost:...` or domain strings to file paths in controllers or database models.
2. **Use `attachFileUrls` for Objects and Collections**: Wrap API response payloads with `attachFileUrls(data, customKeys?, req)` before returning JSON to client endpoints.
3. **Use `toFileUrl` for Single File Strings**: Convert single relative file paths (e.g. `/uploads/avatars/user.png`) using `toFileUrl(path, req)`.
4. **Environment Driven**: Rely on `FILE_BASE_URL` defined in `.env` and loaded via `src/config/index.ts`.
