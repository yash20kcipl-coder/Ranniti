/**
 * Simple semantic version comparison utility.
 * Returns true if the first version string is strictly less than the second version string.
 */

const appVersion = {
  android: "1.0.0",
  ios: "1.0.0"
};

export default appVersion;


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
