import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItem
} from 'react-native';
import { useDispatch } from 'react-redux';
import toast from '../../../utils/toast';
import {
  fetchMobileWhatsAppTemplatesAction,
  MobileWhatsAppTemplate,
  MobileWhatsAppTemplatesData,
  WhatsAppButton,
} from '../../../store/actions/mobileElection';
import { Theme } from '../../../constants/theme';
import { useLanguage } from '../../../languages';
import { Modal } from '../../../components/Modal';
import { AppDispatch } from '../../../store/store';
import { rfValue } from '../../../utils/responsive';
import { Voter } from '../../../store/reducers/voters';
import { FontFamily } from '../../../utils/typography';
import { Skeleton } from '../../../components/Skeleton';
import { useAppTheme } from '../../../hooks/useAppTheme';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MaterialDesignIcons } from '../../../components/MaterialDesignIcons';
import { logVolunteerInteractionAction } from '../../../store/actions/voters';
import { openWhatsAppChat, openSmsComposer } from '../../../utils/linkingUtils';

export interface WhatsAppTemplatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  voter: Voter | null;
  onSuccess?: () => void;
  initialChannel?: MessageChannel;
}

export type MessageChannel = 'whatsapp' | 'sms';
export type TemplateLanguage = 'hi' | 'en';
export type TemplateLanguageFilter = 'ALL' | TemplateLanguage;
export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | string;

export interface ElectionContext {
  id?: string | null;
  name?: string | null;
  electionDate?: string | null;
}

export interface CampaignContext {
  candidateName?: string | null;
  partyName?: string | null;
}

