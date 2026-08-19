# UX 全面优化 — Execution Plan

## 总览

按 PRD 三波分三个 child task 独立交付。每波开始前创建子任务 → 激活 → 实施 → 验证 → 归档。

| 波次 | 子任务 slug | 估计 commit | 估计工作量 |
|---|---|---|---|
| P0 | `a11y-focus-and-perf` | 1 commit | 4-6 小时 |
| P1 | `experience-polish` | 2-3 commits（按 AC 粒度拆） | 8-12 小时 |
| P2 | `nice-to-haves` | 2-3 commits | 4-6 小时 |

## Phase 1: Plan（本任务）

- [x] 父任务 prd.md
- [x] 父任务 design.md
- [x] 父任务 implement.md（本文件）
- [ ] 创建 P0 child task `a11y-focus-and-perf`
- [ ] 创建 P1 child task `experience-polish`
- [ ] 创建 P2 child task `nice-to-haves`
- [ ] `task.py start` 父任务

## Phase 2: Execute（每波独立）

### Child Task 1: P0 — a11y + 性能（`a11y-focus-and-perf`）

**目标**：完成 PRD AC-1 ~ AC-7

**文件改动**：
1. `src/components/BackButton.jsx`（新）
   - 抽出「← 返回」玻璃态胶囊为可复用组件
   - 接受 `to` / `ariaLabel` / `className` / `children` / `ref`
   - 用 react-router `<Link>`
2. `src/hooks/useFocusBackOnMount.js`（新）
   - deps [slug]：rAF 后调用 ref.focus({ preventScroll: true })
   - 跟踪「主动 focus 过」flag，避免抢回焦点
3. `src/pages/EntryDetail.jsx`（改）
   - 替换 inline button 为 `<BackButton ref>`
   - 加 useFocusBackOnMount
   - 加 skip-link `<a href="#back-button">` sr-only focus:not-sr-only
4. `src/pages/NotFound.jsx`（改）
   - 替换 inline Link 为 `<BackButton>`
5. `src/pages/Home.jsx`（改）
   - `useDeferredValue(query)` + `useMemo` filteredEntries
   - `isPending = query !== deferredQuery`
   - `showSpinner = entryCount > 20 && isPending && query.length > 0`
6. `src/components/SearchBar.jsx`（改）
   - 接受 `isPending` prop
   - 输入框右侧条件渲染 `<Loader2 size={12} className="animate-spin text-brand-mid" />`
7. `src/index.css`（改）
   - `.sr-only focus:not-sr-only` 工具类（如 Tailwind 已含则跳过）
   - 加 `.kbd-hint-bar` 微样式（可选）

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] `npm run dev` + 5 场景手测
  - 1) 首页按 j/k 移动焦点 + Enter 进入
  - 2) 首页按 / 聚焦搜索框 + 输入
  - 3) 进入详情页 → BackButton 有 focus-visible ring
  - 4) 详情页 Tab 几次 → 不陷入 iframe（按 Esc 跳出验证）
  - 5) 首页未滚动时无 ScrollToTop 按钮（本波未做，确认无副作用）

**commit 命名**：`fix(detail): iframe focus escape + skip-link, perf(search): useDeferredValue`

### Child Task 2: P1 — 体验加分（`experience-polish`）

**目标**：完成 PRD AC-8 ~ AC-14

**文件改动**：
1. `src/hooks/useScrollToTopVisible.js`（新）+ `src/components/ScrollToTop.jsx`（新）
   - rAF 节流 scroll listener
   - 阈值：window.innerHeight
   - 固定右下，与 PrevNextNav 不重叠
2. `src/components/KeyboardHint.jsx`（新）+ `src/hooks/useKbdHintDismissed.js`（新）
   - 首次浮层：6 秒自动消失 + × 按钮持久关闭
   - `?` cheat sheet 模态
   - localStorage key `coolpanda_kbd_hint_dismissed`
3. `src/hooks/useReveal.js`（改）+ `src/components/EntryCard.jsx`（改）
   - useReveal 接受 columnIndex
   - Home 计算 columnCount（响应式）→ 传给 EntryCard
   - style transitionDelay = columnIndex * 30ms（首屏 N 张 = 0）
4. `src/pages/EntryDetail.jsx`（改）
   - 替换 `<Navigate>` 为内嵌 NotFound 卡片
   - 显示「文章不存在」+ slug + 返回按钮
