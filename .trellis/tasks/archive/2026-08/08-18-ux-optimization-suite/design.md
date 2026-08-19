# UX 全面优化 — Technical Design

## 1. 架构总览

本次优化在现有「瀑布流首页 + 100vh iframe 详情页」架构下增量演进，**不改 Entry 模型契约、不改路由、不改品牌色板、不引入新依赖**。

新增 / 修改的文件清单：

```
src/
├── pages/
│   ├── Home.jsx                  [改] useDeferredValue + tag click handler + stagger
│   └── EntryDetail.jsx           [改] focus back button on mount + 404 inline
├── components/
│   ├── EntryCard.jsx             [改] tag chip clickable + fallback gradient hash + readingTime
│   ├── SearchBar.jsx             [改] show spinner when query pending
│   ├── BackButton.jsx            [新] 抽出「← 返回」玻璃态胶囊，EntryDetail/NotFound 共用
│   ├── ScrollToTop.jsx           [新] 右下角滚顶按钮（Home only）
│   ├── KeyboardHint.jsx          [新] 首次浮层 + cheat sheet 模态
│   └── KbdHintDismissContext.jsx [新] localStorage 持久化
├── hooks/
│   ├── useFocusBackOnMount.js    [新] EntryDetail mount 时把焦点送到 BackButton
│   ├── useIframeFocusEscape.js   [新] iframe 内按 Esc → 把焦点送回主站
│   ├── useScrollToTopVisible.js  [新] 监听 scrollY > 100vh 切可见态（rAF 节流）
│   ├── useReveal.js              [改] 接受 columnIndex 参数，加 transitionDelay
│   └── useKbdHintDismissed.js    [新] localStorage 读写
└── lib/
    ├── iframe-link-bridge.js     [新] 注入到 srcDoc 内的脚本（监听 a click → postMessage）
    ├── hash-route.js             [新] 解析 / 生成 HashRouter 路径（与 react-router 对齐）
    └── gradient-presets.js       [新] 4 套 fallback 渐变预设 + slug → preset 索引

tests/
├── focus-escape.test.jsx         [新] iframe Esc → 主站 focus
├── search-deferred.test.jsx      [新] useDeferredValue 行为
├── scroll-to-top.test.jsx        [新] 可见性切换
├── kbd-hint-dismiss.test.js       [新] localStorage 持久化
├── entry-card-tag-click.test.jsx [新] tag chip 点击 → setQuery
├── fallback-gradient.test.js     [新] 同 slug → 同预设
└── reading-time.test.jsx         [新] 字段缺省不显示
```

## 2. 模块设计

### 2.1 BackButton 抽出（共享组件）

**动机**：`EntryDetail.jsx:104-113` 与 `NotFound.jsx:51-57` 的「返回」按钮文案 / className / aria-label 完全一致，抽出为 `<BackButton>` 组件。

**API**：
```jsx
<BackButton to="/" ariaLabel="返回首页">← 返回</BackButton>
<BackButton to="/" ariaLabel="返回首页" className="mt-10 px-6 py-2">返回首页</BackButton>
```

**实现细节**：
- 用 `react-router-dom` 的 `<Link>` 而非 `<button onClick={navigate}>`，保留 prefetch 能力
- 接受 `className` prop 覆盖外边距 / padding；默认与 EntryDetail 一致
- 焦点管理：作为 `<button>` 或 `<a>` 的原生 focusable 元素；本任务的关键改造点是让 EntryDetail mount 时主动 `backButtonRef.current?.focus()`

### 2.2 useFocusBackOnMount（EntryDetail mount 焦点管理）

**问题**：EntryDetail 加载时，浏览器焦点会落到 `<body>` 或第一个可聚焦元素（iframe title），用户 Tab 一次才到「← 返回」按钮，a11y 不友好。

