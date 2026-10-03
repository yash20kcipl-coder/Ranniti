const createFcmToken = async () => {
  return { token: "demo-fcm-token", isNeedUpdate: false };
};

const removeFcmToken = async () => {
  console.log("FCM token removed");
};

const UpdateFcmToken = async (_studentprofiles: any[] = []) => {
  console.log("FCM token updated");
};

const initializeNotifications = async () => {
  console.log("Notifications initialized");
};

const removeNotificationsHandler = () => {};

const checkNotificationPermissionStatus = async () => {
  return true;
};

const onMessageReceived = async (_message: any, _getAppData?: Function) => {};

export {
  UpdateFcmToken,
  removeFcmToken,
  createFcmToken,
  onMessageReceived,
  initializeNotifications,
  removeNotificationsHandler,
  checkNotificationPermissionStatus,
};