5. `src/lib/iframe-link-bridge.js`（新）+ `src/lib/html.jsx`（改）
   - BRIDGE_SCRIPT 字符串
   - html.jsx 注入位置：head 末尾或片段 root 前
   - capture phase 监听 a click

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] 场景手测
  - 1) 首页滚到 1 屏外 → ScrollToTop 出现；点击 smooth 回顶
  - 2) 首页首次看到键盘提示浮层；6 秒消失；× 关闭后刷新不再显示
  - 3) 首页按 `?` → cheat sheet 出现；按 `?` 或 Esc 关闭
  - 4) 瀑布流首屏卡片几乎同时入场（首屏 N 张）；滚动后入场有 column 偏移
  - 5) 详情页输入不存在 slug → 显示内嵌 404 卡片，不跳首页
  - 6) iframe 内 `<a href="#/p/xxx">` → 父页面切换（构造测试 HTML 验证）

**commit 命名**：
- `feat(home): scroll-to-top + keyboard hint + stagger entrance`
- `fix(detail): inline not-found for missing slug`
- `feat(iframe): bridge same-site links to parent router`

### Child Task 3: P2 — 锦上添花（`nice-to-haves`）

**目标**：完成 PRD AC-15 ~ AC-17

**文件改动**：
1. `src/components/EntryCard.jsx`（改）+ `src/pages/Home.jsx`（改）
   - EntryCard 接收 onTagClick prop
   - tag chip onClick + stopPropagation
   - category chip 也走 onTagClick（category 中文名作为 query）
   - Home handleTagClick = useCallback((tag) => { setQuery(tag); searchInputRef.current?.focus() })
2. `src/lib/gradient-presets.js`（新）+ `src/components/EntryCard.jsx`（改）
   - FALLBACK_GRADIENTS 4 套
   - gradientForSlug(slug) → preset 索引
   - 替换现有 `bg-gradient-to-br from-brand-accent/25 ...`
3. `src/lib/entries.js`（改）+ `src/components/EntryCard.jsx`（改）
   - normalize 增加 `readingTime: e.readingTime ?? null`
   - EntryCard date 旁条件渲染 `{entry.readingTime} 分钟阅读`

**验证**：
- [ ] `npm run test` 全绿
- [ ] `npm run build` 成功
- [ ] 场景手测
  - 1) 卡片 tag chip 点击 → 搜索框填充 tag 文本 + 自动 focus；不触发整卡 navigate
  - 2) 多张无 cover 卡片视觉渐变去重；同 slug 永远同色（构造测试数据）
  - 3) entry.readingTime 缺省 → 卡片不显示；填 5 → 显示「5 分钟阅读」（构造测试数据）

**commit 命名**：
- `feat(card): clickable tag chips trigger search`
- `feat(card): fallback gradient dedup by slug hash`
- `feat(entry): optional readingTime field`

## Phase 3: Finish

- [ ] 所有 child task 归档（`task.py archive`）
- [ ] 父任务 `task.py finish`
- [ ] `npm run test` + `npm run build` 最终全绿
- [ ] git log 整理（按 P0 / P1 / P2 三波 squash 或保留按 AC 粒度）
- [ ] `trellis-update-spec` 把本次学习沉淀到 `.trellis/spec/frontend/`

## Review Gates

每个 child task 完成前必须通过：

1. **Code review**：dispatch `trellis-check` 子代理审改动
2. **Lint**：无 ESLint 配置；纯靠人工 review
3. **Test**：vitest 全绿
4. **Build**：`npm run build` 产物大小 < AC-19 上限
5. **Manual smoke**：本地启动 + 5 场景手测

## Rollback Points

每波独立 commit，回滚粒度：

| 波次 | 回滚粒度 | 风险点 |
|---|---|---|
| P0 | 单 commit | BackButton 抽出涉及 EntryDetail + NotFound，回滚需同时还原 |
| P1 | 3 commits（按 AC 粒度） | bridge script 注入位置如被作者 inline `<head>` 覆盖会导致失效 |
| P2 | 3 commits | readingTime 字段扩展仅 normalize 一处，最易回滚 |

## 时间预估

| 阶段 | 估计 |
|---|---|
| 本规划（已完成） | 1 小时 |
| P0 实施 | 4-6 小时 |
| P1 实施 | 8-12 小时 |
| P2 实施 | 4-6 小时 |
| 总验收 + spec 更新 | 2 小时 |
| **合计** | **19-27 小时** |

## 决策点（执行时遇到时记录）

- 桥接脚本位置：插入 `<head>` 末尾 vs 文档开头 vs 在 `<base>` 之后 → 实施时验证最佳位置
- skip-link 隐藏 vs 始终可见 → 按 a11y 实践隐藏
- ScrollToTop 在移动端是否显示 → 实施时观察（移动端屏幕小，可能不需要）
- KbdHint 浮层文案最终版 → 实施时确认