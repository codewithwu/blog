# P1: 体验加分（滚顶 / 快捷键提示 / stagger / 内嵌 404 / 同站链接 / Hero 时间戳 / shimmer / 浮条遮挡）

父任务：[08-18-ux-optimization-suite](../08-18-ux-optimization-suite/prd.md)

## Goal

完成父 PRD 中 P1 范围的 8 项改造（其中「内嵌 404」已在 P0 顺手实现）：滚回顶部按钮、键盘快捷键可见提示、瀑布流卡片入场 stagger、Hero LAST_UPDATED 派生、iframe 同站链接拦截、iframe shimmer 透明度优化、PrevNextNav 移动端遮挡修复。

## Requirements

### 1. 滚回顶部按钮 ScrollToTop

- 新文件：`src/components/ScrollToTop.jsx` + `src/hooks/useScrollToTopVisible.js`
- 行为：`window.scrollY > window.innerHeight` 时按钮出现；点击 smooth scroll 到 0
- 视觉：同款玻璃态胶囊（`.glass-pill`）；移动端 `min-h/min-w-[44px]`；右下角固定
- Hook `useScrollToTopVisible(threshold)`：rAF 节流 scroll listener，返回 `visible` boolean
- 在 Home 页面右下角渲染；404 / EntryDetail 不需要（保留 PrevNextNav 区域）
- a11y：`aria-label="回到顶部"`

### 2. 键盘快捷键可见提示 KeyboardHint

- 新文件：`src/components/KeyboardHint.jsx` + `src/hooks/useKbdHintDismissed.js`
- 两种形态：
  - **首次浮层**：Home 底部一行淡提示「按 j/k 切换 · Enter 进入 · / 搜索」+ × 按钮
    - 6 秒后自动消失
    - 用户点 × 或 dismiss 后写 localStorage（key `coolpanda_kbd_hint_dismissed`）
  - **Cheat sheet 模态**：按 `?` 触发；列出全部快捷键
    - 全屏 backdrop `bg-brand-dark/80 backdrop-blur-sm`
    - 居中卡片（同款玻璃态）+ 快捷键列表
    - 按 `?` / Esc / 点击 backdrop 关闭
- localStorage 读取失败时降级为每次显示（catch + 默认 false）
- a11y：浮层 `aria-live="polite"` 让屏幕阅读器朗读一次后不打扰；cheat sheet `role="dialog"` + `aria-modal="true"`

### 3. 瀑布流卡片入场 stagger

- 现状：所有卡片同时 `opacity-0` → `opacity-100`，无列偏移
- 改造：
  - 首屏 N 张卡片（`window.innerHeight` 内可见的卡片数）无延迟，同时入场
  - 后续滚动入场的卡片按 column 偏移：`transitionDelay = (columnIndex * 30)ms`
  - Home 计算 columnCount（响应式：sm=2 / lg=3 / 2xl=4，其它=1）
- 实现：Home 给每张卡算 columnIndex + revealIndex；EntryCard 接收 `style.transitionDelay`
- 注意：移动端单列 columnIndex=0，所有卡片无延迟（自然连续）

### 4. Hero LAST_UPDATED 派生

- 现状：`const LAST_UPDATED = '2026-07-19'` 硬编码（Hero.jsx:15）
- 改造：从 `listEntries()` 取最大 date（最新 entry 的 date）
- 找不到任何 entry 时显示「—」
- 新增工具：`src/lib/entries.js` 暴露 `mostRecentDate()` 或 `Hero` 内部 inline 计算

### 5. iframe 同站链接拦截（P1-8）

- 新文件：`src/lib/iframe-link-bridge.js`
- 导出 `BRIDGE_SCRIPT` 常量：捕获 iframe 内所有 `<a>` click
- 拦截规则：
  - `<a href="#/...">`（hash 路由）：`window.parent.location.hash = href`
  - `<a href="/blog/...">` / `<a href="/...">`：转 hash 路由走父 React Router
  - `<a href="https://...">` / `<a href="http://...">`：不拦截，新窗口打开
  - `<a href="#section">`（纯锚点）：不拦截，保留 iframe 内滚动
