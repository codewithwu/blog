# P2: 锦上添花（标签点击 / 渐变去重 / 阅读时间 / fallback 国际化 / tags 3+N / 404 列最近 / 断点细化）

父任务：[08-18-ux-optimization-suite](../08-18-ux-optimization-suite/prd.md)

## Goal

完成父 PRD 中 P2 范围的 7 项改造：EntryCard 标签 chip 可点击触发搜索、fallback 渐变按 slug hash 去重、Entry 扩展 `readingTime` 可选字段、中文标题 fallback 不显示首字符、tag chip 数量上限 + 「+N」合并、404 页列出最近 3 条 entry、瀑布流响应式断点细化。

## Requirements

### 1. EntryCard 标签 chip 可点击 → 触发搜索

- 改动：EntryCard tag chip 加 `onClick + stopPropagation`，回调 `onTagClick(tag)` + 自动聚焦搜索框
- Home 暴露 `onTagClick` prop 给 EntryCard，回调 `setQuery(tag) + searchInputRef.current?.focus()`
- category chip 同款行为（点击 = 触发该 category 中文名的搜索）；category 是 metadata 不做筛选
- stopPropagation 避免连带触发整卡 navigate

### 2. EntryCard fallback 渐变按 hash 决定方向

- 现状：所有卡片走 `from-brand-accent/25 via-brand-primary/20 to-brand-glow/25` 同款渐变
- 改造：`gradientForSlug(slug)` 按 slug 哈希选 4 种预设之一；相同 slug 永远同色
- 新文件：`src/lib/gradient-presets.js`，导出 `FALLBACK_GRADIENTS` + `gradientForSlug`
- 4 套预设（全部走现有 `brand-*` token）：
  - `from-brand-accent/25 via-brand-primary/20 to-brand-glow/25`（原版 紫→蓝→青）
  - `from-brand-primary/25 via-brand-glow/20 to-brand-accent/25`（蓝→青→紫）
  - `from-brand-glow/25 via-brand-accent/20 to-brand-primary/25`（青→紫→蓝）
  - `from-brand-accent/30 via-brand-glow/20 to-brand-primary/20`（紫→青→蓝 加深版）

### 3. Entry 扩展 `readingTime` 可选字段

- `src/lib/entries.js` 的 normalize 增加 `readingTime: e.readingTime ?? null`
- EntryCard date 旁条件渲染 `{entry.readingTime ? <span>· {entry.readingTime} 分钟阅读</span> : null}`
- 不强制作者填；向后兼容（现有 2 条数据无 readingTime，UI 不显示）

### 4. fallback 首字母国际化

- 现状：`entry.title.slice(0, 2).toUpperCase()` 对中文标题无意义（「亲密关系曲线」→ 「亲密」看起来像文案）
- 改造：
  - ASCII 字母首字符 → 取首字母大写（与英文标题一致 monogram 效果）
  - 中文 / 其它 CJK / 数字 / 符号首字符 → 不显示字符，仅保留渐变 + 类型标签
- 实现：检测首字符 Unicode 范围：
  - `A-Z` / `a-z`（A-Z / a-z）→ ASCII 字母，显示
  - 其它 → 不显示

### 5. tag chip 数量上限 + 「+N」合并

- 现状：tag chip 不限数量；5+ tag 的卡片拉高高度破坏瀑布流对齐
- 改造：显示前 3 个 tag + 「+N」徽章
- 实现：EntryCard 内部 `entry.tags.slice(0, 3)` 渲染；超过则追加 `<li>+N</li>`

### 6. 404 页列出最近 3 条 entry

- 现状：404 页只显示「返回首页」按钮，用户无内容线索
- 改造：在 NotFound 加一段「最近发布」列表（前 3 条 entry 的 title + 链接）
- 用 BackButton 同样的玻璃态风格；列表项用 react-router Link
- 帮助输错 slug / 外链失效的用户找回内容

### 7. 瀑布流响应式断点细化

- 现状：`columns-1 sm:columns-2 lg:columns-3 2xl:columns-4`
- 改造：`columns-1 md:columns-2 lg:columns-3 2xl:columns-4`
- 640-1024 中间断点 md:columns-2（中等屏双列），1024+ 三列
- useResponsiveColumnCount 同步调整：sm → md

## Acceptance Criteria

按父 PRD P2 AC：

- [ ] AC-20：EntryCard tag chip 点击后，Home setQuery(tag) + 搜索框自动 focus；不连带触发整卡 navigate
- [ ] AC-21：EntryCard fallback 渐变按 entry.slug hash 选 4 种预设之一；相同 slug 永远同色
- [ ] AC-22：entry.metadata 新增可选 `readingTime` 字段；UI 仅在字段存在时显示「X 分钟阅读」
- [ ] AC-23：中文标题 fallback 不显示首字符（仅渐变 + 类型标签）；英文标题 fallback 显示首字母大写
- [ ] AC-24：tag chip 显示前 3 个 + 「+N」合并；>3 tag 时显示「+N」徽章
- [ ] AC-25：404 页面列出最近 3 条 entry（title + 链接），帮助用户找回内容
- [ ] AC-26：瀑布流响应式断点改为 `columns-1 md:columns-2 lg:columns-3 2xl:columns-4`
- [ ] AC-27：所有改动完成后 `npm run test` 通过（无回归）
- [ ] AC-28：所有改动完成后 `npm run build` 成功；产物 `dist/index.html` 大小增长 < 8 KB
- [ ] AC-29：所有改动完成后 `npm run dev` 启动正常；本地 8 个核心场景手测通过（首页 / 搜索 / 键盘 j/k / 详情页 / 404 / 滚顶 / 快捷键提示 / 同站链接）

## Out of Scope（本任务不做）

- ✗ 暗 / 亮主题切换 / 详情页阅读进度条（评估项，本任务不做）

## Notes

- fallback 首字母国际化要小心：`title.slice(0, 1)` + 检测首字符 Unicode 范围；
  CJK 范围 [一-鿿] 是中文，但还有日文 [぀-ゟ] / 韩文 [가-힯] 等；
  本期只处理"中文标题不显示首字符"，其它语言可按 ASCII 检测分支处理
- readingTime 字段扩展只动 entries.js normalize 一处，向后兼容
- 404 列最近 3 条要用 react-router Link（同款 EntryCard 链接）
- tag chip 点击 stopPropagation：测试要验证「点击 tag 不触发整卡 navigate」