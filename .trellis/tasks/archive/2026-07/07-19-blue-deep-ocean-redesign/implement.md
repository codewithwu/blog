# 执行计划 — 前端蓝色调 UI 升级

> 配套 `prd.md` + `design.md`。本文档是实施 checklist，按顺序执行，每步独立可回滚。

## 0. 前置检查

- [ ] 检查 `tests/` 目录体量与是否有断言老类名（`brand-orange` / `brand-green` / `text-orange`）；若有记录在 Notes 中。
- [ ] 确认 `package.json` 当前 hash（仅做对照；本次不动 deps）。
- [ ] 启动基线 `npm test` 与 `npm run build`，记录通过 / 失败基线。

## 1. 品牌色板与字体配置（落地层）

### 1.1 `tailwind.config.js`
- [ ] 替换 `brand` 块为 D-2 表格内容：
  - `dark #0a0e1f`、`surface #14193a`、`surface-2 #1e2348`、`border #2a3158`
  - `primary #5b8def`、`accent #a78bfa`、`glow #4cc9f0`
  - `light #f8fafc`、`mid #94a3b8`、`dim #64748b`
- [ ] 删除 `orange` / `green` / `gray`（`gray` 当前未被任何代码引用，确认后可删）。
- [ ] 顶部注释更新为新基调（中文）。

### 1.2 `src/index.css`
- [ ] 顶部 `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@400;500&display=swap');`
  - 如 Noto SC 加载过慢可后续移除；先加上作为 fallback。
- [ ] `@layer base`：
  - `body { font-family: 'IBM Plex Sans', 'Noto Sans SC', system-ui, sans-serif; background-color: #0a0e1f; color: #f8fafc; min-height: 100vh; }`
  - `h1, h2, h3, h4, h5, h6 { font-family: 'Fraunces', 'Noto Serif SC', Georgia, serif; font-feature-settings: 'ss01'; }`
  - `.font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }`
- [ ] 新增 `@keyframes aurora-drift`（30s 与 60s 两个版本，复用 `animation-duration` 控制）。
- [ ] 新增 `body::before` 噪点（见 design.md §2.2）。
- [ ] 新增 `@media (prefers-reduced-motion: reduce)` 块，禁用动画。
- [ ] 保留现有 `.animate-heroFade` 关键帧。

### 1.3 校验
- [ ] `grep -rn "brand-orange\|brand-green\|Poppins\|Lora" src/` 无遗留。
- [ ] `npm run build` 通过。

## 2. 装饰层组件 — `AuroraBackdrop`

- [ ] 新增 `src/components/AuroraBackdrop.jsx`，导出函数组件：
  - props：`{ intensity = 'hero' }`
  - `'hero'`：`absolute inset-0 -z-10 pointer-events-none`，3 个径向渐变圆斑（紫 / 蓝 / 青），30s 漂移。
  - `'fullscreen'`：`fixed inset-0 -z-10 pointer-events-none`，3 个径向渐变 + 60s 漂移。
  - 元素结构：一个 `<div>` 内含 3 个 `<div>` 圆斑；每个圆斑 `mix-blend-mode: screen` + 30% opacity。
- [ ] 中文注释：组件用途 / props / 两种 intensity 的差异。

## 3. Hero 改造 — `src/components/Hero.jsx`

- [ ] 引入 `AuroraBackdrop` 组件。
- [ ] `<header>` 改为 `relative` 容器；内部 `<AuroraBackdrop intensity="hero" />` 作为装饰子层。
- [ ] 站名 `<h1>`：
  - `className="font-serif italic font-variation-settings-[opsz:144] text-6xl md:text-7xl tracking-tight text-brand-light"`
  - 保留 `key={count}` 仍用于 tagline 2 重挂载。
- [ ] 副文案 `<p>`：`text-base text-brand-mid` + Plex Sans（继承 body）。
- [ ] tagline 2 `<p>`：
  - `key={count} className="mt-2 text-sm font-mono text-brand-accent animate-heroFade [text-shadow:0_0_12px_rgba(167,139,250,0.45)]"`
