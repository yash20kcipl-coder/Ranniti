import toast from './toast';
import Storage from './storage';
import { Platform, Linking } from 'react-native';
import { navigate } from '../navigation/navigationUtils';
import ReactNativeBlobUtil from 'react-native-blob-util';
import notifee, { EventType } from '@notifee/react-native';
import { viewDocument } from '@react-native-documents/viewer';

// ─── Types & State ───────────────────────────────────────────────────────────
export type DownloadItem = {
  id: string;
  fileName: string;
  url: string;
  progress: number; // 0 to 100
  status: 'downloading' | 'completed' | 'error';
  localPath?: string;
  errorMessage?: string;
  timestamp: number;
};

type Listener = (downloads: DownloadItem[]) => void;
let listeners: Listener[] = [];
let downloadsList: DownloadItem[] = [];

// Initialize & Load from Storage
export const initDownloadManager = async () => {
  try {
    const stored = await Storage.get('downloads_list');
    if (Array.isArray(stored)) {
      // Interrupted downloads from last session are set to error
      downloadsList = stored.map((item) => {
        if (item.status === 'downloading') {
          return { ...item, status: 'error', errorMessage: 'Download interrupted.' };
        }
        return item;
      });
      notifyListeners();
    }

    // Check if the app was opened via notification click from killed state
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      const { notification } = initialNotification;
      if (notification?.data?.screen === 'downloads') {
        navigate('downloads');
      }
    }
  } catch (e) {
    console.error('Failed to load downloads list:', e);
  }
};

