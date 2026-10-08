import React from 'react';
import { Modal } from './Modal';
import { useLanguage } from '../languages';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { ZoomIn, FadeOut } from 'react-native-reanimated';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success' | 'primary';

export interface ConfirmModalProps {
  visible?: boolean;
  isOpen?: boolean;
  title?: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  confirmVariant?: ConfirmVariant;
  isLoading?: boolean;
  loading?: boolean;
  icon?: string;
  onConfirm: () => void | Promise<void>;
  onDismiss?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  isOpen,
  title,
  message,
  description,
  confirmText,
  cancelText,
  variant,
  confirmVariant,
  isLoading,
  loading,
  icon,
  onConfirm,
  onDismiss,
  onClose,
  children,
}) => {
  const { t } = useLanguage();
  const { theme, styles } = useAppTheme(confirmModalStyles);

  const isModalVisible = Boolean(visible ?? isOpen);
  const handleDismiss = onDismiss ?? onClose ?? (() => { });
  const actualIsLoading = Boolean(isLoading ?? loading);
  const actualVariant = variant ?? confirmVariant ?? 'danger';

  const actualTitle = title ?? t('areYouSure') ?? 'Are you sure?';
  const actualMessage = message ?? description ?? '';
  const actualConfirmText = confirmText ?? (actualVariant === 'danger' ? t('delete') ?? 'Delete' : t('confirm') ?? 'Confirm');
  const actualCancelText = cancelText ?? t('cancel') ?? 'Cancel';

  const getVariantConfig = () => {
    switch (actualVariant) {
      case 'danger':
        return {
          icon: icon || 'delete',
          color: theme.colors.error,
          bgColor: theme.colors.error + '18',
          borderColor: theme.colors.error + '30',
          btnBg: theme.colors.error,
        };
      case 'warning':
        return {
          icon: icon || 'alert',
          color: theme.colors.warning,
          bgColor: theme.colors.warning + '18',
          borderColor: theme.colors.warning + '30',
          btnBg: theme.colors.warning,
        };
      case 'success':
        return {
          icon: icon || 'check-circle',
          color: '#10B981',
          bgColor: '#10B98118',
          borderColor: '#10B98130',
          btnBg: '#10B981',
        };
      case 'info':
        return {
          icon: icon || 'info',
          color: theme.colors.info,
          bgColor: theme.colors.info + '18',
          borderColor: theme.colors.info + '30',
          btnBg: theme.colors.info,
        };
      case 'primary':
      default:
        return {
          icon: icon || 'alert',
          color: theme.colors.primary,
          bgColor: theme.colors.primary + '18',
          borderColor: theme.colors.primary + '30',
          btnBg: theme.colors.primary,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <Modal
      visible={isModalVisible}
      onDismiss={() => {
        if (!actualIsLoading) {
          handleDismiss();
        }
      }}
      position="center"
      contentContainerStyle={styles.container}
      entering={ZoomIn.duration(280)}
      exiting={FadeOut.duration(200)}
    >
      <View style={styles.content}>
        {/* Variant Icon Circle */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
            },
          ]}
        >
          <MaterialDesignIcons
            name={config.icon}
            size={30}
            color={config.color}
          />
        </View>

        {/* Modal Title */}
        <Text style={styles.title} numberOfLines={2}>
          {actualTitle}
        </Text>

        {/* Modal Description */}
        {Boolean(actualMessage) && (
          <Text style={styles.message}>
            {actualMessage}
          </Text>
        )}

        {children}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleDismiss}
          disabled={actualIsLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>{actualCancelText}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            { backgroundColor: config.btnBg },
            actualIsLoading && styles.disabledButton,
          ]}
          onPress={onConfirm}
          disabled={actualIsLoading}
          activeOpacity={0.8}
        >
          {actualIsLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>{actualConfirmText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const confirmModalStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      width: '86%',
      maxWidth: 380,
      alignSelf: 'center',
      borderRadius: 24,
      paddingHorizontal: 22,
      paddingVertical: 24,
      alignItems: 'center',
      ...getShadow(8, '#0F172A', 0.15),
    },
    content: {
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
    },
    iconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1.5,
    },
    title: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(18),
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: rfValue(24),
    },
    message: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(13.5),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: rfValue(19),
      paddingHorizontal: 6,
    },
    footer: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
      alignItems: 'center',
    },
    button: {
      flex: 1,
      height: 46,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    cancelButton: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(14),
      color: theme.colors.textSecondary,
    },
    confirmButton: {
      ...getShadow(3, '#000000', 0.15),
    },
    confirmButtonText: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(14),
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

export default ConfirmModal;
