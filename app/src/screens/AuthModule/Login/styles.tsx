import { Theme } from '../../../constants/theme';
import { getShadow } from '../../../utils/shadow';
import { rfValue } from '../../../utils/responsive';
import { StyleSheet } from 'react-native';
import { FontFamily } from '../../../utils/typography';

export const loginStyles = (theme: Theme, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topSection: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: insets.top,
    overflow: 'hidden', // Contain the background effects
  },
  backButton: {
    position: 'absolute',
    top: insets.top + 10,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -120,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: 20,
    left: -30,
  },
  bgCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: 40,
    left: 60,
  },
  bgCircle4: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 0, 0, 0.03)', // Subtle dark shade
    top: -100,
    left: -80,
  },
  bgCircle5: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Brighter white shade
    bottom: -30,
    right: 20,
  },
  bgCircle6: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.04)', // Another subtle dark shade
    right: 40,
    top: 100,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...getShadow(5, '#000', 0.15),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(24),
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: .5,
    textAlign: 'center'
  },
  bottomSection: {
    paddingBottom: 20,
    paddingHorizontal: 28,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -36,
    paddingTop: 32,
    ...getShadow(5, '#000', 0.1),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeTitle: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(28),
    color: theme.colors.text,
    letterSpacing: -1,
  },
  welcomeSub: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(15),
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 28,
  },
  formContainer: {
    gap: 12,
  },
  forgotBtn: {
    alignItems: 'flex-end',

  },
  forgotText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14),
    color: theme.colors.primary,
  },
  loginBtn: {
    height: 56,
    marginTop: 15,
    borderRadius: 16,
    ...getShadow(5, theme.colors.primary, 0.3),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerText: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(14),
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(14),
    color: theme.colors.primary,
  }
});
