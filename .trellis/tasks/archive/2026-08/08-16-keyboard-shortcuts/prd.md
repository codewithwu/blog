# 键盘快捷键 / j/k Enter

## Goal

Home 卡片间 `j/k` 移动焦点（环形），`Enter` 进入；`/` 键聚焦搜索框（与 P1-1 协同）；输入框聚焦时所有快捷键禁用，避免输入"j"被吞掉。**Q3 已决策**：跳过 `←` 详情页返回键（详情页左上角返回按钮已足够显眼）。本期实现 `j/k/Enter + /`。

## Background

- 已有 `useReveal` hook（`src/hooks/useReveal.js`）管理 IntersectionObserver
- 卡片 `src/components/EntryCard.jsx` 已有 `role="link"` + `tabIndex={0}` + Enter/Space 键盘支持
- 搜索框 `src/components/SearchBar.jsx`（P1-1 即将引入）需要暴露 `inputRef` 给键盘 hook 操作
- 当前 Home 没有任何键盘快捷键

## Requirements

### 1. 新 hook `src/hooks/useKeyboardShortcuts.js`

- 单一 `useEffect` 监听全局 `keydown`
- 监听前先判断：
  - 目标元素是 `<input>` / `<textarea>` / `contenteditable` → 跳过（输入框聚焦时不响应）
  - `event.metaKey` / `ctrlKey` / `altKey` 修饰键按下 → 跳过
- 返回的对象包含 `focusedIndex` state（Home 内部消费）

### 2. Home 路由快捷键

- `j`：`focusedIndex = (focusedIndex + 1) % entries.length`，环形
- `k`：`focusedIndex = (focusedIndex - 1 + entries.length) % entries.length`，环形
- `Enter`：当前 `focusedIndex` 对应卡片触发 navigate
- 实现：Home 用 `useState(0)` 管理 focusedIndex；传给 EntryCard 一个 `isFocused` prop；focused 卡片 `.focus()` DOM API 触发
- focused 卡片视觉：除原有 `focus-visible:ring` 外，加 `ring-2 ring-brand-glow` 强制 ring（即便鼠标点击过）

### 3. `/` 快捷键聚焦搜索框

- SearchBar 暴露 `inputRef = useRef()`
- Home 维护 `searchInputRef`，传给 SearchBar 和 useKeyboardShortcuts
- `/` 键按下时：`searchInputRef.current.focus()`，并 `preventDefault()`（避免 `/` 字符进入输入框）
- 实现位置：在 Home 路由内的 keydown 分发，或 useKeyboardShortcuts 接受 `searchInputRef` 参数

### 4. 输入框聚焦守卫

- `useKeyboardShortcuts` 顶部统一判断：若 `document.activeElement` 是 input/textarea/contenteditable，直接 return
- 这样 P2-1 完成后用户输入"j/k/Enter"不会触发导航

## Acceptance Criteria

- [ ] Home 页面，`j` 焦点移到下一张卡，`k` 焦点移到上一张卡，环回首尾
- [ ] 焦点卡片有明显的 glow ring（强制 `ring-brand-glow`）
- [ ] 焦点卡片按 `Enter` 跳到 `/p/:slug`
- [ ] `/` 键按下时搜索框获得焦点，且 `/` 不进入输入框
- [ ] 在搜索框输入 `j` / `k`，不被吞、不触发导航
- [ ] 快捷键与 `<input>` / `<textarea>` 焦点完全互斥
- [ ] 带 `Cmd/Ctrl` 的组合键（`Cmd+J` 等）不被劫持
- [ ] 详情页不响应 `j/k`（路由切换后 hook 卸载）
- [ ] 不引入新 npm 依赖
- [ ] `npm run test` 通过
- [ ] `npm run build` 通过

## Out of Scope

- `←` / `Esc` 详情页返回（Q3 已决策跳过）
- 数字键 `1-9` 跳转到第 N 张卡
- 快捷键自定义面板 / `?` 显示帮助
- 全局"按 `?` 查看快捷键"提示气泡

## Technical Notes

- 不引入新 npm 依赖；纯 `useEffect` + `addEventListener`
- 焦点环实现：用 `cardRef.current[index].focus()` 触发，再让 CSS `:focus-visible` 或强制 ring 决定视觉
- 注意 React 18+ 中 `setState` 在 `useEffect` 内的批处理行为
- 不修改 CLAUDE.md / design.md

## Risks

- **焦点环与现有 focus-visible 冲突**：j/k 移动焦点时 `:focus-visible` 不一定生效（鼠标未点击）。需强制 `ring-2 ring-brand-glow` 不依赖 `:focus-visible`
- **`/` 字符若用户真要输入怎么办**：仅当焦点不在输入框时触发；按下 `/` 时 focus 搜索框后，`/` 仍会被 input 默认行为写入。需要在 keydown handler 中 `preventDefault` 才不会写入
- **滚动到焦点卡片**：focus() 会自动滚到 DOM 元素（浏览器默认），可能造成瀑布流错位。需评估是否 `preventScroll: true`（MDN: `element.focus({ preventScroll: true })`）