const saveDownloads = async () => {
  try {
    await Storage.save('downloads_list', downloadsList);
  } catch (e) {
    console.error('Failed to save downloads list:', e);
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
  await saveDownloads();
};

export const removeDownloadItem = async (id: string) => {
  downloadsList = downloadsList.filter((item) => item.id !== id);
  notifyListeners();
  await saveDownloads();
};

import { store } from '../store/store';
import { markNotificationAsReadAction } from '../store/actions/notification';
import { SCREENS } from '../navigation/constants';

// ─── Notifee Click Handlers ──────────────────────────────────────────────────
export const handleNotificationClick = (data: any) => {
  if (!data) return;

  const { refType, refId, id, notificationId } = data;
  const notifId = id || notificationId;

  console.log('Notification clicked:', notifId, refType, refId);

  if (notifId) {
    store.dispatch(markNotificationAsReadAction(notifId) as any);
  }

  if (refType) {
    const type = String(refType).toLowerCase();
    switch (type) {
      case 'notice':
        if (refId) navigate(SCREENS.NOTICE_DETAIL, { noticeId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'homework':
        if (refId) navigate(SCREENS.HOMEWORK_DETAIL, { homeworkId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'exam':
      case 'exams':
        if (refId) navigate(SCREENS.EXAMS_DETAIL, { examId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'leave':
      case 'leaves':
        if (refId) navigate(SCREENS.LEAVE_DETAIL, { leaveId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'event':
      case 'events':
        if (refId) navigate(SCREENS.EVENT_DETAIL, { eventId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'meeting':
        if (refId) navigate(SCREENS.MEETING_DETAIL, { meetingId: refId });
        else navigate(SCREENS.NOTIFICATIONS);
        break;
      case 'fee':
      case 'fees':
        navigate(SCREENS.STUDENT_FEES);
        break;
      case 'attendance':
        navigate(SCREENS.STUDENT_ATTENDANCE_HUB);
        break;
      case 'salary':
      case 'salaries':
        if (data.userType === 'staff' || data.userType === 'teacher') {
          navigate(SCREENS.TEACHER_MAIN, { screen: SCREENS.MY_SALARY });
        } else {
          navigate(SCREENS.MY_SALARY);
        }
        break;
      case 'inquiry':
        navigate(SCREENS.DASHBOARD);
        break;
      case 'grievance':
      case 'grievances':
        navigate(SCREENS.MY_GRIEVANCES);
        break;
      case 'app_version':
        if (refId) {
          Linking.openURL(refId).catch((err) => {
            console.warn('Failed to open store URL:', err);
            navigate(SCREENS.NOTIFICATIONS);
          });
        } else {
          navigate(SCREENS.NOTIFICATIONS);
        }
        break;
      default:
        navigate(SCREENS.NOTIFICATIONS);
        break;
    }
  } else {
    navigate(SCREENS.NOTIFICATIONS);
  }
};

notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    if (data?.screen === 'downloads') {
      navigate('downloads');
    } else {
      handleNotificationClick(data);
    }
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail.notification?.data;
    if (data?.screen === 'downloads') {
      navigate('downloads');
    } else {
      handleNotificationClick(data);
    }
  }
});

// Trigger Local Success Notification
const triggerSuccessNotification = async (fileName: string) => {
  try {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'downloads_channel',
      name: 'Downloads Channel',
      importance: 4, // High importance
    });

    await notifee.displayNotification({
      title: 'Download Completed',
      body: `${fileName} downloaded successfully.`,
      data: {
        screen: 'downloads',
      },
      android: {
        channelId,
        smallIcon: '@mipmap/ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  } catch (err) {
    console.error('Failed to trigger success notification:', err);
  }
};

// Trigger Local Error Notification
const triggerErrorNotification = async (fileName: string, errorMessage: string) => {
  try {
    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'downloads_channel',
      name: 'Downloads Channel',
      importance: 4, // High importance
    });

    await notifee.displayNotification({
      title: 'Download Failed',
      body: `Failed to download ${fileName}: ${errorMessage}`,
      data: {
        screen: 'downloads',
      },
      android: {
        channelId,
        smallIcon: '@mipmap/ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  } catch (err) {
    console.error('Failed to trigger error notification:', err);
  }
};

const getFileNameFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1] || `attachment_${Date.now()}`;
};

// ─── Download Attachment ────────────────────────────────────────────────────
export const downloadAttachment = async (
  url: string | null | undefined,
  customFileName?: string
): Promise<string | null> => {
  if (!url) {
    toast.error('Document URL is invalid.');
    return null;
  }

  const fileName = customFileName || getFileNameFromUrl(url);
  const { dirs } = ReactNativeBlobUtil.fs;
  const destDir = Platform.OS === 'android' ? dirs.DownloadDir : dirs.DocumentDir;
  const destPath = `${destDir}/${fileName}`;

  const downloadId = `dl_${Date.now()}`;
  const newItem: DownloadItem = {
    id: downloadId,
    fileName,
    url,
    progress: 0,
    status: 'downloading',
    timestamp: Date.now(),
  };

  downloadsList = [newItem, ...downloadsList];
  notifyListeners();
  await saveDownloads();

  try {
    const token = (globalThis as any).token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
    })
      .fetch('GET', url, headers)
      .progress((received: any, total: any) => {
        const rec = Number(received) || 0;
        const tot = Number(total) || 1;
        const percentage = Math.round((rec / tot) * 100);
        downloadsList = downloadsList.map((item) => {
          if (item.id === downloadId) {
            return { ...item, progress: percentage };
          }
          return item;
        });
        notifyListeners();
      });

    const localPath = res.path();
    const formattedPath = Platform.OS === 'android' ? 'file://' + localPath : localPath;

    downloadsList = downloadsList.map((item) => {
      if (item.id === downloadId) {
        return { ...item, status: 'completed', progress: 100, localPath: formattedPath };
      }
      return item;
    });
    notifyListeners();
    await saveDownloads();
    await triggerSuccessNotification(fileName);
    return formattedPath;
  } catch (error: any) {
    console.error('[DOWNLOAD ATTACHMENT ERROR]:', error);
    const errorMsg = error.message || 'Network error.';

    downloadsList = downloadsList.map((item) => {
      if (item.id === downloadId) {
        return { ...item, status: 'error', errorMessage: errorMsg };
      }
      return item;
    });
    notifyListeners();
    await saveDownloads();
    await triggerErrorNotification(fileName, errorMsg);
    return null;
  }
};

// ─── View Attachment ────────────────────────────────────────────────────────
export const viewAttachment = async (
  url: string | null | undefined,
  customFileName?: string
): Promise<void> => {
  if (!url) {
    toast.error('Document URL is invalid.');
    return;
  }

  // If already local, open directly
  if (url.startsWith('file://') || url.startsWith('/')) {
    try {
      const cleanPath = url.replace('file://', '');
      const { dirs } = ReactNativeBlobUtil.fs;

      if (Platform.OS === 'android') {
        const fileName = cleanPath.split('/').pop() || `temp_${Date.now()}`;
        const tempCachePath = `${dirs.CacheDir}/${fileName}`;

        // If file exists at original location, copy to cache to avoid FileProvider IllegalArgumentException
        if (await ReactNativeBlobUtil.fs.exists(cleanPath)) {
          // Clean up any existing temp file
          if (await ReactNativeBlobUtil.fs.exists(tempCachePath)) {
            await ReactNativeBlobUtil.fs.unlink(tempCachePath);
          }
          await ReactNativeBlobUtil.fs.cp(cleanPath, tempCachePath);
          await viewDocument({ uri: 'file://' + tempCachePath });
          return;
        }
      }

      await viewDocument({ uri: url });
      return;
    } catch (e: any) {
      console.error('[VIEW LOCAL ERROR]:', e);
      toast.error('Failed to open local document.');
      return;
    }
  }

  const fileName = customFileName || getFileNameFromUrl(url);
  const { dirs } = ReactNativeBlobUtil.fs;
  const destPath = `${dirs.CacheDir}/${fileName}`;

  try {
    const token = (globalThis as any).token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    // Download to cache for immediate previewing
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
    }).fetch('GET', url, headers);

    const localPath = res.path();
    const formattedPath = Platform.OS === 'android' ? 'file://' + localPath : localPath;

    await viewDocument({ uri: formattedPath });
  } catch (error: any) {
    console.error('[VIEW REMOTE ATTACHMENT ERROR]:', error);
    toast.error('Failed to preview attachment.');
  }
};