- 实现：在 srcDoc 内注入 `<script>`，监听 capture phase click
- src/lib/html.jsx 改造：把 BRIDGE_SCRIPT 注入到 srcDoc（位置：在 `<base>` 之后）
- 不加 iframe `allow-same-origin`（保持隔离）；bridge 走 `window.parent` 访问父（同源 sandbox 不需要 same-origin 也能访问 window.parent）

### 6. iframe shimmer 透明度优化

- 现状：`bg-brand-surface/40` + `animate-pulse`（60% 透明）
- 大文档（如 47KB `intimate-relationship-curve.html`）首帧前 body 紫蓝黑透过 shimmer 渗出 → 视觉闪
- 改为：`bg-brand-surface/85`（仅 15% 透明）+ 保留 `animate-pulse`
- 测试更新：`tests/html.test.jsx` 的 shimmer 断言从 `bg-brand-surface\/40` 改为 `bg-brand-surface\/85`

### 7. PrevNextNav 移动端遮挡修复

- 现状：浮条固定 `bottom-6`，窄屏垂直堆叠后高度 90-100px，遮挡 iframe 底部
- 改造：iframe 容器加 `padding-bottom: 120px`（仅 < sm）
- 用 Tailwind `sm:pb-0 pb-[120px]` 或在 Html 组件容器加

## Acceptance Criteria

按父 PRD P1 AC：

- [ ] AC-10：Home 页 `window.scrollY > 100vh` 时，右下角出现「↑ 顶部」按钮；点击 smooth scroll 到 0
- [ ] AC-11：Home 页首次加载显示一行淡提示「按 j/k 切换 · Enter 进入 · / 搜索」；按 `?` 弹 cheat sheet
- [ ] AC-12：cheat sheet 用户主动关闭后，刷新不再显示；localStorage key `coolpanda_kbd_hint_dismissed` 持久化
- [ ] AC-13：瀑布流卡片入场 stagger 按 column 偏移（首屏 N 张同时入场；后续卡片按 i % 列数 延迟 30ms）
- [ ] AC-15：iframe 内 `<a href="#/p/xxx">` 点击后，父页面 HashRouter 正确切换路由（不出现 404）
- [ ] AC-16：iframe 内 `<a href="#section">`（纯锚点）点击后，iframe 内部滚动到目标（不切换父路由）
- [ ] AC-17：Hero LAST_UPDATED 从 listEntries() 派生（最新 entry date）；找不到 entry 时显示「—」
- [ ] AC-18：iframe shimmer 透明度提到 bg-brand-surface/85（仅 15% 透明）；大文档首帧不再透过
- [ ] AC-19：移动端 EntryDetail iframe 容器 `padding-bottom: 120px`，让 PrevNextNav 不遮挡内容

> AC-14（内嵌 404）已在 P0 顺手实现，勾选父 PRD AC-14 为已通过。

## Out of Scope（本任务不做）

- ✗ EntryCard tag chip 可点击 / fallback 渐变 hash / readingTime / 中文标题首字母 / tags 3+N / 404 列最近 / 断点细化（父 PRD P2 范围）
- ✗ 暗 / 亮主题切换 / 详情页阅读进度条（评估项）

## Notes

- 浮条遮挡修复（AC-19）影响 EntryDetail，要在 EntryDetail 容器加 responsive padding，不能动 iframe 本身（Html 组件）以保持组件边界
- 同站链接拦截（AC-15/16）需要构造测试 fixture：在测试里手动塞一个 srcDoc 含 `<a href="#/p/foo">`，断言 click 后父路由变化
- localStorage 测试需要 mock：`vi.spyOn(Storage.prototype, 'getItem')` / `setItem`
- stagger 实现要小心：columnIndex 需要根据实际渲染列数（响应式），不能用 i 简单 `% N`