export interface CategoryBadgeTheme {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export function getCategoryBadgeTheme(category: TemplateCategory): CategoryBadgeTheme {
  switch (category) {
    case 'MARKETING':
      return {
        backgroundColor: '#F59E0B18',
        borderColor: '#F59E0B40',
        textColor: '#D97706',
      };
    case 'AUTHENTICATION':
      return {
        backgroundColor: '#6366F118',
        borderColor: '#6366F140',
        textColor: '#4F46E5',
      };
    default:
      return {
        backgroundColor: '#10B98118',
        borderColor: '#10B98140',
        textColor: '#059669',
      };
  }
}

/**
 * Replaces dynamic variables {{1}}, {{2}}, {{voterName}}, etc. with voter & election context
 */
function interpolateTemplateBody(
  bodyText: string,
  voter: Voter,
  election?: ElectionContext | null,
  campaign?: CampaignContext | null,
  lang?: string
): string {
  const voterName =
    (lang === 'hi' ? (voter.hindiName || voter.name) : (voter.englishName || voter.name)) ||
    voter.name ||
    'मतदाता';
  const boothDisplay = voter.boothName || (voter.boothNo ? `बूथ #${voter.boothNo}` : 'मतदान केंद्र');
  const sectionDisplay = voter.sectionNo
    ? String(voter.sectionNo)
    : voter.wardNo
      ? String(voter.wardNo)
      : '1';
  const serialDisplay = voter.serialNo ? String(voter.serialNo) : '-';
  const pollingDateDisplay = election?.electionDate ? election.electionDate : 'मतदान दिवस';
  const candidateDisplay = campaign?.candidateName || 'रणनीति टीम';
  const partyDisplay = campaign?.partyName || '';

  let text = bodyText || '';

  // Numbered variables {{1}}, {{2}}, {{3}}, {{4}}, {{5}}
  text = text.replace(/\{\{1\}\}/g, voterName);
  text = text.replace(/\{\{2\}\}/g, boothDisplay);
  text = text.replace(/\{\{3\}\}/g, sectionDisplay);
  text = text.replace(/\{\{4\}\}/g, serialDisplay);
  text = text.replace(/\{\{5\}\}/g, pollingDateDisplay);

  // Named variables (supports both snake_case and camelCase)
  text = text.replace(/\{\{voter_?name\}\}/gi, voterName);
  text = text.replace(/\{\{name\}\}/gi, voterName);
  text = text.replace(/\{\{booth_?name\}\}/gi, boothDisplay);
  text = text.replace(/\{\{booth_?no\}\}/gi, voter.boothNo ? String(voter.boothNo) : boothDisplay);
  text = text.replace(/\{\{serial_?no\}\}/gi, serialDisplay);
  text = text.replace(/\{\{part_?no\}\}/gi, sectionDisplay);
  text = text.replace(/\{\{section_?no\}\}/gi, sectionDisplay);
  text = text.replace(/\{\{polling_?date\}\}/gi, pollingDateDisplay);
  text = text.replace(/\{\{candidate_?name\}\}/gi, candidateDisplay);
  text = text.replace(/\{\{party_?name\}\}/gi, partyDisplay);
  text = text.replace(/\{\{epic_?no\}\}/gi, voter.epicNo || '-');
  text = text.replace(/\{\{booth_?address\}\}/gi, voter.address || voter.fullAddress || boothDisplay);
  text = text.replace(/\{\{worker_?name\}\}/gi, candidateDisplay);
  text = text.replace(/\{\{pending_?count\}\}/gi, '0');

  return text;
}

/**
 * Builds the full formatted WhatsApp payload with header and footer
 */
function buildFullWhatsAppMessage(
  template: MobileWhatsAppTemplate,
  voter: Voter,
  election?: ElectionContext | null,
  campaign?: CampaignContext | null
): string {
  const body = interpolateTemplateBody(
    template.bodyText,
    voter,
    election,
    campaign,
    template.language
  );
  const parts: string[] = [];

  if (template.headerType === 'TEXT' && template.headerContent) {
    parts.push(`*${template.headerContent.trim()}*\n`);
  }

  parts.push(body.trim());

  if (template.footerText) {
    parts.push(`\n_${template.footerText.trim()}_`);
  }

  return parts.join('\n');
}

/**
 * Builds the plain-text SMS payload with header, body, footer, and button links
 */
function buildFullSmsMessage(
  template: MobileWhatsAppTemplate,
  voter: Voter,
  election?: ElectionContext | null,
  campaign?: CampaignContext | null
): string {
  const body = interpolateTemplateBody(
    template.bodyText,
    voter,
    election,
    campaign,
    template.language
  );
  const parts: string[] = [];

  if (template.headerType === 'TEXT' && template.headerContent) {
    parts.push(`${template.headerContent.trim()}\n`);
  }

  parts.push(body.trim());

  if (template.footerText) {
    parts.push(`\n- ${template.footerText.trim()}`);
  }

  // Include button links in SMS body if present
  if (template.buttons && template.buttons.length > 0) {
    const urlBtns = template.buttons.filter(
      (b: WhatsAppButton): b is WhatsAppButton & { url: string } => Boolean(b.url)
    );
    if (urlBtns.length > 0) {
      parts.push('\n' + urlBtns.map((b) => `${b.text || 'Link'}: ${b.url}`).join('\n'));
    }
  }

  return parts.join('\n');
}

export const WhatsAppTemplatePickerModal: React.FC<WhatsAppTemplatePickerModalProps> = ({
  visible,
  onClose,
  voter,
  onSuccess,
  initialChannel = 'whatsapp',
}) => {
  const { t } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, styles } = useAppTheme(templateModalStyles);
  const isDark = theme.colors.background === '#0F172A';

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<MobileWhatsAppTemplatesData | null>(null);
  const [selectedLang, setSelectedLang] = useState<TemplateLanguageFilter>('ALL');
  const [activeChannel, setActiveChannel] = useState<MessageChannel>(initialChannel);

  // Sync activeChannel when modal opens with initialChannel
  useEffect(() => {
    if (visible && initialChannel) {
      setActiveChannel(initialChannel);
    }
  }, [visible, initialChannel]);

