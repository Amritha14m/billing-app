// Script to create drag-and-drop production zip for Netlify / manual web deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(rootDir, 'bizledger-web.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('Compressing dist/ into bizledger-web.zip for web deployment...');

try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipFile}' -Force"`, {
      stdio: 'inherit',
    });
  } else {
    execSync(`cd "${distDir}" && zip -r "${zipFile}" ./*`, {
      stdio: 'inherit',
    });
  }

  const stats = fs.statSync(zipFile);
  console.log(`✓ Successfully generated bizledger-web.zip (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Path: ${zipFile}`);
} catch (error) {
  console.error('Failed to create bizledger-web.zip:', error);
  process.exit(1);
}
