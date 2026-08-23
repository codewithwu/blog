// EntryCard：文章 / 项目 统一卡片（"深海夜空"基调）。
//
// 设计目标（见 design.md §3 / D-8）：
//   - 玻璃态卡片：bg-brand-surface/85 + backdrop-blur-sm + border-brand-border/60。
//   - hover 抬升（保留）+ 双层紫青 box-shadow 发光 + 边框变 primary。
//   - focus 蓝色发光环（取代原 orange ring）。
//   - fallback 渐变替换为紫 / 蓝 / 青（呼应 D-2 色板），不含 orange / green。
//   - category chip 紫，tag chip 蓝，项目外链 hover 转 glow。
//
// 交互（P0-1 父任务 08-23-ux-optimization-suite）：
//   - 整卡改 <Link to={`/p/${slug}`}>：根除 div role="link" 反模式（ui-ux-pro-max
//     诊断 A1 / Compact Control Semantics Severity: Critical）。
//     Link 底层渲染为原生 <a>，自动获得：Enter 跳转 / 中键打开新标签 / 复制链接 /
//     屏幕阅读器朗读。**关键：用 Link 而非裸 <a href>，因为项目是 HashRouter + 部署在
//     /blog/ 子路径**——裸 <a href="/p/foo"> 会跳到 origin/p/foo（丢 base 路径触发
//     「public base URL」错误），Link 会渲染为 <a href="#/p/foo"> 并拦截点击走 SPA。
//   - 内部 button（tag/category chip）：preventDefault + stopPropagation 阻止外层
//     <a> 跳转（Link 的 click handler 检查 defaultPrevented，子按钮 preventDefault
//     后 Link 不接管导航）。
//   - 项目 GitHub / Demo：HTML 规范禁止 <a> 嵌套 <a>，改为 <button> + window.open。
//   - tag/category chip 移动端触控目标 ≥ 44pt（跨任务共性问题 A6）。
//   - 入场动效用 useReveal：进入视口时 opacity/translate 过渡一次。
//   - P2-1 键盘快捷键子任务新增 `isFocused` prop：
//     * 由 Home 路由根据 j/k 派发的 focusedIndex 计算并传入
//     * 为 true 时叠加 `ring-2 ring-brand-glow`，强制 ring 视觉不依赖 :focus-visible
//     * 原因：j/k 移动焦点时用户没碰鼠标，:focus-visible 在大多数浏览器不会触发；
//       不强制环则用户根本看不到"焦点在哪张卡"
//     * 与下方已有的 `focus-visible:ring-2 ring-brand-glow` 共存：
//       Tab/鼠标聚焦时用 focus-visible 版（语义化），j/k 聚焦时用强制版（视觉保证）
//   - P2-1 同时升级为 React.forwardRef：
//     * Home 需要把每张卡 root div 的 DOM 引用存到 cardRefs.current[]
//       用来 focus({ preventScroll: true })
//     * forwardRef 把外部 ref 与 useReveal 内部 ref 用 useMergedRefs 合并到同一 div
//     * 保持 useReveal 行为不变（IntersectionObserver 仍挂载到同一节点）
//   - 移动端 hover 守卫（子任务 08-16-mobile-hover-guard）：
//     * 触屏设备（无 hover 能力的设备）tap 后会残留 hover 视觉态（iOS Safari 尤其严重）
//       直到下次 tap 才清除，体验差且与系统原生行为不一致
//     * 所有 hover 态均包在 `[@media(hover:hover)]:hover:*` arbitrary variant 下，
//       仅在设备真有 hover 能力（鼠标 / 触控板 / 键盘 hover）时才生效
//     * 键盘 focus 态不受影响：focus-visible:ring-* 仍按原语义工作，
//       触屏用户看不到 hover 抬升，但键盘 / 鼠标用户仍能正常享受 hover 反馈
//     * 不引入新依赖；纯 Tailwind 3.1+ arbitrary variants 语法
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Wrench, Github, ExternalLink } from 'lucide-react';
import { categories } from '../data/categories.js';
import useReveal from '../hooks/useReveal.js';
import { gradientForSlug } from '../lib/gradient-presets.js';

// 合并多个 ref 到同一个 DOM 节点：
//   - 内层 ref（useReveal）：用于 IntersectionObserver
//   - 外层 ref（Home）：用于键盘快捷键 focus({ preventScroll: true })
// 不做稳定化：refs 是 rest spread 每次 render 都是新数组，
// useCallback(fn, refs) 实际不会复用 callback。这里也无需稳定——
//   - Home 用 ref={(el) => cardRefs.current[i] = el} 是 callback ref，每次 render
//     也是新函数，React 本来就处理 callback ref 替换（旧(null) → 新(el)）。
//   - useReveal 内部 callback ref 同理，每次 render 也是新函数。
// 因此每次 render 让 React 重新 attach 一次 ref callback 是预期行为，
// 与 React ref 语义一致，且不引入虚假稳定化的代码气味（08-17 code-review #7）。
function useMergedRefs(...refs) {
  return (el) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(el);
      else ref.current = el;
    });
  };
}

