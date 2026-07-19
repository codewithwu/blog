# 前端蓝色调 UI 升级

## Goal

把极客熊猫博客从"暖色极简"切换为"深邃海洋 / 夜空"气质：深蓝近黑主背景、电光蓝 / 紫极光主导、白色文字；排版更有性格（Fraunces 衬线显示字体 + Plex Sans 正文 + JetBrains Mono 数字），动效更有层次（Hero 极光漂移 + 卡片 hover 发光 + focus 蓝色环），主站增加夜空光晕与微噪点装饰层；保持"克制留白、瀑布流阅读"的核心交互与现有数据 / 路由契约。

## Background

当前站点的视觉身份是"极简、克制、暖底冷点缀"。Hero tagline 与卡片标题 hover 的橙色是品牌主信号，但这与"深邃海洋 / 夜空"的整站主张不符。本次升级要把整站色板从"暖灰底 + 橙主导"切换为"深海近黑底 + 蓝色 + 紫极光主导"，并配合字体 / 动效 / 装饰层把整体气质推向"夜空下写代码的极客"。

本次升级影响三个主站页面（Home、EntryDetail、NotFound）、一个 Hero 组件、一个卡片组件，公共资源为 `tailwind.config.js`（品牌色）与 `src/index.css`（字体与全局样式）。**详情页 iframe 内作者 HTML 不受本次升级影响**（CLAUDE.md 规则 4：iframe 视口不继承主站 Tailwind 编译产物，作者内容由自己负责）。

## Confirmed Facts（来自 codebase 调查）

- **技术栈**：Vite + React 18 + Tailwind CSS + HashRouter + react-helmet-async + lucide-react；无 lint / typecheck，质量门槛 `npm test` + `npm run build`（见 `.trellis/spec/frontend/testing-and-quality.md`）。
- **当前 brand 色板**（`tailwind.config.js`）：`dark #141413` / `surface #1c1b1a` / `light #faf9f5` / `mid #b0aea5` / `gray #e8e6dc` / `orange #d97757` / `blue #6a9bcc` / `green #788c5d`。橙色是主强调色（7 处用法：Hero tagline、NotFound 标题与 CTA、EntryCard hover、focus ring、category chip、返回按钮 hover border、fallback 渐变）。
- **当前字体**（`src/index.css` 顶部 `@import`）：`Poppins`（标题）+ `Lora`（正文）；Google Fonts 引入，系统字体 fallback。
- **三个页面 + 两个组件**：
  - `Home.jsx`（columns 瀑布流 1/2/3/4 + Hero）
  - `EntryDetail.jsx`（100vh iframe + 固定悬浮返回按钮）
  - `NotFound.jsx`（居中 404 + 文案 + 返回首页按钮）
  - `Hero.jsx`（站名 + tagline + 计数）
  - `EntryCard.jsx`（统一卡片，封面 / 类型徽章 / 标题 / excerpt / category chip / tags / 项目链接）
- **路由与数据契约**：本次不动。瀑布流首页 `/`、统一详情 `/p/:slug`、404 `*`；旧路由 302 跳首页 / 详情；Entry 抽象与 `entries.js` 数据契约不变。
- **动画现状**：`useReveal` IntersectionObserver 控制卡片入场（400ms opacity + translate-y）；Hero tagline `heroFade` 600ms（靠 `key={count}` 重挂载触发）；卡片 hover 250ms 抬升 + shadow + border。无滚动驱动 / 鼠标跟随 / 装饰背景层。
- **品牌色引用点（grep）**：`Hero.jsx` 4 处、`EntryCard.jsx` 13 处、`EntryDetail.jsx` 5 处、`NotFound.jsx` 4 处、`tailwind.config.js` 1 处。所有需统一替换。
- **CLAUDE.md 硬约束**：品牌色集中定义于 `tailwind.config.js`（改色即改这里）；列表页用主站 `brand-*` 风格；详情页 iframe 自带样式；图标统一 lucide-react；js 注释中文；JSX 用 `.jsx` 后缀；HTML 用 `?raw` 导入。
- **CLAUDE.md 关于字体**：仅要求"标题 Poppins / 正文 Lora"，未硬约束 Google Fonts 不可换。`src/index.css` 注释明确"系统无对应字体时回退到 Arial/Georgia，国内访问不稳不阻塞渲染"。
- **测试现状**：vitest，测试文件在 `tests/`（实施前需 inspect 体量与失败基线）。

## Design Decisions（已收敛）

