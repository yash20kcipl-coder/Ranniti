/**
 * Centralized styling configuration for Event artifacts.
 * Unifies color schemes and iconography between dashboards, galleries, and calendars.
 */

export interface EventThemeConfig {
  color: string;
  icon: string;
}

export const EVENT_FILTER_CATEGORIES = ['All', 'General', 'Sports', 'Academics', 'Cultural', 'Exhibition', 'Competition'];

export const getEventThemeConfig = (category: string | undefined, theme: any): EventThemeConfig => {
  const key = category?.toLowerCase();

  switch (key) {
    case 'sports':
      return {
        color: '#059669', // Emerald Green
        icon: 'trophy-outline'
      };
    case 'academic':
    case 'academics':
      return {
        color: '#0284C7', // Sky Blue
        icon: 'account-group-outline'
      };
    case 'cultural':
      return {
        color: '#8B5CF6', // Violet Purple
        icon: 'palette-outline'
      };
    case 'exhibition':
      return {
        color: '#D97706', // Amber
        icon: 'flask-outline'
      };
    case 'competition':
      return {
        color: '#EC4899', // Pink
        icon: 'microphone-variant'
      };
    case 'general':
      return {
        color: '#64748B', // Slate
        icon: 'calendar-outline'
      };
    default:
      return {
        color: theme.colors.primary,
        icon: 'calendar-star'
      };
  }
};
