import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow external devices / systems on network
    port: 5173,
    allowedHosts: true, // Allow ngrok domains and external hostnames
    proxy: {
      '/api': {
        target: 'https://costly-internidal-moses.ngrok-free.dev',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
});
