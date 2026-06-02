// Vite 构建配置。base: '/blog/' 表示部署到项目页（codewithwu.github.io/blog）
// 如果之后改为用户名.github.io 根域部署，把 base 改回 '/' 即可
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/blog/',
  plugins: [react()],
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