- [ ] 时间戳：副文案下方一行新 `<p>`（或 `<time>`）：
  - `className="mt-2 text-xs font-mono text-brand-mid"`
  - 文案：`最后更新 · 2026-07-19`（硬编码示例日期；后续可换为动态）。
  - 或使用 `new Date().toISOString().slice(0,10)` —— 决策：**静态文本**（避免 hydration mismatch / 时区问题；用户可后续手动更新）。
- [ ] 保留 `pickTagline(count)` 逻辑不变。
- [ ] 中文注释更新：解释 Fraunces italic + 紫光文本 + 时间戳设计意图。

## 4. EntryCard 改造 — `src/components/EntryCard.jsx`

按 D-8 表格逐处替换：

- [ ] 外层容器类名替换：
  - `bg-brand-surface` → `bg-brand-surface/85 backdrop-blur-sm`
  - `border-brand-mid/10` → `border-brand-border/60`
  - `hover:-translate-y-0.5 hover:shadow-md hover:border-brand-mid/20` → `hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-[0_0_0_1px_rgba(91,141,239,0.4),0_8px_32px_-8px_rgba(167,139,250,0.35)]`
  - `focus-visible:ring-brand-orange focus-visible:ring-offset-brand-dark` → `focus-visible:ring-brand-glow focus-visible:ring-offset-brand-dark focus-visible:shadow-[0_0_12px_rgba(76,201,240,0.45)]`
- [ ] fallback 渐变：`from-brand-orange/30 via-brand-blue/20 to-brand-green/30` → `from-brand-accent/30 via-brand-primary/25 to-brand-glow/30`；透明度可视效果降到 15-20%。
- [ ] fallback 文字色 `text-brand-light/70` 不变。
- [ ] 标题 hover：`group-hover:text-brand-orange` → `group-hover:text-brand-glow`，加 `drop-shadow-[0_0_8px_rgba(76,201,240,0.35)]`。
- [ ] category chip：`bg-brand-orange/15 text-brand-orange` → `bg-brand-accent/15 text-brand-accent`。
- [ ] tag chip：`bg-brand-blue/15 text-brand-blue` → `bg-brand-primary/15 text-brand-primary`。
- [ ] 项目 GitHub / Demo 链接：`text-brand-blue hover:text-brand-orange` → `text-brand-primary hover:text-brand-glow`。
- [ ] 中文注释：解释新色板 + hover 发光 + focus 蓝色环的设计意图。

## 5. EntryDetail 返回按钮 — `src/pages/EntryDetail.jsx`

- [ ] 替换按钮类名为玻璃态胶囊：
  ```jsx
  className="fixed top-4 left-4 z-50 inline-flex items-center
             px-3 py-1.5 rounded-md text-sm font-mono
             bg-brand-surface/60 text-brand-light
             border border-brand-primary/40
             backdrop-blur-md
             shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
             hover:bg-brand-surface-2/70 hover:border-brand-glow/70
             hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]
             transition-all duration-200"
  ```
- [ ] 中文注释：解释玻璃态 + 微光 + JetBrains Mono 设计意图。

## 6. NotFound 改造 — `src/pages/NotFound.jsx`

- [ ] 引入 `AuroraBackdrop` 组件。
- [ ] 容器：`min-h-screen relative flex items-center justify-center overflow-hidden`。
- [ ] 内部 `<AuroraBackdrop intensity="fullscreen" />`。
- [ ] 内容容器：`relative z-10 text-center px-6`。
- [ ] `<h1>` 404：
  - `className="font-serif italic font-variation-settings-[opsz:144] text-[12rem] md:text-[16rem] leading-none tracking-tighter bg-gradient-to-br from-brand-accent via-brand-primary to-brand-glow bg-clip-text text-transparent"`
- [ ] 副文案：保留"这里什么都没有..."，但加一行新文案：
  - `<p className="mt-4 text-lg text-brand-mid">迷失在深海中 · 坐标 (0°, 0°)</p>`
  - `<p className="mt-2 text-sm text-brand-dim">这里什么都没有...</p>`
- [ ] 返回按钮：复用 D-6 玻璃态胶囊类名（提为常量或直接复制）。
- [ ] 中文注释：解释巨大字号 + 渐变 + 罗盘坐标的设计意图。

## 7. Home 集成 — `src/pages/Home.jsx`

