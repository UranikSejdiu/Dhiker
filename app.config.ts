import { ExpoConfig, ConfigContext } from 'expo/config';
import { execSync } from 'child_process';

import fs from 'fs';
import path from 'path';

function getGitVersion(): string {
  try {
    const commitCount = parseInt(
      execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim(),
      10
    );
    const patch = commitCount % 10;
    const minor = Math.floor(commitCount / 10) % 10;
    const major = 1 + Math.floor(commitCount / 100);
    return `${major}.${minor}.${patch}`;
  } catch {
    return '1.0.0';
  }
}

const version = getGitVersion();

// Write the version to a static file so the app can import it directly
try {
  const versionFilePath = path.join(__dirname, 'src/constants/version.ts');
  const dirPath = path.dirname(versionFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(
    versionFilePath,
    `// Generated automatically by app.config.ts. Do not edit.\nexport const APP_VERSION = '${version}';\n`,
    'utf-8'
  );
} catch (err) {
  console.warn('Failed to write version file:', err);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dhikr Counter',
  slug: 'dhikr-counter',
  version: version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'dhikrcounter',
  userInterfaceStyle: 'dark',
  backgroundColor: '#060D1B',
  ios: {
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.dhikrcounter.app',
    adaptiveIcon: {
      backgroundColor: '#060D1B',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    // @ts-ignore
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    name: 'Dhikr Counter',
    shortName: 'Dhikr',
    // @ts-ignore
    display: 'standalone',
    backgroundColor: '#060D1B',
    themeColor: '#060D1B',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#060D1B',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e1ecf016-4905-4a7b-9107-bf5754cd0396',
    },
  },
});
