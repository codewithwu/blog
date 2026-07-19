# 技术设计 — 前端蓝色调 UI 升级

> 配套 `prd.md`（已收敛的设计决策 D-1 ~ D-8）。本文档聚焦技术边界、数据流、关键 trade-off、风险点。

## 1. 改动边界

### 1.1 改动文件清单（6 + 1 文件）

| 文件 | 改动范围 | 涉及决策 |
|---|---|---|
| `tailwind.config.js` | 替换 brand tokens；删除 orange/green；新增 surface-2/glow/dim/accent | D-2 |
| `src/index.css` | 顶部 `@import` 换字体；h1–h6/body 字体族；新增 `@keyframes aurora-drift`；body `::before` 噪点 | D-1, D-4, D-3 |
| `src/components/Hero.jsx` | 排版重做（Fraunces italic 大字 + 时间戳 + 极光漂移容器） | D-5 |
| `src/components/EntryCard.jsx` | 13 处 brand 引用替换 + hover 发光 + focus 蓝色环 | D-4, D-8 |
| `src/pages/EntryDetail.jsx` | 返回按钮玻璃态升级 | D-6 |
| `src/pages/NotFound.jsx` | 巨大 404 字号 + 紫蓝青渐变 + 全屏极光 + 坐标文案 | D-7 |
| `src/pages/Home.jsx` | 在 `<Hero />` 上方加极光装饰容器（被动接收 Hero 内部渲染也可，二选一） | D-3 |

### 1.2 不动文件

- `src/App.jsx`（路由 / 重定向）
- `src/main.jsx`
- `src/lib/entries.js`、`src/data/*.js`、`src/hooks/usePageTitle.js`、`src/hooks/useReveal.js`、`src/lib/html.jsx`
- `index.html`、`vite.config.js`、`package.json`
- `articles/**/*.html`、`projects/*.html`、作者内容

## 2. 架构与数据流

本次不改架构——没有新 store / 新 provider / 新 hook / 新路由。改动全部是：
- **Tailwind 配置层**：色板与字体族
- **CSS 全局层**：字体 import + 关键帧 + body 噪点
- **UI 类名层**：在现有 JSX 上替换类名

### 2.1 装饰层与组件的耦合

Hero 极光装饰层有两种挂载方式：

**方案 A（推荐）**：在 `Hero.jsx` 内部渲染一个 `<div className="aurora-bg" aria-hidden />`，作为 `<header>` 的相对定位祖先的 absolute 子层。优点：装饰与 Hero 文本同位置，自带 z-index 管理；缺点：装饰层只能用于 Hero。

**方案 B**：在 `Home.jsx` 渲染 `<Hero />` 之前/之后插入一个独立的 `<AuroraBackdrop />` 组件。优点：可在 NotFound 复用同一组件；缺点：增加一个新文件 / 组件。

**决策**：采用方案 B——新增 `src/components/AuroraBackdrop.jsx`（约 30 行，封装一个绝对定位的径向渐变层），Home 与 NotFound 都 import 并使用，配置 prop 控制 `intensity`（`'hero' | 'fullscreen'`）。

### 2.2 噪点层的实现位置

噪点是全站共享的、最适合放在 body 上。`src/index.css` 的 `@layer base` 增加：

```css
@layer base {
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;  /* 不影响 iframe 内容 */
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>");
    opacity: 0.04;
    mix-blend-mode: overlay;
  }
  body > #root {
    position: relative;
    z-index: 1;  /* 内容在噪点之上 */
  }
}
```

注意点：
- `position: fixed` 让噪点不随滚动重绘（性能友好）。
- `pointer-events: none` 不阻塞交互。
- `mix-blend-mode: overlay` 在深色底上呈"亮噪点"，对比度可控。
- iframe 详情页：`#root` 内只有 `<button>` + `<iframe>`，噪点 z-index 0 + 内容 z-index 1，让噪点位于 iframe 之"下"但视觉上仍可见于按钮附近——需在 EntryDetail 验证视觉。
  - 决策：iframe `z-index: 0`（在 `body::before` 之下），按钮 `z-index: 50`，按钮区域噪点被按钮自身遮挡，符合预期。

