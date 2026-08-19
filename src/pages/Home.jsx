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
//   - type 匹配：DEFAULT_TYPE 永真，否则严格相等 e.type
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
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import SearchBar, { TYPE_OPTIONS } from '../components/SearchBar.jsx';
import EntryCard from '../components/EntryCard.jsx';
import KeyboardHint from '../components/KeyboardHint.jsx';
import ScrollToTop from '../components/ScrollToTop.jsx';
import { entryCount, listEntries } from '../lib/entries.js';
import usePageTitle from '../hooks/usePageTitle.js';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts.js';

// type 默认值：直接从 SearchBar 的 TYPE_OPTIONS 拿第一项的 value
// 单一来源 = TYPE_OPTIONS；改 TYPE_OPTIONS 第一项不需要改这里（08-17 M1）
const DEFAULT_TYPE = TYPE_OPTIONS[0].value;

// P1-13 改造（父任务 08-18-ux-optimization-suite）：瀑布流入场 stagger
//   - CSS columns 列数随断点变化：columns-1 sm:columns-2 lg:columns-3 2xl:columns-4
//   - stagger 延迟按 columnIndex 计算：columnIndex * 30ms
//   - 首屏 N 张卡片（i < firstScreenCount）无延迟，同步入场
//     firstScreenCount = columnCount * 2（top 2 行立即可见，避免用户感知延迟）
//   - 移动端单列 → columnCount=1 → columnIndex 永远 0 → 所有卡片无延迟（自然连续）
//
// 用 matchMedia 监听断点变化（与 Tailwind breakpoints 对齐）：
//   sm: 640px, lg: 1024px, 2xl: 1536px
// 守卫：jsdom 无 window.matchMedia（tests），降级为只读一次 innerWidth
function useResponsiveColumnCount() {
  const [count, setCount] = useState(() => computeColumnCount());
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      // jsdom / 老浏览器：跳过动态监听；columnCount 用初始值即可（测试环境）
      return;
    }
    const mqls = [
      window.matchMedia('(min-width: 1536px)'), // 2xl
      window.matchMedia('(min-width: 1024px)'), // lg
      window.matchMedia('(min-width: 768px)'), // md（P2-26 断点从 sm 提到 md）
    ];
    const update = () => setCount(computeColumnCount());
    mqls.forEach((mql) => mql.addEventListener('change', update));
    return () => mqls.forEach((mql) => mql.removeEventListener('change', update));
  }, []);
  return count;
}

function computeColumnCount() {
  if (typeof window === 'undefined') return 1;
  const w = window.innerWidth;
  if (w >= 1536) return 4;
  if (w >= 1024) return 3;
  // P2-26 改造（父任务 08-18-ux-optimization-suite）：断点从 sm (640px) 提到 md (768px)
  //   - 640-768px 单列太宽（每张卡 ~600px），768-1024px 双列更舒展
  if (w >= 768) return 2;
  return 1;
}