### D-1 字体组合
- **标题 / 显示**：`Fraunces`（可变衬线，serif 转角 + optical size + ink trap，大字戏剧化效果好）
- **正文**：`IBM Plex Sans`（人文无衬线，与 Fraunces 形成"科技 + 文学"对比）
- **数字 / 标签 / 时间戳**：`JetBrains Mono`（工程感）
- 中文 fallback：保留系统字体（`serif` / `sans-serif` / `monospace`）；可选在 `src/index.css` 顶部追加 `Noto Serif SC` / `Noto Sans SC` 作为中文显示后备，避免中文落到默认黑体。
- 字体加载方式仍走 Google Fonts `@import`，保留 `font-display: swap` 不阻塞渲染。

### D-2 品牌色板（深海 + 紫极光）

| Token | Hex | 用途 |
|---|---|---|
| `brand.dark` | `#0a0e1f` | body 背景（紫蓝近黑） |
| `brand.surface` | `#14193a` | 卡片底色、返回按钮底色 |
| `brand.surface-2` | `#1e2348` | hover 状态、次级表面 |
| `brand.border` | `#2a3158` | 卡片边框、按钮边框 |
| `brand.primary` | `#5b8def` | 主强调色（hover 文字、focus ring） |
| `brand.accent` | `#a78bfa` | 副强调色（chip、tag、tagline、404 标题、装饰） |
| `brand.glow` | `#4cc9f0` | 电光青蓝（hover 发光、focus 环发亮、key 状态高亮） |
| `brand.light` | `#f8fafc` | 主文字 |
| `brand.mid` | `#94a3b8` | 次级文字（excerpt、meta） |
| `brand.dim` | `#64748b` | 三级文字、占位 |

- 删除：`brand.orange` / `brand.green`（不再出现于 `tailwind.config.js`，所有引用替换为新 token）。

### D-3 装饰背景层（主站，**不影响 iframe 详情页**）
- **Hero 极光**：Home 顶部 `<Hero />` 上方一个绝对定位的径向渐变层（紫 `#a78bfa` + 蓝 `#5b8def` + 青 `#4cc9f0` 三个圆斑，opacity 30%，30s 周期缓慢漂移）。位置：`position: absolute`，z-index `-1`，pointer-events `none`。
- **整站噪点**：body 上叠加一层 SVG noise（`<feTurbulence>` 生成，opacity 2-3%，`mix-blend-mode: overlay` 或 `screen`）。作为全局 `::before` 伪元素挂在 `<body>` 上，性能可控（一次绘制）。
- **装饰层实现位置**：在 `src/index.css` 通过 `@layer base` 定义 `body::before` 噪点；Home 组件新增一个内部装饰容器渲染 Hero 极光。NotFound 复用同一极光但加全屏径向（更戏剧化）。

### D-4 动效语言（保留 + 叠加）
- **保留**：`useReveal` 卡片入场 400ms ease-out；Hero tagline `heroFade` 600ms（`key={count}` 重挂载）；卡片 hover 250ms。
- **新增**：
  - Hero 极光漂移：`@keyframes aurora-drift`，30s 周期，translate + scale 复合，ease-in-out infinite alternate。
  - 卡片 hover 发光：`box-shadow` 双层紫青光（`0 0 0 1px rgba(91,141,239,0.4), 0 8px 32px -8px rgba(167,139,250,0.35)`），与现有 translate-y 叠加，时长统一 250ms。
  - focus 蓝色发光环：`focus-visible:ring-2 focus-visible:ring-brand-glow focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark`，带一层 `box-shadow: 0 0 12px brand-glow/40`。
- **性能**：所有动效用 transform / opacity / box-shadow / filter（避免 layout / paint）；`prefers-reduced-motion: reduce` 时禁用 Hero 极光漂移与卡片发光。

### D-5 Hero 排版（Editorial 大字 + 时间戳）
- 站名 `<h1>` 用 `Fraunces` + `italic` + `font-variation-settings: 'opsz' 144`（最大光学尺寸），字号 `text-6xl md:text-7xl`，`tracking-tight`，文字渐变（紫→蓝→青）作为可选 v1 装饰（默认关闭渐变以保可读性）。
- 副文案（`一个极简博客 · N 篇内容`）用 `IBM Plex Sans` + `text-brand-mid`，字号 `text-base`。
- tagline 2（动态）用 `JetBrains Mono` + `text-brand-accent` + 微紫光（`text-shadow: 0 0 12px rgba(167,139,250,0.45)`），保留 `heroFade` 600ms。
- 时间戳：右上 / 站名下方一行小字（`最后更新 · 2026-07-19` 或类似），`JetBrains Mono` + `text-brand-mid`，呼应"夜空下的实时钟"。
- Hero 整体 `pt-20 pb-12 md:pt-28 md:pb-16 text-center` 不变。

### D-6 EntryDetail 返回按钮（玻璃态胶囊 + 紫蓝边 + 微光）
- 保留"← 返回"文字与 `fixed top-4 left-4 z-50` 位置。
- 类名升级：
  - 底色 `bg-brand-surface/60 backdrop-blur-md`
  - 边框 `border border-brand-primary/40`
  - 文字 `text-brand-light`
  - 字体 `font-mono`（JetBrains Mono）
  - 微光 `shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]`
  - hover：`hover:border-brand-glow/70 hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]`
  - transition：`transition-all duration-200`

