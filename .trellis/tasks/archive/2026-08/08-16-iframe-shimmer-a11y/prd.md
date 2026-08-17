# iframe 加载 shimmer + a11y 标题

## Goal

EntryDetail 在 HTML 文档加载期间不再闪白屏；iframe 设 `title` 属性让 screen reader 知道是什么内容；返回按钮加 `aria-label` 让屏幕阅读器朗读更明确。三项轻量修改，每个独立可测。

## Background

- `src/lib/html.jsx`（未直接读过，根据 diff 与 use 推断）渲染 `<iframe srcDoc={html} sandbox=...>`；当前没有 loading 占位
- `src/pages/EntryDetail.jsx:42-53` 返回按钮：内容 `← 返回`，无 `aria-label`
- `src/lib/html.jsx` iframe 渲染：未给 `title` 属性
- 详情页 iframe 是 100vh，HTML 文档加载期间白屏对用户视觉跳变明显

## Requirements

### 1. iframe shimmer 占位

- 在 `src/lib/html.jsx` 修改 iframe 渲染：外层包一个容器 div
  ```
  <div className="relative w-full h-screen">
    {loading && (
      <div className="absolute inset-0 bg-brand-surface/40 backdrop-blur-sm animate-pulse" />
    )}
    <iframe className="w-full h-screen border-0" ... />
  </div>
  ```
- `loading` state：`useState(true)`，iframe `onLoad` 事件触发后 `setLoading(false)`
- 触发淡出：shimmer 占位 `opacity-100` → `opacity-0`，`transition-opacity duration-300`
- 注意：`onLoad` 在 srcDoc 模式下也触发（文档解析完成时）

### 2. iframe title 属性

- `<iframe title={entry.title} ... />`
- title 值取自 `entry.title`（由 EntryDetail 传给 Html 组件的 `title` prop）
- 不需要 i18n，本期都是中文站名

### 3. 返回按钮 aria-label

- `src/pages/EntryDetail.jsx:42-53` 给 `<button>` 加 `aria-label="返回首页"`
- 同时检查 `src/pages/NotFound.jsx:42-54` 的"返回首页"按钮是否需要同样 aria-label（Link 元素，文本本身就是 label，但显式 aria-label 更稳）

## Acceptance Criteria

- [ ] 进入 `/p/introduce`，iframe 加载期间可见玻璃态 shimmer（不闪白）
- [ ] iframe `onLoad` 完成后 shimmer 淡出，无残留
- [ ] `<iframe title="Claude Task Monitor">` 在 devtools Elements 中可见
- [ ] 返回按钮 devtools Accessibility 标签显示 `aria-label="返回首页"`
- [ ] 用 macOS VoiceOver / NVDA / Chrome Accessibility Tree 朗读 iframe，能听到 title
- [ ] 404 页面的"返回首页" Link 元素也加 `aria-label="返回首页"`
- [ ] 不引入新 npm 依赖
- [ ] `npm run test` 通过
- [ ] `npm run build` 通过

## Out of Scope

- iframe 内容区的 a11y（heading / aria-live 等）由作者在 `content/*.html` 内部负责
- 详情页进入 / 退出动画（属于更宏观的过渡设计，独立任务考虑）
- 详情页键盘快捷键（属于 P2-1 child）

## Technical Notes

- iframe `onLoad` 触发时机：在 SPA 内由于 srcDoc 是同步字符串，加载极快（< 100ms），可能看不到 shimmer。这是预期——主要价值在 iframe 首次挂载到首帧渲染之间的缝隙
- shimmer 用 `bg-brand-surface/40`（半透明，呼应 glass pill）+ `animate-pulse`（Tailwind 内建）
- 不修改 CLAUDE.md / design.md

## Risks

- **iframe `onLoad` 在 SPA + srcDoc 下可能不触发**：`srcDoc` 模式下浏览器解析极快，`onLoad` 可能错过。备选方案：用 `useEffect` + `setTimeout(0)` 作为兜底触发；或在 iframe mount 后用 `requestAnimationFrame` 立即隐藏 shimmer
- **验证方法**：在 chrome devtools Performance 录一段详情页加载，看 shimmer DOM 是否出现并消失