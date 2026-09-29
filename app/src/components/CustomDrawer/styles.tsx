import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { rfValue } from '../../utils/responsive';
import { FontFamily } from '../../utils/typography';

export const customDrawerStyles = (theme: Theme, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingTop: insets.top + 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30,
    overflow: 'hidden',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontFamily: FontFamily.black,
    fontSize: rfValue(16),
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  userRole: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(12),
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  schoolName: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
  drawerContent: {
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  drawerItemIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  drawerItemText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(15),
    color: theme.colors.textSecondary,
  },
  drawerItemTextActive: {
    color: theme.colors.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: insets.bottom + 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  logoutText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: rfValue(15),
    color: theme.colors.error,
    marginLeft: 12,
  },
  version: {
    fontFamily: FontFamily.body,
    fontSize: rfValue(12),
    color: theme.colors.textSecondary,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
    marginHorizontal: 12,
    opacity: 0.5,
  },
});
