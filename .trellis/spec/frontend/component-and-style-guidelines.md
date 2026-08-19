# Component and Style Guidelines

## 适用范围

新增或修改 `src/components/`、`src/pages/` 的展示结构、Tailwind 类、交互、图标、响应式布局和可访问性时遵循本规范。文章/项目 iframe 内部样式不属于主站组件层，见 [Data and Rendering](./data-and-rendering.md)。

> 瀑布流重构（2026-07）后：`Skills.jsx` / `Tools.jsx` / `About.jsx` 与对应 `SkillBar` / `ToolCard` / `TimelineItem` 组件已下线。`Navbar` / `Footer` / `PageTransition` 也已移除（首页改为 Hero + 瀑布流，详情页改为固定悬浮「← 返回」按钮）。本规范不再覆盖它们。

## 组件形状

项目统一使用函数组件和 ESM 默认导出：

```jsx
export default function EntryCard({ entry }) {
  // 用 entry.type / entry.category / entry.tags 决定视觉分支
  return <article>{/* presentation */}</article>;
}
```

证据：`src/components/EntryCard.jsx`、`src/components/Hero.jsx`、`src/pages/Home.jsx`、`src/pages/EntryDetail.jsx`。

- 在函数签名中解构简单 props；复杂派生值在 JSX 前计算。
- 页面负责组合 `src/lib/entries.js` 结果；卡片负责单条展示，不在卡片里查询全局 registry，除非该组件确实拥有显示名映射职责（如 `EntryCard` 读取分类显示名）。
- 列表渲染使用稳定领域键：entry 用 `slug`。不要用数组 index 掩盖重复数据。
- 条件内容用清晰的提前返回或短路渲染；找不到路由实体时由 `EntryDetail` 用 `<Navigate replace>` 处理。

## 复用与组合

复用真实重复，而不是为一个调用点提前抽象：

- 文章和项目详情共同使用 `src/lib/html.jsx`，因此 iframe 行为只能在 `Html` 中修改。
- 各路由页面共同使用 `usePageTitle`。
- 重复的卡片/条目视觉放在 `src/components/`；页面只负责 grid 和 section。
- 瀑布流首页用 `EntryCard` 同时承载文章与项目；两者合同差异（type 徽章 / category chip / links 图标）由卡片内部根据 `entry.type` 与 `entry.category` 分支处理。

新增工具函数前先搜索 `src/lib/`；新增视觉单元前先搜索 `src/components/`。只有重复出现或具有独立行为合同的结构才提取。

## 主站品牌系统

视觉修改必须同时遵循项目 `brand-guidelines`、`tailwind.config.js` 和 `src/index.css`。

### 颜色 token（"深海 + 紫极光"基调，2026-07-19 升级）

| Tailwind token | 色值 | 用途 |
|---|---|---|
| `brand-dark` | `#0a0e1f` | body 紫蓝近黑背景 |
| `brand-surface` | `#14193a` | 卡片、按钮底色（玻璃态配 /85 /60 透明度） |
| `brand-surface-2` | `#1e2348` | hover 状态、次级表面 |
| `brand-border` | `#2a3158` | 卡片边框、按钮边框 |
| `brand-primary` | `#5b8def` | 电光蓝，主强调（hover 文字、focus ring） |
| `brand-accent` | `#a78bfa` | 极光紫，副强调（chip、tagline、404 装饰） |
| `brand-glow` | `#4cc9f0` | 电光青蓝，hover 发光 / focus 发亮 |
| `brand-light` | `#f8fafc` | 主文字 |
| `brand-mid` | `#94a3b8` | 次级文字（excerpt、meta） |
| `brand-dim` | `#64748b` | 三级文字、占位 |

历史 token `brand-orange` / `brand-green` / `brand-gray` 已删除（本次升级）；不要在新代码里复活它们。

主站 JSX 使用 `brand-*` 类，不在同一个组件里散落同义 hex。box-shadow / text-shadow 里的 `rgba(...)` 是 Tailwind 无法表达的发光值，属合理内联。调整品牌色时以 `tailwind.config.js` 为单一入口，并检查 `src/index.css` 是否存在对应硬编码。

