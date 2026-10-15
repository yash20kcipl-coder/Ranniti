import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type?: ToastType;
  copyable?: boolean;
  duration?: number;
  position?: 'top' | 'bottom';
  title?: string;
}

const toastMessage = (data: any, options: ToastOptions = {}) => {
  let message = '';
  let title = options.title || '';

  if (typeof data === 'string') {
    message = data;
  } else if (data?.error) {
    message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  } else if (data?.message) {
    message = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
  } else if (data?.title) {
    message = data.title;
  } else {
    message = 'Notice';
  }

  if (!message) return;

  const type = options.type || (data?.error ? 'error' : 'info');
  console.log(`[Toast ${type.toUpperCase()}]:`, message);

  // Map internal types to react-native-toast-message types ('success' | 'error' | 'info')
  const toastType = type === 'warning' ? 'info' : type;
  if (!title) {
    if (type === 'success') title = 'Success';
    else if (type === 'error') title = 'Error';
    else if (type === 'warning') title = 'Warning';
    else title = 'Notice';
  }

  try {
    Toast.show({
      type: toastType,
      text1: title,
      text2: message,
      text1Style: { fontSize: 15 },
      text2Style: { fontSize: 14 },
      position: options.position || 'bottom',
      visibilityTime: options.duration || 3500,
      autoHide: true,
      bottomOffset: 60,
      topOffset: 50,
    });
  } catch (err) {
    console.warn('[Toast Error]:', err);
  }
};

const toast = (data: any, options?: ToastOptions) => toastMessage(data, options);

toast.success = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'success' });
toast.error = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'error' });
toast.info = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'info' });
toast.warning = (data: any, options: ToastOptions = {}) => toastMessage(data, { ...options, type: 'warning' });

export { toastMessage };
export default toast;

