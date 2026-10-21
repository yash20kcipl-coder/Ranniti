import { Platform } from 'react-native';

/**
 * Centralized App Version & Build Configuration
 * Single source of truth for the app version across the entire mobile application.
 */
export const APP_VERSION_CONFIG = {
  ios: '1.7',
  android: '1.0.9',
  buildNumber: '10',
};

export default APP_VERSION_CONFIG;

/**
 * Returns the current installed app version string (e.g., '1.0.0').
 */
export function getAppVersion(): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return APP_VERSION_CONFIG[platform];
}

/**
 * Returns the current installed app build number string (e.g., '102').
 * Dynamically queries native DeviceInfo first, falling back to APP_VERSION_CONFIG.
 */
export function getBuildNumber(): string {
  return APP_VERSION_CONFIG.buildNumber;
}

/**
 * Returns a human-friendly formatted version string, e.g. "1.0.0 (Build 102)".
 */
export function getFormattedAppVersion(): string {
  const version = getAppVersion();
  const build = getBuildNumber();
  return build ? `${version} (Build ${build})` : version;
}

/**
 * Simple semantic version comparison utility.
 * Returns true if the first version string is strictly less than the second version string.
 */
export function isVersionLessThan(current: string, target: string): boolean {
  const cParts = current.split('.').map(Number);
  const tParts = target.split('.').map(Number);

  for (let i = 0; i < Math.max(cParts.length, tParts.length); i++) {
    const cPart = cParts[i] || 0;
    const tPart = tParts[i] || 0;
    if (cPart < tPart) return true;
    if (cPart > tPart) return false;
  }
  return false;
}

