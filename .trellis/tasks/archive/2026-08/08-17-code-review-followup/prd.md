# 修复 /code-review 8 项 findings

## Goal

修复 `/code-review @src/` 暴露的 8 项 finding（4 个 functional bug + 4 个维护性问题）：
让社交分享卡（OG / Twitter Card meta）正确指向当前 entry URL、详情页 / 搜索框 / 键盘焦点的边界行为符合用户预期、避免搜索框打字丢焦点、详情页导航切换 shimmer 重触发；并把分散在三处的玻璃态样式与魔法字符串收敛到单一来源。

## Scope

**In scope:**
- `src/pages/EntryDetail.jsx:73` — og:url 在 HashRouter 下指向站点根；改为含 hash 的完整 URL
- `src/pages/EntryDetail.jsx:117` — `<Html>` 缺 `key={slug}`；补 key 强制 iframe 在 slug 切换时重建
- `src/components/SearchBar.jsx:88-99` — X 清除按钮 onClick 只 setQuery 不 restore focus；补 `inputRef.current.focus()`
- `src/pages/Home.jsx:84-104` — 焦点过滤 0 → N 时不主动恢复；补「length 由 0 转正时强制 focus」逻辑
- `src/pages/Home.jsx:78,130,49` — `'all'` 字面量硬编码 3 处；改为 import `TYPE_OPTIONS[0].value`
- `src/pages/Home.jsx:104` — `useEffect` deps 含 `filteredEntries`（每次新数组）；改为 `[focusedIndex, filteredEntries.length]`
- `src/components/EntryCard.jsx:45-54` — `useMergedRefs` 用 `useCallback(fn, refs)` 但 `refs` 是 rest spread 永远新数组；改为不依赖 useCallback 或诚实注释
- `src/index.css` + `EntryDetail.jsx` + `PrevNextNav.jsx` + `NotFound.jsx` — 玻璃态胶囊 hover utility 在三处完整重复；抽 `.glass-pill` CSS 类，三处简写
- 配套 Vitest 测试断言（F1 og:url 包含 hash、F3 X 按钮后 input 仍焦点、F4 过滤 0→N 后焦点自动恢复、M1 type 默认值来自 TYPE_OPTIONS）
- `npm test` + `npm run build` 验证

**Out of scope:**
- OG meta 端到端验证（GitHub Pages 纯 SPA 已知限制，详见 spec data-and-rendering.md §OG / Twitter Card meta）
- 预渲染每条 `/p/:slug` 静态 HTML（vite-plugin-prerender，已知方案，未排期）
- 重写 `<base href="about:srcdoc">` 注入策略（与 srcDoc 渲染合同绑定，不是本次 review 项）
- 修复 `tests/html.test.jsx > renders an iframe for a full HTML document` 已知基线漂移
- 抽 `usePageTitle` 之外的 hooks（`useKeyboardShortcuts` / `useReveal` 等本次没问题）
- 任何样式系统的扩展（不新增 Tailwind component class 之外的插件）
- 其他已发现但用户没放进本次 review 的项

## Requirements

### R1. EntryDetail og:url 包含 hash（F1 / code-review #1）

- **R1.1** 当前 `${window.location.origin}${window.location.pathname}` 在 HashRouter 下永远是 `/blog/`，丢失 `#/p/<slug>`
- **R1.2** 改为 `${window.location.origin}${window.location.pathname}${window.location.hash}`（origin + pathname + hash），或在 pathname 末尾拼接 hash
- **R1.3** `window.location.hash` 默认含前导 `#`，无需手动加
- **R1.4** 保留 entry.description / entry.title fallback 逻辑

### R2. EntryDetail `<Html>` 接收 `key={slug}` 强制 iframe 重建（F2 / code-review #2）

- **R2.1** 当前 EntryDetail 路由切换时 EntryDetail 组件实例复用，`<Html>` 子组件不 unmount
- **R2.2** Html 内部 `loading` state 已在首次 onLoad / rAF 后变 false，切换 slug 时不再重触发 shimmer
- **R2.3** 改为 `<Html key={entry.slug} html={...} title={...} />`，React 用 key 变化识别为不同 element 实例，unmount + remount → loading 重置 true → shimmer 重新出现
- **R2.4** iframe `srcDoc` 变化（new entry.content）应触发视觉重置；key 是最稳的方式
- **R2.5** Html 组件本身签名不变（不需要接收 key prop）

