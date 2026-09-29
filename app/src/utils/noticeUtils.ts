/**
 * Centralized styling configuration for Notice artifacts.
 * Unifies color palette, iconography, and layout detail modes across entire workspace.
 */

export interface NoticeThemeConfig {
  primary: string;
  banner: string;
  bg: string;
  icon: string;
  detailIcon: string;
}

export const NOTICE_FILTER_CATEGORIES = ['All', 'Urgent', 'Event', 'Academic', 'Info'];

export const getNoticeThemeConfig = (type: string | undefined, theme: any): NoticeThemeConfig => {
  const key = type?.toLowerCase();

  switch (key) {
    case 'urgent':
      return {
        primary: '#EF4444',
        banner: '#DC2626',
        bg: '#FEE2E2',
        icon: 'alert-circle-outline',
        detailIcon: 'alert-decagram'
      };
    case 'event':
      return {
        primary: '#10B981',
        banner: '#059669',
        bg: '#D1FAE5',
        icon: 'calendar-star',
        detailIcon: 'calendar-star'
      };
    case 'academic':
      return {
        primary: '#F59E0B',
        banner: '#D97706',
        bg: '#FEF3C7',
        icon: 'book-open-variant',
        detailIcon: 'school'
      };
    case 'info':
      return {
        primary: '#3B82F6',
        banner: '#2563EB',
        bg: '#DBEAFE',
        icon: 'information-variant',
        detailIcon: 'information'
      };
    default:
      return {
        primary: theme.colors.primary,
        banner: theme.colors.primary,
        bg: theme.colors.primary + '15',
        icon: 'bell-outline',
        detailIcon: 'information'
      };
  }
};
