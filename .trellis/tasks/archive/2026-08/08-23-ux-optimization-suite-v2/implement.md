# UX 优化套件 v2 — Execution Plan

## 总览

按 PRD 三波分 7 个 child task 独立交付。每波/每个 child 独立 commit、独立 archive。

| 波次 | 子任务 slug | 估计 commit | 估计工作量 |
|---|---|---|---|
| P0 | `p0-entrycard-anchor-tag` | 1 commit | 2-3 小时 |
| P0 | `p0-notfound-skip-link` | 1 commit | 1 小时 |
| P1 | `p1-entrydetail-404-unify` | 1 commit | 1-2 小时 |
| P1 | `p1-reduced-motion-complete` | 1 commit | 1 小时 |
| P1 | `p1-searchbar-count-empty-state` | 1 commit | 1-2 小时 |
| P2 | `p2-tailwind-token-extension` | 1 commit（含 P2-7 合并） | 2-3 小时 |
| P2 | `p2-color-contrast-mid-dim` | 同上合并 commit | 1 小时 |

## Phase 1: Plan（本任务）

- [x] 父任务 prd.md（本任务）
- [x] 父任务 design.md
- [x] 父任务 implement.md（本文件）
- [x] 创建 7 个 child task
- [ ] 7 个 child prd.md
- [ ] `task.py validate` 父任务
- [ ] `task.py start` 父任务

## Phase 2: Execute（按子任务串行）

### 子任务执行顺序

**原则**：先 P0（a11y 必修）→ P1（一致性 + 体验）→ P2（系统收口）；同波次内按依赖关系排序。

1. **P0-1** EntryCard `<a href>` —— 必修，影响范围最大，先做
2. **P0-2** NotFound skip-link —— 复用现有 BackButton，独立
3. **P1-3** EntryDetail 内嵌 404 视觉 —— 依赖 P0-2 已完成的 skip-link 模式（共享思路）
4. **P1-4** prefers-reduced-motion 兜底 —— 独立 CSS 改动，无依赖
5. **P1-5** SearchBar 计数 + 空态 —— 独立组件改动
6. **P2-6 + P2-7** tailwind token 扩展 + 颜色提亮 —— **合并到 1 个 commit**（同文件）
   - 拆开会让品牌色反复 commit；合并 1 次，diff 清晰
   - 一次性升级所有 `text-brand-mid` / `text-brand-dim` 用点

### 每子任务的执行循环

```
task.py start <child-dir>
  ↓
读取子任务 prd.md 的具体改动点
  ↓
修改代码（按子任务 prd.md 列的文件清单）
  ↓
更新测试（按子任务 prd.md AC 写断言）
  ↓
npm run test（应全绿）
  ↓
npm run build（应成功，gzip 增长 < 2KB）
  ↓
手测 1-2 个核心场景
  ↓
git add + commit（按子任务 prd.md 建议的 commit 命名）
  ↓
task.py finish
```

### 各子任务具体执行计划

#### Child 1: P0-1 EntryCard `<a href>`（`08-23-p0-entrycard-anchor-tag`）

**目标**：完成 PRD AC-1 / AC-2 / AC-3

**文件改动**：
1. `src/components/EntryCard.jsx`（改）
   - 外层 `<div ref={mergedRef} role="link" tabIndex={0} onClick={go} onKeyDown={...}>` → `<a ref={mergedRef} href={\`/p/${entry.slug}\`}>` + 移除 onClick / onKeyDown / role / tabIndex
   - 保留 focus:outline-none / focus-visible:ring-2（a 原生 focusable）
   - 内部 button（tag/category chip）：加 `e.preventDefault()` + `e.stopPropagation()`
   - 项目 GitHub / Demo `<a>`：改 `<button onClick={() => window.open(...)}>`（避免嵌套 `<a>`）
   - tag/category chip 移动端（< 640px）补 `[@media(max-width:640px)]:min-h-[44px]`
2. `tests/entry-card.test.jsx`（改）
   - 断言：`expect(card.tagName).toBe('A')` 而非 `'DIV'`
   - 断言：`expect(card.getAttribute('href')).toBe('/p/<slug>')`
   - 新断言：tag chip 点击不触发整卡 navigate
   - 新断言：移动端 chip 触控目标 ≥ 44pt

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `npm run dev` + 首页 Tag chip 点击不再误触发整卡

**commit 命名**：`fix(card): EntryCard <a href> wrap + nested button 44pt`

#### Child 2: P0-2 NotFound skip-link + useFocusBackOnMount（`08-23-p0-notfound-skip-link`）

**目标**：完成 PRD AC-4 / AC-5

**文件改动**：
1. `src/pages/NotFound.jsx`（改）
   - 加 skip-link `<a href="#back-button" className="sr-only focus:not-sr-only fixed top-2 left-1/2 -translate-x-1/2 z-[60] glass-pill ...">跳到主站导航</a>`
   - BackButton 加 `ref={backButtonRef}` + `useFocusBackOnMount(backButtonRef, [])`
   - 加 Esc 监听：document keydown → 焦点送 backButtonRef（INPUT/TEXTAREA 守卫）
2. `tests/not-found.test.jsx`（改）
   - 断言：首个 Tab 元素是 skip-link
   - 断言：mount 后 BackButton 获得焦点

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `npm run dev` + NotFound Tab 1 次到 skip-link，再 Tab 1 次到 BackButton

**commit 命名**：`fix(a11y): NotFound skip-link + useFocusBackOnMount`

#### Child 3: P1-3 EntryDetail 内嵌 404 视觉（`08-23-p1-entrydetail-404-unify`）

**目标**：完成 PRD AC-6 / AC-7

