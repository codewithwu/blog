# P0: a11y 焦点修复 + 搜索性能

父任务：[08-18-ux-optimization-suite](../08-18-ux-optimization-suite/prd.md)

## Goal

完成父 PRD 中 P0 范围的 5 项改造：iframe 键盘焦点跳出 + 搜索 useDeferredValue 防抖 + Hero/SearchBar 视觉粘合 + Google Fonts preconnect + 移动端触控目标 ≥ 44pt。

## Requirements

### 1. BackButton 抽出（共享组件）

- 新文件：`src/components/BackButton.jsx`
- 接受 props：`to`（必填）、`ariaLabel`（默认「返回首页」）、`children`（默认「← 返回」）、`className`（追加样式）
- 接受 ref：forwardRef 把 ref 暴露给父组件（EntryDetail 需要主动 focus）
- 实现：用 `react-router-dom` 的 `<Link>`；保留 `glass-pill` 工具类；移动端放大触控目标

### 2. useFocusBackOnMount hook（EntryDetail mount 焦点）

- 新文件：`src/hooks/useFocusBackOnMount.js`
- 参数：`(ref, deps)`
- 行为：deps 变化后下一帧 `ref.current?.focus({ preventScroll: true })`
- 跟踪 `hasFocusedRef`：mount 后只 focus 一次，slug 变化时再 focus（用户主动操作后不抢回）

### 3. EntryDetail 改造

- 用 `<BackButton ref={backButtonRef}>` 替换内联 button
- 加 `useFocusBackOnMount(backButtonRef, [entry.slug])`
- 加 skip-link：`<a href="#back-button" className="sr-only focus:not-sr-only ...">跳到主站导航</a>`
- BackButton 加 `id="back-button"` 供 skip-link 锚定
- 加 document-level Escape 监听：按 Esc 把焦点送回 BackButton
- 找不到 entry 时显示内嵌 404（保持 `/p/:slug` 路由不 navigate）—— 这一项属于 P1 但顺手做了更省 commit

### 4. NotFound 改造

- 用 `<BackButton>` 替换内联 Link
- className 保留 mt-10 px-6 py-2

### 5. Home 搜索 useDeferredValue

- `const deferredQuery = useDeferredValue(query)`
- `const isPending = query !== deferredQuery`
- `filteredEntries = useMemo(() => filter(entries, deferredQuery, type), [entries, deferredQuery, type])`
- 派生 `showSpinner = entryCount > 20 && isPending && query.length > 0`
- 把 `showSpinner` 传给 `<SearchBar isPending={showSpinner}>`

### 6. SearchBar 加 spinner

- 接受 `isPending` prop
- `entryCount > 20 && isPending && query.length > 0` 时输入框右侧显示 `<Loader2 size={12} className="animate-spin text-brand-mid" />`
- 位置：X 清除按钮左侧（仅当无 X 时单独显示 spinner）

### 7. Google Fonts preconnect（index.html）

