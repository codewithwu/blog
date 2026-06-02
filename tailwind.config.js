// Tailwind 配置：注入 Anthropic 品牌色（dark/light/mid/gray + orange/blue/green 点缀）
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#141413',
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
  plugins: []
};
