import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          const packagePath = id.split('node_modules/')[1];

          if (!packagePath) {
            return 'vendor';
          }

          const packageParts = packagePath.split('/');
          const packageName = packageParts[0].startsWith('@') && packageParts[1]
            ? `${packageParts[0]}/${packageParts[1]}`
            : packageParts[0];

          return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})