import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
    watch: {
      // 编辑器/agent 的原子写入会产生 .xxx.tmpdir/ 临时目录，监听这些被锁定的临时文件
      // 在 Windows 上会抛 EBUSY 并直接杀死 dev server，一律忽略。
      // .shots/ 是截图工具的浏览器配置目录，GPU 缓存 db 同样会被 Chromium 锁定；
      // reference/ 是美术/表情参考素材，常被看图工具长期锁文件，也不参与构建；
      // 其余是 .gitignore 里的产物目录（录屏、构建输出等），会被外部进程长期锁定。
      ignored: [
        '**/.*.tmpdir/**',
        '**/*.tmp',
        '**/*.tmp/**',
        '**/.shots/**',
        '**/reference/**',
        '**/release/**',
        '**/dist/**',
        '**/out/**',
        '**/.portable-app/**',
        '**/generated-images/**',
        '**/.vite/**',
      ],
    },
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
