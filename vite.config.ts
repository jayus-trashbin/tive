import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: '.',
    publicDir: 'public',
    server: {
      port: 5500, // Match "Live Server" default port
      host: '0.0.0.0',
      open: true, // Open browser on start
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    build: {
      outDir: 'dist',
      // Increase chunk warning limit to avoid noise
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React ecosystem
            vendor: ['react', 'react-dom', 'zustand'],
            // Animation library (used everywhere)
            motion: ['framer-motion'],
            // UI utilities
            ui: ['lucide-react', 'clsx', 'tailwind-merge'],
            // Heavy charting library (lazy-loaded)
            charts: ['recharts'],
            // Drag and drop (only used in routine editor)
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            // Supabase (async operations)
            supabase: ['@supabase/supabase-js'],
          }
        }
      },
      // Enable minification optimizations
      minify: 'esbuild',
      target: 'esnext',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
    }
  };
});
