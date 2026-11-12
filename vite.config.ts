import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 管理后台由反代挂载在 /admin/，与 /pc/、/m/ 同级，独立构建、独立产物。开发期把 /api 代理到本地 API。
export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8787',
        // 保留浏览器的 Host：服务端按 Origin 与 Host 是否同站校验写请求，改写 Host 会被误判为跨站
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
