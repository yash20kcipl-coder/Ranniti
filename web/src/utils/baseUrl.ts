export const FILE_BASE_URL = 'http://localhost:10001';
export const API_BASE_URL = 'http://localhost:10001/api/v1';

/**
 * Returns full URL for uploaded file paths
 */
export const getFileUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${FILE_BASE_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  FILE_BASE_URL,
  getFileUrl,
};
