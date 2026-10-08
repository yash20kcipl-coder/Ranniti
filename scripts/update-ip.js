#!/usr/bin/env node

/**
 * Auto-detect local machine IPv4 and update IP across backend, web, and mobile app configurations.
 *
 * Usage:
 *   node scripts/update-ip.js              # Auto-detect IP from active network interface
 *   node scripts/update-ip.js 192.168.1.50 # Manually specify IP
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Determine Local IP
function detectLocalIp() {
  const manualIp = process.argv[2];
  if (manualIp && manualIp.trim()) {
    const trimmed = manualIp.trim();
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
      return { ip: trimmed, iface: 'manual' };
    }
    console.warn(`[WARN] Provided argument '${manualIp}' is not a valid IPv4 address. Auto-detecting...`);
  }

  const interfaces = os.networkInterfaces();
  const ignoredInterfaces = [
    'docker',
    'vboxnet',
    'vmnet',
    'tailscale',
    'tun',
    'tap',
    'utun',
    'awdl',
    'llw',
    'bridge',
    'dummy',
    'lo',
  ];

  const preferredOrder = ['en0', 'en1', 'wlan0', 'eth0', 'Wi-Fi', 'Ethernet'];

  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const isIgnored = ignoredInterfaces.some((prefix) => name.toLowerCase().startsWith(prefix));
    if (isIgnored) continue;

    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && addr.address !== '127.0.0.1') {
        candidates.push({ ip: addr.address, iface: name });
      }
    }
  }

  if (candidates.length === 0) {
    console.warn('[WARN] No external IPv4 network interface found. Falling back to 127.0.0.1');
    return { ip: '127.0.0.1', iface: 'localhost' };
  }

  // Prioritize preferred interface names
  candidates.sort((a, b) => {
    const idxA = preferredOrder.indexOf(a.iface);
    const idxB = preferredOrder.indexOf(b.iface);
    const weightA = idxA === -1 ? 99 : idxA;
    const weightB = idxB === -1 ? 99 : idxB;
    return weightA - weightB;
  });

  return candidates[0];
}

const { ip, iface } = detectLocalIp();
const BACKEND_PORT = 10001;
const WEB_PORT = 10002;

console.log('\n======================================================');
console.log(`🌐 Ranniti Local IP Synchronizer`);
console.log(`   Target IP:   ${ip} (${iface})`);
console.log(`   Backend:     http://${ip}:${BACKEND_PORT}`);
console.log(`   Web:         http://${ip}:${WEB_PORT}`);
console.log('======================================================\n');

let changesMade = 0;

function updateFile(filePath, updater) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const relativePath = path.relative(ROOT_DIR, filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = updater(original);

  if (original !== updated) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(` ✅ Updated: ${relativePath}`);
    changesMade++;
  } else {
    console.log(` ⏸️  Unchanged: ${relativePath}`);
  }
}

// 1. backend/.env
updateFile(path.join(ROOT_DIR, 'backend', '.env'), (content) => {
  let updated = content;

  // Update CORS_ORIGIN
  if (/^CORS_ORIGIN=.*$/m.test(updated)) {
    updated = updated.replace(
      /^CORS_ORIGIN=.*$/m,
      `CORS_ORIGIN=http://localhost:${WEB_PORT},http://${ip}:${WEB_PORT}`
    );
  } else {
    updated += `\nCORS_ORIGIN=http://localhost:${WEB_PORT},http://${ip}:${WEB_PORT}\n`;
  }

  // Update FILE_BASE_URL
  if (/^FILE_BASE_URL=.*$/m.test(updated)) {
    updated = updated.replace(
      /^FILE_BASE_URL=http:\/\/[^:]+(:\d+)?.*$/m,
      `FILE_BASE_URL=http://${ip}:${BACKEND_PORT}`
    );
  } else {
    updated += `\nFILE_BASE_URL=http://${ip}:${BACKEND_PORT}\n`;
  }

  return updated;
});

// 2. backend/.env.development
updateFile(path.join(ROOT_DIR, 'backend', '.env.development'), (content) => {
  let updated = content;

  if (/^CORS_ORIGIN=.*$/m.test(updated)) {
    updated = updated.replace(
      /^CORS_ORIGIN=.*$/m,
      `CORS_ORIGIN=http://localhost:${WEB_PORT},http://${ip}:${WEB_PORT}`
    );
  }

  if (/^FILE_BASE_URL=.*$/m.test(updated)) {
    updated = updated.replace(
      /^FILE_BASE_URL=http:\/\/[^:]+(:\d+)?.*$/m,
      `FILE_BASE_URL=http://${ip}:${BACKEND_PORT}`
    );
  }

  return updated;
});

// 3. web/src/utils/baseUrl.ts
updateFile(path.join(ROOT_DIR, 'web', 'src', 'utils', 'baseUrl.ts'), (content) => {
  let updated = content;

  updated = updated.replace(
    /export const FILE_BASE_URL = ['"`]http:\/\/[^:]+(:\d+)?['"`];/,
    `export const FILE_BASE_URL = 'http://${ip}:${BACKEND_PORT}';`
  );

  updated = updated.replace(
    /export const API_BASE_URL = ['"`]http:\/\/[^:]+(:\d+)?\/api\/v1['"`];/,
    `export const API_BASE_URL = 'http://${ip}:${BACKEND_PORT}/api/v1';`
  );

  return updated;
});

// 4. app/src/utils/url.ts
updateFile(path.join(ROOT_DIR, 'app', 'src', 'utils', 'url.ts'), (content) => {
  let updated = content;

  // Update Wi-Fi IP comment
  updated = updated.replace(
    /\/\/\s*Machine Wi-Fi IP:.*$/m,
    `// Machine Wi-Fi IP: ${ip} | Active Backend Port: ${BACKEND_PORT}`
  );

  // Update LOCAL_IP constant
  updated = updated.replace(
    /const LOCAL_IP = ['"`][^'"`]+['"`];/,
    `const LOCAL_IP = '${ip}';`
  );

  return updated;
});

console.log(`\n✨ Finished: ${changesMade} file(s) updated to IP ${ip}.\n`);
