import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.jinam.compass',
  appName: '결정의 나침반',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