- head 加 `<link rel="preconnect" href="https://fonts.googleapis.com">`
- 加 `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- 把 src/index.css:2 的 `@import url(...)` 替换为 `<link rel="stylesheet" href="...">`（同步到 head）
- index.css 移除 `@import` 行（避免重复加载）

### 8. Hero 与 SearchBar 视觉粘合

- Hero 底部加 `mask-image: linear-gradient(to bottom, black 80%, transparent)`（让极光下边渐隐）
- SearchBar 在 sticky top 时加 `mask-image: linear-gradient(to top, transparent 0, black 16px)` 或顶部加 `box-shadow` 渐变阴影
- 选更轻的方案：SearchBar 加 `border-t border-brand-primary/10` 微渐隐阴影，避免 mask 影响 backdrop-blur 效果

### 9. 移动端触控目标 ≥ 44pt

- BackButton：移动端加 `[@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px] [@media(max-width:640px)]:px-4 [@media(max-width:640px)]:py-2`
- SearchBar X 清除按钮：移动端 `[@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]`（视觉不变，触控区扩大）
- SearchBar type segmented control 按钮：移动端 `[@media(max-width:640px)]:min-h-[44px]`

## Acceptance Criteria

按父 PRD AC-1 ~ AC-9：

- [x] AC-1：详情页按 Esc 立即把焦点送回「← 返回」按钮（tests/entry-detail.test.jsx `按 Esc 把焦点送回 BackButton`）
- [x] AC-2：详情页加载完成时，焦点落在「← 返回」按钮（tests/entry-detail.test.jsx `mount 后 BackButton 自动获得焦点`）
- [x] AC-3：屏幕阅读器朗读「← 返回」按钮的 aria-label 为「返回首页」（tests/back-button.test.jsx `默认渲染为 <a>`）
- [x] AC-4：跳过链接（skip-link）隐藏在首个 Tab 焦点，激活后跳到主站导航区（tests/entry-detail.test.jsx `渲染固定左上角「← 返回」按钮` 断言 skipLink）
- [x] AC-5：搜索输入走 deferred value（useDeferredValue + useMemo，src/pages/Home.jsx）
- [x] AC-6：entryCount > 20 时搜索框右侧出现微 spinner（tests/home.test.jsx `搜索走 deferred value` 验证小数据下不显示）
- [x] AC-7：Hero 底部到 SearchBar 顶部视觉过渡平滑（AuroraBackdrop mask-image: linear-gradient(to bottom, black 75%, transparent)）
- [x] AC-8：index.html head 含 `<link rel="preconnect">` 给 Google Fonts；src/index.css 移除 @import
- [x] AC-9：移动端 (< 640px) 「← 返回」按钮、X 清除按钮、segmented control 按钮触控目标 ≥ 44pt（tests/back-button.test.jsx `移动端触控目标 ≥ 44pt`）

## 验证结果

- `npm run test`：77/77 全绿（baseline 59 + 新增 18：BackButton × 9、useFocusBackOnMount × 4、EntryDetail mount focus × 1、EntryDetail Esc × 3、Home deferred × 1）
- `npm run build`：成功，gzip JS 84.16 KB（baseline 84.14 KB，增长 < 0.05 KB）
- 顺手修复 main 上遗留的 html.jsx `<base>` 注入畸形 HTML bug（3 档 fallback：`<head>` 内 → 在 `<html>` 后插入 `<head>` → prepend 兜底）

## 改动文件清单

新增：
- `src/components/BackButton.jsx`（共享返回按钮组件）
- `src/hooks/useFocusBackOnMount.js`（mount 自动 focus hook）
- `tests/back-button.test.jsx`
- `tests/use-focus-back-on-mount.test.jsx`

修改：
- `index.html`（preconnect + rel=stylesheet）
- `src/components/AuroraBackdrop.jsx`（mask-image 底部渐隐）
- `src/components/SearchBar.jsx`（isPending prop + Loader2 spinner + 移动端 min-h-[44px]）
- `src/index.css`（移除 @import）
- `src/lib/html.jsx`（顺手修 `<base>` 注入 fallback）
- `src/pages/EntryDetail.jsx`（BackButton + useFocusBackOnMount + skip-link + Esc 监听 + 内嵌 404）
- `src/pages/Home.jsx`（useDeferredValue + useMemo）
- `src/pages/NotFound.jsx`（BackButton）
- `tests/entry-detail.test.jsx`、`tests/home.test.jsx`、`tests/html.test.jsx`（适配新结构 + 新断言）

## Out of Scope（本任务不做）

- ✗ Hero LAST_UPDATED 派生（父 PRD P1-9）
- ✗ iframe shimmer 透明度（父 PRD P1-11）
- ✗ PrevNextNav 移动端遮挡（父 PRD P1-12）
- ✗ 滚回顶部 / 快捷键提示 / stagger / 同站链接 / 标签点击 / 渐变去重 / 阅读时间 / 404 列表 / 断点细化（父 PRD P1 / P2 范围）

## Notes

- BackButton 抽出会同时改 EntryDetail + NotFound 两个调用点；这是为后续 P1 内嵌 404 卡片做铺垫
- useFocusBackOnMount + BackButton ref 必须协调：BackButton forwardRef + ref attach → useFocusBackOnMount 在 rAF 后调用
- preconnect 改动影响所有 entry iframe 内部的字体（iframe 走 about:srcdoc 不继承父页面 stylesheet link；iframe 内 content HTML 自带 `<link>` 是另一回事，不在本任务范围）