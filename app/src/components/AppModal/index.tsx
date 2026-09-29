import React from 'react';
import { Modal } from '../Modal';
import { appModalStyles } from './styles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ZoomIn, FadeOut } from 'react-native-reanimated';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

interface AppModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  message?: string;
  icon?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  children?: React.ReactNode;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onDismiss,
  title,
  message,
  icon = 'information-outline',
  primaryAction,
  secondaryAction,
  children,
}) => {
  const { theme, styles } = useAppTheme(appModalStyles);

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.container}
      entering={ZoomIn.duration(400)}
      exiting={FadeOut}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
          <MaterialDesignIcons name="close" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <MaterialDesignIcons name={icon as any} size={36} color={theme.colors.primary} />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        {children && children}
        <View style={styles.footer}>
          {secondaryAction && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={secondaryAction.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
            </TouchableOpacity>
          )}

          {primaryAction && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={primaryAction.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