export default function Home() {
  usePageTitle(''); // 首页只用站名，不加前缀
  const navigate = useNavigate();

  // P1-13：响应式列数（用于 stagger 计算 columnIndex）
  const columnCount = useResponsiveColumnCount();

  // 搜索 / 过滤 state（不持久化：路由切换回 / 时自然重置）
  //   - query: 原始输入字符串（搜索框受控）
  //   - type:   DEFAULT_TYPE | 'article' | 'project'
  //   - searchInputRef: 绑定到搜索框 input，给 / 快捷键聚焦用
  const [query, setQuery] = useState('');
  const [type, setType] = useState(DEFAULT_TYPE);
  const searchInputRef = useRef(null);

  // 键盘快捷键聚焦态
  //   - focusedIndex: 当前焦点卡在 filteredEntries 中的下标；j/k 环形变化
  //   - cardRefs: 数组式 ref 容器，保存每张卡 root div 的 DOM 引用
  //     * React ref callback 模式：<EntryCard ref={el => cardRefs.current[i] = el} />
  //     * focusedIndex 变化时调用 cardRefs.current[i]?.focus({ preventScroll: true })
  //       把浏览器默认的"聚焦即滚动"关掉，避免瀑布流错位
  //   - lastFocusedRef: 跟踪上一次"实际应用过 DOM focus"的 focusedIndex
  //     * 防止输入框输入时误触发 .focus() 抢走用户当前正在用的焦点
  //       （典型场景：用户在搜索框打字，焦点被劫到卡片）
  //     * 只在 focusedIndex 真正变化时才同步 DOM 焦点
  //   - prevLengthRef: 跟踪上一帧 filteredEntries.length
  //     * 用于「length 由 0 转正」时强制恢复焦点（08-17 code-review #4）
  //     * 复现：focusedIndex=2 → 输入字符过滤到 0（effect 早返，lastFocusedRef 不变）
  //       → 清字符恢复 N（clamped===focusedIndex 不 setState；旧实现 lastFocusedRef 守卫
  //         跳过 focus，焦点丢失）→ 必须按 j 才能恢复
  //     * 新增「prevLength===0 && currentLength>0」分支作为额外触发条件，
  //       自动把焦点拉回到原 focusedIndex 对应的卡片
  //   - 注意：聚焦对象永远是 filteredEntries（不是 entries），保证 j/k 与用户可见的卡片一致
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef([]);
  const lastFocusedRef = useRef(0);
  const prevLengthRef = useRef(0);

  // 派生 filteredEntries
  //   - entries 是 listEntries() 的副本（每次 render 都新建数组，规模 < 50 无 memo 必要）
  //   - q 预先 trim + lowercase，避免每次 substring 重复计算
  //   - matchType: 'all' 永真；其他严格相等
  //   - matchQuery: query 空 → 全过；非空 → haystack.includes(q)
  //     haystack 拼 title + excerpt(兜底 '') + tags.join(' ')，统一 lowercase
  //     tags 兜底 [] 防御 entries.js 未注册 tags（正常生产数据不应出现）
  //
  // P0 改造（父任务 08-18-ux-optimization-suite P0-5）：
  //   - 改走 useDeferredValue(query) + useMemo：输入即时更新 state，但 filter
  //     计算走 deferred value，避免大库下每次输入都触发 O(n) filter
  //   - isPending = query !== deferredQuery：true 时显示搜索框 spinner
  //     （仅 entryCount > 20 时启用，避免小数据下闪烁）
  //   - useMemo deps: [entries, deferredQuery, type] —— entries 引用变化
  //     （如 Home re-mount 或 entries.js 改动）才重算；单纯 query / type 变化
  //     不影响 entries 引用
  const entries = listEntries();
  const deferredQuery = useDeferredValue(query);
  const isPending = query !== deferredQuery;

  // 注意：这里继续用 query（不是 deferredQuery）做 trim + lowercase 计算 —— 因为
  // 即便在 isPending 期间，q 也得是用户最新意图的归一化形式；只是把 filter 放到
  // deferredQuery 上，避免每次 keystroke 都重算
  const q = deferredQuery.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (type !== DEFAULT_TYPE && e.type !== type) return false;
      if (!q) return true;
      const haystack = `${e.title} ${e.excerpt ?? ''} ${(e.tags ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, q, type]);

  // 搜索框 spinner 显示条件：
  //   - entryCount > 20：大库下 deferred value 才有意义，小数据即时 filter 足够
  //   - isPending：deferred 落后于当前 input
  //   - query.length > 0：空 query 时 filter 是恒等映射，无须 spinner
  const showSearchSpinner = entryCount() > 20 && isPending && query.length > 0;

  // 焦点越界保护：搜索后 filteredEntries 可能缩短，旧的 focusedIndex 需 clamp
  //   - 每次 filteredEntries.length / focusedIndex 变化时执行
  //   - 若 focusedIndex 越界，回落到 0，避免数组越界与导航指向已隐藏卡片
  //   - DOM 焦点同步：触发条件 OR（focusedIndex 真变化 || 上一帧 length===0 转正）
  //     deps 用 filteredEntries.length 而非 filteredEntries 本身，避免数组引用每次 render
  //     重建都重跑 effect（08-17 code-review #6）
  //   - 焦点恢复（08-17 F4）：prevLength===0 && currentLength>0 时即使 lastFocusedRef 没变
  //     也要强制 .focus()，恢复因过滤 0 张丢掉的卡片焦点流
  //   - focus({ preventScroll: true }) 关闭浏览器默认的"聚焦即滚动"行为
  //   - 注意：聚焦下标永远是 filteredEntries（不是 entries），保证 j/k 与用户可见卡片一致
  useEffect(() => {
    const prevLength = prevLengthRef.current;
    const currentLength = filteredEntries.length;
    prevLengthRef.current = currentLength;

    if (currentLength === 0) return;

    const clamped = Math.min(focusedIndex, currentLength - 1);
    if (clamped !== focusedIndex) {
      setFocusedIndex(clamped);
      return; // 下一次 render 再执行 focus()，避免 stale ref
    }
    // 关键守卫：focusedIndex 没变且非「过滤 0→N 恢复」就不抢焦点
    // （deps 含 filteredEntries.length 后，length 不变则 effect 不跑）
    const isFirstRestoreAfterEmpty =
      prevLength === 0 && lastFocusedRef.current === focusedIndex;
    if (lastFocusedRef.current !== focusedIndex || isFirstRestoreAfterEmpty) {
      // F3+F4 协调：若用户当前焦点在搜索框（说明正在输入或刚刚主动聚焦），
      // 不抢焦点回卡片，让用户继续在搜索框操作（08-17 F3 + F4 协调）
      // 例外：仅在 focusedIndex 真变化（j/k 路径）时不检查 activeElement，
      // 因为 j/k 显式切焦点是要把焦点从 input 拉回卡片
      if (
        isFirstRestoreAfterEmpty &&
        document.activeElement === searchInputRef.current
      ) {
        return;
      }
      lastFocusedRef.current = focusedIndex;
      cardRefs.current[focusedIndex]?.focus({ preventScroll: true });
    }
  }, [focusedIndex, filteredEntries.length]);

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
  const isFiltered = query.trim().length > 0 || type !== DEFAULT_TYPE;
  const isEmpty = filteredEntries.length === 0 && isFiltered;

  // P2-20 改造（父任务 08-18-ux-optimization-suite）：tag chip 点击 → 触发搜索
  //   - useCallback + 空 deps：保证 EntryCard 不必要的 re-render
  //   - setQuery(tag) + searchInputRef.focus：与 X 清除按钮后行为一致
  //     （用户清空后无需再次点击输入框可继续输入）
  //   - preventScroll: true：避免 focus 触发滚动
  const handleTagClick = useCallback((tag) => {
    setQuery(tag);
    searchInputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20">
      <Hero />
      <SearchBar
        query={query}
        setQuery={setQuery}
        type={type}
        setType={setType}
        inputRef={searchInputRef}
        isPending={showSearchSpinner}
      />
      {isEmpty ? (
        // 空结果态：Search 灰图标（opacity-50） + dim 色文字 + 居中
        // 与设计语言一致：复用 brand-dim / brand-mid / lucide Search
        <div className="text-center py-16 text-brand-dim">
          <Search size={32} className="mx-auto mb-3 opacity-50" aria-hidden />
          <p>没有匹配的内容</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-6">
          {filteredEntries.map((entry, i) => {
            // P1-13：stagger 入场延迟
            //   - 首屏 N 张卡片（i < columnCount * 2）：无延迟
            //     假设至少 2 行可见，让用户立即看到内容
            //   - 后续卡片按 columnIndex 偏移：columnIndex * 30ms
            //   - 移动端单列 → columnCount=1 → 所有卡片首屏内（columnCount*2=2）
            const columnIndex = i % columnCount;
            const isFirstScreen = i < columnCount * 2;
            const revealDelay = isFirstScreen ? 0 : columnIndex * 30;
            return (
              <div key={entry.slug} className="mb-6 break-inside-avoid">
                <EntryCard
                  entry={entry}
                  isFocused={i === focusedIndex}
                  revealDelay={revealDelay}
                  onTagClick={handleTagClick}
                  ref={(el) => {
                    // ref callback 模式：把每个卡片的 DOM 引用存到 cardRefs.current[i]
                    // 这样 useEffect 里可以 .focus({ preventScroll: true })
                    cardRefs.current[i] = el;
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
      {/* P1-10：滚回顶部按钮（右下角，玻璃态胶囊） */}
      <ScrollToTop />
      {/* P1-11/12：键盘快捷键浮层 + cheat sheet */}
      <KeyboardHint />
    </div>
  );
}