### 品牌色板变更审计清单（防止文档/内容漂移）

2026-07 主站升级「深海 + 紫极光」后曾出现 `CLAUDE.md` 规则 6 与 `content/claude-code-taming-guide.html` 都还停留在旧暖色板的情况，因为只改了 `tailwind.config.js` 与 `src/index.css`，没同步更新文档与已发布内容。后续品牌变更必须**一次性**走完以下清单：

1. 改 `tailwind.config.js` 的 `brand.*`（单一入口）。
2. 同步 `src/index.css` 的 body 硬编码色值（注释里已标注例外原因）。
3. 同步 `CLAUDE.md` 规则 6 的色板表与字体段（这是后续内容作者的唯一参照，漂移会直接污染新文章）。
4. 审计已发布 `content/*.html`：grep 旧色 hex 与旧字体名（如 `#d97757` / `Poppins` / `Lora`），逐篇改版或加废弃标记。
5. `grep -rE 'brand-orange|brand-green|brand-gray' src/` 应 0 命中（历史 token 已删除）。
6. 跑 `npm test && npm run build`。

历史经验：CLAUDE.md 与 live code 漂移时，错误方向几乎总是「CLAUDE.md 没跟上」而非「live code 没跟上」，因为 CLAUDE.md 是给人看的、容易被遗忘。改色板时把第 3 步当成必修项，不要「后续再补」。

### 字体（"深海 + 夜空"基调，2026-07-19 升级）

- **标题 / 显示**：`Fraunces`（可变衬线，italic + opsz:144 用于 Hero 站名与 404 数字），回退 `Georgia, serif`。
- **正文**：`IBM Plex Sans`，回退 `system-ui, sans-serif`。
- **数字 / 标签 / 时间戳**：`JetBrains Mono`，由 `.font-mono` 工具类启用，回退 `ui-monospace, monospace`。
- 字体在 `src/index.css` 顶部 `@import` Google Fonts（含 ital/opsz/wght 轴），并通过 `@layer base` 设置 `h1–h6` / `body` / `.font-mono`；组件通常不重复指定 font-family。
- 中文 fallback：默认走系统字体；如需补 `Noto Serif SC` / `Noto Sans SC` 也可（Google Fonts 可用，PRD 标为可选）。

### 组件视觉语法

现有组件重复使用：

- `rounded-xl bg-brand-surface/85 backdrop-blur-sm border border-brand-border/60` 作为卡片基底（玻璃态）。
- `hover:-translate-y-0.5 hover:border-brand-primary/50` + `hover:shadow-[0_0_0_1px_rgba(91,141,239,0.4),0_8px_32px_-8px_rgba(167,139,250,0.35)]` 作为可点击卡片反馈（双层紫青发光）。
- `focus-visible:ring-2 focus-visible:ring-brand-glow focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark focus-visible:shadow-[0_0_12px_rgba(76,201,240,0.45)]` 作为键盘 focus 蓝色发光环。
- `transition-all duration-[250ms] ease-out` 不添加夸张/长时动画。
- 装饰背景层：`src/components/AuroraBackdrop.jsx` 提供 `intensity: 'hero' | 'fullscreen'`，Hero 内嵌 `'hero'`，NotFound 用 `'fullscreen'`；body::before 噪点（SVG turbulence, opacity 0.04, mix-blend-mode overlay）由 `src/index.css` 全局生效。
- 装饰动画：`@keyframes aurora-drift`（30s / 60s 两个版本通过 `animate-aurora-drift` / `animate-aurora-drift-slow` 工具类启用）。`@media (prefers-reduced-motion: reduce)` 必须禁用这些 animation、`.group:hover` 的 transform 与 box-shadow。
- 页面 grid 从移动单列逐级到 `md`/`lg` 多列，例如项目 `md:grid-cols-2 lg:grid-cols-3`。
- 标题层级保持 `h1` 页面标题、`h2` 分组、`h3` 卡片标题。

改动时匹配邻近组件的 spacing 和 comment density，不创建另一套 design token。

## 图标

