import React from 'react';
import { Modal } from '../Modal';
import { appModalStyles } from './styles';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ZoomIn, FadeOut } from 'react-native-reanimated';
import { MaterialDesignIcons } from '../MaterialDesignIcons';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface AppModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  message?: string;
  icon?: string;
  position?: 'center' | 'right';
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
  position = 'center',
  primaryAction,
  secondaryAction,
  children,
}) => {
  const { theme, styles } = useAppTheme(appModalStyles);
  const isRight = position === 'right';

  if (isRight) {
    return (
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        position="right"
        contentContainerStyle={styles.sidebarContainer}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarHeaderLeft}>
            <View style={styles.sidebarIconContainer}>
              <MaterialDesignIcons name={icon as any} size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sidebarTitle} numberOfLines={1}>{title}</Text>
              {message ? <Text style={styles.sidebarSubtitle} numberOfLines={1}>{message}</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.sidebarCloseBtn} activeOpacity={0.7}>
            <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sidebarScroll}
          contentContainerStyle={styles.sidebarContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>


        {(primaryAction || secondaryAction) && (
          <View style={styles.sidebarFooter}>
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
        )}
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      position="center"
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