// monogramForTitle：根据标题首字符决定 monogram 显示
//   - 首字符是 ASCII 字母（A-Z / a-z）：返回首字母大写（English monogram 效果）
//   - 首字符是中文 / 其它 CJK / 数字 / 符号：返回空串（仅保留渐变 + 类型标签）
// 父任务 08-18-ux-optimization-suite P2-23
// 为什么不直接 slice(0, 2).toUpperCase()：对中文标题取前 2 字看起来像文案不像 monogram
function monogramForTitle(title) {
  if (!title) return '';
  const first = title.charAt(0);
  // ASCII 字母：A-Z (0x41-0x5A) / a-z (0x61-0x7A)
  const code = first.charCodeAt(0);
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return first.toUpperCase();
  }
  return '';
}

const EntryCard = forwardRef(function EntryCard({ entry, isFocused = false, revealDelay = 0, onTagClick }, externalRef) {
  const [revealRef, visible] = useReveal();
  // 合并 useReveal 的 ref 与外部传入的 ref，两者必须挂在同一元素上（<a> 与 <div>
  // 同样接受 ref / focus，Home 的 cardRefs.current[i] 与 j/k 快捷键行为不变）
  const mergedRef = useMergedRefs(revealRef, externalRef);

  const isArticle = entry.type === 'article';
  // 分类中文名唯一来源是 categories.js（CLAUDE.md 规则 5）
  const categoryName = entry.category
    ? categories.find((c) => c.slug === entry.category)?.name ?? entry.category
    : null;

  // 整卡的 a11y 标签：让屏幕阅读器朗读"阅读文章：<title>" / "查看项目：<title>"
  // 比直接朗读全文 title + excerpt 摘要更明确（diag A1）。
  const cardAriaLabel = `${isArticle ? '阅读文章' : '查看项目'}：${entry.title}`;

  return (
    <Link
      ref={mergedRef}
      to={`/p/${entry.slug}`}
      aria-label={cardAriaLabel}
      className={`group block overflow-hidden rounded-xl
                  bg-brand-surface/85 backdrop-blur-sm
                  border border-brand-border/60
                  [@media(hover:hover)]:-translate-y-0.5
                  [@media(hover:hover)]:border-brand-primary/50
                  [@media(hover:hover)]:shadow-glow-lg
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
                  focus-visible:shadow-glow-md
                  transition-all duration-[250ms] ease-out
                  ${isFocused ? 'ring-2 ring-brand-glow ring-offset-2 ring-offset-brand-dark shadow-glow-md' : ''}
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      // 入场过渡（400ms ease-out）与 hover 过渡（250ms）分工不同，
      // 这里显式覆写为入场时长，hover 由上面的 duration-[250ms] 负责
      // P1-13 改造（父任务 08-18-ux-optimization-suite）：revealDelay 控制 stagger 延迟
      //   - 首屏卡片 revealDelay=0：与现有 transitionDelay 默认 0ms 等价，无副作用
      //   - 后续卡片 revealDelay>0：transitionDelay 让 opacity/translate 入场延迟触发，
      //     形成"按 column 渐次浮入"的视觉
      style={{ transitionDuration: visible ? undefined : '400ms', transitionDelay: `${revealDelay}ms` }}
    >
      {/* 封面区：有 cover 渲染图，无 cover 用渐变 + 标题首字母兜底
           P2-21 改造（父任务 08-18-ux-optimization-suite）：渐变按 slug hash 去重
             gradientForSlug(slug) 选 4 套预设之一，相同 slug 永远同色
           P2-23 改造：首字符国际化
             - ASCII 字母开头：取首字母大写（English monogram 效果）
             - 中文 / 其它：返回空串（不显示字符，只保留渐变背景） */}
      {entry.cover ? (
        <img
          src={entry.cover}
          alt=""
          className="w-full aspect-video object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`w-full aspect-video bg-gradient-to-br ${gradientForSlug(entry.slug)}
                        flex items-center justify-center text-3xl font-bold text-brand-light/70`}>
          {monogramForTitle(entry.title)}
        </div>
      )}

      <div className="p-5">
        {/* type 徽章 + date（项目隐藏 date）
            P2-22 改造（父任务 08-18-ux-optimization-suite）：readingTime 可选字段
              - 字段缺省（entry.readingTime 为 null）不显示
              - 字段存在时显示「X 分钟阅读」，加 · 分隔符保持视觉一致 */}
        <div className="flex items-center gap-2 text-xs text-brand-mid">
          <span className="inline-flex items-center gap-1">
            {isArticle ? <FileText size={13} /> : <Wrench size={13} />}
            {isArticle ? '文章' : '项目'}
          </span>
          {isArticle && (
            <>
              <span aria-hidden>·</span>
              <time>{entry.date}</time>
              {entry.readingTime != null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{entry.readingTime} 分钟阅读</span>
                </>
              )}
            </>
          )}
        </div>

        {/* 标题：Fraunces（h3 全局字体），hover 转 glow + 紫光
            （hover 效果仅在真有 hover 能力的设备上触发，避免触屏 tap 后残留） */}
        <h3 className="mt-2 text-lg font-semibold text-brand-light
                       [@media(hover:hover)]:group-hover:text-brand-glow transition-colors
                       [@media(hover:hover)]:group-hover:drop-shadow-[0_0_8px_rgba(76,201,240,0.35)]">
          {entry.title}
        </h3>

        {/* excerpt：最多 3 行截断 */}
        <p className="mt-2 text-sm text-brand-mid line-clamp-3">{entry.excerpt}</p>

        {/* 底部条：category chip（仅文章） + tags
            P2-20 改造（父任务 08-18-ux-optimization-suite）：tag chip 可点击 → 触发搜索
              - chip onClick + stopPropagation：避免连带触发整卡 navigate
              - onTagClick 回调：Home 的 setQuery(tag) + 搜索框 focus
              - category chip 同款行为：点击 = 触发 category 中文名搜索
                （category 是 metadata，不做筛选；与搜索正交）
            P2-24 改造：tag chip 数量上限 + 「+N」合并
              - 显示前 3 个；超过则追加「+N」徽章（与现有 chip 同款样式）
              - 避免 5+ tag 卡片拉高高度破坏瀑布流列对齐 */}
        <ul className="mt-4 flex flex-wrap gap-2 items-center text-xs">
          {categoryName && (
            <li>
              <button
                type="button"
                onClick={(e) => {
                  // preventDefault 阻止外层 <a href> 跳转；stopPropagation 不必要
                  // （<a> 没有 React 事件 handler 走 stopPropagation，但保留防御）
                  e.preventDefault();
                  onTagClick?.(categoryName);
                }}
                className="px-2 py-0.5 rounded bg-brand-accent/15 text-brand-accent
                           [@media(hover:hover)]:hover:bg-brand-accent/25 transition-colors
                           cursor-pointer
                           [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]"
              >
                {categoryName}
              </button>
            </li>
          )}
          {entry.tags.slice(0, 3).map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTagClick?.(t);
                }}
                className="px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary
                           [@media(hover:hover)]:hover:bg-brand-primary/25 transition-colors
                           cursor-pointer
                           [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]"
              >
                {t}
              </button>
            </li>
          ))}
          {entry.tags.length > 3 && (
            <li className="px-2 py-0.5 rounded bg-brand-surface-2/50 text-brand-mid">
              +{entry.tags.length - 3}
            </li>
          )}
        </ul>

        {/* 项目外链：GitHub / Demo（仅项目且 links 存在时渲染）
            HTML 规范禁止 <a> 嵌套 <a>，外层卡片已改 <a>，这里改 <button> + window.open
            保留 target=_blank 的语义（window.open 第二参数 "_blank"）
            noopener + noreferrer 保护：window.open 第三个参数设置 */}
        {!isArticle && entry.links && (
          <div className="mt-4 flex gap-3 text-sm">
            {entry.links.github && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(entry.links.github, '_blank', 'noopener,noreferrer');
                }}
                aria-label={`GitHub：${entry.title}`}
                className="inline-flex items-center gap-1 text-brand-primary
                           [@media(hover:hover)]:hover:text-brand-glow transition-colors
                           cursor-pointer
                           [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]"
              >
                <Github size={16} aria-hidden /> GitHub
              </button>
            )}
            {entry.links.demo && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(entry.links.demo, '_blank', 'noopener,noreferrer');
                }}
                aria-label={`Demo：${entry.title}`}
                className="inline-flex items-center gap-1 text-brand-primary
                           [@media(hover:hover)]:hover:text-brand-glow transition-colors
                           cursor-pointer
                           [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]"
              >
                <ExternalLink size={16} aria-hidden /> Demo
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});

export default EntryCard;
