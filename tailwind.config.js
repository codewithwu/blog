// Tailwind 配置：注入 Anthropic 品牌色（dark/light/mid/gray + orange/blue/green 点缀）
// 引入 typography 插件：Task 6 的 markdown 渲染依赖 prose 系列类
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#141413',
          // surface：比 dark 略亮的近黑色表面色，用于卡片/引用/代码块底色
          surface: '#1c1b1a',
          light:  '#faf9f5',
          mid:    '#b0aea5',
          gray:   '#e8e6dc',
          orange: '#d97757',
          blue:   '#6a9bcc',
          green:  '#788c5d'
        }
      }
    }
  },
  // 注册 typography 插件，否则 prose-* 类不会生成任何 CSS
  plugins: [typography]
};
