import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, 'package.json');
const versionJsPath = path.join(__dirname, 'resources', 'js', 'constants', 'version.js');
const manifestJsonPath = path.join(__dirname, 'public', 'manifest.json');

try {
  // 1. Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '1.0.0';

  // 2. Bump version with rollover (patch hits 10 → minor bumps, minor hits 10 → major bumps)
  const parts = currentVersion.split('.');
  if (parts.length === 3) {
    let major = parseInt(parts[0], 10)
    let minor = parseInt(parts[1], 10)
    let patch = parseInt(parts[2], 10) + 1
    if (patch >= 10) {
      patch = 0
      minor++
    }
    if (minor >= 10) {
      minor = 0
      major++
    }
    parts[0] = major
    parts[1] = minor
    parts[2] = patch
  } else {
    parts.push('1');
  }
  const nextVersion = parts.join('.');

  // 3. Update package.json
  packageJson.version = nextVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n', 'utf8');

  // 4. Create constants/version.js directory if it doesn't exist
  const dir = path.dirname(versionJsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 5. Write version.js
  fs.writeFileSync(versionJsPath, `export const APP_VERSION = '${nextVersion}';\n`, 'utf8');

  // 6. Update manifest.json version field
  if (fs.existsSync(manifestJsonPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    manifest.version = nextVersion;
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  console.log(`Bumped version from ${currentVersion} to ${nextVersion}`);
} catch (error) {
  console.error('Failed to bump version:', error);
  process.exit(1);
}
