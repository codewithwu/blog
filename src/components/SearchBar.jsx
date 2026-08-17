// SearchBar：瀑布流首页顶部「搜索 + type 切换」sticky 浮条。
//
// 设计目标（见 .trellis/tasks/08-16-waterfall-search-filter/prd.md）：
//   - 客户端 substring 过滤（title + excerpt + tags），零依赖、零 fuzzy 复杂度
//   - type segmented control：「全部 / 文章 / 项目」三段切换
//   - 视觉与现有玻璃态语言一致：与 PrevNextNav / EntryDetail 返回按钮同款
//     bg-brand-surface/60 + backdrop-blur-md + brand-border/60 边框
//
// 交互细节：
//   - 受控组件：query / type 由 Home 的 useState 管理，组件只读 + 触发 set
//     原因：P2-1 键盘快捷键子任务需要 useImperativeHandle.focus() 聚焦搜索框
//     如果 state 在组件内，外部无法触发聚焦/清空（除非把 ref 转 imperative）
//   - inputRef 由 Home 持有并向下传；P2-1 只需 `searchInputRef.current.focus()`
//   - Esc 清空 query：仅当 input 自身聚焦时（避免误清空用户在其他地方的输入）
//   - X 清除按钮：query.length > 0 时出现；点击 setQuery('') + 让 input 保留焦点
//
// 响应式（CLAUDE.md 规则 1 → 移动端不爆框）：
//   - 桌面（≥ sm）：input 左侧 + segmented control 右侧（flex flex-row）
//   - 移动（< sm）：input 上 + segmented control 下（flex-col），按钮变小
//   - input 与 segmented control 各占主轴宽度，移动端也避免挤压
//
// 与分类筛选正交（CLAUDE.md 规则 4）：
//   - SearchBar 不读 / 不引用 `src/data/categories.js`
//   - type 只关心 entry.type ∈ { 'article', 'project' }，不参与 article category 字段
//
// 可访问性：
//   - input: type="search" + aria-label="搜索内容"
//   - X 按钮: aria-label="清除搜索"
//   - segmented control: 每个 button aria-pressed 表达当前激活项
import { Search, X } from 'lucide-react';

// type 可选值（语义清晰导出，Home 也可复用避免魔法字符串）
export const TYPE_OPTIONS = [
  { value: 'all',      label: '全部' },
  { value: 'article',  label: '文章' },
  { value: 'project',  label: '项目' },
];

export default function SearchBar({ query, setQuery, type, setType, inputRef }) {
  return (
    // sticky 容器：top-0 + z-30
    //   - sticky 让用户在瀑布流滚动时仍能操作搜索框（不必滚回顶部）
    //   - z-30 高于 EntryCard 的 hover shadow / focus ring（无明确 z-index 但 hover shadow
    //     会盖住卡片，sticky 浮条必须能盖在卡片之上）
    // 玻璃态：同款 PrevNextNav 的 bg-brand-surface/60 + backdrop-blur-md + brand-border/60
    // 圆角：rounded-lg（与卡片 rounded-xl 区分，浮条更"轻"）
    <div
      className="sticky top-0 z-30
                 bg-brand-surface/60 backdrop-blur-md
                 border border-brand-border/60 rounded-lg
                 px-3 py-2.5 mb-6
                 flex flex-col sm:flex-row sm:items-center gap-2"
      role="search"
    >
      {/* 搜索框：左侧 input 容器（占据剩余空间） */}
      <div className="relative flex-1 min-w-0">
        {/* 左侧放大镜 icon：absolute 定位，垂直居中 */}
        <Search
          size={16}
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-mid pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Esc 在 input 聚焦时清空 query；onKeyDown 只在 input 自身触发，
          // 避免用户在其他元素（如 segmented control 按钮）按 Esc 时误清空
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setQuery('');
            }
          }}
          placeholder="搜索标题 / 摘要 / 标签"
          aria-label="搜索内容"
          className="w-full pl-9 pr-9 py-1.5
                     bg-brand-surface/40 text-brand-light placeholder:text-brand-dim
                     border border-brand-border/60 rounded-md
                     text-sm font-mono
                     focus:outline-none focus:border-brand-primary
                     focus:ring-2 focus:ring-brand-glow/40
                     transition-colors"
        />
        {/* X 清除按钮：query 非空时渲染（点击不抢 input 焦点，type=button 防止表单提交） */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="清除搜索"
            className="absolute right-2 top-1/2 -translate-y-1/2
                       inline-flex items-center justify-center
                       w-6 h-6 rounded
                       text-brand-mid [@media(hover:hover)]:hover:text-brand-light [@media(hover:hover)]:hover:bg-brand-surface-2/60
                       transition-colors"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      {/* type segmented control：桌面右侧，移动端下方堆叠 */}
      <div
        role="group"
        aria-label="按类型筛选"
        // 桌面：自然宽度（不被 input 挤扁）；移动：拉伸至容器宽度
        className="flex shrink-0 sm:w-auto w-full
                   bg-brand-surface/40 border border-brand-border/60 rounded-md
                   p-0.5 gap-0.5"
      >
        {TYPE_OPTIONS.map((opt) => {
          const active = type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              // aria-pressed 表达 segmented control 当前激活项（与 toggle button 语义一致）
              aria-pressed={active}
              onClick={() => setType(opt.value)}
              // 桌面：text-sm；移动（< sm）：text-xs + flex-1 横向均分
              className={`flex-1 sm:flex-none px-3 py-1 rounded
                          text-xs sm:text-sm font-mono
                          transition-colors
                          ${active
                            ? 'bg-brand-primary/20 text-brand-glow'
                            : 'text-brand-mid [@media(hover:hover)]:hover:text-brand-light'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}