- 统一从 `lucide-react` 引入，不混用 FontAwesome、emoji 图标包或自绘 icon component。
- 固定图标使用命名 import，例如 `Github`, `ExternalLink`, `Mail`。
- 工具数据的 icon 是字符串；`EntryCard` 不依赖字符串 icon 解析，所有图标直接用 lucide 命名 import 写在卡片里。
- 图标尺寸通常由组件显式设置（如 `size={16}`/`size={20}`），不要依赖不透明的全局 CSS。

## 交互与可访问性

沿用源码已有模式：

- 导航和内部跳转用 `Link`/`NavLink`，active 状态使用 `aria-current`。
- 外部链接使用 `target="_blank" rel="noreferrer"`。
- iframe 必须有由 metadata 提供的可读 `title`。
- 自定义可点击容器必须同时支持键盘和焦点视觉。`EntryCard` 使用 `role="link"`、`tabIndex={0}`、Enter 处理和 `focus-visible` ring。
- 原生 `<a>`/`<button>` 能表达语义时优先使用原生元素。若容器内还需要嵌套 Link（如 `EntryCard` 的 category chip 或 github/demo 按钮），才采用经过测试的自定义容器模式。
- 点击嵌套外链时要阻止触发外层卡片导航；当前 `EntryCard` 的 github/demo 按钮使用 `stopPropagation`，修改其结构时要用交互测试验证。
- 文字与背景使用现有高对比 token；次要文字 `brand-mid` 不用于关键操作。

### 触屏 hover 守卫（防止 hover 视觉残留）

iOS Safari / 触屏浏览器对 `:hover` 的实现是"sticky"——tap 后 hover 状态会一直保留到下次 tap，用户松开手指后卡片/按钮仍处于"被按下"的高亮态，造成视觉残留。所有可交互元素的 `hover:*` 类必须用 Tailwind 的 `[@media(hover:hover)]:hover:*` arbitrary variant 守卫：

```jsx
// ❌ 错误：触屏 tap 后会残留高亮
'hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-[...]'

// ✅ 正确：只对有 hover 能力的设备（鼠标 / 触控板）生效
'[@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-brand-primary/50 [@media(hover:hover)]:hover:shadow-[...]'
```

**仅 hover 守卫，`focus-visible:*` 不变**——键盘 focus 是核心 a11y，触屏 tap 不影响 focus-visible 命中，必须保持原样。

当前已守卫：所有 `EntryCard` hover、详情页 / 404 返回按钮 hover、`SearchBar` 清除按钮 hover、`PrevNextNav` 前后翻按钮 hover。新增交互组件必须套用相同模式。

### forwardRef + ref 合并（当父组件需要 .focus() 子元素时）

如果父组件（如 Home 的 j/k 键盘焦点管理）需要调用子组件 DOM 节点的 `.focus()`，而子组件自身已经有内部 ref（如 `useReveal` 的 IntersectionObserver ref），需要把外部 ref 与内部 ref 合并。典型实现：

```jsx
import { forwardRef, useCallback, useRef } from 'react';

function useMergedRefs(...refs) {
  return useCallback((el) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(el);
      else if (ref && typeof ref === 'object') ref.current = el;
    });
  }, refs);
}

const EntryCard = forwardRef(function EntryCard({ isFocused, ...rest }, externalRef) {
  const internalRef = useReveal(); // 返回 object ref 或 callback ref
  const mergedRef = useMergedRefs(internalRef, externalRef);
  // 用 mergedRef 给到 root <div>
  return <div ref={mergedRef} ... />;
});
```

父组件用法：

```jsx
const cardRefs = useRef([]);
<EntryCard ref={(el) => { cardRefs.current[i] = el; }} isFocused={i === focusedIndex} />
```

修改 `EntryCard` 已有 forwardRef 签名时不要破坏内部 `useReveal` 行为。

### useEffect 防 focus-steal（依赖含派生列表时）

`useEffect` 依赖若包含派生数组（如 `filteredEntries = entries.filter(...)`），数组引用每次 render 都会重建（即使内容相同），导致 effect 重跑。如果 effect 内调用 `.focus()`，会抢走用户当前正在使用的焦点（例如在搜索框打字时焦点被劫到卡片）。

**症状**：用户在搜索框输入第一个字符后，输入框失焦，无法继续输入（除非再次点击输入框）。

