// Home：瀑布流首页。
//
// 结构（见 design.md §6/§7）：
//   - 顶部 <Hero />（品牌区，不 sticky）
//   - <SearchBar />（sticky 浮条：客户端搜索 + type 切换）
//   - CSS columns 多列瀑布流
//
// CSS columns 而非第三方 masonry 库（trade-off 见 design.md §12）：
//   - columns-1 / sm:columns-2 / lg:columns-3 / 2xl:columns-4 响应式列数
//   - CSS columns 不支持 flex/grid gap，故列间距用 gap-*，卡片纵向间距用每张卡的 mb-6
//   - break-inside-avoid 防止单张卡被列断开
//
// 搜索 + type 切换：
//   - query / type state 由本组件 useState 持有（不持久化：刷新后重置为 'all' + ''）
//   - 派生 filteredEntries 在 render 前计算；n ≤ 50 时无 memo 必要
//   - 过滤匹配：title + excerpt + tags 拼成 lowercase haystack，substring 包含 query
//   - type 匹配：'all' 永真，否则严格相等 e.type
//   - 与分类筛选正交（CLAUDE.md 规则 4）：不读 categories 字段
//   - searchInputRef 暴露给 P2-1 键盘快捷键任务，外部可触发聚焦
//
// 键盘快捷键（P2-1）：
//   - j / k：卡片焦点环形移动（向下/向上）
//   - Enter：进入当前 focusedIndex 卡片详情页
//   - /：聚焦搜索框
//   - 修饰键 (Cmd/Ctrl/Alt) 与输入框聚焦守卫由 useKeyboardShortcuts 内部处理
//   - focusedIndex state 由本组件持有；focused 卡片视觉由 EntryCard 的 isFocused prop 控制
//
// 空状态：
//   - filteredEntries.length === 0 且（query 非空 或 type !== 'all'）时显示居中提示
//   - 注意：纯"全部 + 无 query"时不显示空态（防御性，正常不会发生）
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import SearchBar from '../components/SearchBar.jsx';
import EntryCard from '../components/EntryCard.jsx';
import { listEntries } from '../lib/entries.js';
import usePageTitle from '../hooks/usePageTitle.js';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts.js';