### D-7 404 戏剧化（巨大字号 + 极光 + 罗盘坐标）
- 404 数字 `<h1>`：`Fraunces` + `italic` + `font-variation-settings: 'opsz' 144` + `text-[12rem] md:text-[16rem]` + `leading-none` + `tracking-tighter`，文字渐变紫蓝青（默认开启，作为 404 唯一一处"显式色彩装饰"）。
- 副文案改为 `迷失在深海中 · 坐标 (0°, 0°)`，Plex Sans + accent 紫；保留下方"这里什么都没有..."作为二级文案（更轻，mid 色）。
- 返回按钮复用全局玻璃胶囊样式（D-6）。
- 背景全屏极光径向（比 Home 极光更暗、opacity 50%，持续漂移）。
- 容器高度 `min-h-screen`，垂直居中。

### D-8 EntryCard 改造要点
- 底色：`bg-brand-surface` → `bg-brand-surface/85 backdrop-blur-sm`（轻微玻璃）；hover 时变 `bg-brand-surface-2/90`。
- 边框：`border-brand-mid/10` → `border-brand-border/60`。
- hover：保留 translate-y -0.5，叠加 D-4 的双层紫青发光；边框 hover 由 `border-brand-mid/20` 改为 `border-brand-primary/50`。
- 标题 hover：`group-hover:text-brand-orange` → `group-hover:text-brand-glow`。
- focus ring：`focus-visible:ring-brand-orange` → `focus-visible:ring-brand-glow`，叠加发光阴影。
- fallback 渐变（无 cover 时）：`from-brand-orange/30 via-brand-blue/20 to-brand-green/30` → `from-brand-accent/30 via-brand-primary/25 to-brand-glow/30`，并加入"深海光晕"感。
- type 徽章（FileText / Wrench icon + "文章"/"项目" 文字）：保留 `text-brand-mid`，不变。
- 日期 / 计数：`text-brand-mid` 不变。
- excerpt：`text-brand-mid line-clamp-3` 不变。
- category chip：`bg-brand-orange/15 text-brand-orange` → `bg-brand-accent/15 text-brand-accent`。
- tag chip：`bg-brand-blue/15 text-brand-blue` → `bg-brand-primary/15 text-brand-primary`。
- 项目 GitHub / Demo 链接：`text-brand-blue hover:text-brand-orange` → `text-brand-primary hover:text-brand-glow`。

## Requirements

- **REQ-1 品牌色板切换**：替换 `tailwind.config.js` 的 brand tokens；删除 `orange` / `green`；新增 `surface-2` / `glow` / `dim` / `accent`。
- **REQ-2 字体组合升级**：替换 `src/index.css` 顶部 Google Fonts `@import`；更新 `h1–h6` / body / 工具类 `font-mono`；保留系统字体 fallback。
- **REQ-3 装饰背景层**：Home 加 Hero 极光径向（30s 漂移）+ 整站噪点（body `::before`）；NotFound 加全屏极光。
- **REQ-4 动效叠加**：保留 `useReveal` / `heroFade` / hover 抬升；新增 `aurora-drift` 关键帧、卡片 hover 发光、focus 蓝色发光环；尊重 `prefers-reduced-motion`。
- **REQ-5 Hero 改造**：Editorial 大字（Fraunces italic + 大光学尺寸）+ Plex Sans 副文案 + JetBrains Mono tagline + 时间戳。
- **REQ-6 EntryCard 改造**：底色、边框、chip、链接、focus ring、fallback 渐变全部跟随 D-8；hover 抬升保留，叠加发光。
- **REQ-7 EntryDetail 返回按钮重做**：玻璃态胶囊 + 紫蓝边 + 微光 + JetBrains Mono（详见 D-6）。
- **REQ-8 NotFound 改造**：巨大字号 + 极光 + 罗盘坐标 + 全屏极光背景（详见 D-7）。
- **REQ-9 中文注释保留**：所有改动沿用中文注释（CLAUDE.md 规则 1.4）。

## Constraints（硬约束）

- **C-1** 品牌色单一来源：`tailwind.config.js` 一处定义，UI 层只通过 `brand-*` 工具类引用（CLAUDE.md 规则 6）。
- **C-2** 数据契约不动：`entries.js` / `data/*.js` / `lib/*.js` 字段、签名、排序不变。
- **C-3** 路由不动：`App.jsx` 的 Routes / 重定向不变。
- **C-4** iframe 隔离不动：详情页 100vh iframe srcDoc；新基调不渗透作者 HTML。
- **C-5** 图标库不动：仍 lucide-react。
- **C-6** 中文注释：所有改动保留中文注释。
- **C-7** 字体加载不阻塞：Google Fonts `@import`，保留系统字体 fallback。
- **C-8** 不引入新依赖。
- **C-9** 不破坏 GitHub Pages 部署：base 路径 `/blog/` 不动。
- **C-10** `prefers-reduced-motion` 必须尊重：所有新增动画在该媒体查询下失效。

