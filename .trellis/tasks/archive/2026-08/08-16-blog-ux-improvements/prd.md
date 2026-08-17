# 博客 UX 优化（parent）

## Goal

瀑布流首页 + 详情页 + 卡片交互 + 性能 + a11y 多维度 UX 改进，**6 项独立可交付子任务**，每项可单独完成、单独评审、单独发布。范围、UI 风格、代码约束继续遵守 CLAUDE.md + design.md 既有约定，不破坏既有架构（Entry 抽象 / iframe 详情页 / 玻璃态胶囊 / 紫蓝青 brand 色板）。

## Background

`/simplify` review（08-16）扫过最新 diff 后，从用户体验角度识别出 6 项可改进点。这些不是 bug，是"主动设计缺失"。每项独立成 child task，平行推进。来源分析见会话上下文与对应 child task 的 prd.md。

**既有 UX 表面**（已读代码确认）：
- 瀑布流首页：`src/pages/Home.jsx:20-26` CSS columns 1/2/3/4 列；卡片 `src/components/EntryCard.jsx` 玻璃态 + hover 抬升 + focus ring
- 详情页：`src/pages/EntryDetail.jsx:36-56` 100vh iframe + 左上固定"← 返回"玻璃态胶囊；`src/lib/html.jsx` 的 Html 组件做 srcDoc / sandbox / base 注入
- 404：`src/pages/NotFound.jsx` 全屏 AuroraBackdrop + Fraunces 大数字 + 返回按钮
- 数据层：`src/lib/entries.js:34` `allEntries` 已合并 articles + projects；`:38-40` 每次调用 `[...allEntries].sort()`
- meta 基础设施：`src/main.jsx` 已包 `<HelmetProvider>`（CLAUDE.md 规则 6）；页面目前只用 `usePageTitle`（`document.title`），**未真正使用 Helmet**

## Requirements

按优先级列 6 项 child task；每项的细节在对应 child prd.md。

### P0（高影响 / 低成本）

**P0-1 详情页"上一篇 / 下一篇"导航**（child: `08-16-detail-prev-next-nav`）
- EntryDetail 当前仅左上角一个"← 返回"（`src/pages/EntryDetail.jsx:38-53`）。用户在瀑布流看完一篇后想翻另一篇，必须返回首页重新滚瀑布流再点。
- 需求：底部加一个轻量浮条，与现有"← 返回"同款玻璃态胶囊；展示前一篇 + 后一篇的标题与跳转链接；首篇 / 末篇时对应方向禁用并置灰。
- 数据契约：`listEntries()` 已按 date 降序，`findEntryBySlug(slug)` 已存在；只需在 `EntryDetail` 内线性扫描得 prev / next（或用 `entries.js` 加 `findNeighbors(slug)` helper）。

**P0-2 OG / Twitter Card meta 标签**（child: `08-16-og-meta-tags`）
- `/p/:slug` 详情页分享到微信 / Twitter / LinkedIn 时，目前没有自定义 OG meta，社交平台只会拉默认空卡片或 SEO 全无。
- 需求：每个 `/p/:slug` 注入 `og:title / og:description / og:type=article / og:url / og:image` 与 `twitter:card=summary_large_image / twitter:title / twitter:description / twitter:image`。标题 / 描述取自 entry；URL 用 `window.location.origin + '/p/' + slug`。
- 实现路径：`src/main.jsx` 已有 `<HelmetProvider>`，在 `EntryDetail` 用 `<Helmet>` 组件或 `usePageTitle` 内部扩展。**不引入新依赖**。

### P1（中影响 / 中成本）

**P1-1 瀑布流搜索 + type 切换**（child: `08-16-waterfall-search-filter`）
- `src/pages/Home.jsx:20-26` 现在固定渲染 `listEntries()` 全部内容。规模 ≤ 5 时无感，超过 10 篇后翻不动。
- 需求：Hero 下方加极简搜索框（放大镜图标 + placeholder "搜索标题 / 摘要 / 标签"），`/` 键聚焦；客户端 substring 匹配 `title + excerpt + tags`，空查询显示全部。搜索框右侧加 type 切换 segmented control（"全部" / "文章" / "项目"）。
- **重要约束**：CLAUDE.md 规则 4 明确"无分类筛选 chip"——本项是搜索 + type，不是分类筛选，**理论上不冲突**；但需用户确认是否接受这层解读（见 Open Questions）。

**P1-2 iframe shimmer + a11y 标题**（child: `08-16-iframe-shimmer-a11y`）
- `src/lib/html.jsx` 渲染 iframe 时没有 loading 占位，HTML 文档加载期间显示纯白屏（视觉跳变）；`Html` 组件未给 iframe 设 `title` 属性（screen reader 朗读不到 iframe 内容是什么）。
- `src/pages/EntryDetail.jsx:42-53` 返回按钮没有 `aria-label`，默认朗读"← 返回"。
- 需求：(a) iframe 外层包一个 `bg-brand-surface/60 animate-pulse` 占位，`onLoad` 后淡出；(b) `<iframe title={entry.title}>`；(c) 返回按钮加 `aria-label="返回首页"`。

### P2（低影响 / 低-中成本）

**P2-1 键盘快捷键**（child: `08-16-keyboard-shortcuts`）
- 需求：Home 卡片间 `j/k` 移动 focus（环形），`Enter` 进入；`/` 聚焦搜索框；详情页 `←`（或 `Esc`）返回首页；输入框聚焦时所有快捷键禁用（避免输入"j"被吞掉）。
- 实现：单一 `useKeyboardShortcuts` hook，集中监听 `keydown`，分发到当前路由的 handler。`useReveal` 已有，加 `focusedIndex` state 即可。

