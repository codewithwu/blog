# UX 优化套件 v2 — Technical Design

## 1. 架构总览

本次优化在现有「瀑布流首页 + 100vh iframe 详情页」架构下增量演进，**不改 Entry 模型契约、不改路由、不引入新依赖、不动 iframe 架构**。所有改动都是「视觉 / a11y / token」层。

```
src/
├── components/
│   ├── EntryCard.jsx             [改 P0-1] div role=link → <a href>
│   └── SearchBar.jsx             [改 P1-5] X/Y 计数 + 空态 chip
├── pages/
│   ├── Home.jsx                  [改 P1-4] revealDelay 按 matchMedia 强制 0
│   ├── EntryDetail.jsx           [改 P1-3] 内嵌 404 引入 AuroraBackdrop
│   └── NotFound.jsx              [改 P0-2] skip-link + useFocusBackOnMount
├── hooks/
│   └── (无新增 / 复用 useFocusBackOnMount)
├── index.css                     [改 P1-4] prefers-reduced-motion 兜底
└── (lib/ 不动)

tailwind.config.js                [改 P2-6 + P2-7] 扩展 token + 颜色提亮

tests/
├── entry-card.test.jsx           [改 P0-1] 新断言
├── not-found.test.jsx            [改 P0-2] 新断言
├── entry-detail.test.jsx         [改 P1-3] 内嵌 404 视觉断言
└── home.test.jsx                 [改 P1-4 + P1-5] reduced-motion + 空态 chip
```

## 2. 关键设计决策

### 2.1 EntryCard 改 `<a href>`（P0-1）

**问题**：当前 `<div role="link" tabIndex={0} onClick={go} onKeyDown={...}>` 是 a11y 反模式（ui-ux-pro-max guideline「Compact Control Semantics / Severity: Critical」）。

**方案**：
```jsx
<a href={`/p/${entry.slug}`} className="group block ...">
  {/* 封面 / 元信息 / 标题 / excerpt */}
  {/* tag/category chip 是嵌套 button，需 preventDefault + stopPropagation */}
  {/* 项目 GitHub/Demo 也是嵌套 <a>，stopPropagation 即可（外层 <a> 已会 navigate） */}
</a>
```

**关键点**：
- 嵌套 `<a>` 在 HTML 规范上不合法——浏览器实际会拆开解析（虽然不报错），但语义混乱。改方案：GitHub / Demo 链接用 `<button onClick={() => window.open(...)}>`，避免嵌套 `<a>`。
- tag/category chip 当前是 `<button onClick={onTagClick}>` —— 在 `<a>` 内放 `<button>` 是合法 HTML，chip 点击时 `e.preventDefault()` 阻止外层 `<a>` 跳转，stopPropagation 阻止冒泡。
- `isFocused` ring 当前叠加在 `ring-2 ring-brand-glow`，与 `<a>` 的 `focus-visible:ring-2 ring-brand-glow` 共存 —— 不冲突，保留。

**取舍**：原代码用 `useNavigate` 而非 `<Link>` 是为了避免 react-router 的 prefetch（少量 entry 用不上）。改 `<a href>` 后必须用 `<Link>` 才能保留 SPA 路由能力 —— EntryDetail 的 prev/next 已经用 `<Link>`，与之一致。

### 2.2 NotFound skip-link + useFocusBackOnMount（P0-2）

**复用 EntryDetail 的现有模式**：
- skip-link：`<a href="#back-button" className="sr-only focus:not-sr-only fixed top-2 left-1/2 -translate-x-1/2 z-[60] glass-pill ...">跳到主站导航</a>`
- useFocusBackOnMount(backButtonRef, [])
- Esc 监听：document keydown → 焦点送 BackButton（注意 INPUT/TEXTAREA 守卫）

**BackButton 复用**：EntryDetail 与 NotFound 当前都通过 BackButton 共享组件，ref 也是 forwardRef 暴露的，零改动。

**取舍**：Esc 监听逻辑可以抽成 hook（如 `useEscapeToFocusBack`），但本任务只在 2 个页面用，且 EntryDetail 已有 inline 实现，**为最小 diff 复制粘贴**，避免新 hook 引入复杂度。如未来第 3 处需要再抽。

### 2.3 EntryDetail 内嵌 404 复用 NotFound 视觉（P1-3）

**现状**（src/pages/EntryDetail.jsx:58-71）：`<div className="relative min-h-screen flex items-center justify-center px-6">` 内裸 div + 小 404 标题 + BackButton。

**目标**：引入 AuroraBackdrop + 大字 + 文案。

**方案**：
```jsx
if (!entry) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <AuroraBackdrop intensity="fullscreen" />
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        <h1 className="font-serif italic text-[12rem] md:text-[16rem] leading-none tracking-tighter
                       bg-gradient-to-br from-brand-accent via-brand-primary to-brand-glow
                       bg-clip-text text-transparent
                       drop-shadow-[0_0_32px_rgba(91,141,239,0.35)]"
            style={{ fontVariationSettings: "'opsz' 144" }}>
          404
        </h1>
        <p className="mt-4 text-lg text-brand-accent font-mono">文章不存在或已被移除</p>
        <p className="mt-2 text-sm text-brand-dim font-mono">/p/{slug}</p>
        <BackButton to="/" className="mt-10 px-6 py-2" ref={backButtonRef}>
          返回首页
        </BackButton>
      </div>
    </div>
  );
}
```

