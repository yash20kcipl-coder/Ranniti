import { Platform } from 'react-native';
import { PERMISSIONS, checkNotifications, requestNotifications } from 'react-native-permissions';

export interface PermissionItem {
  type: 'location' | 'camera' | 'storage' | 'notifications' | 'microphone';
  permission_title: string;
  permission_description: string;
  permissions: any;
  requestUserPermission?: () => Promise<any>;
  isRequired: boolean;
}

const permissions: PermissionItem[] = [
  {
    type: 'camera',
    permission_title: 'Camera Access Required',
    permission_description: 'This app needs access to your camera to capture photos for assignments, profile pictures, and document scanning.\n\nWe only access your camera when you explicitly choose to take a photo.',
    permissions: Platform.select({
      ios: [PERMISSIONS.IOS.CAMERA],
      android: [PERMISSIONS.ANDROID.CAMERA],
    }),
    isRequired: false,
  },
  {
    type: 'storage',
    permission_title: 'Storage Access Required',
    permission_description: "This app needs access to your device's storage to save and access study materials, assignments, and other educational content.\n\nWe only access files that you choose to upload or download.",
    permissions: Platform.select<any>({
      ios: [
        PERMISSIONS.IOS.PHOTO_LIBRARY,
      ],
      android: Number(Platform.Version) >= 33 ? [] : [
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ],
    }),
    isRequired: false,
  },
  {
    type: 'notifications',
    permission_title: 'Enable Notifications',
    permission_description: 'Stay updated with important notices, assignments, and exam schedules by enabling push notifications.',
    permissions: () => checkNotifications(),
    requestUserPermission: () => requestNotifications(['alert', 'sound', 'badge']),
    isRequired: false,
  },
  {
    type: 'microphone',
    permission_title: 'Microphone Access Required',
    permission_description: 'This app needs access to your microphone for voice notes and video recordings.\n\nWe only access your microphone when you actively use these features.',
    permissions: Platform.select({
      ios: [PERMISSIONS.IOS.MICROPHONE],
      android: [PERMISSIONS.ANDROID.RECORD_AUDIO],
    }),
    isRequired: false,
  },
];

export default permissions;
