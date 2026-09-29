/**
 * Unwraps nested event/file objects if an object wrapper like { target: { value: ... } }
 * or { file: ... } was stored in state.
 */
function unwrapValue(val: any): any {
  if (!val) return val;
  if (val instanceof File || val instanceof Blob) return val;
  if (typeof val === 'object') {
    if ('target' in val && val.target && 'value' in val.target) {
      return unwrapValue(val.target.value);
    }
    if ('file' in val && val.file) {
      return unwrapValue(val.file);
    }
    if (Object.keys(val).length === 0) {
      return null;
    }
  }
  return val;
}

/**
 * Converts a JS object into FormData if any value in the object is a File or Blob.
 * Returns normalized payload or FormData ready for direct multipart submit.
 */
export function toFormDataOrJson(payload: Record<string, any>): FormData | Record<string, any> {
  if (!payload || typeof payload !== 'object' || payload instanceof FormData) {
    return payload;
  }

  // Normalize payload values to extract any unwrapped File or string values
  const normalizedPayload: Record<string, any> = {};
  for (const key of Object.keys(payload)) {
    const unwrapped = unwrapValue(payload[key]);
    if (typeof unwrapped === 'string' && (unwrapped === '{}' || unwrapped === '[object Object]')) {
      normalizedPayload[key] = null;
    } else {
      normalizedPayload[key] = unwrapped;
    }
  }

  const hasFile = Object.values(normalizedPayload).some(
    (val) => val instanceof File || val instanceof Blob
  );

  if (!hasFile) {
    return normalizedPayload;
  }

  const formData = new FormData();
  for (const key of Object.keys(normalizedPayload)) {
    const val = normalizedPayload[key];
    if (val === undefined || val === null) {
      continue;
    }
    if (val instanceof File || val instanceof Blob) {
      formData.append(key, val);
    } else if (typeof val === 'boolean' || typeof val === 'number') {
      formData.append(key, String(val));
    } else if (typeof val === 'object') {
      if (Object.keys(val).length === 0) {
        continue;
      }
      formData.append(key, JSON.stringify(val));
    } else {
      formData.append(key, val);
    }
  }
  return formData;
}