export default function Home() {
  usePageTitle(''); // 首页只用站名，不加前缀
  const navigate = useNavigate();

  // 搜索 / 过滤 state（不持久化：路由切换回 / 时自然重置）
  //   - query: 原始输入字符串（搜索框受控）
  //   - type:   'all' | 'article' | 'project'
  //   - searchInputRef: 绑定到搜索框 input，给 / 快捷键聚焦用
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const searchInputRef = useRef(null);

  // 键盘快捷键聚焦态
  //   - focusedIndex: 当前焦点卡在 filteredEntries 中的下标；j/k 环形变化
  //   - cardRefs: 数组式 ref 容器，保存每张卡 root div 的 DOM 引用
  //     * React ref callback 模式：<EntryCard ref={el => cardRefs.current[i] = el} />
  //     * focusedIndex 变化时调用 cardRefs.current[i]?.focus({ preventScroll: true })
  //       把浏览器默认的"聚焦即滚动"关掉，避免瀑布流错位
  //   - lastFocusedRef: 跟踪上一次"实际应用过 DOM focus"的 focusedIndex
  //     * 防止输入框输入时（filteredEntries 数组引用每次 render 都重建）误触发 .focus()
  //       抢走用户当前正在用的焦点（典型场景：用户在搜索框打字，焦点被劫到卡片）
  //     * 只在 focusedIndex 真正变化时才同步 DOM 焦点
  //   - 注意：聚焦对象永远是 filteredEntries（不是 entries），保证 j/k 与用户可见的卡片一致
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef([]);
  const lastFocusedRef = useRef(0);

  // 派生 filteredEntries
  //   - entries 是 listEntries() 的副本（每次 render 都新建数组，规模 < 50 无 memo 必要）
  //   - q 预先 trim + lowercase，避免每次 substring 重复计算
  //   - matchType: 'all' 永真；其他严格相等
  //   - matchQuery: query 空 → 全过；非空 → haystack.includes(q)
  //     haystack 拼 title + excerpt(兜底 '') + tags.join(' ')，统一 lowercase
  //     tags 兜底 [] 防御 entries.js 未注册 tags（正常生产数据不应出现）
  const entries = listEntries();
  const q = query.trim().toLowerCase();
  const filteredEntries = entries.filter((e) => {
    if (type !== 'all' && e.type !== type) return false;
    if (!q) return true;
    const haystack = `${e.title} ${e.excerpt ?? ''} ${(e.tags ?? []).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });

  // 焦点越界保护：搜索后 filteredEntries 可能缩短，旧的 focusedIndex 需 clamp
  //   - 每次 filteredEntries / focusedIndex 变化时执行
  //   - 若 focusedIndex 越界，回落到 0，避免数组越界与导航指向已隐藏卡片
  //   - DOM 焦点同步：只在 focusedIndex 实际变化（与 lastFocusedRef 比对）时调用 .focus()
  //     filteredEntries 数组引用每次 render 都重建，不能仅凭 deps 变化就触发 focus
  //     —— 否则用户在搜索框输入时会丢焦点（focus-steal bug 的修复关键）
  //   - focus({ preventScroll: true }) 关闭浏览器默认的"聚焦即滚动"行为
  useEffect(() => {
    if (filteredEntries.length === 0) return;
    const clamped = Math.min(focusedIndex, filteredEntries.length - 1);
    if (clamped !== focusedIndex) {
      setFocusedIndex(clamped);
      return; // 下一次 render 再执行 focus()，避免 stale ref
    }
    // 关键守卫：focusedIndex 没变就不抢焦点
    // （filteredEntries 数组每次 render 都新建，deps 含它会让 effect 每次都跑）
    if (lastFocusedRef.current !== focusedIndex) {
      lastFocusedRef.current = focusedIndex;
      cardRefs.current[focusedIndex]?.focus({ preventScroll: true });
    }
  }, [focusedIndex, filteredEntries]);

  // 快捷键绑定（见 .trellis/tasks/08-16-keyboard-shortcuts/prd.md）
  //   - 走 ref-based 模式，handler 闭包总是读到最新 focusedIndex / filteredEntries
  //   - 环形模运算：j = (i+1) % n；k = (i-1+n) % n（+n 防负数）
  //   - Enter 导航到 /p/<slug>
  //   - / 聚焦搜索框（preventDefault 由 hook 内部处理）
  useKeyboardShortcuts({
    onJ: () => {
      if (filteredEntries.length === 0) return;
      setFocusedIndex((i) => (i + 1) % filteredEntries.length);
    },
    onK: () => {
      if (filteredEntries.length === 0) return;
      setFocusedIndex((i) => (i - 1 + filteredEntries.length) % filteredEntries.length);
    },
    onEnter: () => {
      const target = filteredEntries[focusedIndex];
      if (target) navigate(`/p/${target.slug}`);
    },
    onSlash: () => {
      searchInputRef.current?.focus();
    },
  });

  // 空态条件：必须真有过滤条件（防御：全空 + 全空 不应显示"无匹配"）
  const isFiltered = query.trim().length > 0 || type !== 'all';
  const isEmpty = filteredEntries.length === 0 && isFiltered;

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      <Hero />
      <SearchBar
        query={query}
        setQuery={setQuery}
        type={type}
        setType={setType}
        inputRef={searchInputRef}
      />
      {isEmpty ? (
        // 空结果态：Search 灰图标（opacity-50） + dim 色文字 + 居中
        // 与设计语言一致：复用 brand-dim / brand-mid / lucide Search
        <div className="text-center py-16 text-brand-dim">
          <Search size={32} className="mx-auto mb-3 opacity-50" aria-hidden />
          <p>没有匹配的内容</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-6">
          {filteredEntries.map((entry, i) => (
            <div key={entry.slug} className="mb-6 break-inside-avoid">
              <EntryCard
                entry={entry}
                isFocused={i === focusedIndex}
                ref={(el) => {
                  // ref callback 模式：把每个卡片的 DOM 引用存到 cardRefs.current[i]
                  // 这样 useEffect 里可以 .focus({ preventScroll: true })
                  cardRefs.current[i] = el;
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