### R3. SearchBar X 清除按钮保留焦点（F3 / code-review #3）

- **R3.1** 当前 `<button onClick={() => setQuery('')}>` 仅 setQuery，X unmount 后浏览器把焦点送回 body
- **R3.2** 改为 onClick 内 setQuery 后调 `inputRef.current.focus()`，让 input 仍持有焦点
- **R3.3** X 按钮 unmount 后 `inputRef.current` 仍指向同一个 input 节点（input DOM 不被 X 卸载，因为 X 是 input 的 sibling 不是 child）
- **R3.4** 注释行 15 承诺的「让 input 保留焦点」需要实际生效

### R4. Home 焦点过滤 0 → N 强制恢复（F4 / code-review #4）

- **R4.1** 当前 effect 路径：length>0 → clamp → 检查 lastFocusedRef === focusedIndex → 跳过 focus()
- **R4.2** 复现场景：focusedIndex=2 → 输入字符过滤到 0（effect 早返）→ 清字符恢复 N（clamped===focusedIndex，不 setState；lastFocusedRef 守卫跳过 focus）→ 焦点未恢复
- **R4.3** 修复方案：在 effect 起始记录 length 上一帧的值（如 `prevLengthRef`），当 prevLength===0 && currentLength>0 且 focusedIndex 不变时，强制调 `.focus({preventScroll:true})` 并同步更新 lastFocusedRef
- **R4.4** 或更简单：用 `lastFocusedRef.current !== focusedIndex || (prevLengthRef.current === 0 && filteredEntries.length > 0)` 作为 focus 触发条件
- **R4.5** 必须保留现有「输入框打字不抢焦点」的行为（focus-steal 修复不能倒退）

### R5. Home type 默认值与条件来自 TYPE_OPTIONS（M1 / code-review #5）

- **R5.1** 当前 `useState('all')`、`type !== 'all'`（2 处），共 3 处魔法字符串
- **R5.2** SearchBar 已导出 `TYPE_OPTIONS`，Home import 后用 `TYPE_OPTIONS[0].value` 替代 `'all'`
- **R5.3** `isFiltered` 中 `type !== 'all'` 改为 `type !== TYPE_OPTIONS[0].value`
- **R5.4** 不动 SearchBar.jsx 内的 `'all'`（它本就是 TYPE_OPTIONS 的字面定义源）

### R6. Home useEffect deps 收敛（M2 / code-review #6）

- **R6.1** 当前 `useEffect(..., [focusedIndex, filteredEntries])` 中 filteredEntries 每次 render 新数组
- **R6.2** 改为 `[focusedIndex, filteredEntries.length]`
- **R6.3** effect 内 `filteredEntries.length` 与 `filteredEntries` 行为一致（不读 entry 字段，只读 length）
- **R6.4** effect 内 `cardRefs.current[focusedIndex]` 仍走 filteredEntries 拿对象？还是改成走 entries 拿？必须确认：如拿 slug 用于 navigate 用 filteredEntries（已 focused 的对象）；这里 effect 主要是 focus()，要聚焦的卡片下标对应 filteredEntries（与 j/k 行为一致）
- **R6.5** 决定：focus 操作用 `cardRefs.current[focusedIndex]`，因为下标是 filteredEntries 的下标（Home line 152 `filteredEntries.map((entry, i) => ...)`）

### R7. EntryCard useMergedRefs 移除假稳定的 useCallback（M3 / code-review #7）

- **R7.1** 当前 `useCallback(fn, refs)` 中 `refs` 是 rest spread，每次新数组 → useCallback 总是返回新函数
- **R7.2** 选项 A：改用 `useMemo(() => (el) => {...}, [])` 配合外部 ref 显式 attach / detach（侵入性大）
- **R7.3** 选项 B：去掉 `useCallback`，注释改写为「每次渲染重新 attach ref callback；Home 传的 callback ref 反正每次都是新函数，行为一致」
- **R7.4** 决定：选项 B（最小侵入，行为不变，注释诚实）

