import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { MaterialDesignIcons } from '../MaterialDesignIcons';
import { PermissionsPopUp } from '../Permissions';
import { AttachmentPickerModal } from '../AttachmentPickerModal';
import { FormInputProps } from './types';
import { Theme } from '../../constants/theme';

interface DocumentInputComponentProps extends FormInputProps {
  theme: Theme;
  styles: any;
  renderLabel: (style: any) => React.ReactNode;
}

export const DocumentInput: React.FC<DocumentInputComponentProps> = ({
  value,
  placeholder,
  onChange,
  theme,
  styles,
  renderLabel,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      {renderLabel(styles.fieldLabel)}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={async () => {
          if (value) {
            onChange(null);
          } else {
            if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
              setShowPicker(true);
            } else {
              const storagePerm = Platform.OS === 'ios'
                ? PERMISSIONS.IOS.PHOTO_LIBRARY
                : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

              try {
                const status = await check(storagePerm);
                if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
                  setShowPicker(true);
                } else {
                  setShowPermissionPopup(true);
                }
              } catch {
                setShowPermissionPopup(true);
              }
            }
          }
        }}
        style={[styles.uploadBox, value && styles.uploadBoxActive]}
      >
        <MaterialDesignIcons
          name={value ? 'file-check-outline' : 'cloud-upload-outline'}
          size={22}
          color={value ? theme.colors.primary : theme.colors.textSecondary + 'B3'}
        />
        <View style={styles.uploadTextContainer}>
          <Text style={[styles.uploadTitle, value && { color: theme.colors.primary }]}>
            {value
              ? (typeof value === 'object'
                ? (value.name || value.fileName || value.uri || 'Selected File')
                : value)
              : placeholder || 'Upload proof (Medical / Invitation)'}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {value ? 'Tap to remove attachment' : 'PDF, PNG, or JPG up to 5MB'}
          </Text>
        </View>
      </TouchableOpacity>

      {showPermissionPopup && (
        <PermissionsPopUp
          type="storage"
          onCheck={(granted) => {
            if (granted) {
              setShowPicker(true);
            }
            setShowPermissionPopup(false);
          }}
        />
      )}

      <AttachmentPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectFile={(fileName, uri, mimeType) => onChange({ name: fileName, uri, mimeType })}
      />
    </View>
  );
};

export default DocumentInput;