**解决**：
- EntryDetail 持有 `backButtonRef`
- useEffect（deps: `[entry.slug]`）：mount / slug 变化后 `requestAnimationFrame(() => backButtonRef.current?.focus({ preventScroll: true }))`
- rAF 是为了等 React commit + BackButton ref attach 完成
- 加 `data-autofocus` 属性 + `:focus-visible` 样式，让焦点可见
- 加 `usePageTitle` 副作用：先 set title，再 focus（不互相阻塞）

**边界**：
- 路由从 `/p/A` 切到 `/p/B`：entry 变 → Html 重挂 → ref 重 attach → useEffect re-run → focus 新按钮
- 路由从首页进 `/p/X`：同上
- 用户主动 Tab 走开后**不抢回焦点**：用 ref 跟踪「本组件是否曾主动 focus 过」，主动 focus 后只有 entry slug 变化才再 focus

### 2.3 useIframeFocusEscape（iframe Esc → 主站 focus）

**问题**：100vh iframe 形成键盘焦点陷阱；iframe 内部 Tab 键无法跳回主站。

**解决**：
- 在 EntryDetail 上加 document-level keydown 监听
- 守卫：
  1. `event.key === 'Escape'` → focus BackButton
  2. `event.key === 'Tab'` && `document.activeElement` 在 iframe 内 → focus BackButton（捕获在 iframe focus 转移前的时机）
- iframe 内焦点检测：`document.activeElement === iframe.contentDocument.activeElement`（需要 `allow-same-origin` 才能读；本期不打开 same-origin，改为「如果 BackButton 当前 focused，就不抢」）
- 简化方案：iframe 没有 `allow-same-origin` 时无法读取内部 focus 状态。**只在 Escape 触发**，不劫 Tab —— 让用户自己 Tab 出来（or 按 Esc）
- 兜底：iframe 加 `onFocus={() => setIframeFocused(true)}` / `onBlur={() => setIframeFocused(false)}` 标记；这样 Tab 进入 iframe 后下一次 Tab 由主站处理（实际上 Tab 在 iframe 内循环，需要用户按 Esc 才能跳出）

**决策**：本期只实现 Esc 跳出，Tab 跳出留作 follow-up（加 same-origin 后能完整实现）。

### 2.4 Skip-link

**设计**：
```jsx
<a href="#main-nav" className="sr-only focus:not-sr-only ...">跳到主站导航</a>
```
- 详情页：跳到 BackButton（id="back-button"）
- 首页：跳到 SearchBar（id="search-bar"）
- 屏幕阅读器朗读为「跳到主站导航」；视觉上 focus 时显示在屏幕左上

### 2.5 useDeferredValue 搜索

**改动**：
```jsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const isStale = query !== deferredQuery;  // 用于显示 spinner

const filteredEntries = useMemo(() => {
  // 用 deferredQuery 做 filter
}, [entries, deferredQuery, type]);
```

**spinner 设计**：
- `isStale && query.length > 0` 时，搜索框右侧显示 `<Loader2 size={12} className="animate-spin" />`
- 颜色：`text-brand-mid`（不抢眼）
- 仅 `entryCount > 20` 才渲染 spinner（避免小数据下闪烁）
- `useDeferredValue` 在 React 18 是 concurrent：state 立即更新，渲染走 deferred，下一次 commit 用新值

### 2.6 ScrollToTop 组件

**API**：
```jsx
<ScrollToTop threshold={window.innerHeight} />
```
- 内部用 `useScrollToTopVisible(threshold)` 返回 `visible`
- `visible` 时 `opacity-100 pointer-events-auto`，否则 `opacity-0 pointer-events-none`
- transition-opacity duration-200
- 固定定位 `fixed bottom-6 right-6 z-40`（与 PrevNextNav 错开：右下 vs 左下居中）
- onClick：`window.scrollTo({ top: 0, behavior: 'smooth' })`
- a11y：`aria-label="回到顶部"`

**Hook `useScrollToTopVisible`**：
```js
function useScrollToTopVisible(threshold) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setVisible(window.scrollY > threshold);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return visible;
}
```

