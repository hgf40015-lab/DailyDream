
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Muhit o'zgaruvchilarini yuklash
  // Fix: Property 'cwd' does not exist on type 'Process'. Cast to any to access Node's process.cwd() in config.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // API_KEY ni ham Vite env'dan, ham Vercel process.env'dan qidiramiz
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
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
