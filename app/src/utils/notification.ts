import { store } from '../store/store';
import Storage from './storage';
import {
  getMessaging,
  getToken,
  deleteToken,
  requestPermission,
  setBackgroundMessageHandler,
  AuthorizationStatus,
  onNotificationOpenedApp,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages
} from '@react-native-firebase/messaging';
import { AppState, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { handleNotificationClick } from './attachmentUtils';
import { requestNotifications, RESULTS } from "react-native-permissions";
import { AddFcmToken, markNotificationAsReadAction } from '../store/actions/notification';
import notifee, { AndroidImportance, AndroidVisibility, Event, EventType } from '@notifee/react-native';

const firebaseMessaging = getMessaging(getApp());

let channelId: string;
let notificationPermission = false;
let foregroundSubscription: any = null;
let backgroundSubscription: any = null;
let messageSubscription: any = null;
let notificationOpenedSubscription: any = null;

const checkNotificationPermissionStatus = async () => {
  try {
    if (!notificationPermission) {
      const authStatus = await requestPermission(firebaseMessaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      const notification = await requestNotifications(['alert', 'sound', 'badge']);
      console.info("--- notification permission status ---", notification.status === RESULTS.GRANTED);
      notificationPermission = notification.status === RESULTS.GRANTED;
    }
    return notificationPermission;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const setNotificationsHandler = async () => {
  try {
    let granted = await checkNotificationPermissionStatus();
    if (!granted) return;
    channelId = await notifee.createChannel({
      vibration: true,
      name: "School_Management",
      id: "School_Notifications_v2",
      sound: 'notification_sound',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibrationPattern: [300, 2000, 300, 2000],
      description: "All academic activity notifications",
    });
  } catch (error) {
    console.error(error);
  }
};

const createFcmToken = async () => {
  try {
    let granted = await checkNotificationPermissionStatus();

    if (!granted) return { token: "", isNeedUpdate: false };

    if (Platform.OS === 'ios') {
      if (!isDeviceRegisteredForRemoteMessages(firebaseMessaging)) {
        await registerDeviceForRemoteMessages(firebaseMessaging);
      }
    }

    const fcmToken = await getToken(firebaseMessaging);
    const token = await Storage.get("fcmtoken");

    if (fcmToken !== token) { console.warn('FCM Token:', fcmToken); }

    return { token: fcmToken || "", isNeedUpdate: fcmToken !== token };
  } catch (error) {
    console.warn("[FCM] Failed to register or retrieve FCM token:", error);
    return { token: "", isNeedUpdate: false };
  }
};

const removeFcmToken = async () => {
  try {
    console.warn("--- fcm token deleted ---");
    await deleteToken(firebaseMessaging);
    await Storage.remove("fcmtoken");
  } catch (error) {
    console.error(error);
  }
};

const UpdateFcmToken = async (studentprofiles: any[] = []) => {
  if ((globalThis as any).token) {
    const fcm = await createFcmToken();
    if (fcm?.isNeedUpdate) {
      store.dispatch(AddFcmToken(fcm?.token, studentprofiles?.map((item: any) => item?.studentId)) as any);
    }
  }
};

const sendNotification = async ({ title, body, ...message }: any) => {
  try {
    notifee.displayNotification({
      title,
      body,
      data: message?.data || {},
      android: {
        onlyAlertOnce: true,
        channelId: channelId || "School_Notifications_v2", // Added fallback string
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
        smallIcon: "@mipmap/ic_launcher", // Using valid app launcher icon if custom missing
        visibility: AndroidVisibility.PUBLIC,
        showTimestamp: true,
        color: "#217020",
      },
      ios: {
        sound: 'notification_sound.wav',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      }
    });
  } catch (error) {
    console.error(error);
  }
};

const onMessageReceived = async (message: any, getAppData?: Function) => {
  setTimeout(async () => {
    let messageIds: any = await Storage.get('messageIds');
    messageIds = Array.isArray(messageIds) ? messageIds : [];

    if (!message || !message?.notification || AppState.currentState !== 'active' || messageIds.includes(message?.messageId)) { return; }

    console.log("--- message --- ", message)
    const { title, body } = message.notification;
    await Storage.save('messageIds', [...messageIds, message?.messageId]);

    if (Platform.OS === 'android') {
      sendNotification({ title, body, ...message });
    }

    getAppData?.(message?.data);
  }, 4000);
};

const initializeNotifications = async (onNotificationEvent: (event: Event) => Promise<void>, getAppData: Function) => {
  setNotificationsHandler();

  (globalThis as any).onNotificationEventCallback = onNotificationEvent;
  (globalThis as any).getAppDataCallback = getAppData;

  if ((globalThis as any).notificationsInitialized) {
    return;
  }
  (globalThis as any).notificationsInitialized = true;

  // Background handle
  setBackgroundMessageHandler(firebaseMessaging, async (remoteMessage) => {
    (globalThis as any).getAppDataCallback?.(remoteMessage?.data);
  });

  // Foreground handle
  firebaseMessaging.onMessage(async (remoteMessage) => {
    await onMessageReceived(remoteMessage, (globalThis as any).getAppDataCallback);
  });

  const defaultNotificationHandler = async ({ type, detail }: Event) => {
    if (type === EventType.PRESS) {
      const notifId = detail.notification?.data?.id;
      if (notifId) {
        store.dispatch(markNotificationAsReadAction(String(notifId)) as any);
      }
    }
  };

  notifee.onForegroundEvent(async (event) => {
    await defaultNotificationHandler(event);
    if ((globalThis as any).onNotificationEventCallback) {
      await (globalThis as any).onNotificationEventCallback(event);
    }
  });

  notifee.onBackgroundEvent(async (event) => {
    await defaultNotificationHandler(event);
    if ((globalThis as any).onNotificationEventCallback) {
      await (globalThis as any).onNotificationEventCallback(event);
    }
  });

  // Listen for notification clicks when app is in background state
  onNotificationOpenedApp(firebaseMessaging, (remoteMessage) => {
    console.log('Notification caused app to open from background state:', remoteMessage);
    if (remoteMessage?.data) {
      handleNotificationClick(remoteMessage.data);
    }
  });

  // Check if app was opened from terminated state by a notification click
  getInitialNotification(firebaseMessaging).then((remoteMessage) => {
    if (remoteMessage) {
      console.log('Notification caused app to open from quit state:', remoteMessage);
      if (remoteMessage?.data) {
        handleNotificationClick(remoteMessage.data);
      }
    }
  });
};

const removeNotificationsHandler = () => {
  if (foregroundSubscription?.remove) { foregroundSubscription.remove() }
  if (backgroundSubscription?.remove) { backgroundSubscription.remove() }
  if (typeof messageSubscription === 'function') {
    messageSubscription();
    messageSubscription = null;
  }
  if (typeof notificationOpenedSubscription === 'function') {
    notificationOpenedSubscription();
    notificationOpenedSubscription = null;
  }
};

export {
  UpdateFcmToken,
  removeFcmToken,
  createFcmToken,
  onMessageReceived,
  initializeNotifications,
  removeNotificationsHandler,
  checkNotificationPermissionStatus,
};