### 2.7 KeyboardHint 组件

**两种形态**：
1. **首次浮层**（首屏底部一行淡提示）
   - `<p>按 j/k 切换 · Enter 进入 · / 搜索</p>`
   - 6 秒后自动消失
   - 用户点击 × 关闭（写 localStorage）
2. **Cheat sheet 模态**（按 `?` 触发）
   - 全屏 backdrop `bg-brand-dark/80 backdrop-blur-sm`
   - 居中卡片：列出全部快捷键（j/k/Enter/`/`/Esc/?/Tab）
   - 按 `?` 或 Esc 或点击 backdrop 关闭

**持久化**：
- `localStorage.getItem('coolpanda_kbd_hint_dismissed') === '1'` 时不显示浮层
- 用 `useKbdHintDismissed` hook 提供 `{ dismissed, dismiss }`
- 关闭后 cheat sheet 仍可用

### 2.8 入场 stagger（useReveal 增强）

**现状**：`useReveal` 只判断是否在视口内，不控制延迟。

**改动**：
```jsx
// Home 渲染时
{filteredEntries.map((entry, i) => {
  const columnIndex = i % columnCount;  // columnCount = responsive
  return <EntryCard entry={entry} columnIndex={columnIndex} revealIndex={i} />;
})}

// EntryCard 接收 columnIndex / revealIndex
// revealIndex === 0 时不延迟；revealIndex < firstScreenCount 时立即 visible
// 否则 transition-delay = columnIndex * 30ms
```

**简化实现**：
- Home 直接计算 `delay = i < firstScreenCount ? 0 : columnIndex * 30`
- 传给 EntryCard 的 `style={{ transitionDelay: `${delay}ms` }}`
- useReveal 行为不变
- 移动端列数 1，columnIndex=0，所有卡片无延迟（自然连续）

### 2.9 未找到 entry 内嵌提示

**现状**（EntryDetail.jsx:58-60）：
```jsx
if (!entry) {
  return <Navigate to="/" replace />;
}
```

**改造**：
```jsx
if (!entry) {
  return (
    <main className="...">
      <BackButton ref={backButtonRef} to="/">← 返回</BackButton>
      <div className="text-center py-20">
        <h2 className="font-serif italic text-6xl text-brand-accent">404</h2>
        <p className="mt-4 text-brand-mid">文章不存在或已被移除</p>
        <p className="mt-2 text-sm text-brand-dim font-mono">/p/{slug}</p>
      </div>
    </main>
  );
}
```

- 保留在 `/p/:slug` 路由，history 栈干净（用 replace 但**不 navigate**）
- 焦点自动落到 BackButton（与正常情况行为一致）
- 给用友反馈：明确告诉他「文章不存在」

### 2.10 iframe 同站链接拦截

**现状**：iframe 内 `<a href="#/p/xxx">` 点击 → 父页面 React Router 找 `#/p/xxx` → 匹配到路由 → 切换详情（**已经能工作**！因为 hash 改变触发 Route 重新匹配）。

**实际场景**：项目 HTML 作者可能写：
- `<a href="/blog/#/p/xxx">`（绝对 URL，会刷新整个页面，丢失 SPA 状态）
- `<a href="#/articles/xxx">`（指向旧路由 → 走 Navigate → 首页）

**目标**：拦截所有「看起来是同站路由」的链接，统一走 window.parent.location.hash。

**实现**（在 `lib/html.jsx` 注入 srcDoc 之前）：
```js
const BRIDGE_SCRIPT = `
<script>
(function() {
  function isRouterHref(href) {
    if (!href) return false;
    // 同站路由：#/、/、绝对路径 /blog/...
    return /^#\\//.test(href) || /^\\/(?!\\/)/.test(href);
  }
  document.addEventListener('click', function(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!isRouterHref(href)) return;
    e.preventDefault();
    // 统一转 hash 路由
    var hash = href.startsWith('#') ? href : ('#' + href);
    // 让父页面 React Router 接管
    window.parent.location.hash = hash;
  }, true);
})();
</script>
`;
```
- 注入位置：`<head>` 最前面（HTML 片段）或保留 `<base>` 之后（完整文档）
- 监听 `capture phase` 确保比作者 inline onclick 先执行
- 不加 `allow-same-origin`：bridge 脚本走 `window.parent` 访问父（同源 sandbox 不需要 same-origin 也能访问 window.parent）

