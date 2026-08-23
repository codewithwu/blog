# P0-2: NotFound 加 skip-link + useFocusBackOnMount

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

根除 ui-ux-pro-max 诊断 C1+C4：NotFound 当前无 skip-link 也无 mount 焦点；键盘用户首屏 Tab 体验与 EntryDetail 不一致。复用 EntryDetail 的 skip-link 模式 + useFocusBackOnMount，加 Esc 监听捕获焦点。

## Requirements

### 1. 加 skip-link

- `src/pages/NotFound.jsx` 在最外层 `<div>` 前加：
  ```jsx
  <a
    href="#back-button"
    className="sr-only focus:not-sr-only fixed top-2 left-1/2 -translate-x-1/2 z-[60]
               glass-pill px-3 py-1.5 rounded-md text-sm font-mono"
  >
    跳到主站导航
  </a>
  ```
- 与 EntryDetail.jsx:124-130 完全对齐（复用同款玻璃态胶囊 + sr-only 隐藏）

### 2. 加 useFocusBackOnMount

- `src/pages/NotFound.jsx`：
  - `import { useRef } from 'react'`（已有）+ `import useFocusBackOnMount from '../hooks/useFocusBackOnMount.js'`
  - 组件顶部加 `const backButtonRef = useRef(null);`
  - 加 `useFocusBackOnMount(backButtonRef, []);`（NotFound 没 slug 变化，deps 空数组）
  - 把现有 `<BackButton to="/">` 改为 `<BackButton ref={backButtonRef} to="/">`

### 3. 加 Esc 监听

- `src/pages/NotFound.jsx`：
  - `import { useEffect } from 'react'`（如未导入）
  - 加 useEffect（与 EntryDetail.jsx:86-99 同款实现）：
    ```jsx
    useEffect(() => {
      const onKeyDown = (e) => {
        if (e.key !== 'Escape') return;
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.target?.isContentEditable) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        backButtonRef.current?.focus({ preventScroll: true });
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, []);
    ```

### 4. 测试更新

- `tests/not-found.test.jsx` 现有断言适配：
  - 断言：`skipLink.tagName === 'A'` + `href === '#back-button'`（如之前未断言）
- 新断言：mount 后 BackButton 获得焦点（与 EntryDetail 的 `mount 后 BackButton 自动获得焦点` 测试对齐）

## Acceptance Criteria

- [ ] **AC-1**：NotFound 渲染首个 Tab 元素为 `<a href="#back-button">` skip-link
- [ ] **AC-2**：NotFound mount 后 BackButton 获得焦点（与 EntryDetail 同款 useFocusBackOnMount）
- [ ] **AC-3**：NotFound 按 Esc 焦点送回 BackButton（与 EntryDetail 同款 Esc handler）
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功；gzip JS 体积增长 < 0.3 KB

## 验证场景

- `npm run dev` + 访问任意不存在路径触发 NotFound
- 1st Tab：聚焦 skip-link（玻璃态胶囊浮现）
- 2nd Tab：聚焦 BackButton
- 按 Esc：焦点回到 BackButton（无变化，但守卫对）
- 屏幕阅读器朗读："跳到主站导航" → "返回首页"

## 改动文件清单

修改：
- `src/pages/NotFound.jsx`
- `tests/not-found.test.jsx`

新增：无

## Out of Scope

- ✗ NotFound 文案加引导小字（C6）—— 文案任务
- ✗ 404 数字 4K 屏放大（C5）—— 边缘场景
- ✗ NotFound 与 EntryDetail 内嵌 404 视觉统一（P1-3 单独任务）

## Notes

- Esc 监听逻辑可以抽成 hook（如 `useEscapeToFocusBack`），但本任务只在 2 个页面用，**复制粘贴**避免新 hook 引入复杂度（design.md §2.2 取舍）
- skip-link 与 EntryDetail 完全相同的 className，**不抽出新组件**（就一处用，复制即可）