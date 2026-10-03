import toast from '../utils/toast';
import React, { useState } from 'react';
import { Theme } from '../constants/theme';
import { getShadow } from '../utils/shadow';
import { rfValue } from '../utils/responsive';
import { FontFamily } from '../utils/typography';
import { useAppTheme } from '../hooks/useAppTheme';
import ImagePicker from 'react-native-image-crop-picker';
import { MaterialDesignIcons } from './MaterialDesignIcons';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { View, StyleSheet, Modal, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface AttachmentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  mediaTypesOnly?: boolean;
  onSelectFile?: (fileName: string, fileUri: string, mimeType?: string) => void;
  onSelectFiles?: (files: Array<{ name: string; uri: string; mimeType?: string; thumbnail?: string; size?: number }>) => void;
}

export const AttachmentPickerModal: React.FC<AttachmentPickerModalProps> = ({
  visible,
  onClose,
  onSelectFile,
  onSelectFiles,
  mediaTypesOnly = false,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const [loadingText, setLoadingText] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const getNormalizedUri = (uri: string) => {
    if (!uri) return '';
    if (uri.startsWith('file://')) {
      const path = uri.substring(7);
      return 'file://' + encodeURI(path);
    }
    return uri;
  };

  const compressFile = async (path: string, isVideo: boolean): Promise<string> => {
    try {
      if (isVideo) {
        return await VideoCompressor.compress(path, {});
      } else {
        return await ImageCompressor.compress(path, {
          compressionMethod: 'auto',
        });
      }
    } catch (error) {
      console.warn('Compression failed, falling back to original path:', error);
      return path;
    }
  };

  const handleDocumentPick = async () => {
    try {
      const res = await pick({
        type: mediaTypesOnly ? [types.images, types.video] : [types.allFiles],
        allowMultiSelection: !!onSelectFiles,
      });

      if (res && res.length > 0) {
        const sortedRes = [...res].sort((a, b) => {
          const isAVideo = a.type?.startsWith('video') || a.uri.endsWith('.mp4') || a.uri.endsWith('.mov') || a.name?.endsWith('.mp4') || a.name?.endsWith('.mov');
          const isBVideo = b.type?.startsWith('video') || b.uri.endsWith('.mp4') || b.uri.endsWith('.mov') || b.name?.endsWith('.mp4') || b.name?.endsWith('.mov');
          if (isAVideo && !isBVideo) return -1;
          if (!isAVideo && isBVideo) return 1;
          return 0;
        });

        const hasCompressible = sortedRes.some(file => file.type?.startsWith('video') || file.type?.startsWith('image') || file.uri.endsWith('.mp4') || file.uri.endsWith('.mov') || file.name?.endsWith('.mp4') || file.name?.endsWith('.mov'));
        if (hasCompressible) {
          setIsCompressing(true);
        }
        const compressedFiles: Array<{ name: string; uri: string; mimeType?: string; thumbnail?: string; size?: number }> = [];

        for (let i = 0; i < sortedRes.length; i++) {
          const file = sortedRes[i];
          const isVideo = file.type?.startsWith('video') || file.uri.endsWith('.mp4') || file.uri.endsWith('.mov') || file.name?.endsWith('.mp4') || file.name?.endsWith('.mov');
          setLoadingText(`Compressing file ${i + 1} of ${sortedRes.length}...`);

          const isCompressible = file.type?.startsWith('image') || file.type?.startsWith('video') || isVideo || file.type?.includes('image');
          let finalUri = file.uri;

          if (isCompressible) {
            finalUri = await compressFile(file.uri, !!isVideo);
          }

          let thumbnail: string | undefined;
          if (isVideo) {
            try {
              const thumbResponse = await createThumbnail({
                url: finalUri,
                timeStamp: 1000,
              });
              thumbnail = thumbResponse.path;
            } catch (error) {
              console.warn('Failed to generate video thumbnail:', error);
            }
          }

          const mimeType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');
          compressedFiles.push({
            name: file.name || (isVideo ? 'video.mp4' : 'image.jpg'),
            uri: getNormalizedUri(finalUri),
            mimeType,
            thumbnail: thumbnail ? getNormalizedUri(thumbnail) : undefined,
            size: file.size ?? undefined,
          });
        }

        if (hasCompressible) {
          setLoadingText("Files compressed successfully!");
          if (onSelectFiles) {
            onSelectFiles(compressedFiles);
          } else {
            compressedFiles.forEach(f => onSelectFile?.(f.name, f.uri, f.mimeType));
          }
          setTimeout(() => {
            setIsCompressing(false);
            onClose();
          }, 5000);
        } else {
          if (onSelectFiles) {
            onSelectFiles(compressedFiles);
          } else {
            compressedFiles.forEach(f => onSelectFile?.(f.name, f.uri, f.mimeType));
          }
          onClose();
        }
      }
    } catch (err) {
      setIsCompressing(false);
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // user canceled picking, do nothing
      } else {
        toast.error('Failed to pick document');
      }
    }
  };

  const handleGalleryPick = async () => {
    try {
      if (mediaTypesOnly || !!onSelectFiles) {
        const selections = await ImagePicker.openPicker({
          multiple: true,
          mediaType: 'any',
          compressImageQuality: 0.8,
        });

        if (selections && Array.isArray(selections) && selections.length > 0) {
          const sortedSelections = [...selections].sort((a, b) => {
            const isAVideo = a.mime?.startsWith('video') || a.path.endsWith('.mp4') || a.path.endsWith('.mov');
            const isBVideo = b.mime?.startsWith('video') || b.path.endsWith('.mp4') || b.path.endsWith('.mov');
            if (isAVideo && !isBVideo) return -1;
            if (!isAVideo && isBVideo) return 1;
            return 0;
          });

          const hasCompressible = sortedSelections.some(item => item.mime?.startsWith('video') || item.mime?.startsWith('image') || item.path.endsWith('.mp4') || item.path.endsWith('.mov'));
          if (hasCompressible) {
            setIsCompressing(true);
          }
          const compressedFiles: Array<{ name: string; uri: string; mimeType?: string; thumbnail?: string; size?: number }> = [];

          for (let i = 0; i < sortedSelections.length; i++) {
            const item = sortedSelections[i];
            const isVideo = item.mime?.startsWith('video') || item.path.endsWith('.mp4') || item.path.endsWith('.mov');
            setLoadingText(`Compressing ${isVideo ? 'video' : 'image'} ${i + 1} of ${sortedSelections.length}...`);

            const compressedUri = await compressFile(item.path, !!isVideo);
            let thumbnail: string | undefined;
            if (isVideo) {
              try {
                const thumbResponse = await createThumbnail({
                  url: compressedUri,
                  timeStamp: 1000,
                });
                thumbnail = thumbResponse.path;
              } catch (error) {
                console.warn('Failed to generate video thumbnail:', error);
              }
            }
            const fileName = item.filename || item.path.substring(item.path.lastIndexOf('/') + 1) || (isVideo ? 'video.mp4' : 'image.jpg');
            const mimeType = item.mime || (isVideo ? 'video/mp4' : 'image/jpeg');
            compressedFiles.push({
              name: fileName,
              uri: getNormalizedUri(compressedUri),
              mimeType,
              thumbnail: thumbnail ? getNormalizedUri(thumbnail) : undefined,
              size: item.size ?? undefined,
            });
          }

          if (hasCompressible) {
            setLoadingText("Media compressed successfully!");
            if (onSelectFiles) {
              onSelectFiles(compressedFiles);
            } else {
              compressedFiles.forEach(f => onSelectFile?.(f.name, f.uri, f.mimeType));
            }
            setTimeout(() => {
              setIsCompressing(false);
              onClose();
            }, 5000);
          } else {
            if (onSelectFiles) {
              onSelectFiles(compressedFiles);
            } else {
              compressedFiles.forEach(f => onSelectFile?.(f.name, f.uri, f.mimeType));
            }
            onClose();
          }
        }
      } else {
        const image = await ImagePicker.openPicker({
          width: 1200,
          height: 1200,
          cropping: true,
          compressImageQuality: 0.8,
        });

        if (image && image.path) {
          setIsCompressing(true);
          setLoadingText("Compressing media...");
          const compressedUri = await ImageCompressor.compress(image.path, {
            compressionMethod: 'auto',
          });
          const fileName = image.filename || image.path.substring(image.path.lastIndexOf('/') + 1) || 'gallery_image.jpg';
          setLoadingText("Media compressed successfully!");
          onSelectFile?.(fileName, getNormalizedUri(compressedUri), image.mime || 'image/jpeg');
          setTimeout(() => {
            setIsCompressing(false);
            onClose();
          }, 5000);
        }
      }
    } catch (err: any) {
      setIsCompressing(false);
      if (err?.message !== 'User cancelled image selection') {
        toast.error('Failed to pick media');
      }
    }
  };

  const handleCameraPick = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 1200,
        height: 1200,
        cropping: true,
        compressImageQuality: 0.8,
      });

      if (image && image.path) {
        setIsCompressing(true);
        setLoadingText("Compressing captured photo...");
        const compressedUri = await compressFile(image.path, false);
        const fileName = image.filename || image.path.substring(image.path.lastIndexOf('/') + 1) || 'camera_image.jpg';
        setLoadingText("Photo processed successfully!");
        if (onSelectFiles) {
          onSelectFiles([{ name: fileName, uri: getNormalizedUri(compressedUri), mimeType: image.mime || 'image/jpeg', size: image.size ?? undefined }]);
        } else {
          onSelectFile?.(fileName, getNormalizedUri(compressedUri), image.mime || 'image/jpeg');
        }
        setTimeout(() => {
          setIsCompressing(false);
          onClose();
        }, 5000);
      }
    } catch (err: any) {
      if (err?.message !== 'User cancelled image selection') {
        toast.error('Failed to capture photo');
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.bottomSheetContainer}
        >
          {/* Header Indicator */}
          <View style={styles.indicator} />

          <Text style={styles.title}>Select Source</Text>
          <Text style={styles.subtitle}>Choose how you want to upload your document</Text>

          <View style={styles.optionsContainer}>
            {/* Option 1: Document */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.optionButton}
              onPress={handleDocumentPick}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
                <MaterialDesignIcons name="file-document-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.optionLabel}>Document</Text>
            </TouchableOpacity>

            {/* Option 2: Gallery */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGalleryPick}
              style={styles.optionButton}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.info + '15' }]}>
                <MaterialDesignIcons name="image-outline" size={24} color={theme.colors.info} />
              </View>
              <Text style={styles.optionLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Option 3: Camera */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCameraPick}
              style={styles.optionButton}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.warning + '15' }]}>
                <MaterialDesignIcons name="camera-outline" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.optionLabel}>Camera</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {isCompressing && (
        <Modal
          transparent
          animationType="fade"
          visible={isCompressing}
          onRequestClose={() => { }}
        >
          <View style={styles.loaderCard}>
            <View style={styles.loaderIconContainer}>
              <View style={styles.spinnerPulseCircle}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.loaderText}>{loadingText}</Text>
            <Text style={styles.loaderSubtext}>Please do not close the app or go back</Text>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    backgroundColor: 'rgba(18, 18, 18, 0.88)',
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  loaderIconContainer: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerPulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  loaderText: {
    fontSize: rfValue(15.5),
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  loaderSubtext: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  bottomSheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    alignItems: 'center',
    ...getShadow(5, theme.colors.shadowColor, 0.18),
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: rfValue(16),
    fontFamily: FontFamily.heading,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: rfValue(11.5),
    fontFamily: FontFamily.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...getShadow(1, theme.colors.shadowColor, 0.02),
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: rfValue(12),
    fontFamily: FontFamily.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
