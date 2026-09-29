import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { getShadow } from '../../utils/shadow';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const appModalStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    width: '85%',
    maxHeight: '85%',
    alignSelf: 'center',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  closeBtn: {
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  title: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(22),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(15),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...getShadow(4, theme.colors.primary, 0.3),
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButtonText: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(16),
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(16),
    color: theme.colors.textSecondary,
  },
});