**修复模式**：用 ref 跟踪上一次"实际应用过 DOM focus"的状态值，只在状态值真正变化时才调 `.focus()`：

```jsx
const [focusedIndex, setFocusedIndex] = useState(0);
const lastFocusedRef = useRef(0);

useEffect(() => {
  if (filteredEntries.length === 0) return;
  const clamped = Math.min(focusedIndex, filteredEntries.length - 1);
  if (clamped !== focusedIndex) {
    setFocusedIndex(clamped);
    return; // 下次 render 再执行 focus()
  }
  // 关键守卫：focusedIndex 没变就不抢焦点
  if (lastFocusedRef.current !== focusedIndex) {
    lastFocusedRef.current = focusedIndex;
    cardRefs.current[focusedIndex]?.focus({ preventScroll: true });
  }
}, [focusedIndex, filteredEntries]);
```

配套回归测试（参考 `tests/keyboard-shortcuts.test.jsx`）：`fireEvent.change(input, { target: { value: 'x' } })` 后断言 `document.activeElement === input`，锁定"输入不丢焦点"。

### prefers-reduced-motion 复位

新增动画 / transform / box-shadow 必须在 `@media (prefers-reduced-motion: reduce)` 下复位（已经在 `src/index.css` 全局生效），新增组件若引入新的关键帧或 transform 需要单独验证。

## 数据容错显示

组件仅在现有合同明确要求时 fallback：

- Entry `cover` 为 null → 用 brand-* 渐变占位 + 标题首字母。
- Entry 没有 `tags` → 渲染空 chip 区。
- Entry 的 `category` 显示名未找到 → 回退 slug，但数据完整性测试应防止这种状态。
- Project `links` 为 null → 不渲染外链按钮区。

不要用大量 optional chaining 静默吞掉必填 metadata；必填字段缺失应在内容注册/测试阶段暴露。

## 注释与可维护性

项目要求详细中文注释。应说明：

- 为什么选择特殊 DOM 结构（如可点击容器内嵌 Link）。
- fallback 的业务原因。
- Tailwind/iframe 边界或浏览器限制。
- 多处看似重复但不能合并的交互差异。

避免把 className 每个 token 翻译成注释。长 className 可按布局/颜色/交互分行，保持现有文件风格。

## 反模式

- 在主站组件中新增未注册的颜色体系或直接复制文章 iframe 的内联 CSS。
- 在 iframe 作者 HTML 中假设 `brand-*` Tailwind 类会生效（iframe 视口不继承主站 Tailwind 编译产物）。
- 混用图标库、用字符串 emoji 替代 Lucide 图标。
- 用数组 index 作动态列表 key。
- 只有 mouse click，没有 keyboard/focus 状态。
- 把 data 查找、Markdown 解析或 document wrapping 塞进展示组件。
- 为减少两三行 JSX 而创建难以命名、只使用一次的“万能组件”。
- 新增装饰层 / 关键帧动画时不写 `prefers-reduced-motion` 复位（破坏可访问性）。

## 验证

组件行为优先使用 `@testing-library/react` 观察 DOM，而不是测试实现细节：

- 断言链接目标、aria 属性、iframe title/sandbox/class。
- 用 `MemoryRouter` 包裹依赖 Router 的组件。
- 视觉改动至少运行 `npm run build`，并在真实响应式视口检查 mobile/tablet/desktop。
- 交互改动覆盖鼠标与键盘路径。

## 共享组件契约（2026-08-18 UX 优化沉淀）

UX 全面优化（任务 `08-18-ux-optimization-suite`，三波 P0/P1/P2）引入了若干跨页面复用的模式。这些模式不属于"提前抽象"，而是从至少两个调用点（EntryDetail + NotFound / Home + 浮条等）抽取：

### BackButton（`src/components/BackButton.jsx`）