## 3. 关键 trade-off

### 3.1 字体加载策略
- **选项 A**：保留 `@import url(...Google Fonts)` 在 `index.css` 顶部，简单但 FOIT/FOUT 风险。
- **选项 B**：改用 `<link rel="preconnect">` + `<link rel="stylesheet">` 在 `index.html` head 中，更可控。
- **决策**：保留方案 A（CLAUDE.md 注释明确"国内访问不稳不阻塞渲染"已接受；现有策略稳定）。如需优化留作后续。

### 3.2 Hero 文字渐变（紫→蓝→青）
- 优点：404 唯一显式色彩装饰，强化主题。
- 缺点：渐变文本可能影响可读性。
- 决策：404 渐变默认开启（巨大字号 + italic + 紫蓝青三色停靠点选择高对比值）；Hero 站名**不**开渐变（保留纯色 `text-brand-light`），避免正文 / 标题被渐变文本稀释。

### 3.3 EntryCard fallback 渐变
- 当前：`from-brand-orange/30 via-brand-blue/20 to-brand-green/30` + 标题首字母。
- 新版：`from-brand-accent/30 via-brand-primary/25 to-brand-glow/30`。
- 透明度 25-30% 在 `bg-brand-surface/85` 卡片底色上可能过亮——实施时若发现对比度不足，把透明度降到 15-20%。

### 3.4 装饰层 z-index 管理
- `body::before` 噪点 z-index 0。
- `#root` 内容 z-index 1。
- `AuroraBackdrop` z-index `-1`（Hero 文本之下；位于噪点层之上还是之下？）。
  - 决策：aurora z-index 0（在 `#root` 之"下"，与噪点同层）；通过 `mix-blend-mode: screen` + 30% opacity 与噪点共存。
  - 备用：aurora z-index 1（在内容之上但 pointer-events: none），噪点 z-index 0；视觉上 aurora 在前景更"亮"。
  - **最终**：aurora z-index 0 + mix-blend-mode: screen，噪点 z-index 1（在 aurora 之上叠加 4% opacity）；这样 aurora 是"光"，噪点是"质感"，符合物理直觉。

### 3.5 字体替换范围
- 仅替换三个页面的字体引用；不修改 `tailwind.config.js` 的 `fontFamily` 扩展（保持默认 sans / serif / mono fallback）。
- 在 `src/index.css` 中通过 `@layer base` 显式声明：
  - `h1, h2, h3, h4, h5, h6 { font-family: 'Fraunces', Georgia, serif; }`
  - `body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }`
  - 工具类 `font-mono` 由 Tailwind 默认（`ui-monospace, ...`）继承，可在需要时显式覆盖为 `'JetBrains Mono'`。
  - 中文 fallback：标题显式补 `Noto Serif SC`（Google Fonts 可用）；正文显式补 `Noto Sans SC`（Google Fonts 可用）。

### 3.6 prefers-reduced-motion
- 在 `src/index.css` 末尾加：
  ```css
  @media (prefers-reduced-motion: reduce) {
    .animate-heroFade,
    .animate-aurora-drift {
      animation: none !important;
    }
    .group:hover {
      transform: none !important;
      box-shadow: none !important;
    }
    /* focus ring 仍保留但移除光晕阴影 */
  }
  ```

## 4. 数据流与契约

本次不动 Entry 数据契约，不动 `entries.js` / `useReveal` / `usePageTitle`。所有 props / 渲染输出形状不变。

唯一新契约：`AuroraBackdrop` 组件 props：
```ts
{ intensity?: 'hero' | 'fullscreen' }  // 默认 'hero'
```
- `'hero'`：相对父容器（Heros header），小尺寸径向渐变，30s 漂移。
- `'fullscreen'`：`fixed inset-0`，覆盖整个视口，60s 漂移（更慢，戏剧化）。

## 5. 兼容性 / 迁移 / 回滚