**文件改动**：
1. `src/pages/EntryDetail.jsx`（改）
   - `if (!entry) return ...` 块：引入 `AuroraBackdrop` + 满极光 + 巨大渐变 404 数字 + 文案 + BackButton
   - BackButton 仍走 `backButtonRef`（useFocusBackOnMount 在 slug 变化时跑）

**验证**：
- [ ] `npm run test` 全绿（tests/entry-detail.test.jsx 内嵌 404 块）
- [ ] `npm run build` 成功
- [ ] `npm run dev` + 访问 `/p/不存在-slug` 看视觉对齐 NotFound

**commit 命名**：`feat(detail): inline 404 reuse NotFound visual`

#### Child 4: P1-4 prefers-reduced-motion 兜底（`08-23-p1-reduced-motion-complete`）

**目标**：完成 PRD AC-8 / AC-9

**文件改动**：
1. `src/index.css`（改）
   - `@media (prefers-reduced-motion: reduce)` 块加暴力兜底：
     ```css
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       transition-delay: 0ms !important;
     }
     ```
2. `src/pages/Home.jsx`（改）
   - `useResponsiveColumnCount` 加 reduce-motion 检测：
     ```js
     const reduceMotion = typeof window.matchMedia === 'function' &&
       window.matchMedia('(prefers-reduced-motion: reduce)').matches;
     const revealDelay = reduceMotion ? 0 : (isFirstScreen ? 0 : columnIndex * 30);
     ```

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] DevTools Rendering → Emulate `prefers-reduced-motion: reduce` + 刷新瀑布流：卡片立即可见，无 stagger

**commit 命名**：`fix(a11y): prefers-reduced-motion guard transitionDelay + useReveal`

#### Child 5: P1-5 SearchBar X/Y 计数 + 空态建议（`08-23-p1-searchbar-count-empty-state`）

**目标**：完成 PRD AC-10 / AC-11

**文件改动**：
1. `src/components/SearchBar.jsx`（改）
   - 接受 `totalCount` + `filteredCount` props（从 Home 传）
   - 容器底部加 `<span className="text-xs text-brand-mid font-mono" aria-live="polite">{filteredCount} / {totalCount}</span>`（右下）
2. `src/pages/Home.jsx`（改）
   - 把 `entryCount()` 与 `filteredEntries.length` 传给 `<SearchBar totalCount={entryCount()} filteredCount={filteredEntries.length} />`
   - 空态分支：
     - 「清除筛选」按钮（点击 setQuery('') + setType(DEFAULT_TYPE)）
     - 「试试搜这些」chip：取 tags Top 3 + categories，渲染为 button 调用 setQuery
3. `tests/home.test.jsx`（改）
   - 断言：SearchBar 渲染 "X/Y"
   - 断言：空态包含「清除筛选」链接
   - 断言：空态包含至少 1 个 "试试搜这些" chip

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `npm run dev` + 输入不存在关键词看空态可操作建议

**commit 命名**：`feat(search): X/Y count + empty state suggestions`

#### Child 6 + 7: P2-6 + P2-7 tailwind token + 颜色提亮（`08-23-p2-tailwind-token-extension` + `08-23-p2-color-contrast-mid-dim`）

**目标**：合并 commit 完成 PRD AC-12 / AC-13 / AC-14 / AC-15 / AC-16

**文件改动**（一次性合并）：
1. `tailwind.config.js`（改）
   - `theme.extend.boxShadow`：glow-sm / glow-md / glow-lg
   - `theme.extend.borderRadius`：pill
   - `theme.extend.transitionTimingFunction`：smooth
   - `theme.extend.fontFamily`：display / sans / mono
   - `theme.extend.zIndex`：tooltip=60 / modal=100
   - `colors.brand.mid`: '#94a3b8' → '#cbd5e1'
   - `colors.brand.dim`: '#64748b' → '#94a3b8'
2. `src/index.css`（改）
   - body 移除硬编码 `font-family`，改 `@apply font-sans`
   - h1-h6 移除硬编码 `font-family`，改 `@apply font-display`
3. **关键**（commit 后做）：
   - grep src/ 找所有 `shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]` 等散落 hardcoded shadow，替换为 `shadow-glow-sm` 等 token
   - grep src/ 找所有 `font-family` 硬编码，确认无残留
   - 视觉走查：确认 card / button / chip 的紫光强度未变（box-shadow 数值一致）

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `grep -rE 'shadow-\[0_0_12px_-2px_rgba\(91,141,239' src/` 无结果（AC-13）
- [ ] `grep -rE "font-family: 'IBM Plex Sans'|font-family: 'Fraunces'|font-family: 'JetBrains Mono'" src/` 无结果（AC-14）
- [ ] 视觉对比：token 化前后卡片玻璃态外观一致（截图或 Lighthouse 对比）

**commit 命名**：`refactor(design): tailwind token extension + color contrast bump`

## Phase 3: Finish（每子任务）

每个 child 完成后：
1. 跑 `npm run test` 全绿 + `npm run build` 成功
2. `task.py finish <child-dir>` 归档
3. 跳到下一个 child

父任务最终完成：
1. `task.py finish <parent-dir>`
2. 更新 `.trellis/spec/`（如果有跨任务的模式提炼）
3. commit 收尾

## 总体验证（5 场景手测）

1. 首页 Tab 1 次到 skip-link（NotFound 也走 skip-link）；再 Tab 到 BackButton
2. 首页 Tag chip 点击不误触发整卡；移动端 chip 触控目标 ≥ 44pt
3. 详情页 mount 后 BackButton 有 focus-visible ring；按 Esc 焦点送回 BackButton
4. 详情页 `/p/不存在-slug` 显示满极光 404（与 NotFound 一致）
5. 首页 reduced-motion 启用后瀑布流入场无延迟