import toast from './toast';
import { Linking, Platform } from 'react-native';

export interface InteractionTrackingOptions {
  onTrack?: () => void;
}

/**
 * Common Phone Dialer Utility
 * Opens the native dialer with sanitized phone digits.
 */
export const openPhoneDialer = (
  phoneNumber?: string | null,
  options?: InteractionTrackingOptions
) => {
  if (!phoneNumber) {
    toast.error('Phone number not available');
    return;
  }

  // Trigger optional tracking callback
  options?.onTrack?.();

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

/**
 * Common WhatsApp Messaging Utility
 * Attempts to launch native WhatsApp with optional pre-filled message.
 */
export const openWhatsAppChat = (
  phoneNumber?: string | null,
  message: string = '',
  options?: InteractionTrackingOptions
) => {
  if (!phoneNumber) {
    toast.error('Phone number not available');
    return;
  }

  // Trigger optional tracking callback
  options?.onTrack?.();

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

/**
 * Common Email Composer Utility
 */
export const openEmailComposer = (email?: string | null, subject: string = '') => {
  if (!email) {
    toast.error('Email address not available');
    return;
  }
  const encodedSub = encodeURIComponent(subject);
  const url = `mailto:${email}${encodedSub ? `?subject=${encodedSub}` : ''}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        toast.error('Unable to open email client');
      }
    })
    .catch(() => toast.error('Error launching email client'));
};

/**
 * Common SMS Composer Utility
 * Opens native SMS app with optional pre-filled message text.
 */
export const openSmsComposer = (
  phoneNumber?: string | null,
  message: string = '',
  options?: InteractionTrackingOptions
) => {
  if (!phoneNumber) {
    toast.error('Phone number not available');
    return;
  }

  options?.onTrack?.();

  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  const encodedMsg = encodeURIComponent(message);
  const separator = Platform.OS === 'ios' ? '&' : '?';
  const url = `sms:${cleanNumber}${encodedMsg ? `${separator}body=${encodedMsg}` : ''}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`sms:${cleanNumber}`).catch(() => toast.error('Unable to open SMS app'));
      }
    })
    .catch(() => Linking.openURL(`sms:${cleanNumber}`).catch(() => toast.error('Unable to open SMS app')));
};

// Aliases for convenience across screens and components
export const handleCall = openPhoneDialer;
export const handleWhatsApp = openWhatsAppChat;
export const handleSms = openSmsComposer;
export const handleEmail = openEmailComposer;
