// Tailwind 配置：注入"深海 + 紫极光"品牌色板（D-2 决策）
//   单一来源：所有 UI 层只能通过 brand-* 工具类引用，禁止散落 hex（CLAUDE.md 规则 6）
//   层级：dark / surface / surface-2 / border 是底色；primary / accent / glow 是强调；
//         light / mid / dim 是文字层级
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './projects/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:     '#0a0e1f', // body 紫蓝近黑
          surface:  '#14193a', // 卡片、按钮底色
          'surface-2': '#1e2348', // hover 状态、次级表面
          border:   '#2a3158', // 边框
          primary:  '#5b8def', // 电光蓝，主强调（hover 文字、focus ring）
          accent:   '#a78bfa', // 极光紫，副强调（chip / tagline / 404 装饰）
          glow:     '#4cc9f0', // 电光青蓝，hover 发光 / focus 发亮
          light:    '#f8fafc', // 主文字
          mid:      '#94a3b8', // 次级文字（excerpt、meta）
          dim:      '#64748b'  // 三级文字、占位
        }
      }
    }
  }
};