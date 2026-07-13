import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '결정의 나침반',
        short_name: '나침반',
        description: '개인 의사결정 상담 앱',
        theme_color: '#2d3748',
        background_color: '#f7fafc',
        display: 'standalone',
        lang: 'ko',
        start_url: '/',
        icons: [
          { src: '/compass.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@jinam/engine') || id.includes('/engine/')) return 'engine';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('astronomia') || id.includes('kor-lunar')) return 'calendar-vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
  },
});
