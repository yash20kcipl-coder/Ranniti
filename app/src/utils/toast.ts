import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-root-toast";
import { AppTheme } from "../constants/theme";
import { Appearance } from "react-native";

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type?: ToastType;
  copyable?: boolean;
  duration?: number;
  position?: number;
}

/**
 * Enhanced Toast utility adapted from EduTrack
 * 
 * @param {string|object} data - Message string or response object
 * @param {ToastOptions} options - Options for the toast
 */
const toastMessage = (data: any, options: ToastOptions = {}) => {
  // 1. Extract message
  let message = "";
  if (typeof data === "string") {
    message = data;
  } else if (data?.error) {
    message = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
  } else if (data?.message) {
    message = typeof data.message === "string" ? data.message : JSON.stringify(data.message);
  } else if (data?.title) {
    message = data.title;
  } else {
    message = "Something went wrong";
  }

  if (!message) return;

  // 2. Determine Type
  let type = options?.type;
  if (!type) {
    // Auto-detect error if not specified
    if (data?.error || message.toLowerCase().includes("error") || message.toLowerCase().includes("failed")) {
      type = "error";
    } else {
      type = "info";
    }
  }

  // 3. Get Theme Colors
  const colorScheme = Appearance.getColorScheme();
  const theme = colorScheme === 'dark' ? AppTheme.dark : AppTheme.light;
  const colors = theme.colors;

  let backgroundColor = colors.primary;
  let textColor = "#FFFFFF";

  switch (type) {
    case "success":
      backgroundColor = "#10B981"; // Success Emerald
      break;
    case "error":
      backgroundColor = colors.error;
      break;
    case "warning":
      backgroundColor = colors.warning;
      break;
    case "info":
      backgroundColor = colors.info;
      break;
    default:
      backgroundColor = colors.primary;
  }

  // 4. Show Toast
  try {
    Toast.show(message, {
      duration: options.duration || Toast.durations.LONG,
      position: options.position || Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
      backgroundColor: backgroundColor,
      textColor: textColor,
      opacity: 1,
      containerStyle: {
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        width: '90%',
      },
      onPress: () => {
        if (options?.copyable) {
          Clipboard.setString(message);
          Toast.show("Copied to clipboard", {
            duration: Toast.durations.SHORT,
            position: Toast.positions.BOTTOM,
          });
        }
      },
    });
  } catch (error) {
    console.error("Toast Error:", error);
  }
};

const toast = (data: any, options?: ToastOptions) => toastMessage(data, options);

toast.success = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'success' as ToastType });
toast.error = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'error' as ToastType });
toast.info = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'info' as ToastType });
toast.warning = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'warning' as ToastType });

export { toastMessage };
export default toast;
