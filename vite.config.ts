
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel-dagi API_KEY ni brauzer kodiga o'tkazish
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', '@google/genai'],
        },
      },
    },
  }
});
