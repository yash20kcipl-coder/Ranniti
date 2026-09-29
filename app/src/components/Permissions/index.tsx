import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { checkMultiple, requestMultiple, openSettings } from 'react-native-permissions';
import permissionsConfig from './permissionsConfig';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Theme } from '../../constants/theme';
import { FontFamily } from '../../utils/typography';
import { rfValue } from '../../utils/responsive';
import { getShadow } from '../../utils/shadow';

interface PermissionsPopUpProps {
  type: 'location' | 'camera' | 'storage' | 'notifications' | 'microphone';
  onCheck: (granted: boolean) => void;
}

export const PermissionsPopUp: React.FC<PermissionsPopUpProps> = ({
  type,
  onCheck,
}) => {
  const [visible, setVisible] = useState(false);
  const { theme, styles } = useAppTheme(getStyles);
  const [permissionState, setPermissionState] = useState({
    title: '',
    description: '',
    blockedText: '',
    permissionsList: [] as any[],
  });

  const configItem = permissionsConfig.find((item) => item.type === type);

  useEffect(() => {
    if (!configItem) return;

    setPermissionState((prev) => ({
      ...prev,
      title: configItem.permission_title,
      description: configItem.permission_description,
      permissionsList: typeof configItem.permissions === 'function' ? [] : configItem.permissions || [],
    }));

    const performSilentCheck = async () => {
      if (typeof configItem.permissions === 'function') {
        const result = await configItem.permissions();
        if (result.status === 'granted') {
          onCheck(true);
        } else {
          // Open visually since consent missing
          setVisible(true);
          if (result.status === 'blocked') {
            setPermissionState((prev) => ({
              ...prev,
              blockedText: 'Permission is permanently blocked. Please enable it in Settings.',
            }));
          }
        }
      } else if (configItem.permissions) {
        const statuses = await checkMultiple(configItem.permissions);
        const values = Object.values(statuses);
        if (values.every((status) => status === 'granted')) {
          onCheck(true);
        } else {
          setVisible(true);
          if (values.some((status) => status === 'blocked')) {
            setPermissionState((prev) => ({
              ...prev,
              blockedText: 'Permission is permanently blocked. Please enable it in Settings.',
            }));
          }
        }
      }
    };

    setTimeout(() => { performSilentCheck(); }, 400);
  }, [type, configItem, onCheck]);

  const handleClose = () => setVisible(false);

  const handleRequest = async () => {
    if (permissionState.blockedText) {
      openSettings();
      handleClose();
      return;
    }

    if (configItem) {
      if (typeof configItem.requestUserPermission === 'function') {
        const res = await configItem.requestUserPermission();
        if (res.status === 'granted') {
          onCheck(true);
          handleClose();
        } else {
          onCheck(false);
          if (res.status === 'blocked') {
            setPermissionState(p => ({ ...p, blockedText: 'Permission permanently blocked.' }));
          } else {
            handleClose();
          }
        }
      } else if (configItem.permissions) {
        const results = await requestMultiple(configItem.permissions);
        const values = Object.values(results);
        if (values.every((status) => status === 'granted')) {
          onCheck(true);
          handleClose();
        } else {
          const isBlocked = values.some((status) => status === 'blocked');
          if (isBlocked) {
            setPermissionState((prev) => ({
              ...prev,
              blockedText: 'Permission is permanently blocked. Please enable it in Settings.',
            }));
          } else {
            onCheck(false);
            handleClose();
          }
        }
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.cardContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{permissionState.title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialDesignIcons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.description}>{permissionState.description}</Text>
            {!!permissionState.blockedText && (
              <Text style={styles.blockedText}>{permissionState.blockedText}</Text>
            )}
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.btn, styles.cancelBtn]}
            >
              <Text style={[styles.btnText, styles.cancelBtnText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRequest}
              style={[styles.btn, styles.primaryBtn]}
            >
              <Text style={[styles.btnText, styles.primaryBtnText]}>
                {permissionState.blockedText ? 'Open Settings' : 'Allow'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    ...getShadow(4, theme.colors.shadowColor, 0.15),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.heading,
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 20,
  },
  description: {
    fontSize: rfValue(13),
    fontFamily: FontFamily.body,
    color: theme.colors.textSecondary,
  },
  blockedText: {
    fontSize: rfValue(12.5),
    fontFamily: FontFamily.medium,
    color: theme.colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bodyBold,
  },
  btnText: {
    fontSize: rfValue(13.5),
  },
});
export default PermissionsPopUp;
