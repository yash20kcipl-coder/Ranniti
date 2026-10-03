import { Linking } from 'react-native';
import toast from './toast';

export const openPhoneDialer = (phoneNumber: string) => {
  if (!phoneNumber) {
    toast.error('Phone number not available');
    return;
  }
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  const url = `tel:${cleanNumber}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        toast.error('Unable to open phone dialer');
      }
    })
    .catch(() => toast.error('Error launching phone dialer'));
};

export const openWhatsAppChat = (phoneNumber: string, message: string = '') => {
  if (!phoneNumber) {
    toast.error('Phone number not available');
    return;
  }
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${cleanNumber}&text=${encodedMsg}`;
  const webUrl = `https://wa.me/${cleanNumber}?text=${encodedMsg}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl).catch(() => toast.error('WhatsApp is not installed'));
      }
    })
    .catch(() => Linking.openURL(webUrl).catch(() => toast.error('WhatsApp is not installed')));
};
