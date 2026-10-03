import React, { useState } from 'react';
import { FormInputProps } from './types';
import { CustomImage } from '../CustomImage';
import { Theme } from '../../constants/theme';
import { Attachment } from '../../core/config';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { View, Text, TouchableOpacity } from 'react-native';
import { AttachmentPickerModal } from '../AttachmentPickerModal';
import { MaterialDesignIcons } from '../MaterialDesignIcons';

interface AttachmentsInputComponentProps extends FormInputProps {
  theme: Theme;
  styles: any;
  renderLabel: (style: any) => React.ReactNode;
}

export const AttachmentsInput: React.FC<AttachmentsInputComponentProps> = ({
  value = [],
  onChange,
  theme,
  styles,
  renderLabel,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const attachments: Attachment[] = Array.isArray(value) ? value : [];

  const handleSelectFiles = (files: Array<{ name: string; uri: string; mimeType?: string; thumbnail?: string; size?: number }>) => {
    const formatBytes = (bytes?: number): string => {
      if (!bytes) return '1.2 MB';
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const newAttachments = files.map((file, index) => {
      const nameLower = file.name.toLowerCase();
      const uriLower = file.uri.toLowerCase();
      const mimeLower = file.mimeType?.toLowerCase() || '';
      const isImage =
        mimeLower.startsWith('image') ||
        nameLower.includes('.jpg') ||
        nameLower.includes('.jpeg') ||
        nameLower.includes('.png') ||
        nameLower.includes('.webp') ||
        nameLower.includes('.gif') ||
        uriLower.includes('.jpg') ||
        uriLower.includes('.jpeg') ||
        uriLower.includes('.png') ||
        uriLower.includes('.webp') ||
        uriLower.includes('.gif') ||
        uriLower.includes('image');
      const isVideo =
        mimeLower.startsWith('video') ||
        nameLower.includes('.mp4') ||
        nameLower.includes('.mov') ||
        nameLower.includes('.m4v') ||
        nameLower.includes('.3gp') ||
        uriLower.includes('.mp4') ||
        uriLower.includes('.mov') ||
        uriLower.includes('.m4v') ||
        uriLower.includes('.3gp') ||
        uriLower.includes('video');
      const type = isVideo ? 'video' : isImage ? 'image' : 'document';
      const mediaId = `hw_att_added_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`;

      return {
        id: mediaId,
        uri: file.uri,
        title: file.name,
        type,
        thumbnail: file.thumbnail,
        size: formatBytes(file.size),
        mimeType: file.mimeType || mimeLower,
      } as Attachment;
    });

    onChange([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    onChange(attachments.filter((item) => item.id !== id));
  };

  return (
    <View style={{ gap: 10 }}>
      {renderLabel(styles.fieldLabel)}

      {attachments.length === 0 ? (
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
          style={[
            styles.emptyMediaBox,
            {
              borderColor: theme.colors.primary + '40',
              backgroundColor: theme.colors.primary + '08',
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              borderStyle: 'dashed',
              borderWidth: 1.2,
              borderRadius: 12,
            },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + '12',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialDesignIcons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: theme.colors.primary, fontFamily: FontFamily.medium, fontSize: rfValue(13) }}>
              Upload attachment sheets
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: rfValue(11), fontFamily: FontFamily.body }}>
              Images, videos or documents up to 10MB
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ gap: 14 }}>
          {/* Visual media queue (images, videos) */}
          {attachments.some((item) => item.type !== 'document') && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {attachments
                .filter((item) => item.type !== 'document')
                .map((item) => (
                  <View key={item.id} style={styles.formMediaCard}>
                    {item.type === 'video' && !item.thumbnail ? (
                      <View
                        style={[
                          styles.formMediaThumb,
                          { backgroundColor: theme.colors.text + 'D0', justifyContent: 'center', alignItems: 'center' },
                        ]}
                      >
                        <MaterialDesignIcons name="video" size={32} color="#FFFFFF" />
                      </View>
                    ) : (
                      <CustomImage
                        uri={item.thumbnail || item.uri}
                        placeholderType="landscape"
                        style={styles.formMediaThumb}
                      />
                    )}
                    {item.type === 'video' && (
                      <View style={styles.formMediaIconBadge}>
                        <MaterialDesignIcons name="play" size={18} color="#FFFFFF" />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(item.id)}
                      style={styles.deleteMediaItemBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialDesignIcons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* Compact documents/files list queue */}
          {attachments.some((item) => item.type === 'document') && (
            <View style={{ gap: 8 }}>
              {attachments
                .filter((item) => item.type === 'document')
                .map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.inputBackground,
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: theme.colors.primary + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialDesignIcons name="file-document-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: rfValue(12.5),
                          fontFamily: FontFamily.medium,
                          color: theme.colors.text,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: rfValue(10.5),
                          fontFamily: FontFamily.body,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        {item.size || '1.2 MB'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(item.id)}
                      activeOpacity={0.7}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: theme.colors.error + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialDesignIcons name="delete-outline" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* Single Standardized Bottom Add Button */}
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary + '08',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1.2,
              borderStyle: 'dashed',
              borderColor: theme.colors.primary + '40',
              gap: 8,
              marginTop: 4,
            }}
          >
            <MaterialDesignIcons name="plus" size={18} color={theme.colors.primary} />
            <Text style={{ fontSize: rfValue(12), fontFamily: FontFamily.medium, color: theme.colors.primary }}>
              Add Attachment / File
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <AttachmentPickerModal
        mediaTypesOnly={false}
        visible={showPicker}
        onSelectFiles={handleSelectFiles}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
};

export default AttachmentsInput;
