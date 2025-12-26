
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Muhit o'zgaruvchilarini yuklash
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // API_KEY ni ustuvorlik bilan aniqlash
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
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
  };
});
