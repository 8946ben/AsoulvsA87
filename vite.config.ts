import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
    // 本地联调入场券限流服务：python server/game_gate.py 后，dev 页面走 /api/* 反代
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8793',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    chunkSizeWarningLimit: 2048,
  },
});