**限制**：
- iframe 内容是 `about:srcdoc` → 同源策略特殊：bridge 仍能访问 parent（HashRouter 在父路由下，postMessage 等价于 location.hash）
- 作者写 `<a onclick="location.href='/#/p/x'">` 不会被拦截（onclick 不走 click event）；本期不覆盖

### 2.11 EntryCard tag chip 可点击

**改动**：
```jsx
// EntryCard 接收 onTagClick prop
function EntryCard({ entry, isFocused, onTagClick }) {
  // tag chip:
  <li onClick={(e) => { e.stopPropagation(); onTagClick?.(t); }}>
    {t}
  </li>
}
```

**Home 回调**：
```jsx
const handleTagClick = useCallback((tag) => {
  setQuery(tag);
  searchInputRef.current?.focus({ preventScroll: true });
}, []);
```
- setQuery + 聚焦：与 X 清除按钮后行为一致（用户清空后无需再次点击输入框可继续输入）

### 2.12 fallback 渐变 hash 去重

**预设**（4 套，全部用现有 `brand-*` token）：
```js
// gradient-presets.js
export const FALLBACK_GRADIENTS = [
  'from-brand-accent/25 via-brand-primary/20 to-brand-glow/25',  // 原版（紫→蓝→青）
  'from-brand-primary/25 via-brand-glow/20 to-brand-accent/25',  // 蓝→青→紫
  'from-brand-glow/25 via-brand-accent/20 to-brand-primary/25',  // 青→紫→蓝
  'from-brand-accent/30 via-brand-glow/20 to-brand-primary/20',  // 紫→青→蓝
];

export function gradientForSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return FALLBACK_GRADIENTS[Math.abs(h) % FALLBACK_GRADIENTS.length];
}
```
- 同 slug 永远同色（hash 稳定）
- 测试：`gradientForSlug('introduce')` 多次调用结果一致

### 2.13 readingTime 可选字段

**Entry 字段扩展**（entries.js normalize）：
```js
readingTime: e.readingTime ?? null,  // 数字（分钟）或 null
```

**EntryCard 显示**：
```jsx
{isArticle && entry.readingTime && (
  <>
    <span aria-hidden>·</span>
    <span>{entry.readingTime} 分钟阅读</span>
  </>
)}
```

**向后兼容**：
- 现有 2 条数据均不填 readingTime，UI 不显示（测试 AC-17）
- 未来作者填 `readingTime: 5`，自动出现

## 3. 数据流

### 3.1 Home 状态机

```
[query, type, focusedIndex] 由 Home useState 持有
[deferredQuery] = useDeferredValue(query)
[isPending] = query !== deferredQuery
filteredEntries = useMemo(() => filter(entries, deferredQuery, type))

派生 visible 判断：
- showSpinner = entryCount > 20 && isPending && query.length > 0
- showKbdHint = !dismissed && entryCount > 0
- showScrollToTop = scrollY > innerHeight
```

### 3.2 EntryDetail 焦点流

```
mount → useFocusBackOnMount:
  - rAF 后 backButtonRef.current.focus({ preventScroll: true })
  - 用户 Tab 走到 iframe → 不抢（只支持 Esc）
  - 用户在 iframe 内按 Esc → focus BackButton

route 切换 /p/A → /p/B：
  - entry prop 变 → key 变 → Html 重挂 + BackButton 实例更新
  - useFocusBackOnMount deps [entry.slug] 触发 → focus 新 BackButton
```

