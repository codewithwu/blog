# 详情页上一篇 / 下一篇导航

## Goal

EntryDetail 底部加 "上一篇 / 下一篇" 浮条，与现有"← 返回"同款玻璃态胶囊；展示前一篇 + 后一篇的标题，跳转链接；首篇 / 末篇时对应方向禁用并置灰。让用户从瀑布流看完一篇后，无需返回首页即可翻下一篇。

## Background

- `src/pages/EntryDetail.jsx:36-56` 当前只有左上角一个固定悬浮"← 返回"按钮（glass pill，bg-brand-surface/60 + backdrop-blur-md + brand-primary 边框 + 微光）
- `src/lib/entries.js:38-40` `listEntries()` 已按 date 降序合并 articles + projects
- `src/lib/entries.js:44-46` `findEntryBySlug(slug)` 已有线性查找
- 同款胶囊样式在 `src/pages/NotFound.jsx:42-54` 也用了"返回首页"按钮

## Requirements

### 数据层

- 在 `src/lib/entries.js` 新增 `findNeighbors(slug)`：返回 `{ prev: Entry | null, current: Entry, next: Entry | null }`
- 实现：先 `listEntries()` 拿降序数组，再 `findIndex` 当前 slug，前后各取一条；边界返回 `null`
- `findNeighbors` 在 `allEntries` 数组中工作（articles + projects 一起排），与现有 `findEntryBySlug` 语义一致

### UI 层

- 在 `src/pages/EntryDetail.jsx` 当前 `<Html />` 之后（或之前）渲染 `<PrevNextNav prev={prev} next={next} />`
- 新组件 `src/components/PrevNextNav.jsx`：固定定位 `bottom-6 left-1/2 -translate-x-1/2`（居中浮条），z-index 与返回按钮同档
- 容器：`flex gap-2` + 玻璃态胶囊（同款返回按钮）：
  - `bg-brand-surface/60 backdrop-blur-md border border-brand-primary/40 rounded-md`
  - 内含左 / 右两个按钮，分别指向 prev / next
- 按钮布局（每个按钮）：
  - 左按钮：`<` 图标 + 标题（`text-brand-light`）；`hover:text-brand-glow hover:border-brand-glow/70`
  - 右按钮：标题 + `>` 图标；样式对称
  - 标题最多 1 行截断（`truncate`，max-width 限制防爆框）
- 边界处理：
  - `prev === null`（首篇）：左按钮 `disabled` + `opacity-40 cursor-not-allowed`
  - `next === null`（末篇）：右按钮同理
- 响应式：手机端 `< 640px` 改为垂直堆叠（`flex-col`）或缩窄 max-width

### 交互细节

- 整条浮条不挡返回按钮（返回按钮在 `top-4 left-4`，浮条在 `bottom-6`，互不冲突）
- 浮条在 iframe 100vh 之**外**渲染（不进入 iframe），是父页 DOM
- iframe 内滚动与浮条互不影响（浮条 `fixed` 始终在视口底部）

## Acceptance Criteria

- [ ] `findNeighbors('intimate-relationship-curve')` 返回 `{ prev: <introduce>, current: <art>, next: null }`
- [ ] `findNeighbors('introduce')` 返回 `{ prev: null, current: <proj>, next: <art> }`（projects 沉底）
- [ ] 详情页加载后，底部浮条可见，包含左 / 右两个胶囊
- [ ] 点"下一篇"按钮，跳到相邻 entry，新详情页的浮条更新（不闪屏、不滚动到顶）
- [ ] 当前是首篇时，左按钮置灰且 `disabled`；点无反应
- [ ] 当前是末篇时，右按钮同理
- [ ] 浮条与左上角"← 返回"按钮在视觉上不重叠
- [ ] 移动端（`< 640px`）浮条不爆框（`truncate` 生效）
- [ ] 标题 hover 时 `text-brand-glow` + 紫光（与现有 glass pill 风格一致）
- [ ] `npm run test` 通过；`tests/home.test.jsx` 不被破坏
- [ ] `npm run build` 通过；bundle 不显著增大

## Out of Scope

- 键盘快捷键（`←` 返回）：属于 P2-1 child，本任务不实现
- 详情页"读完回到顶部"按钮：不在本次范围
- 浮条显隐动画（首屏 vs 滚到底）：本期固定显示

## Technical Notes

- 不引入新 npm 依赖
- 浮条 z-index 与返回按钮同档（`z-50`），但 DOM 顺序保证不互相遮挡
- `findNeighbors` 是 O(n)，与现有 `findEntryBySlug` 同阶；memoize 暂不需要（n < 100 时无感）
- 不修改 CLAUDE.md / design.md