- **何时复用**：详情页左上角悬浮「← 返回」、NotFound 居中「返回首页」、内嵌 404 卡片等所有"返回首页"动作
- **API**：`to`、`ariaLabel`（默认「返回首页」）、`children`（默认「← 返回」）、`className`（追加外边距 / 定位 / padding）
- **forwardRef**：暴露 DOM 引用供 `useFocusBackOnMount` 做 mount 自动 focus（a11y：避免焦点落到 iframe 或 body）
- **glass-pill + 移动端 `min-h/min-w-[44px]`**：所有触控目标 ≥ 44pt 写在 BackButton 内部，调用方不用关心
- **id="back-button"**：供 skip-link 锚定（首个 Tab 焦点元素 `href="#back-button"`）

新增"返回"场景时**不要**再写内联 Link / button，直接用 BackButton。

### useFocusBackOnMount（`src/hooks/useFocusBackOnMount.js`）

- **何时复用**：详情页 / Modal / 全屏 overlay 等需要在 mount 时把焦点送到指定元素（避免被 iframe 或 body 抢占）
- **API**：`(ref, deps)`，deps 变化时下一帧 `ref.current?.focus({ preventScroll: true })`
- **守卫**：`hasFocusedRef` 跟踪"本组件是否曾主动 focus 过"，仅在首次 mount 与 deps 真变化时 focus，用户主动操作后不抢回
- **rAF 时机**：等 React commit + ref attach 完成再调 `.focus()`，避免 stale ref

### 浮条 / 浮按钮定位约定

浮在视口边缘的 UI 元素用 `fixed` 定位 + z-index 层级：

| 元素 | 位置 | z-index |
|---|---|---|
| BackButton（详情页） | top-4 left-4 | 50 |
| PrevNextNav（详情页底部） | bottom-6 left-1/2 | 50 |
| ScrollToTop（Home 右下） | bottom-6 right-6 | 40 |
| KeyboardHint 浮层（Home 底部） | bottom-4 left-1/2 | 30 |
| KeyboardHint CheatSheet | inset-0（全屏） | 100 |
| Skip-link | top-2 left-1/2 | 60 |

新增浮元素时 z-index 必须 ≥ 40 但 ≤ 50，避免盖过 PrevNextNav / BackButton 的 `z-50` 层级。CheatSheet / Modal 等全屏覆盖层用 `z-[100]` 起步。

### 渐进式信息披露（localStorage 持久化）

模式：`useXxxDismissed` hook + 一次性浮层 + localStorage 持久化。

- key 命名：`coolpanda_<feature>_dismissed`，值 `'1'` 表示已 dismiss
- 读取失败（隐私模式 / quota）降级为 `false`（每次显示，但不致命）
- 写入失败 catch 静默（不抛到 UI）
- 多 Tab 同步：监听同源 `storage` 事件

参考实现：`useKbdHintDismissed.js` 是这个模式的标准模板，新增类似 UX 提示时复用此模式。

### 响应式 columns 与 stagger 入场

`Home.jsx` 用 `useResponsiveColumnCount()` hook 监听 Tailwind 断点（`md` 768 / `lg` 1024 / `2xl` 1536）：

- `computeColumnCount(w)` 单一来源；JSX 容器用对应 `md:columns-2 lg:columns-3 2xl:columns-4` class
- 瀑布流卡片 stagger：`revealDelay = (i % columnCount) * 30ms`；首屏 N 张（`i < columnCount * 2`）无延迟
- 移动端单列 → columnCount=1 → 所有卡片无延迟（自然连续不卡顿）

`jsdom` 无 `window.matchMedia`，hook 内 `typeof window.matchMedia !== 'function'` 守卫降级。

### iframe 注入脚本模式

`src/lib/html.jsx` 注入两类 srcDoc 内容：

1. **`<base href="about:srcdoc">`**：修复锚点跨页跳转。3 档 fallback：`<head>` 内 → 在 `<html>` 后插入 `<head>` → prepend 兜底（畸形 HTML 修复）
2. **桥接脚本**（`src/lib/iframe-link-bridge.js`）：捕获 capture phase click，把同站路由 href（`#/x` / `/x` / `/blog/x`）改写为 `window.parent.location.hash`，让父 HashRouter 接管；纯锚点 `#section` 与外链 `https://` 不拦截

新增 iframe 注入功能时：在 `<base>` 之后追加，幂等检查（避免重复注入），用 IIFE 包成单个 `<script>` 不污染作者 inline script。
