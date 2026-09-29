import React, { useMemo } from 'react';
import { CustomImage } from '../CustomImage';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Attachment } from '../../core/config';
import { viewAttachment, downloadAttachment } from '../../utils/attachmentUtils';

interface AttachmentsViewProps {
  attachments?: Attachment[];
  accentColor?: string;
}

export const AttachmentsView: React.FC<AttachmentsViewProps> = ({
  attachments = [],
  accentColor,
}) => {
  const { theme, styles } = useAppTheme(getStyles);
  const activeColor = accentColor || theme.colors.primary;

  const processedAttachments = useMemo<Attachment[]>(() => {
    return attachments.map((att: Attachment) => {
      const type = att.type || (() => {
        const uri = att.uri?.toLowerCase() || '';
        const title = att.title?.toLowerCase() || '';
        const isImage =
          uri.endsWith('.jpg') ||
          uri.endsWith('.jpeg') ||
          uri.endsWith('.png') ||
          uri.includes('image') ||
          title.endsWith('.jpg') ||
          title.endsWith('.jpeg') ||
          title.endsWith('.png');
        const isVideo =
          uri.endsWith('.mp4') ||
          uri.endsWith('.mov') ||
          uri.includes('video') ||
          title.endsWith('.mp4') ||
          title.endsWith('.mov');
        return isVideo ? 'video' : isImage ? 'image' : 'document';
      })();
      return { ...att, type } as Attachment;
    });
  }, [attachments]);

  const mediaAttachments = processedAttachments.filter((att) => att.type !== 'document');
  const documentAttachments = processedAttachments.filter((att) => att.type === 'document');

  if (processedAttachments.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Media Attachments Section (Images, Videos) */}
      {mediaAttachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Media Attachments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
            {mediaAttachments.map((att) => (
              <TouchableOpacity
                key={att.id}
                style={styles.mediaCard}
                activeOpacity={0.8}
                onPress={() => viewAttachment(att.uri)}
              >
                {att.type === 'video' && !att.thumbnail ? (
                  <View
                    style={[
                      styles.mediaThumb,
                      { backgroundColor: theme.colors.text + 'D0', justifyContent: 'center', alignItems: 'center' },
                    ]}
                  >
                    <MaterialDesignIcons name="video" size={32} color="#FFFFFF" />
                  </View>
                ) : (
                  <CustomImage
                    uri={att.thumbnail || att.uri}
                    placeholderType="landscape"
                    style={styles.mediaThumb}
                  />
                )}
                {att.type === 'video' && (
                  <View style={styles.mediaIconBadge}>
                    <MaterialDesignIcons name="play" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Document Attachments Section */}
      {documentAttachments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reference Documents</Text>
          <View style={styles.documentsList}>
            {documentAttachments.map((att) => (
              <View key={att.id} style={styles.documentItem}>
                <View style={[styles.docIconContainer, { backgroundColor: activeColor + '15' }]}>
                  <MaterialDesignIcons name="file-document-outline" size={22} color={activeColor} />
                </View>
                <View style={styles.docInfo}>
                  <Text numberOfLines={1} style={styles.docName}>
                    {att.title}
                  </Text>
                  <Text style={styles.docSize}>{att.size || '1.2 MB'}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.downloadBtn, { backgroundColor: activeColor + '15' }]}
                  onPress={() => downloadAttachment(att.uri)}
                >
                  <MaterialDesignIcons name="download" size={16} color={activeColor} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: 20,
      marginTop: 20,
    },
    section: {
      gap: 8,
    },
    sectionLabel: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.bodyBold,
      color: theme.colors.textSecondary + 'B0',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    mediaScroll: {
      flexDirection: 'row',
    },
    mediaCard: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
      position: 'relative',
    },
    mediaThumb: {
      width: '100%',
      height: '100%',
    },
    mediaIconBadge: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -12 }, { translateY: -12 }],
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    documentsList: {
      gap: 8,
    },
    documentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border + '15',
      gap: 12,
    },
    docIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    docInfo: {
      flex: 1,
      gap: 2,
    },
    docName: {
      fontSize: rfValue(12.5),
      fontFamily: FontFamily.medium,
      color: theme.colors.text,
    },
    docSize: {
      fontSize: rfValue(10.5),
      fontFamily: FontFamily.body,
      color: theme.colors.textSecondary,
    },
    downloadBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
