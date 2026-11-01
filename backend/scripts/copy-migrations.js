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

// Copy Swagger UI CSS & Hook files
const swaggerAssets = ['swagger.css', 'swagger.auth-hook.js'];
for (const asset of swaggerAssets) {
  const assetSrc = path.join(__dirname, `../src/config/${asset}`);
  const assetDist = path.join(__dirname, `../dist/config/${asset}`);
  if (fs.existsSync(assetSrc)) {
    fs.mkdirSync(path.dirname(assetDist), { recursive: true });
    fs.copyFileSync(assetSrc, assetDist);
    console.log(`✅ Copied ${asset} to dist/config/${asset}`);
  }
}


