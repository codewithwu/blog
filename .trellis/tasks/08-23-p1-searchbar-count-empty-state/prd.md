# P1-5: SearchBar 加 X/Y 计数 + 空态建议

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

修复 ui-ux-pro-max 诊断 A3+A4：当前 useDeferredValue 仅在 entryCount>20 显示 spinner，20 条以内既无 X/Y 计数；空态文案仅一句话缺可操作建议。输入框容器外加实时 X/Y 计数 + 空态加「清除筛选」+ 「试试搜这些」chip。

## Requirements

### 1. SearchBar 加 X/Y 计数

- `src/components/SearchBar.jsx`：
  - 接受新 props：`totalCount`（总数）、`filteredCount`（过滤后）
  - 容器底部右侧加：
    ```jsx
    <div className="text-xs text-brand-mid font-mono mt-1" aria-live="polite">
      {filteredCount} / {totalCount}
    </div>
    ```
  - 注意：放在容器外底部，与 input 不冲突

### 2. Home 传 props

- `src/pages/Home.jsx:246-253` 的 `<SearchBar />` 改为：
  ```jsx
  <SearchBar
    query={query}
    setQuery={setQuery}
    type={type}
    setType={setType}
    inputRef={searchInputRef}
    isPending={showSearchSpinner}
    totalCount={entryCount()}
    filteredCount={filteredEntries.length}
  />
  ```

### 3. 空态加「清除筛选」+ 「试试搜这些」

- `src/pages/Home.jsx:254-261` 的空态分支：
  ```jsx
  {isEmpty ? (
    <div className="text-center py-16 text-brand-dim">
      <Search size={32} className="mx-auto mb-3 opacity-50" aria-hidden />
      <p className="mb-4">没有匹配的内容</p>
      <button
        type="button"
        onClick={() => {
          setQuery('');
          setType(DEFAULT_TYPE);
        }}
        className="glass-pill inline-flex items-center px-4 py-1.5 rounded-md text-sm font-mono
                   [@media(hover:hover)]:hover:text-brand-glow transition-colors"
      >
        清除筛选
      </button>
      {/* 试试搜这些：取 tags Top5 高频 */}
      {suggestedTags.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-xs text-brand-mid">试试搜这些：</span>
          {suggestedTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setQuery(t)}
              className="px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary
                         [@media(hover:hover)]:hover:bg-brand-primary/25 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  ) : ( ... )}
  ```

### 4. 派生 suggestedTags

- `src/pages/Home.jsx` 加 useMemo：
  ```jsx
  const suggestedTags = useMemo(() => {
    const counts = new Map();
    entries.forEach((e) => (e.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  }, [entries]);
  ```
- 兜底：tags 全空时回退 categories 列表（cn 中文名）

### 5. 测试更新

- `tests/home.test.jsx`：
  - 新断言：SearchBar 渲染 "X / Y"（SearchBar 容器内含 `aria-live="polite"` 的 span）
  - 新断言：空态包含「清除筛选」按钮
  - 新断言：tags 非空时空态包含至少 1 个 chip

## Acceptance Criteria

- [ ] **AC-1**：SearchBar 输入时容器底部右侧实时显示 "X / Y" 计数，aria-live="polite"
- [ ] **AC-2**：空态包含「清除筛选」按钮（点击 reset query + type）
- [ ] **AC-3**：空态包含至少 1 个 "试试搜这些" chip（点击触发 setQuery）
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功；gzip JS 体积增长 < 1 KB

## 验证场景

- `npm run dev` + 首页：
  - 输入"AI" → 容器底部显示 "3 / 5"（示例）
  - 输入不存在关键词 → 空态显示「清除筛选」按钮 + 至少 1 个 chip
  - 点击「清除筛选」→ query 与 type reset，瀑布流恢复
  - 点击 chip → setQuery 后 input 持焦

## 改动文件清单

修改：
- `src/components/SearchBar.jsx`
- `src/pages/Home.jsx`
- `tests/home.test.jsx`

新增：无

## Out of Scope

- ✗ SearchBar 整体重构（保留现有 sticky + segmented control 结构）
- ✗ 搜索结果高亮命中关键词 —— 视觉增强，独立任务
- ✗ 搜索历史持久化 —— UX 增强，独立任务

## Notes

- X/Y 计数位置在容器**外底部**而非输入框内，避免与 X 清除按钮 + spinner 三者冲突
- suggestedTags 取 tags Top5（不是 Top3），多 2 个给用户更多选择；chip 自动 wrap（`flex-wrap`）
- 「清除筛选」按钮复用 glass-pill，与品牌一致