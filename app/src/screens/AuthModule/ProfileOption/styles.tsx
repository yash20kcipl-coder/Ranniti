import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';

export const profileOptionStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  circleTop: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: theme.colors.primary + '25',
    top: -200,
    right: -200,
  },
  circleBottom: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.colors.primary + '15',
    bottom: -100,
    left: -100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: rfValue(24),
    fontFamily: FontFamily.extraBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: rfValue(15),
    fontFamily: FontFamily.bodyBold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...getShadow(3, theme.colors.shadowColor, 0.08),
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: rfValue(16),
    fontFamily: FontFamily.heading,
    color: theme.colors.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: rfValue(13),
    color: theme.colors.textSecondary,
    fontFamily: FontFamily.bodyBold,
  }
});
