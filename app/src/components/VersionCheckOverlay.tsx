import React, { useState } from 'react';
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
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';

const { width } = Dimensions.get('window');

interface VersionCheckOverlayProps {
  status: 'loading' | 'allowed' | 'force-update' | 'recommended-update';
  storeUrl: string;
  latestVersion: string;
  onDismissRecommended?: () => void;
}

export const VersionCheckOverlay: React.FC<VersionCheckOverlayProps> = ({
  status,
  storeUrl,
  latestVersion,
  onDismissRecommended,
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  const [userDismissed, setUserDismissed] = useState(false);

  if (status === 'loading' || status === 'allowed') return null;

  const isForceUpdate = status === 'force-update';

  // If recommended update was dismissed by the user, don't render
  if (!isForceUpdate && userDismissed) return null;

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

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isForceUpdate ? () => {} : handleDismiss}
    >
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
        
        {/* Update Card */}
        <View style={styles.card}>
          {/* Header Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isForceUpdate
                  ? 'rgba(244, 63, 94, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
                borderColor: isForceUpdate
                  ? 'rgba(244, 63, 94, 0.3)'
                  : 'rgba(99, 102, 241, 0.3)',
              },
            ]}
          >
            <MaterialDesignIcons
              name={isForceUpdate ? 'cloud-download' : 'alert-decagram-outline'}
              size={36}
              color={isForceUpdate ? theme.colors.error : theme.colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { fontFamily: FontFamily.extraBold }]}>
            {isForceUpdate ? 'Update Required' : 'Update Available'}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { fontFamily: FontFamily.medium }]}>
            {isForceUpdate
              ? 'A critical new version of the app is available. Please update to the latest version to continue using the application.'
              : `A new version of the app (${latestVersion}) is available. We recommend updating to access new features and performance enhancements.`}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
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
                Update Now
              </Text>
            </TouchableOpacity>

            {!isForceUpdate && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleDismiss}
                style={styles.cancelBtn}
              >
                <Text style={[styles.cancelBtnText, { fontFamily: FontFamily.medium, color: theme.colors.textSecondary }]}>
                  Later
                </Text>
              </TouchableOpacity>
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
