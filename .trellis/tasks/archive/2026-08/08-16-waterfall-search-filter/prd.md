# 瀑布流搜索 + type 切换

## Goal

Home 顶部加客户端搜索框 + 「全部 / 文章 / 项目」type segmented control。substring 匹配 `title + excerpt + tags`，客户端过滤，零依赖。规模 ≥ 10 篇后用户能快速定位内容。**Q1 已确认**：本项不破坏 CLAUDE.md 规则 4（与"分类筛选 chip"正交）。

## Background

- `src/pages/Home.jsx:14-28` 当前固定 `listEntries()` 全渲染；CSS columns 1/2/3/4 列瀑布流
- `src/components/Hero.jsx` 占位大块顶部区域，搜索框放 Hero **下方**自然衔接
- 已有 6 个 article category 字段（CLAUDE.md 规则 5）但**不参与过滤**（CLAUDE.md 规则 4 禁止）
- `src/components/EntryCard.jsx` 是纯展示组件，搜索过滤在 `Home.jsx` 层做

## Requirements

### 搜索框

- 新组件 `src/components/SearchBar.jsx`
- 位置：`Hero` 与瀑布流之间，独立 sticky 区（`sticky top-0 z-30` + 玻璃态背景）
- UI：
  - 输入框 `input type="search"`，左放大镜 icon（lucide-react `Search`），右清除按钮（lucide-react `X`，仅当输入非空显示）
  - placeholder = "搜索标题 / 摘要 / 标签"
  - 圆角 `rounded-lg`，玻璃态 `bg-brand-surface/60 backdrop-blur-md border border-brand-border/60`
  - focus 时边框转 `brand-primary` + `ring-2 ring-brand-glow/40`
- 状态：Home 用 `useState('')` 管理 query；controlled component

### Type 切换

- 同一组件内右侧（或下方，响应式）：segmented control
- 三段：「全部」「文章」「项目」
- 当前态：背景 `bg-brand-primary/20` + 文字 `text-brand-glow`；非当前态：`text-brand-mid hover:text-brand-light`
- 状态：`useState('all')`，值 `'all' | 'article' | 'project'`
- 移动端（`< 640px`）：切换按钮变小（`text-xs`）或横排压缩

### 过滤逻辑

- 在 `Home.jsx` 内派生 `filteredEntries = entries.filter(e => matchType(e.type, typeFilter) && matchQuery(e, query))`
- `matchType(type, filter)`：`'all'` 永真；其他严格相等
- `matchQuery(entry, query)`：
  - query 空 → true
  - query 非空 → 把 `entry.title + ' ' + entry.excerpt + ' ' + entry.tags.join(' ')` 转小写后 substring 包含 `query.toLowerCase()`
- 空结果态：当 `filteredEntries.length === 0` 时显示居中提示「没有匹配的内容」+ dim 色 + Search 灰图标

### 性能

- `entries` 来自 `listEntries()`，n ≤ 50 时无 memo 必要；> 50 篇再考虑 `useMemo`
- query 改变时直接 re-render（无 debounce，n 小时不需要）

### 键盘交互（与 P2-1 协同）

- `/` 键聚焦搜索框：在 P2-1 child 实现；本期 SearchBar 暴露 `inputRef` 即可
- `Esc` 在搜索框聚焦时清空 query

## Acceptance Criteria

- [ ] 搜索框在 Hero 下方渲染，玻璃态风格统一
- [ ] 输入"亲密"过滤出含"亲密关系曲线"的卡片；输入不存在的字串显示空结果态
- [ ] type 切到"项目"，只剩 Claude Task Monitor 卡片；切回"全部"恢复
- [ ] query + type 同时生效（AND 关系）
- [ ] 清除按钮（X）在 query 非空时出现，点击清空
- [ ] `Esc` 在搜索框聚焦时清空 query
- [ ] 移动端浮条不爆框（输入框 width 自适应）
- [ ] 搜索结果 0 条时显示空状态（不是空白瀑布流）
- [ ] search/type state 在路由切换（点到详情页再返回）后**重置**（不持久化）
- [ ] 不读 6 个 article category 字段（验证：grep 源码不引用 `categories` 做过滤）
- [ ] 不引入新 npm 依赖
- [ ] `npm run test` 通过；现有 `tests/home.test.jsx` 中"2 篇内容"断言仍通过（搜索框不影响 Hero 计数）
- [ ] `npm run build` 通过

## Out of Scope

- 全文 fuzzy 搜索（fuse.js）：n < 50 不需要；> 50 再考虑
- 搜索历史 / localStorage 持久化：本期 state 不持久化
- 分类筛选（CLAUDE.md 规则 4 禁止）
- 按 date / tag 排序切换

## Technical Notes

- 不引入新 npm 依赖
- 不读 `src/data/categories.js`（确认与分类筛选正交）
- SearchBar 是受控组件，state 在 Home 而非组件内（便于 P2-1 键盘快捷键操作）
- 不修改 CLAUDE.md / design.md