## Acceptance Criteria

- **AC-1** `tailwind.config.js` 的 brand 色板替换为 D-2 表格；`orange` / `green` 完全移除；新增 `surface-2` / `glow` / `dim` / `accent`；grep 全 src/ 无遗留 `brand-orange` / `brand-green`。
- **AC-2** `src/index.css` 顶部 `@import` 替换为 Fraunces / IBM Plex Sans / JetBrains Mono；`h1–h6` / body / `font-mono` 字体族同步更新；保留中文 fallback；新增 `aurora-drift` 关键帧与噪点 `::before`。
- **AC-3** `Hero.jsx` 呈现 Fraunces italic 大字 + Plex Sans 副文案 + JetBrains Mono tagline + accent 紫 + 时间戳 + 极光漂移装饰层；hover / 静态观感与新基调一致。
- **AC-4** `EntryCard.jsx` 13 处品牌色引用全部替换为新 token；fallback 渐变替换为紫蓝青；hover 发光生效；focus 蓝色发光环生效。
- **AC-5** `EntryDetail.jsx` 返回按钮升级为玻璃态胶囊（`backdrop-blur-md` + 紫蓝边 + 微光 + JetBrains Mono），hover 边框变 glow 色 + 紫光增强。
- **AC-6** `NotFound.jsx` 404 数字 Fraunces 巨幅 italic（`text-[12rem] md:text-[16rem]`） + 紫蓝青文字渐变 + 全屏极光背景；副文案含"坐标 (0°, 0°)"；返回按钮复用玻璃胶囊。
- **AC-7** `Home.jsx` 顶部 Hero 极光径向装饰层渲染正确，30s 周期漂移，不影响瀑布流卡片交互。
- **AC-8** 整站噪点（body `::before` SVG turbulence，opacity 2-3%）可见但极弱，不影响文本对比度（lint 检查正文文字对比度 ≥ WCAG AA）。
- **AC-9** `prefers-reduced-motion: reduce` 时，aurora-drift 关键帧、卡片 hover 发光、focus 环动画均失效，hover 仅保留静态颜色变化。
- **AC-10** `npm run build` 通过；`npm test` 维持现状（不引入新失败；若有既有用例断言 `brand-orange` 类名，需在 `tests/` 中更新断言或确认不影响）。
- **AC-11** 不引入新的 npm 依赖；`package.json` 仅本次范围内必要的版本调整。
- **AC-12** 改动文件清单可由 `git diff --stat` 对照本次任务范围；非范围文件不被改动。
- **AC-13** 视觉回归：本地启动（`npm run dev`，http://localhost:5173）后 `/`、`/p/sirchmunk-deep-dive`、`/p/articles`、`/p/claude-task-monitor`、404 页面在深海 + 紫极光基调下视觉一致。
- **AC-14** 文章 / 项目 HTML iframe 内部样式不受影响（CLAUDE.md C-4）：作者内容的字体 / 颜色保持原样。

## Out of Scope

- 不动内容源（articles / projects / html 文件本身）。
- 不动分类 slug 与 `categories.js`。
- 不动 `usePageTitle` 机制 / HelmetProvider / HashRouter。
- 不新增分类 / 页签 / 筛选功能。
- 不优化 SEO / 性能 / Lighthouse 分数（除非本次改动顺带）。
- 不改 `favicon.svg` / `index.html` 文案。
- 不改 `useReveal` hook 内部逻辑（仅在 EntryCard 调整 className 配合新视觉）。

## Notes

- 任何品牌色 / 字体变更必须先在 `tailwind.config.js` 与 `src/index.css` 落点，再批量替换 UI 引用（顺序：config → 全局 CSS → Hero → EntryCard → EntryDetail → NotFound → 噪点 / 极光装饰）。
- 字体引入 Google Fonts URL 包含 wght 轴与 ital 参数（如 Fraunces 需 `ital,opsz,wght@0,9..144,300..900;1,9..144,300..900`），需在实施时校对。
- Hero 极光层需要 absolute 定位 + pointer-events: none，避免影响瀑布流交互。
- 中文 fallback 字体可在实施时确认是否补 `Noto Serif SC` / `Noto Sans SC`（Google Fonts 可用），用于标题大字与正文中文。
- 404 文字渐变（紫→蓝→青）作为唯一显式色彩装饰；其他位置文字不使用 gradient 文本以保可读性。