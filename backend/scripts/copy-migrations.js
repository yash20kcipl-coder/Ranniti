const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/database/migrations');
const distDir = path.join(__dirname, '../dist/database/migrations');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.sql'));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(distDir, file));
  }
  console.log(`✅ Copied ${files.length} SQL migration files to dist/database/migrations`);
} else {
  console.warn(`⚠️ Source migrations directory not found at: ${srcDir}`);
}
