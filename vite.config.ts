import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Try to load env, but don't fail if .env files don't exist or have permission issues
    let env: Record<string, string> = {};
    try {
      env = loadEnv(mode, '.', '');
    } catch (e: any) {
      // If it's a permission error or file doesn't exist, continue without env vars
      if (e.code === 'EPERM' || e.code === 'ENOENT') {
        console.warn('Skipping .env file load due to permissions or missing file');
      } else {
        console.warn('Could not load .env files:', e.message);
      }
    }
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/server-api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
