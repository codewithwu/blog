// Tailwind 配置：注入"深海 + 紫极光"品牌色板（D-2 决策）
//   单一来源：所有 UI 层只能通过 brand-* 工具类引用，禁止散落 hex（CLAUDE.md 规则 6）
//   层级：dark / surface / surface-2 / border 是底色；primary / accent / glow 是强调；
//         light / mid / dim 是文字层级
//
// P2-6 + P2-7 改造（父任务 08-23-ux-optimization-suite，ui-ux-pro-max 诊断 D1+D2）：
//   - theme.extend 5 个新扩展：boxShadow / borderRadius / transitionTimingFunction /
//     fontFamily / zIndex（单一来源收口）
//   - colors.brand.mid / brand.dim 提亮（P2-7）：#cbd5e1 / #94a3b8，
//     对比度 13:1 / 5:1（AAA / AA 大字边界）
//
// 修改 brand.* 颜色：必须同步检查 src/index.css body 硬编码 bg-[#0a0e1f]
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
          mid:      '#cbd5e1', // 次级文字（excerpt、meta）P2-7 提亮：#94a3b8 → #cbd5e1
          dim:      '#94a3b8'  // 三级文字、占位 P2-7 提亮：#64748b → #94a3b8
        }
      },
      // P2-6：boxShadow token 收口（替代散落 hardcoded shadow-[0_0_12px_-2px_rgba(...)]）
      boxShadow: {
        'glow-sm':  '0 0 12px -2px rgba(91,141,239,0.45)',   // 玻璃态默认
        'glow-md':  '0 0 18px -2px rgba(76,201,240,0.55)',   // hover / focus
        'glow-lg':  '0 0 0 1px rgba(91,141,239,0.4), 0 8px 32px -8px rgba(167,139,250,0.35)', // EntryCard hover 双层
        'hover-glow': '0 0 18px -2px rgba(76,201,240,0.55)', // glass-pill hover
      },
      // P2-6：borderRadius token
      borderRadius: {
        'pill': '0.5rem',  // 玻璃态胶囊标准
      },
      // P2-6：transitionTimingFunction token
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // P2-6：fontFamily token（替代 index.css 硬编码 font-family）
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      // P2-6：zIndex 分层（tooltip / modal）
      zIndex: {
        'tooltip': 60,
        'modal': 100,
      },
    }
  }
};