  // Load templates whenever modal opens
  useEffect(() => {
    if (visible) {
      setLoading(true);
      dispatch(fetchMobileWhatsAppTemplatesAction())
        .then((res) => {
          if (res) {
            setData(res);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [visible, dispatch]);

  const templates: MobileWhatsAppTemplate[] = data?.templates || [];

  // Filter templates by language
  const filteredTemplates = useMemo<MobileWhatsAppTemplate[]>(() => {
    if (selectedLang === 'ALL') return templates;
    return templates.filter((tmpl) => tmpl.language === selectedLang);
  }, [templates, selectedLang]);

  const handleSendTemplate = useCallback(
    (template: MobileWhatsAppTemplate, channel: MessageChannel = 'whatsapp') => {
      if (!voter) return;

      const targetMobile = voter.mobile || voter.mobileNo || '';
      if (!targetMobile) {
        toast.error('Voter has no mobile number recorded');
        return;
      }

      // 1. Dispatch volunteer outreach logging telemetry
      dispatch(
        logVolunteerInteractionAction({
          voterId: voter.id,
          boothId: voter.boothId,
          activityType: channel,
          metadata: {
            templateId: template.id,
            templateName: template.name,
            category: template.category,
            language: template.language,
            channel,
          },
        })
      );

      // 2. Format & dispatch to selected channel
      if (channel === 'whatsapp') {
        const fullMessage = buildFullWhatsAppMessage(
          template,
          voter,
          data?.election,
          data?.campaign
        );
        openWhatsAppChat(targetMobile, fullMessage);
        toast.success(t('whatsAppSentSuccess'));
      } else {
        const fullSmsMessage = buildFullSmsMessage(
          template,
          voter,
          data?.election,
          data?.campaign
        );
        openSmsComposer(targetMobile, fullSmsMessage);
        toast.success(t('smsSentSuccess'));
      }

      // 3. Close modal
      onClose();
      if (onSuccess) onSuccess();
    },
    [voter, data, dispatch, t, onClose, onSuccess]
  );

  const voterDisplayName = voter
    ? (voter.englishName || voter.name) + (voter.hindiName ? ` (${voter.hindiName})` : '')
    : '';

  const renderTemplateItem: ListRenderItem<MobileWhatsAppTemplate> = ({ item }) => {
    if (!voter) return null;

    const interpolatedBody = interpolateTemplateBody(
      item.bodyText,
      voter,
      data?.election,
      data?.campaign,
      item.language
    );

    const friendlyName = item.name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const categoryTheme = getCategoryBadgeTheme(item.category);
    const isWhatsApp = activeChannel === 'whatsapp';

    const fullSmsMessage = buildFullSmsMessage(
      item,
      voter,
      data?.election,
      data?.campaign
    );

    return (
      <View
        style={[
          styles.templateCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Card Header: Category & Language badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: categoryTheme.backgroundColor,
                  borderColor: categoryTheme.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: categoryTheme.textColor },
                ]}
              >
                {item.category}
              </Text>
            </View>
            <View
              style={[
                styles.langBadge,
                { backgroundColor: theme.colors.border + '60' },
              ]}
            >
              <Text
                style={[styles.langBadgeText, { color: theme.colors.textSecondary }]}
              >
                {item.language === 'hi' ? 'हिन्दी' : item.language.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.templateName, { color: theme.colors.text }]}>
            {friendlyName}
          </Text>
        </View>

        {/* Message Preview Bubble (Dynamic WhatsApp vs SMS Chat Style) */}
        <View
          style={[
            styles.messageBubble,
            isWhatsApp
              ? {
                backgroundColor: isDark ? '#0B201A' : '#E7FCE8',
                borderColor: isDark ? '#134E35' : '#BBF7D0',
              }
              : {
                backgroundColor: isDark ? '#1F172B' : '#FAF5FF',
                borderColor: isDark ? '#581C87' : '#E9D5FF',
              },
          ]}
        >
          {/* Preview Channel Header Tag */}
          <View style={styles.previewChannelBadge}>
            <MaterialDesignIcons
              name={isWhatsApp ? 'whatsapp' : 'message-text-outline'}
              size={13}
              color={
                isWhatsApp
                  ? isDark ? '#86EFAC' : '#15803D'
                  : isDark ? '#D8B4FE' : '#7E22CE'
              }
            />
            <Text
              style={[
                styles.previewChannelText,
                {
                  color: isWhatsApp
                    ? isDark ? '#86EFAC' : '#15803D'
                    : isDark ? '#D8B4FE' : '#7E22CE',
                },
              ]}
            >
              {isWhatsApp ? t('whatsAppPreview') : t('smsPreview')}
            </Text>
            {!isWhatsApp && (
              <Text
                style={[
                  styles.charCountText,
                  { color: isDark ? '#C4B5FD' : '#9333EA' },
                ]}
              >
                {`${fullSmsMessage.length} chars`}
              </Text>
            )}
          </View>

          {isWhatsApp ? (
            <>
              {item.headerType === 'TEXT' && item.headerContent ? (
                <Text
                  style={[
                    styles.previewHeader,
                    { color: isDark ? '#86EFAC' : '#15803D' },
                  ]}
                >
                  {item.headerContent}
                </Text>
              ) : null}

              <Text
                style={[
                  styles.previewBody,
                  { color: isDark ? '#DCFCE7' : '#14532D' },
                ]}
              >
                {interpolatedBody}
              </Text>

              {item.footerText ? (
                <Text
                  style={[
                    styles.previewFooter,
                    { color: isDark ? '#86EFAC' : '#16A34A' },
                  ]}
                >
                  {item.footerText}
                </Text>
              ) : null}

              {/* Quick reply buttons preview */}
              {item.buttons && item.buttons.length > 0 ? (
                <View style={styles.buttonsRow}>
                  {item.buttons.map((btn: WhatsAppButton, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.buttonChip,
                        {
                          backgroundColor: isDark ? '#134E35' : '#DCFCE7',
                          borderColor: isDark ? '#22C55E' : '#86EFAC',
                        },
                      ]}
                    >
                      <MaterialDesignIcons
                        name="reply"
                        size={11}
                        color={isDark ? '#86EFAC' : '#15803D'}
                      />
                      <Text
                        style={[
                          styles.buttonChipText,
                          { color: isDark ? '#86EFAC' : '#15803D' },
                        ]}
                      >
                        {btn.text || btn.url || t('quickReply')}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text
              style={[
                styles.previewBody,
                { color: isDark ? '#F3E8FF' : '#581C87' },
              ]}
            >
              {fullSmsMessage}
            </Text>
          )}
        </View>

        {/* Dynamic Action Buttons: Tailored to activeChannel */}
        <View style={styles.actionButtonsRow}>
          {isWhatsApp ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.whatsappButton, { flex: 2 }]}
                activeOpacity={0.8}
                onPress={() => handleSendTemplate(item, 'whatsapp')}
              >
                <MaterialDesignIcons name="whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('sendViaWhatsApp')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.outlineButton,
                  { borderColor: isDark ? '#7E22CE' : '#E9D5FF', flex: 1 },
                ]}
                activeOpacity={0.8}
                onPress={() => handleSendTemplate(item, 'sms')}
              >
                <MaterialDesignIcons name="message-text-outline" size={15} color="#7E22CE" />
                <Text style={[styles.secondaryButtonText, { color: '#7E22CE' }]}>{t('sms')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.smsButton, { flex: 2 }]}
                activeOpacity={0.8}
                onPress={() => handleSendTemplate(item, 'sms')}
              >
                <MaterialDesignIcons name="message-text-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{t('sendViaSms')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.outlineButton,
                  { borderColor: isDark ? '#16A34A' : '#BBF7D0', flex: 1 },
                ]}
                activeOpacity={0.8}
                onPress={() => handleSendTemplate(item, 'whatsapp')}
              >
                <MaterialDesignIcons name="whatsapp" size={15} color="#16A34A" />
                <Text style={[styles.secondaryButtonText, { color: '#16A34A' }]}>{t('whatsApp')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={[
        styles.sheetContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.channelIconContainer,
              {
                backgroundColor: activeChannel === 'whatsapp' ? '#16A34A18' : '#7E22CE18',
              },
            ]}
          >
            <MaterialDesignIcons
              name={activeChannel === 'whatsapp' ? 'whatsapp' : 'message-text-outline'}
              size={22}
              color={activeChannel === 'whatsapp' ? '#16A34A' : '#7E22CE'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {activeChannel === 'whatsapp' ? t('selectWhatsAppTemplate') : t('selectSmsTemplate')}
            </Text>
            {voter ? (
              <Text
                style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {voterDisplayName}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: theme.colors.border + '50' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialDesignIcons name="close" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Voter Context Details Bar */}
      {voter && (
        <View
          style={[
            styles.voterDetailsPills,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.pillItem}>
            <Text style={[styles.pillLabel, { color: theme.colors.textSecondary }]}>EPIC</Text>
            <Text style={[styles.pillValue, { color: theme.colors.text }]}>
              {voter.epicNo || '-'}
            </Text>
          </View>
          <View style={styles.pillItem}>
            <Text style={[styles.pillLabel, { color: theme.colors.textSecondary }]}>Booth</Text>
            <Text style={[styles.pillValue, { color: theme.colors.text }]}>
              #{voter.boothNo || '-'}
            </Text>
          </View>
          <View style={styles.pillItem}>
            <Text style={[styles.pillLabel, { color: theme.colors.textSecondary }]}>Serial</Text>
            <Text
              style={[
                styles.pillValue,
                { color: activeChannel === 'whatsapp' ? '#16A34A' : '#7E22CE' },
              ]}
            >
              #{voter.serialNo || '-'}
            </Text>
          </View>
          {data?.election?.electionDate && (
            <View style={styles.pillItem}>
              <Text style={[styles.pillLabel, { color: theme.colors.textSecondary }]}>Poll Date</Text>
              <Text style={[styles.pillValue, { color: theme.colors.text }]}>
                {data.election.electionDate}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Channel Switcher Tabs: WhatsApp vs SMS */}
      <View style={styles.channelRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveChannel('whatsapp')}
          style={[
            styles.channelTab,
            activeChannel === 'whatsapp'
              ? { backgroundColor: '#16A34A', borderColor: '#16A34A' }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <MaterialDesignIcons
            name="whatsapp"
            size={16}
            color={activeChannel === 'whatsapp' ? '#FFFFFF' : '#16A34A'}
          />
          <Text
            style={[
              styles.channelTabText,
              {
                color: activeChannel === 'whatsapp' ? '#FFFFFF' : theme.colors.textSecondary,
                fontFamily: activeChannel === 'whatsapp' ? FontFamily.bodyBold : FontFamily.medium,
              },
            ]}
          >
            {t('whatsApp')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveChannel('sms')}
          style={[
            styles.channelTab,
            activeChannel === 'sms'
              ? { backgroundColor: '#7E22CE', borderColor: '#7E22CE' }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <MaterialDesignIcons
            name="message-text-outline"
            size={16}
            color={activeChannel === 'sms' ? '#FFFFFF' : '#7E22CE'}
          />
          <Text
            style={[
              styles.channelTabText,
              {
                color: activeChannel === 'sms' ? '#FFFFFF' : theme.colors.textSecondary,
                fontFamily: activeChannel === 'sms' ? FontFamily.bodyBold : FontFamily.medium,
              },
            ]}
          >
            {t('sms')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'hi', 'en'] as const).map((langKey) => {
          const isActive = selectedLang === langKey;
          const label =
            langKey === 'ALL'
              ? t('allLanguages')
              : langKey === 'hi'
                ? 'हिन्दी'
                : 'English';

          return (
            <TouchableOpacity
              key={langKey}
              activeOpacity={0.7}
              onPress={() => setSelectedLang(langKey)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? activeChannel === 'whatsapp' ? '#16A34A' : '#7E22CE'
                    : theme.colors.surface,
                  borderColor: isActive
                    ? activeChannel === 'whatsapp' ? '#16A34A' : '#7E22CE'
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                    fontFamily: isActive ? FontFamily.bodyBold : FontFamily.medium,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content: Skeleton Loader or List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={120} borderRadius={16} />
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>
      ) : filteredTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialDesignIcons name="message-alert-outline" size={36} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {t('noTemplatesFound')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        />
      )}
    </Modal>
  );
};

const templateModalStyles = (_theme: Theme) =>
  StyleSheet.create({
    sheetContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingBottom: 24,
      paddingHorizontal: 16,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    dragHandleRow: {
      paddingBottom: 6,
      alignItems: 'center',
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    header: {
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    channelIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    waIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#16A34A18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: FontFamily.bold,
      fontSize: rfValue(15),
    },
    headerSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: rfValue(11),
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voterDetailsPills: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginVertical: 8,
    },
    pillItem: {
      alignItems: 'center',
      gap: 1,
    },
    pillLabel: {
      fontSize: rfValue(9.5),
      fontFamily: FontFamily.body,
    },
    pillValue: {
      fontSize: rfValue(11.5),
      fontFamily: FontFamily.bodyBold,
    },
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
      marginTop: 2,
    },
    channelTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
    },
    channelTabText: {
      fontSize: rfValue(12.5),
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    filterTab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterTabText: {
      fontSize: rfValue(11),
    },
    listContent: {
      paddingBottom: 20,
    },
    cardSeparator: {
      height: 12,
    },
    templateCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      gap: 10,
    },
    cardHeader: {
      gap: 4,
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    categoryBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    categoryBadgeText: {
      fontSize: rfValue(9.5),
      fontFamily: FontFamily.bodyBold,
    },
    langBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    langBadgeText: {
      fontSize: rfValue(9.5),
      fontFamily: FontFamily.medium,
    },
    templateName: {
      fontSize: rfValue(13.5),
      fontFamily: FontFamily.bodyBold,
      marginTop: 2,
    },
    messageBubble: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      gap: 6,
    },
    previewChannelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 2,
    },
    previewChannelText: {
      fontSize: rfValue(11),
      fontFamily: FontFamily.bodyBold,
    },
    charCountText: {
      fontSize: rfValue(10),
      fontFamily: FontFamily.medium,
      marginLeft: 'auto',
    },
    previewHeader: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.bodyBold,
    },
    previewBody: {
      fontSize: rfValue(12),
      fontFamily: FontFamily.body,
      lineHeight: 18,
    },
    previewFooter: {
      fontSize: rfValue(10.5),
      fontFamily: FontFamily.medium,
      marginTop: 2,
    },
    buttonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    buttonChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    buttonChipText: {
      fontSize: rfValue(10),
      fontFamily: FontFamily.bodyBold,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    whatsappButton: {
      backgroundColor: '#16A34A',
    },
    smsButton: {
      backgroundColor: '#7E22CE',
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12.5),
    },
    secondaryButtonText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: rfValue(12),
    },
    loadingContainer: {
      paddingVertical: 20,
      gap: 12,
    },
    emptyContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    emptyText: {
      fontSize: rfValue(12.5),
      fontFamily: FontFamily.medium,
    },
  });

export default WhatsAppTemplatePickerModal;