- **兼容性**：纯类名 + 颜色 + 字体替换，无 API 变化，无 props 变化；老链接 / 老路由 / 老数据全部照常工作。
- **迁移**：无数据迁移，无 schema 变化，无新依赖。
- **回滚**：`git revert` 即可，所有改动限定在 6 个文件 + 1 个新增组件。
- **灰度**：本地 `npm run dev` 全量预览后 push main 即可（GitHub Pages 自动部署）。

## 6. 风险点

| 风险 | 严重度 | 缓解 |
|---|---|---|
| Google Fonts 在国内加载慢导致 FOIT | 中 | 已保留系统字体 fallback + Arial/Georgia 兜底 |
| Fraunces italic 在小字号（如 excerpt）下渲染重 | 低 | excerpt 用 Plex Sans；italic 仅用于 Hero 站名与 404 数字 |
| 噪点 SVG data URL 在某些浏览器兼容性差 | 低 | `feTurbulence` 自 2015 全面支持；混 `mix-blend-mode: overlay` 也已稳定 |
| 紫光 box-shadow 在 Safari 渲染较重 | 低 | `box-shadow` 在所有现代浏览器无问题；hover 时长 250ms 不超过审美阈值 |
| 极光 `mix-blend-mode: screen` 与父背景透明度叠加意外 | 中 | 实施时在 Home / NotFound 实测；若发现问题回退到 `mix-blend-mode: normal` |
| 404 文字渐变（紫→蓝→青）在某些屏幕对比度不足 | 低 | 渐变文字仅 404 一处；其他文本均为纯色高对比 |
| `useReveal` 隐藏内容时 prefers-reduced-motion 用户看不到内容 | 低 | useReveal 立即 setVisible(true) on 无 IO 环境；reduce 模式下卡片立即可见 |
| 文章 / 项目 HTML 作者用了 `text-brand-light` 等 brand 类 | 中 | CLAUDE.md 已明确"iframe 视口不继承主站 Tailwind 编译产物"——这些类在 iframe 内本就不生效；本次仍不动作者 HTML，符合预期 |

## 7. 性能考量

- **CSS 动画**：aurora-drift / hover 发光 / focus 环全部走 transform / opacity / box-shadow / filter，无 layout / paint 开销。
- **噪点**：`position: fixed` + SVG turbulence 一次性绘制；浏览器会缓存 SVG data URL 不重复解析。
- **字体**：3 套字体共 ~12 weight/style 组合，Google Fonts CSS 大小约 60-80KB；非首屏关键路径可接受。
- **可访问性**：所有装饰层 `aria-hidden` + `pointer-events: none`；动画可被 `prefers-reduced-motion` 关闭。

## 8. 验证策略

- **静态**：`npm run build` 通过（Vite 编译 + Tailwind JIT）。
- **测试**：`npm test`（vitest）维持现状（不引入新失败）；如有用例断言老类名，更新断言。
- **视觉**：`npm run dev` 后访问：
  - `/` — 验证 Hero editorial 大字 + 极光漂移 + 瀑布流卡片新色 + 噪点。
  - `/p/sirchmunk-deep-dive` — 验证玻璃态返回按钮 + iframe 内作者样式保持原样。
  - `/p/articles`、`/p/claude-task-monitor` — 同上。
  - `/404` — 验证巨大 404 字号 + 渐变文字 + 全屏极光 + 玻璃返回。
- **辅助**：
  - DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce → 验证动画禁用。
  - DevTools → Lighthouse → Performance ≥ 90（不强制）。
  - 移动端 375px 视口 — Hero 字号、卡片栅格、按钮位置。

## 9. 不变量

- 路由：`/`、`/p/:slug`、`*` 不动；旧路由 302 重定向不动。
- 数据：Entry 抽象、`entries.js` 排序、`categorySlugSet` 不动。
- iframe：`src/lib/html.jsx` 不动；作者 HTML 自带样式不受本次升级影响。
- 图标库：lucide-react 不动。
- Hooks：`useReveal` / `usePageTitle` 不动。
- 文件后缀：`.jsx` 用于组件 / 页面；`.css` / `.js` 不变；不引入新后缀。