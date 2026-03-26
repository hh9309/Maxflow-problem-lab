import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // ⭐ GitHub Pages 必须改成仓库名路径
    base: '/Maxflow-problem-lab/',

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    define: {
      // 让浏览器可用 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});