# UX 优化套件 v2（基于 ui-ux-pro-max 诊断）

## Goal

从 `ui-ux-pro-max:ui-ux-pro-max` 2026-08-23 诊断报告派生，针对 `src/` 中的 7 个高 ROI 改进点逐项修复。**不破坏现有视觉语言与 Entry 模型契约**。

完成后用户感知：

- 键盘 / 屏幕阅读器用户整站体验一致（EntryCard 不再是 div role=link 反模式；NotFound 也加 skip-link）
- 详情页与 404 页的"找不到内容"体验统一（视觉不再分裂）
- prefers-reduced-motion 用户入场动效不再"漏"（瀑布流入场 stagger 真正可降级）
- 搜索空态从"一句话"升级为"清除筛选 + 试试这些"可操作建议
- 品牌系统从「颜色单一收口」升级为「颜色 + 阴影 + 圆角 + 缓动 + 字体」全 token 化；二级文字对比度提升到 AA 5:1+

## Requirements

按优先级分三波交付，每波独立可验证。**所有 7 项均纳入本任务**（用户确认）。

### 第一波 P0 — a11y 关键修复（2 项）

1. **P0-1 EntryCard 改 `<a href>` 包裹整卡**（子任务 `08-23-p0-entrycard-anchor-tag`）
   - 根除 ui-ux-pro-max 诊断 A1：当前 `div role="link" tabIndex={0}` 是 a11y Critical 反模式
   - 整卡改 `<a href={\`/p/${slug}\`}>`，内部按钮用 stopPropagation + preventDefault 阻断冒泡
   - 顺手补 tag/category chip 44pt 触控目标（A6 跨范围共性问题）

2. **P0-2 NotFound 加 skip-link + useFocusBackOnMount**（子任务 `08-23-p0-notfound-skip-link`）
   - 根除 ui-ux-pro-max 诊断 C1+C4：NotFound 当前无 skip-link 也无 mount 焦点
   - 复用 EntryDetail 的 skip-link 模式
   - 加 useFocusBackOnMount(backButtonRef) + Esc 监听捕获焦点到 BackButton

### 第二波 P1 — 一致性 + 体验（3 项）

3. **P1-3 EntryDetail 内嵌 404 复用 NotFound 视觉**（子任务 `08-23-p1-entrydetail-404-unify`）
   - 修复 B4：内嵌 404（slug 不存在）当前裸 div + BackButton，与 NotFound 满极光 + 巨大渐变 404 数字 + 副文案的体验分裂
   - 引入 AuroraBackdrop；保留 `/p/:slug` 路由（不 navigate），只换视觉

4. **P1-4 prefers-reduced-motion 补全**（子任务 `08-23-p1-reduced-motion-complete`）
   - 修复 A6：当前媒体查询只关了 aurora-drift / heroFade / hover transform，但瀑布流入场 stagger 的 transitionDelay + useReveal 的 transition-opacity 未关
   - index.css 兜底 `* { transition-delay: 0ms !important; transition-duration: 0ms !important; }`
   - Home 的 revealDelay 计算按 matchMedia 强制 0（双保险）

5. **P1-5 SearchBar 加 X/Y 计数 + 空态建议**（子任务 `08-23-p1-searchbar-count-empty-state`）
   - 修复 A3+A4：当前 useDeferredValue 仅在 entryCount>20 显示 spinner，20 条以内无 X/Y 计数；空态文案仅一句话
   - 输入框右侧加实时 X/Y 计数 + `aria-live="polite"`
   - 空态加「清除筛选」链接 + 「试试搜这些」chip（取 tags Top3 高频）

### 第三波 P2 — 系统收口（2 项）

6. **P2-6 tailwind.config 扩展 token**（子任务 `08-23-p2-tailwind-token-extension`）
   - 修复 D1+D3+D5+D7：当前只扩展 `colors.brand`，`boxShadow` / `borderRadius` / `transitionTimingFunction` / `fontFamily` / `zIndex` 全无，散落 hardcoded `shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]` 在多处
   - 统一扩展并把 z-index 分层（tooltip / modal / skipLink）也收口
   - index.css body 硬编码 font-family 改 `@apply font-sans`

7. **P2-7 颜色对比提升 brand-mid/dim 重新分工**（子任务 `08-23-p2-color-contrast-mid-dim`）
   - 修复 D2：当前 `brand-dim #64748b` 在 `brand-dark #0a0e1f` 上对比度约 4.3:1，刚达 WCAG AA 下限
   - brand-mid 提到 `#cbd5e1`（AA 7:1），brand-dim 提到 `#94a3b8`（AA 5:1）
   - 重新分工 mid=次要文本 / dim=占位符与极弱文本
   - 同步检查 brand-primary/15 等半透明 chip 在新 mid/dim 上的对比度

## Acceptance Criteria

按子任务分别验收（详见各子任务 prd.md 的 AC 章节）：

### P0 AC

