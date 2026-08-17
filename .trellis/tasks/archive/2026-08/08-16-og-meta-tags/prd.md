# OG / Twitter Card meta 标签

## Goal

为每个 `/p/:slug` 详情页注入 Open Graph + Twitter Card meta 标签，便于微信 / Twitter / LinkedIn / Slack 分享时显示品牌化卡片（标题、描述、图片）。不引入新依赖，使用项目已有的 react-helmet-async。

## Background

- `src/main.jsx` 已经包了 `<HelmetProvider>`（CLAUDE.md 规则 6 + react-helmet-async@2），但目前没有任何 `<Helmet>` 使用，meta 标签完全没注入
- 当前分享 `/p/introduce` 到任何社交平台只会拉默认空卡片（无标题、无描述、无图片）
- `src/hooks/usePageTitle.js` 仍走 `document.title = ...`（保留以兼容快速标题更新）

## Requirements

### 图片资源

- 创建 `public/og-default.png`：1200×630，PNG，紫蓝青渐变背景 + 站名"Cool Panda"+ 副文案"熊猫博客 · {count} 篇内容 · 不定期更新"
- 渐变方向：`from-brand-accent via-brand-primary to-brand-glow`（呼应 D-2 色板 + D-7 404 数字渐变）
- 字体：站名用 Fraunces italic（与 Hero 同步），数字 / 标签用 JetBrains Mono
- 文件大小 ≤ 100KB（社交平台爬虫友好）

### Meta 注入

- 在 `src/pages/EntryDetail.jsx` 用 `<Helmet>` 注入以下 meta（**所有 entry 共用同一套**，title / description / url 用 entry 字段填充）：
  ```html
  <meta property="og:type" content="article" />
  <meta property="og:title" content="{entry.title}" />
  <meta property="og:description" content="{entry.excerpt}" />
  <meta property="og:url" content="{window.location.origin}/p/{entry.slug}" />
  <meta property="og:image" content="{window.location.origin}/og-default.png" />
  <meta property="og:site_name" content="Cool Panda" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{entry.title}" />
  <meta name="twitter:description" content="{entry.excerpt}" />
  <meta name="twitter:image" content="{window.location.origin}/og-default.png" />
  ```
- 渲染位置：在 `<Html />` 之后（不影响 layout）

### SPA URL 处理

- `og:url` 需要绝对 URL；React Router 提供 `useLocation()` 但 SPA 首屏 `window.location` 已可用
- 用 `import.meta.env.BASE_URL`（Vite）拼接更稳妥，但 GitHub Pages 子路径下 origin 也对（`https://cooperxxx.github.io/blog`）
- 实现：用 `new URL(\`/p/${slug}\`, window.location.origin).toString()` 拿绝对 URL

### 兜底

- 若 entry 没有 `excerpt`（不可能但兜底），用 `entry.title`
- 若 entry 有 `cover`（未来扩展），`og:image` 改用 `entry.cover`（本期不实现，因为当前所有 `cover: null`）

## Acceptance Criteria

- [ ] `public/og-default.png` 存在，1200×630，< 100KB
- [ ] 在 `/p/introduce` 页面 view-source 能看到完整 OG + Twitter meta（10 个 `<meta>` 标签）
- [ ] 在 `/p/introduce` 页面 `window.title` 仍为"Claude Task Monitor · Cool Panda"（page title 没破）
- [ ] 不在 `/p/:slug` 的页面（如 `/` Home、`/404`）不注入 OG meta（避免污染）
- [ ] 用 Facebook Sharing Debugger（输入 `/p/introduce` URL）能拉到品牌图
- [ ] 用 Twitter Card Validator 同上
- [ ] 微信内置浏览器分享卡片标题 = entry.title，描述 = entry.excerpt
- [ ] `npm run test` 通过
- [ ] `npm run build` 通过；`og-default.png` 在 `dist/` 出现（Vite 自动拷贝 public/）

## Out of Scope

- 逐 entry 截图式 OG 图：本期采用单品牌图（parent Q2 已决策）
- `<meta name="description">` 通用站点描述（不与 OG 重叠，独立）
- 微信 JSSDK 签名（公众号后台配置，非纯前端）

## Technical Notes

- 不引入新 npm 依赖；用 react-helmet-async 已存在
- `react-helmet-async@2` 不导出 `useHelmet` 钩子，必须用 `<Helmet>` JSX（CLAUDE.md 规则 6 已声明）
- SSR / 静态构建注意：GitHub Pages 部署后，爬虫看到的是纯 HTML，不依赖 JS 注入——所以 `<Helmet>` 在 client-only 环境**无效**。本期需评估是否要做 build-time 注入（`vite-plugin-ssg` 之类），否则爬虫抓不到
- **关键技术风险**：见 Risks

## Risks

- **🔴 SPA + Helmet 注入的爬虫可见性**：Twitterbot / Facebook crawler / 微信爬虫执行 JS 吗？多数只拉 SSR / 静态 HTML。本期若依赖 Helmet，可能**爬虫看不到 meta**
- **缓解方案**：考虑在 build 期用 vite-plugin-prerender 或简单 React 静态预渲染生成 `/p/:slug/index.html`，让爬虫直接读 HTML 中的 meta
- **判断标准**：实现后用 `curl -A "Twitterbot" https://.../p/introduce` 看返回 HTML 是否有 meta；有则成功，无则需要 prerender
- 若 SPA + Helmet 实际可行（某些爬虫执行 JS），本期接受此风险；若不可行，需要后续 P-3 任务加 prerender

## Rollback

- 若 Helmet 在 SPA 下无效且 prerender 工作量过大，rollback 方案：仅保留静态 `<title>` 与 `<meta name="description">`（写在 `index.html` 模板），OG meta 暂时不上