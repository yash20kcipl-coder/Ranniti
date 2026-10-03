import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import React from 'react';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import { DownloadCloud, ShieldCheck } from 'lucide-react-native';

export interface AppUpdateModalProps {
  visible: boolean;
  type: 'force-update' | 'recommended' | 'force' | 'optional';
  latestVersion?: string;
  title?: string;
  body?: string;
  onSkip?: () => void;
  versionInfo: any
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  versionInfo,
  type,
  latestVersion = '',
  title,
  body,
  onSkip,
}) => {
  const { theme, styles } = useAppTheme(createStyles);

  const onUpdate = () => {
    if (versionInfo.storeUrl) {
      Linking.openURL(versionInfo.storeUrl).catch((err) =>
        console.error('Failed to open store URL:', err)
      );
    }
  };


  if (!visible) return null;

  const isForceUpdate = type === 'force-update' || type === 'force';

  const defaultTitle = isForceUpdate ? 'Update Required' : 'New Version Available';
  const defaultBody = isForceUpdate
    ? `A critical update for Ranniti is available${latestVersion ? ` (v${latestVersion})` : ''}. Please update to continue using the app.`
    : `A new update${latestVersion ? ` (v${latestVersion})` : ''} is available with performance improvements and new features.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isForceUpdate ? () => { } : onSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconCircle}>
            {isForceUpdate ? (
              <DownloadCloud size={32} {...({ color: theme.colors.primary } as any)} />
            ) : (
              <ShieldCheck size={32} {...({ color: theme.colors.primary } as any)} />
            )}
          </View>

          <Text style={styles.modalTitle}>{title || defaultTitle}</Text>
          <Text style={styles.modalBody}>{body || defaultBody}</Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Update Now</Text>
            </TouchableOpacity>

            {!isForceUpdate && onSkip && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Skip for now</Text>
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.colors.surface || '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      ...getShadow(10, '#000000', 0.3),
    },
    modalIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(5, 150, 105, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: FontFamily.black,
      fontSize: rfValue(20),
      color: theme.colors.text || '#111827',
      textAlign: 'center',
      marginBottom: 8,
    },
    modalBody: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(14),
      color: theme.colors.textSecondary || '#4B5563',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    modalActions: {
      width: '100%',
      gap: 10,
    },
    primaryBtn: {
      width: '100%',
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...getShadow(4, theme.colors.primary, 0.3),
    },
    primaryBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(15),
      color: '#FFFFFF',
    },
    secondaryBtn: {
      width: '100%',
      height: 44,
      borderRadius: 14,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(14),
      color: theme.colors.textSubtle || '#6B7280',
    },
  });

export default AppUpdateModal;
