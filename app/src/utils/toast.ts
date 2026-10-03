import { Alert } from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type?: ToastType;
  copyable?: boolean;
  duration?: number;
  position?: number;
}

const toastMessage = (data: any, options: ToastOptions = {}) => {
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
    message = "Notice";
  }

  if (!message) return;

  const type = options.type || (data?.error ? 'error' : 'info');
  console.log(`[Toast ${type.toUpperCase()}]:`, message);
};

const toast = (data: any, options?: ToastOptions) => toastMessage(data, options);

toast.success = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'success' });
toast.error = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'error' });
toast.info = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'info' });
toast.warning = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'warning' });

export { toastMessage };
export default toast;
