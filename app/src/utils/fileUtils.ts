import { Platform } from "react-native";

/**
 * Standardizes local filesystem URIs across both iOS and Android 
 * for seamless injection into multipart/form-data boundaries.
 */
export const normalizeFileUri = (uri: string): string => {
  if (!uri) return "";
  if (Platform.OS === 'android') return uri;
  return uri.replace('file://', '');
};

/**
 * Constructs a React Native-compatible file object for standard multipart submissions.
 * Automatically deduces appropriate mime-types and extension footprints from the source string.
 */
export const prepareFileForUpload = (uri: string, fallbackName: string = 'file.jpg') => {
  const filename = uri.split('/').pop() || fallbackName;
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  
  // Common mobile mime mappings
  const isVideo = ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
  const mime = isVideo 
    ? `video/${ext}` 
    : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  return {
    uri: normalizeFileUri(uri),
    type: mime,
    name: filename,
  } as any;
};