- [ ] **AC-1**（P0-1）：EntryCard 渲染 `<a href="/p/<slug>">` 而非 `<div role="link">`（tests/entry-card.test.jsx 新断言）
- [ ] **AC-2**（P0-1）：卡片内 button（tag/category chip、GitHub/Demo）点击时不触发整卡 navigate（e.preventDefault + stopPropagation）
- [ ] **AC-3**（P0-1）：tag/category chip 移动端（<640px）触控目标 ≥ 44pt
- [ ] **AC-4**（P0-2）：NotFound 渲染首个 Tab 元素为 `<a href="#back-button">` skip-link（tests/not-found.test.jsx）
- [ ] **AC-5**（P0-2）：NotFound mount 后 BackButton 获得焦点（与 EntryDetail 同款 useFocusBackOnMount）

### P1 AC

- [ ] **AC-6**（P1-3）：EntryDetail 找不到 entry 时显示 AuroraBackdrop + 巨大渐变 404 数字（与 NotFound 视觉对齐）
- [ ] **AC-7**（P1-3）：内嵌 404 仍保留 `/p/:slug` 路由（URL 不变；不 navigate 到 /）
- [ ] **AC-8**（P1-4）：prefers-reduced-motion: reduce 时瀑布流入场 stagger 立即生效（无 transitionDelay 等待）
- [ ] **AC-9**（P1-4）：prefers-reduced-motion: reduce 时 useReveal 的 transition-opacity 不再闪
- [ ] **AC-10**（P1-5）：SearchBar 输入时右侧实时显示 "X / Y" 计数，aria-live="polite"
- [ ] **AC-11**（P1-5）：空态包含「清除筛选」链接 + 至少 1 个 "试试搜这些" chip

### P2 AC

- [ ] **AC-12**（P2-6）：tailwind.config.js `theme.extend` 包含 `boxShadow` / `borderRadius` / `transitionTimingFunction` / `fontFamily` / `zIndex` 五个扩展
- [ ] **AC-13**（P2-6）：src/ 中 grep 不到 `shadow-\[0_0_12px_-2px_rgba\(91,141,239` 散落（统一走 token）
- [ ] **AC-14**（P2-6）：src/index.css body 不再硬编码 `font-family`（改 `@apply font-sans`）
- [ ] **AC-15**（P2-7）：brand-mid `#cbd5e1` 在 brand-dark `#0a0e1f` 上对比度 ≥ 7:1（WCAG AAA 正文）
- [ ] **AC-16**（P2-7）：brand-dim `#94a3b8` 在 brand-dark 上对比度 ≥ 5:1（WCAG AA 大字 / AAA 大字边界）

### 跨任务 AC

- [ ] **AC-17**：`npm run test` 全绿
- [ ] **AC-18**：`npm run build` 成功；gzip JS 体积增长 < 2 KB
- [ ] **AC-19**：`npm run dev` + 5 场景手测通过（详见 implement.md）

## 改动文件清单（预估）

新增：
- 无（所有改动都复用现有文件结构 + 已有 BackButton 组件）

修改（按文件）：
- `src/components/EntryCard.jsx`（P0-1）
- `src/components/SearchBar.jsx`（P1-5）
- `src/pages/NotFound.jsx`（P0-2）
- `src/pages/EntryDetail.jsx`（P1-3）
- `src/pages/Home.jsx`（P1-4 改 revealDelay 计算）
- `tailwind.config.js`（P2-6 + P2-7）
- `src/index.css`（P1-4 + P2-6）
- 测试：`tests/entry-card.test.jsx`（P0-1）、`tests/not-found.test.jsx`（P0-2）、`tests/entry-detail.test.jsx`（P1-3）、`tests/home.test.jsx`（P1-4 + P1-5）

## Out of Scope（本任务不做）

按诊断报告 §5「不建议改的事项」：
- ✗ iframe 全屏布局、CSS columns 瀑布流、Aurora 极光层、HashRouter、j/k 快捷键、glass-pill 发光、触屏守卫 —— 已识别为正确选择，不动
- ✗ 字体 preload 优化（D5）—— 锦上添花，非必需
- ✗ Aurora 30s/60s 漂移节奏 —— 已 reduced-motion 兜底
- ✗ OG meta canonical / locale / JSON-LD（B5）—— SEO 与本次 UX 优化分离，独立任务
- ✗ 移动端 landscape 让出 60px（B6）—— 边缘场景
- ✗ monogram 拉丁扩展（A2）—— 微优化
- ✗ 卡片列 resize 重新入场守卫（A7）—— 视觉微调
- ✗ 项目外链 chip 视觉风格统一（A5）—— 设计风格选择，延后
- ✗ 404 数字 4K 屏放大（C5）—— 边缘场景
- ✗ NotFound 文案加引导小字（C6）—— 文案任务

## Notes

- 7 项交付中 P0-1 / P0-2 是 a11y Critical 必修，独立 commit
- P1-3 与 P0-2 共享 BackButton ref 模式，避免重复实现
- P2-6 + P2-7 都在 tailwind.config.js 改，**合并到一次 commit**避免品牌色反复改
- EntryCard 改 `<a href>` 后所有现有 a11y 测试需重写断言（role=link → a）
- prefers-reduced-motion 兜底用 `* { transition-delay: 0ms !important }` 是「暴力但有效」的方案；如有性能担忧可改用 `:not([data-no-reduced])` 限定，但本期优先选简单可靠