**关键点**：
- 不复用 NotFound 组件本身（NotFound 包含"最近发布"列表，详情页内嵌 404 是单条错信息，不需要列表）
- 视觉与 NotFound **对齐**：满极光 + 巨大渐变 404 + 文案 + BackButton
- BackButton 仍 ref 暴露（useFocusBackOnMount 在 slug 变化时也会跑）

**取舍**：是否复用 NotFound 整体组件？否定——会引入"最近发布"列表副作用和 `listEntries().slice(0, 3)` 的额外开销。**复制粘贴视觉模板**比强行抽象更稳。

### 2.4 prefers-reduced-motion 兜底（P1-4）

**现状**：index.css `@media (prefers-reduced-motion: reduce)` 关了 `animate-heroFade / aurora-drift / aurora-drift-slow` + `.group:hover` 的 transform/shadow。

**漏掉的**：
1. EntryCard 入场 `transitionDelay: ${revealDelay}ms` —— reduced-motion 用户看不到延迟
2. useReveal 的 transition-opacity 仍跑（虽然只有 400ms 但也是动画）

**方案**（index.css 暴力兜底）：
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
  }
}
```

**双保险**：Home 的 `revealDelay` 计算时 matchMedia 检测 reduce，强制为 0（避免极端 CSS 引擎不识别 !important 的情况）。

**取舍**：「暴力」CSS 选择器 `*` 可能影响性能（CSS 引擎对 universal selector 的处理）。但这是 reduced-motion 用户的特定媒体查询分支，且只在用户主动启用系统设置时才生效，**性能影响可接受**。如未来 Lighthouse 报性能警告可改用 `:not([data-no-reduced])` 限定。

### 2.5 SearchBar X/Y 计数 + 空态建议（P1-5）

**X/Y 计数**：
```jsx
<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-mid font-mono" aria-live="polite">
  {filteredCount} / {totalCount}
</span>
```

**位置冲突**：X 清除按钮在 `right-2`，spinner 在 `right-9` / `right-3`，计数要插在哪？

**方案**：
- 计数放输入框外侧（SearchBar 整体右侧，或 input ref 上方）—— 不与 X / spinner 冲突
- 或计数放 SearchBar 容器底部（细字）+ aria-live
- 选 SearchBar 容器右下（容器底部 + 右对齐），避免与 input 内任何东西冲突

**空态建议**：
- 「清除筛选」按钮（点击 reset query + type）
- 「试试搜这些」chip：取所有 entries tags Top 3 高频，点击触发 setQuery

**取舍**：Top3 取自 `listEntries().flatMap(e => e.tags).reduce((acc, t) => ...)`。如果 tags 数组普遍为空（项目场景），fallback 到 categories 列表。

### 2.6 tailwind.config 扩展 token（P2-6）

**新增 5 个扩展**：

```js
// tailwind.config.js
theme: {
  extend: {
    colors: { brand: { /* 原 10 token + P2-7 提亮 */ } },
    boxShadow: {
      'glow-sm': '0 0 12px -2px rgba(91,141,239,0.45)',   // 玻璃态默认
      'glow-md': '0 0 18px -2px rgba(76,201,240,0.55)',   // hover / focus
      'glow-lg': '0 0 32px -4px rgba(167,139,250,0.4)',    // 404 / Hero
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
      'skip-link': 60,
    },
  }
}
```

**index.css 改动**：
- 移除 body 硬编码 `font-family: 'IBM Plex Sans'`，改 `@apply font-sans`
- 移除 h1-h6 硬编码 `font-family: 'Fraunces'`，改 `@apply font-display`

**取舍**：h1-h6 全局字体用 `@apply font-display` 会让所有 `<h1>` 走 Fraunces。当前 brand 文档 h2/h3 已经是 Fraunces（h1-h6 选择器），所以**改后等价**。

### 2.7 颜色对比提升（P2-7）

**原**：
- `brand-mid: '#94a3b8'` —— AA 5:1（次要文本）
- `brand-dim: '#64748b'` —— AA 4.3:1（占位符，刚达 AA）

**新**：
- `brand-mid: '#cbd5e1'` —— AA 7:1（次要文本，AAA 正文）
- `brand-dim: '#94a3b8'` —— AA 5:1（占位符）

**重新分工**：
- `brand-mid` → excerpt、meta、次要信息（高优先级读）
- `brand-dim` → placeholder、极弱标签、日期

**关键检查点**：
- 所有 `text-brand-mid` / `text-brand-dim` 使用点（grep 全 src/）
- `brand-primary/15` 等半透明 chip 在新 mid/dim 上的对比度 —— 视觉对比不变，因为 chip 背景是 `bg-brand-primary/15`（透明叠加在 brand-surface/85 上）
- `placeholder:text-brand-dim` 用 dim 颜色（仍是合法 AA 5:1）

## 3. 测试策略

每个子任务的 prd.md 列具体 AC 与对应测试。本任务继承项目测试栈：

- vitest + jsdom + @testing-library/react
- `npm run test`：单元 + 组件测试
- `npm run build`：dist/ 构建

## 4. 风险与回滚

### 风险

1. **EntryCard 改 `<a href>` 可能影响 j/k 快捷键**（Home 的 cardRefs.current 依赖 DOM 引用）—— `<a>` 同样 focusable，引用保持有效
2. **prefers-reduced-motion 暴力 CSS 可能影响性能**（Lighthouse 警告）—— 已说明取舍，可后续优化
3. **tailwind token 扩展可能影响 className 编译产物大小** —— 增长 < 1KB gzip

### 回滚

每个子任务独立 commit + tag，可 `git revert <commit>` 单独回滚，不影响其他项。