### R8. 玻璃态 utility 抽取到 .glass-pill（M4 / code-review #8）

- **R8.1** 当前三处（EntryDetail.jsx:110-112、PrevNextNav.jsx:58-60、NotFound.jsx:59-61）完全相同：
  - `[@media(hover:hover)]:hover:bg-brand-surface-2/70`
  - `[@media(hover:hover)]:hover:border-brand-glow/70`
  - `[@media(hover:hover)]:hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]`
- **R8.2** 此外三处共享的 `bg-brand-surface/60 text-brand-light border border-brand-primary/40 backdrop-blur-md shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)] transition-all duration-200` 也是相同的
- **R8.3** 方案：在 `src/index.css` 用 `@layer components` 定义 `.glass-pill` 类，包含 hover utility 与基础 utility
- **R8.4** Tailwind 3.1+ 的 `@apply` 在 `@media (hover: hover)` 嵌套规则内的支持需确认；如不稳定则把 hover 部分用原生 CSS 写死
- **R8.5** 三处组件 className 简写为只含 `glass-pill`（PrevNextNav 因为是 Link，与返回按钮是 button 也共用一套）—— 视觉回归需人工目视
- **R8.6** PrevNextNav 还有「hover:text-brand-glow」（颜色变）项，需纳入 .glass-pill hover 集合

## Acceptance Criteria

- [ ] AC-1 EntryDetail.jsx 内的 og:url 测试断言包含 `#/p/sample-entry` 完整 hash 路径
- [ ] AC-2 EntryDetail 测试新增：mock slug → 切换不同 slug → iframe 被 unmount/remount（验证 key 行为：可用 `lastFocusedRef`-like 思路，或断言两不同 slug 渲染时 iframe DOM node 不是同一个）
- [ ] AC-3 SearchBar 测试新增：fireEvent.click(X 按钮) 后 `document.activeElement === input`
- [ ] AC-4 Home 测试新增：fireEvent.change 过滤到 0 → 清字符 → focused card 自动获得焦点（`document.activeElement === cardRefs.current[focusedIndex]`）
- [ ] AC-5 Home.jsx 内 `'all'` 字面量 0 命中（grep 验证）；`useState(TYPE_OPTIONS[0].value)` 与 `type !== TYPE_OPTIONS[0].value`
- [ ] AC-6 Home.jsx useEffect deps 为 `[focusedIndex, filteredEntries.length]`
- [ ] AC-7 EntryCard.jsx useMergedRefs 不使用 useCallback；注释诚实说明每次渲染重新 attach ref callback
- [ ] AC-8 `src/index.css` 新增 `.glass-pill` 类；EntryDetail / PrevNextNav / NotFound 三处 className 引用 `glass-pill`，三处 hover utility 字符串 0 重复
- [ ] AC-9 `npm run test` 通过；失败数 ≤ 基线（已知 `tests/html.test.jsx > renders an iframe for a full HTML document` 1 个基线失败）
- [ ] AC-10 `npm run build` 成功
- [ ] AC-11 视觉回归：浏览器打开 `/p/sample-entry` 与 `/404-not-found` 路径，玻璃态浮条视觉与改前一致（hover 边框变 glow、紫光增强）

## Open Questions

- AC-8 中 `.glass-pill` 的 hover 部分用 `@apply` 还是原生 CSS 待 phase 2 design 阶段确定（Tailwind 3.4 实测 `@apply [@media(...)]` 不稳定）

## Notes

- 这是 PRD-only 之外的复杂任务，需 `design.md`（og:url 表达式细节、useMergedRefs 决策、glass-pill CSS 实现）与 `implement.md`（执行顺序、回滚点）
- 全部 8 项相互独立（除 F4 与 M2 都改 Home.jsx 的 focus effect，PR 内可同 commit）
- 不引入新依赖；不动测试 fixture；不动 package.json
- 修复后 codebase 风格与 `08-16-mobile-hover-guard` / `08-16-blog-ux-improvements` 等最近 task 保持一致