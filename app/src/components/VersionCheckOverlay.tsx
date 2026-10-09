import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
  StatusBar,
} from 'react-native';
import React, { useState } from 'react';
import { useLanguage } from '../languages';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { MaterialDesignIcons } from './MaterialDesignIcons';

const { width } = Dimensions.get('window');

interface VersionCheckOverlayProps {
  storeUrl: string;
  updateTitle?: string;
  onRetry?: () => void;
  latestVersion: string;
  updateMessage?: string;
  maintenanceMessage?: string;
  onDismissRecommended?: () => void;
  status: 'loading' | 'allowed' | 'force-update' | 'recommended-update' | 'maintenance';
}

export const VersionCheckOverlay: React.FC<VersionCheckOverlayProps> = ({
  status,
  storeUrl,
  latestVersion,
  updateTitle,
  updateMessage,
  maintenanceMessage,
  onDismissRecommended,
  onRetry,
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  const { t } = useLanguage();
  const [userDismissed, setUserDismissed] = useState(false);

  if (status === 'loading' || status === 'allowed') return null;

  const isMaintenance = status === 'maintenance';
  const isForceUpdate = status === 'force-update';

  // If recommended update was dismissed by the user, don't render
  if (!isForceUpdate && !isMaintenance && userDismissed) return null;

  const handleUpdate = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch((err) =>
        console.error('Failed to open app store link:', err)
      );
    }
  };

  const handleDismiss = () => {
    setUserDismissed(true);
    if (onDismissRecommended) {
      onDismissRecommended();
    }
  };

  const getModalIcon = () => {
    if (isMaintenance) return 'wrench-clock';
    if (isForceUpdate) return 'cloud-download';
    return 'alert-decagram-outline';
  };

  const getIconColor = () => {
    if (isMaintenance) return '#F59E0B'; // Amber
    if (isForceUpdate) return theme.colors.error;
    return theme.colors.primary;
  };

  const getTitleText = () => {
    if (updateTitle) return updateTitle;
    if (isMaintenance) return t('underMaintenanceTitle');
    if (isForceUpdate) return t('updateRequired');
    return t('newVersionAvailable');
  };

  const getBodyText = () => {
    if (isMaintenance) return maintenanceMessage || t('underMaintenanceMessage');
    if (updateMessage) return updateMessage;
    if (isForceUpdate) {
      return `${t('criticalUpdateMessage')}${latestVersion ? ` (v${latestVersion})` : ''}`;
    }
    return `${t('recommendedUpdateMessage')}${latestVersion ? ` (v${latestVersion})` : ''}`;
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isForceUpdate || isMaintenance ? () => { } : handleDismiss}
    >
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" />

        {/* Update / Maintenance Card */}
        <View style={styles.card}>
          {/* Header Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isMaintenance
                  ? 'rgba(245, 158, 11, 0.15)'
                  : isForceUpdate
                    ? 'rgba(244, 63, 94, 0.15)'
                    : 'rgba(99, 102, 241, 0.15)',
                borderColor: isMaintenance
                  ? 'rgba(245, 158, 11, 0.3)'
                  : isForceUpdate
                    ? 'rgba(244, 63, 94, 0.3)'
                    : 'rgba(99, 102, 241, 0.3)',
              },
            ]}
          >
            <MaterialDesignIcons
              name={getModalIcon()}
              size={36}
              color={getIconColor()}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontFamily: FontFamily.extraBold }]}>
            {getTitleText()}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { fontFamily: FontFamily.medium }]}>
            {getBodyText()}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isMaintenance ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRetry}
                style={[styles.updateBtn, { backgroundColor: '#F59E0B' }]}
              >
                <MaterialDesignIcons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.updateBtnText, { fontFamily: FontFamily.bodyBold }]}>
                  {t('retryConnection')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUpdate}
                  style={[
                    styles.updateBtn,
                    {
                      backgroundColor: isForceUpdate
                        ? theme.colors.error
                        : theme.colors.primary,
                    },
                  ]}
                >
                  <MaterialDesignIcons name="open-in-app" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.updateBtnText, { fontFamily: FontFamily.bodyBold }]}>
                    {t('updateNow')}
                  </Text>
                </TouchableOpacity>

                {!isForceUpdate && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDismiss}
                    style={styles.cancelBtn}
                  >
                    <Text
                      style={[
                        styles.cancelBtnText,
                        { fontFamily: FontFamily.medium, color: theme.colors.textSecondary },
                      ]}
                    >
                      {t('skipForNow')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    card: {
      width: '100%',
      maxWidth: width - 48,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border || 'rgba(255,255,255,0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      marginBottom: 20,
    },
    title: {
      fontSize: rfValue(20),
      color: theme.colors.text || '#000000',
      textAlign: 'center',
      marginBottom: 10,
    },
    description: {
      fontSize: rfValue(12),
      color: theme.colors.textSecondary || '#666666',
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 24,
      paddingHorizontal: 12,
    },
    buttonContainer: {
      width: '100%',
      gap: 10,
    },
    updateBtn: {
      width: '100%',
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    updateBtnText: {
      color: '#FFFFFF',
      fontSize: rfValue(13),
    },
    cancelBtn: {
      width: '100%',
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtnText: {
      fontSize: rfValue(13),
    },
  });

export default VersionCheckOverlay;