### 3.3 iframe 同站链接

```
作者 HTML <a href="#/p/foo">click
  ↓
bridge script capture phase:
  - preventDefault
  - parent.location.hash = '#/p/foo'
  ↓
父 HashRouter 监听 hashchange
  ↓
React Router 匹配 → /p/foo → EntryDetail 渲染
```

## 4. 兼容性 / 边界

| 场景 | 行为 |
|---|---|
| entryCount ≤ 2 | 所有提示都不显示（KbdHint / ScrollToTop / Spinner 都受阈值保护） |
| SearchBar 移动端 segmented control | 现有 flex-col 行为不变；spinner 仅在右侧显示（输入框右边） |
| 用户开 localStorage 拒绝 | useKbdHintDismissed 降级为「每次都显示」（catch + 默认 false） |
| iframe 作者写 `<base href="...">` 自定义 | bridge 在 `<base>` 之后注入（保持现有 `<base href="about:srcdoc">` 注入位置） |
| iframe 作者写 `<a href="https://external.com">` | 不被拦截，正常新窗口打开 |
| iframe 作者 inline `onclick="location.href=..."` | 不被拦截（本期限制） |
| prefers-reduced-motion | ScrollToTop / KbdHint / stagger 入场全部 transition 收尾 / 不延迟 |
| 屏幕阅读器读 KbdHint | `aria-live="polite"` 让提示文本朗读一次后不打扰 |
| 触屏 tap 关闭 KbdHint | button 触发，stopPropagation |

## 5. 性能 / 体积影响

- 新增 ~6 个组件 / hooks，单文件 < 100 行（不含测试）
- 不引入运行时依赖
- bundle 增长估算：< 4 KB gzip（gradient-presets + bridge script + 各组件）
- 测试增长：+ 7 个测试文件

## 6. 回滚策略

每个 P0/P1/P2 改动独立 commit，按文件粒度可 revert。BackButton 抽出后 EntryDetail 与 NotFound 视觉等价于改造前，回滚 BackButton 只需把 import 替换为内联 JSX。

bridge script 注入回滚：移除 `lib/html.jsx` 中 BRIDGE_SCRIPT 字符串 + 注入逻辑（10 行内）。

## 7. 测试策略

每个组件 / hook 单独 vitest 文件：
- `focus-escape.test.jsx`：模拟 mount，断言 BackButton ref 在 rAF 后被 focus
- `search-deferred.test.jsx`：断言输入后 deferredQuery 滞后一拍；spinner 显示条件
- `scroll-to-top.test.jsx`：scroll 事件触发可见性切换
- `kbd-hint-dismiss.test.js`：localStorage 写入 / 读取
- `entry-card-tag-click.test.jsx`：tag chip 点击触发 onTagClick，不触发 navigate
- `fallback-gradient.test.js`：hash 稳定性
- `reading-time.test.jsx`：字段缺省 / 存在两种情况

回归：`tests/entries.test.js` + `tests/registry.test.js` 必须继续通过（确认未破坏数据层）。

## 8. 风险与权衡

| 风险 | 缓解 |
|---|---|
| EntryDetail mount 时主动 focus 可能被屏幕阅读器视为「劫持焦点」 | 仅在 mount + slug 变化时 focus；用户主动操作后不抢 |
| bridge script 加 capture 监听可能与作者 onclick 冲突 | 作者若 inline `onclick` 仍生效；我们只是 preventDefault 默认导航 |
| useDeferredValue 在小数据下视觉闪烁 | 仅 entryCount > 20 时显示 spinner |
| KbdHint 浮层可能干扰首屏阅读 | 6 秒自动消失 + 用户可永久关闭 |
| 阅读时间字段作者不一定愿意维护 | 完全可选；现有 2 条数据无影响 |
| 渐变预设只有 4 套 → 大库下仍有重复 | 用户感知可接受；进一步去重要引入图片生成，scope 之外 |