- [ ] 不需要 import `AuroraBackdrop`——Hero 内部已渲染装饰。
- [ ] 容器类名不变。
- [ ] 中文注释更新（可选）：注明极光由 Hero 提供。

## 8. 校验

### 8.1 静态检查
- [ ] `grep -rn "brand-orange\|brand-green\|Poppins\|Lora\|brand-gray" src/ tailwind.config.js` 无输出。
- [ ] `grep -rn "brand-blue\|brand-mid" src/ tailwind.config.js` 仅命中 `tailwind.config.js`（配置定义），UI 层应使用新 token `brand-primary` / `brand-mid`（mid 仍存在但保留用途）。
- [ ] `npm run build` 通过。

### 8.2 测试
- [ ] `npm test` 维持基线；若失败先看是否老用例断言老类名。
- [ ] 若有失败，更新断言或确认是否可接受（如视觉断言可改类名）。

### 8.3 视觉回归（手动）
- [ ] `npm run dev`，访问：
  - `/` — Hero 站名 Fraunces italic 大字 + 紫蓝漂移极光 + Plex Sans 副文案 + JetBrains Mono 紫光 tagline + 时间戳；瀑布流卡片新色 + 玻璃 + hover 发光 + focus 蓝色环；整站噪点可见。
  - `/p/sirchmunk-deep-dive` — 玻璃态返回按钮（左上悬浮）；iframe 内作者样式保持原样；按钮 hover 边框变 glow + 紫光增强。
  - `/p/articles`、`/p/claude-task-monitor` — 同上。
  - `/404` 或 `/any-unknown` — 巨大 404 渐变文字 + 全屏极光 + 坐标文案 + 玻璃返回按钮。
- [ ] DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` → 验证动画禁用，hover 仅保留颜色变化。
- [ ] 移动端 375px 视口 — Hero 字号自适应；卡片栅格降为 columns-1；返回按钮位置不变。

### 8.4 可访问性
- [ ] Lighthouse Accessibility ≥ 90（不强制，但作为检查项）。
- [ ] 装饰层 `aria-hidden` + `pointer-events: none`（在 AuroraBackdrop 中实现）。
- [ ] focus 环键盘可达（EntryCard `role="link" tabIndex={0}` + onKeyDown 保留）。

## 9. 风险点回退

| 风险 | 回退动作 |
|---|---|
| aurora-drift 在 Safari 卡顿 | 把动画 duration 提到 60s，或整体删除关键帧仅保留静态渐变层 |
| Fraunces italic 字重过细 | 把 `font-variation-settings-[opsz:144]` 降到 `144→72`，或显式 `font-medium` |
| 噪点太明显 | 把 `opacity: 0.04` 降到 `0.02` 或 `mix-blend-mode: overlay` 改为 `multiply` |
| 404 渐变文字对比度不足 | 移除 `bg-clip-text text-transparent`，改为纯色 `text-brand-glow` + drop-shadow |
| 紫光 box-shadow 在某些 Android 浏览器渲染重 | 移除 hover 阴影，仅保留 translate-y + border 颜色变化 |

## 10. 提交

- [ ] `git status` 确认改动限定在 7 个文件（tailwind.config.js、src/index.css、src/components/Hero.jsx、src/components/EntryCard.jsx、src/components/AuroraBackdrop.jsx 新增、src/pages/EntryDetail.jsx、src/pages/NotFound.jsx、src/pages/Home.jsx）。
- [ ] `git diff --stat` 与本次任务范围对照。
- [ ] commit message 形如：`feat(frontend): 蓝色调 UI 升级（深海 + 紫极光 + Fraunces/Plex/Mono）`
- [ ] push 到 main 触发 GitHub Pages 自动部署。
- [ ] 部署后访问 https://cooperzhang06.github.io/blog/ 验证（视用户实际仓库而定）。

## 11. 后续可优化（不属本次范围）

- 字体子集化（font subsetting）减少 Google Fonts 加载体积
- prefers-color-scheme: dark 媒体查询（当前仅 dark）
- Hero 极光跟随鼠标（鼠标视差）—— 决策中已选 C（不引入）
- 用 `usePageTitle` 统一 404 标题文案
- 时间戳改为动态（构建时间 / 最后 git commit 时间）
- 给 AuroraBackdrop 加 `prefers-reduced-motion` 内联媒体查询，自动停止动画