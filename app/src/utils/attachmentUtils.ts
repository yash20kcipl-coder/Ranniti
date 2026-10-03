import toast from './toast';
import Storage from './storage';
import { Linking } from 'react-native';

export type DownloadItem = {
  id: string;
  fileName: string;
  url: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  localPath?: string;
  errorMessage?: string;
  timestamp: number;
};

type Listener = (downloads: DownloadItem[]) => void;
let listeners: Listener[] = [];
let downloadsList: DownloadItem[] = [];

export const initDownloadManager = async () => {
  try {
    const stored = await Storage.get('downloads_list');
    if (Array.isArray(stored)) {
      downloadsList = stored;
      notifyListeners();
    }
  } catch (e) {
    console.error('Failed to load downloads list:', e);
  }
};

const notifyListeners = () => {
  listeners.forEach((l) => l([...downloadsList]));
};

export const subscribeDownloads = (listener: Listener) => {
  listeners.push(listener);
  listener([...downloadsList]);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

export const getDownloads = () => [...downloadsList];

export const clearDownloadHistory = async () => {
  downloadsList = [];
  notifyListeners();
  await Storage.remove('downloads_list');
};

export const removeDownloadItem = async (id: string) => {
  downloadsList = downloadsList.filter((item) => item.id !== id);
  notifyListeners();
  await Storage.save('downloads_list', downloadsList);
};

export const handleNotificationClick = (data: any) => {
  console.log('Notification clicked:', data);
};

export const downloadAttachment = async (
  url: string | null | undefined,
): Promise<string | null> => {
  if (!url) {
    toast.error('Document URL is invalid.');
    return null;
  }
  Linking.openURL(url).catch(() => toast.error('Failed to open link.'));
  return url;
};

export const viewAttachment = async (
  url: string | null | undefined,
): Promise<void> => {
  if (!url) {
    toast.error('Document URL is invalid.');
    return;
  }
  Linking.openURL(url).catch(() => toast.error('Failed to open document link.'));
};
