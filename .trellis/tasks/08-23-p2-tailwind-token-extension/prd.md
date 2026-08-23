# P2-6: tailwind.config 扩展 token

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

修复 ui-ux-pro-max 诊断 D1+D3+D5+D7：当前 tailwind.config.js 只扩展 `colors.brand`，`boxShadow` / `borderRadius` / `transitionTimingFunction` / `fontFamily` / `zIndex` 全无，散落 hardcoded `shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]` 在多处。统一扩展并把 z-index 分层（tooltip / modal / skipLink）也收口。

**与 P2-7 颜色对比提升合并到 1 个 commit**（同文件改动反复 commit 噪声大）。

## Requirements

### 1. tailwind.config.js 扩展

`/home/cooper/githubProjects/blog/tailwind.config.js` 的 `theme.extend` 增加 5 个扩展：

```js
extend: {
  colors: { brand: { /* 原 10 token（由 P2-7 提亮 mid/dim） */ } },
  boxShadow: {
    'glow-sm':  '0 0 12px -2px rgba(91,141,239,0.45)',   // 玻璃态默认
    'glow-md':  '0 0 18px -2px rgba(76,201,240,0.55)',   // hover / focus
    'glow-lg':  '0 0 32px -4px rgba(167,139,250,0.4)',    // 404 / Hero
    'hover-glow': '0 0 18px -2px rgba(76,201,240,0.55)',  // glass-pill hover
  },
  borderRadius: {
    'pill': '0.5rem',  // 玻璃态胶囊标准
  },
  transitionTimingFunction: {
    'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  fontFamily: {
    display: ['Fraunces', 'Georgia', 'serif'],
    sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
  },
  zIndex: {
    'tooltip': 60,
    'modal': 100,
  },
}
```

### 2. 替换散落 hardcoded shadow

- `src/index.css` 的 `.glass-pill` shadow 改用 token：
  ```css
  .glass-pill {
    @apply bg-brand-surface/60 text-brand-light border border-brand-primary/40
           backdrop-blur-md shadow-glow-sm
           transition-all duration-200;
  }
  ```
- `src/components/PrevNextNav.jsx:120` 的 `shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]` 改 `shadow-glow-sm`
- `src/components/EntryCard.jsx:107` 的 `shadow-[0_0_0_1px_rgba(91,141,239,0.4),0_8px_32px_-8px_rgba(167,139,250,0.35)]` 改 `shadow-glow-lg`（保留双层视觉效果）
- `src/components/EntryCard.jsx:110` 的 `shadow-[0_0_12px_rgba(76,201,240,0.45)]`（focus-visible shadow）改 `shadow-glow-md`

### 3. index.css 字体走 token

- `src/index.css:16-32` 移除 body / h1-h6 / .font-mono 的 `font-family` 硬编码：
  ```css
  @layer base {
    h1, h2, h3, h4, h5, h6 {
      @apply font-display;
    }
    body {
      @apply font-sans bg-[#0a0e1f] text-brand-light;
      min-height: 100vh;
    }
    .font-mono {
      @apply font-mono;
    }
  }
  ```
- 注：`.font-mono` 改 `@apply font-mono` 后等价（保留 `.font-mono` 类兼容）

### 4. z-index 用 token

- 各组件的 `z-30` / `z-40` / `z-50` / `z-[60]` / `z-[100]` 保留数字类即可（Tailwind 已提供 z-0~z-50 的常用档；自定义 60/100 改用 `z-tooltip` / `z-modal`）

### 5. 测试

- 本任务主要是 token 扩展 + 视觉不变
- `npm run test` 应全绿（行为不变）
- `npm run build` 应成功
- 视觉对比：截图首页 + 详情页 + 404，确认玻璃态外观一致

## Acceptance Criteria

- [ ] **AC-1**：tailwind.config.js `theme.extend` 包含 `boxShadow` / `borderRadius` / `transitionTimingFunction` / `fontFamily` / `zIndex` 五个扩展
- [ ] **AC-2**：src/ 中 grep 不到 `shadow-\[0_0_12px_-2px_rgba\(91,141,239` 散落（统一走 token）
- [ ] **AC-3**：src/index.css body 不再硬编码 `font-family`（改 `@apply font-sans`）
- [ ] **AC-4**：src/index.css h1-h6 不再硬编码 `font-family`（改 `@apply font-display`）
- [ ] **AC-5**：`npm run test` 全绿
- [ ] **AC-6**：`npm run build` 成功；gzip CSS 增长 < 1 KB
- [ ] **AC-7**：视觉对比 token 化前后玻璃态外观一致

## 验证场景

- `npm run dev` + 首页 + 详情页 + 404：
  - 玻璃态胶囊外观（紫蓝边 + 紫光阴影）不变
  - 字体显示不变（Fraunces 标题 + Plex 正文 + JetBrains 数字）
  - z-index 层次不变（SearchBar 30 / ScrollToTop 40 / BackButton + PrevNextNav 50 / SkipLink 60 / CheatSheet 100）

## 改动文件清单

修改：
- `tailwind.config.js`
- `src/index.css`
- `src/components/PrevNextNav.jsx`
- `src/components/EntryCard.jsx`

新增：无

## Out of Scope

- ✗ 字体 preload（D5）—— 锦上添花
- ✗ zIndex 全面收口（如把所有 z-30 改 z-tooltip-base 等）—— 本期只定义 token，不强改所有用法

## Notes

- 本任务与 P2-7 合并到 1 个 commit，commit 命名：`refactor(design): tailwind token extension + color contrast bump`
- boxShadow token 的颜色值与现有 hardcoded 保持**完全等价**（不调整紫光强度），避免视觉回归
- zIndex 分层只定义 `tooltip` (60) + `modal` (100)；其余 30/40/50 保留数字档