**P2-2 移动端 hover 守卫**（child: `08-16-mobile-hover-guard`）
- `src/components/EntryCard.jsx:46-50` 的 `hover:-translate-y-0.5` + 边框 + 双层 box-shadow 在触屏 tap 后会残留 hover 状态直到下次 tap。`hover:text-brand-glow` 外链同理。
- 需求：在 `EntryCard` 顶部加 `@media (hover: hover) { ... hover ... }` 守卫，或直接改为 `[@media(hover:hover)]:-translate-y-0.5` 等条件类名（Tailwind arbitrary variants 支持）。

## Acceptance Criteria

- [ ] 6 项 child task 全部创建且 parent/child 关系正确（已在 `.trellis/tasks/` 注册）
- [ ] 每项 child 完成时 review 该 child 的 prd.md 列出的 acceptance criteria
- [ ] 所有 P0 完成后：详情页有 prev/next 浮条 + 分享链接展示 OG 卡片（用 Facebook Sharing Debugger 或 Twitter Card Validator 验证）
- [ ] 所有 P1 完成后：Home 有搜索 + type 切换；EntryDetail iframe 不再闪白；screen reader 朗读 iframe 标题
- [ ] 所有 P2 完成后：键盘流完整；触屏设备无 hover 残留
- [ ] 全程通过 `npm run test` + `npm run build`
- [ ] 全程品牌色 / 字体 / 玻璃态胶囊风格统一（CLAUDE.md 规则 6 + design.md D-5/D-6）

## Out of Scope

- **整站主题切换（暗 / 亮）**：当前强制深色基调，改动面过大（Tailwind tokens + iframe 内 CSS 都要重写），独立任务考虑
- **`?raw` HTML 改为动态 import**：CLAUDE.md 规则 3 明确 `?raw` 导入方式；当前规模（2 篇）bundle 不痛，独立任务考虑
- **重命名 `introduce` slug → `claude-task-monitor`**：08-16 `/simplify` review 已记录；属于内容/命名决策，不属于 UX，独立任务考虑
- **SITE_NAME 重复常量整合**：Hero.jsx:14 / usePageTitle.js:6 各自定义，pre-existing；重构属于代码质量，独立任务考虑
- **`Hero` 站名 hover 跳首页**：可选 UX 加分，不在本次范围

## Open Questions

### Q1 [resolved: 允许]

**决策**：P1-1（瀑布流搜索 + type 切换）纳入范围。**用户确认**。
- 搜索框 substring 匹配 `title + excerpt + tags`；type segmented control「全部 / 文章 / 项目」按 `entry.type` 过滤
- 不读 6 个分类 slug，与 CLAUDE.md 规则 4「无分类筛选 chip」正交
- 实现位置：`src/pages/Home.jsx` 局部 useState，不污染 lib 层

### Q2 [resolved: 单品牌图]

**决策**：单一品牌级 OG 图片 `public/og-default.png`（1200×630，紫蓝青渐变 + 站名 + tagline）。**用户确认**。
- 后续若某 entry 有 `cover`，加 `og:image = entry.cover` 分支；当前所有 entry `cover: null` 走默认图
- 不引入截图基建，build 零成本
- 验收：用 Facebook Sharing Debugger 输入 `/p/introduce` 应见品牌图 + 标题 + 描述

### Q3 [resolved: 跳过 `←`]

**决策**：P2-1 只实现 `/` + `j/k` + `Enter`，跳过 `←` 详情页返回。**默认采用推荐项**。
- 详情页左上角返回按钮已经玻璃态显眼，键盘返回是 marginal 增益
- 输入框聚焦时所有快捷键禁用（防 `j` 被吞）

## Child Tasks

| Slug | Title | Priority | Status |
|---|---|---|---|
| `08-16-detail-prev-next-nav` | 详情页上一篇 / 下一篇导航 | P0 | planning |
| `08-16-og-meta-tags` | OG / Twitter Card meta 标签 | P0 | planning |
| `08-16-waterfall-search-filter` | 瀑布流搜索 + type 切换 | P1 | planning (Q1 resolved) |
| `08-16-iframe-shimmer-a11y` | iframe shimmer + a11y 标题 | P1 | planning |
| `08-16-keyboard-shortcuts` | 键盘快捷键 / j/k Enter（跳过 ←） | P2 | planning (Q3 resolved) |
| `08-16-mobile-hover-guard` | 移动端 hover 守卫 | P2 | planning |

## Technical Notes

- 不引入新 npm 依赖（OG meta 用现成的 react-helmet-async，键盘 / shimmer / hover 守卫全是 Tailwind + React 标准能力）
- 不修改 CLAUDE.md；不修改 design.md（除非某项设计决策与现有 design 冲突——到时单独走 `trellis-update-spec`）
- 全部 P0/P1 完成后再做 P2，避免 P2 的局部状态污染 P1 的搜索 / 切换交互

## Risks

- **OG meta image 缺失影响 P0-2 验收**：若选"单品牌图"，需额外生成 / 引入 1200×630 PNG
- **搜索框性能**：当前规模 substring 匹配无感；超过 50 篇才需要 fuse.js 之类的 fuzzy 搜索，先不做
- **键盘快捷键与 a11y 焦点环冲突**：j/k 移动 focus 时要确保 focus ring 可见（现有 `focus-visible:ring-2 ring-brand-glow` 已覆盖）