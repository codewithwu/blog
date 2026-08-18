// EntryDetail：文章 / 项目 统一详情页（路由 /p/:slug）。
//
// 契约（CLAUDE.md 规则 4 + design.md §3）：
//   - 正文走 100vh iframe（复用 src/lib/html.jsx 的 Html 组件，含 srcDoc / sandbox / base 注入）
//   - 全局无 Navbar / Footer；顶部仅一个固定悬浮「← 返回」按钮
//   - 找不到 slug 时显示内嵌 404（08-18 P0 / P1 合并实现；不 navigate，保持 /p/:slug 路由）
//   - 底部加「上一篇 / 下一篇」浮条（PrevNextNav），让用户无需返回首页即可翻下一篇
//   - 通过 <Helmet> 注入 OG / Twitter Card meta，便于社交分享（微信/Twitter/LinkedIn）
//
// P0 改造（父任务 08-18-ux-optimization-suite）：
//   - BackButton 抽出来共享组件（src/components/BackButton.jsx）；EntryDetail 与
//     NotFound 现在都用它
//   - useFocusBackOnMount：mount 后下一帧自动 focus BackButton，让键盘 / 屏幕
//     阅读器用户立即知道当前位置（避免焦点落到 iframe 或 body）
//   - skip-link：首个 Tab 焦点元素，激活后跳到 #back-button（WCAG 2.4.1 bypass blocks）
//   - Esc 跳出：document-level keydown 监听 Esc → focus BackButton；不打开 iframe
//     allow-same-origin（保持隔离），Tab 跳出需 future follow-up
//
// 返回按钮的 aria-label 与样式由 BackButton 负责（详情见 BackButton.jsx）。
// 移动端触控目标 ≥ 44pt 也由 BackButton 内部 utility 处理。
//
// OG / Twitter Card meta：
//   - 数据来源：entry.title + entry.excerpt
//   - URL 拼接：window.location.origin + window.location.pathname 自动包含 GitHub Pages base
//   - HashRouter 下 pathname 永远是 /blog/，真实 entry URL 是 #/p/<slug>，所以必须
//     拼 window.location.hash（含前导 #）
//   - og:image 用单品牌图（public/og-default.png，1200×630 PNG，78 KB）
//   - SPA + Helmet 限制：爬虫大多不执行 JS，分享卡片在用户复制链接时由客户端 JS
//     渲染才完整生效（08-17 已知限制，本任务不解决）
//
// 内嵌 404（P1 顺手）：
//   - 原来 `<Navigate to="/" replace />` 直接跳回首页（EntryDetail.jsx:58-60 历史实现）
//   - 改为：在 /p/:slug 路由显示内嵌「文章不存在」+ BackButton，保持 history 栈
//     干净（replace 语义保留）
//   - 内嵌 404 与 useFocusBackOnMount 配合：未找到 entry 时也走 BackButton，
//     键盘焦点仍能落到 BackButton（用户可立即按 Esc / ← 返回）
import { useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { findEntryBySlug, findNeighbors } from '../lib/entries.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import useFocusBackOnMount from '../hooks/useFocusBackOnMount.js';
import BackButton from '../components/BackButton.jsx';
import PrevNextNav from '../components/PrevNextNav.jsx';

export default function EntryDetail() {
  const { slug } = useParams();
  const entry = findEntryBySlug(slug);
  const backButtonRef = useRef(null);

  // 早返回必须在 usePageTitle 之前：否则无效 slug 会先把 document.title 改成
  // 「未找到内容 · Cool Panda」，再被 Home 的 usePageTitle 覆盖 — 标签栏闪烁。
  // entry 已确定存在，下方 hook 直接用 entry.title（去掉 '|| 未找到内容' 兜底）。
  if (!entry) {
    // 内嵌 404：保留 /p/:slug 路由；显示同款玻璃态胶囊 BackButton + 错误文案
    // BackButton 同样进 ref 体系，让键盘焦点也落到这里（useFocusBackOnMount）
    return (
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <BackButton ref={backButtonRef} to="/">
          ← 返回
        </BackButton>
        <div className="relative z-10 text-center max-w-md">
          <h1 className="font-serif italic text-[6rem] leading-none text-brand-accent/70">404</h1>
          <p className="mt-4 text-lg text-brand-mid">文章不存在或已被移除</p>
          <p className="mt-2 text-sm text-brand-dim font-mono">/p/{slug}</p>
          <p className="mt-6 text-xs text-brand-dim">点击左上角「← 返回」回到首页</p>
        </div>
      </div>
    );
  }

  usePageTitle(entry.title);

  // Mount / slug 变化时把焦点送到 BackButton（a11y：避免焦点落到 iframe）
  useFocusBackOnMount(backButtonRef, [entry.slug]);

  // Esc 跳出 iframe 焦点陷阱：document-level keydown 监听
  // 守卫：
  //   1. Esc 键才响应（其它键不抢）
  //   2. event.target 是 input / textarea / contenteditable 时不抢（用户正在编辑）
  //   3. 带修饰键（Cmd/Ctrl/Alt）不抢
  // 这里故意不劫持 Tab：iframe sandbox 没有 allow-same-origin，无法可靠检测
  // iframe 内 focus 状态；Esc 跳出是本期最低成本 + 最高 ROI 的方案。
  // Tab 跳出需要打开 same-origin 或 postMessage 桥接，列为后续 follow-up。
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // 阻止 Esc 触发浏览器其它默认行为（如关闭全屏、退出 pointer lock）
      e.preventDefault();
      backButtonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // 计算 prev / next 邻居。entry 已存在（上面已 early return），
  // 所以 findNeighbors 一定不会返回 null；用对象解构拿 prev / next。
  // 这里不 useMemo：findNeighbors 是 O(n)，详情页每次 route 切换只调用一次。
  const { prev, next } = findNeighbors(entry.slug);

  // OG / Twitter Card meta 数据
  //   - ogUrl: 当前页绝对 URL
  //     * pathname 自动含 GitHub Pages base（/blog/）
  //     * 必须拼 hash：HashRouter 下 pathname 永远是 /blog/，真实 entry URL 是 #/p/<slug>
  //     * window.location.hash 自带前导 #，无需手动加
  //   - ogImage: 单品牌图绝对 URL；import.meta.env.BASE_URL 末尾带 /，直接拼文件名
  //   - description: 优先 excerpt，缺失兜底用 title
  const ogUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  const ogImage = `${window.location.origin}${import.meta.env.BASE_URL}og-default.png`;
  const description = entry.excerpt ?? entry.title;

  return (
    <>
      {/* Skip-link：首个 Tab 焦点元素，激活后跳到 BackButton（#back-button）
          - sr-only 默认隐藏（不占视觉空间），focus:not-sr-only 让键盘聚焦时显示
          - 玻璃态胶囊风格与品牌一致
          - WCAG 2.4.1 Bypass Blocks：让键盘 / 屏幕阅读器用户跳过 iframe 主区
            直接操作主站导航（仅 BackButton + PrevNextNav） */}
      <a
        href="#back-button"
        className="sr-only focus:not-sr-only fixed top-2 left-1/2 -translate-x-1/2 z-[60]
                   glass-pill px-3 py-1.5 rounded-md text-sm font-mono"
      >
        跳到主站导航
      </a>

      {/* OG / Twitter Card meta：社交分享卡片来源
          - og:type=article（项目也用 article，因为 og:project 不是标准 type）
          - twitter:card=summary_large_image（适配 1200×630 大图）
          - 未来若 entry 有 cover，加 <meta property="og:image" content={entry.cover} /> 分支 */}
      <Helmet>
        <meta property="og:type" content="article" />
        <meta property="og:title" content={entry.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Cool Panda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={entry.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* 返回按钮：BackButton 共享组件（src/components/BackButton.jsx）
          - ref 暴露给 useFocusBackOnMount 用于 mount 后自动 focus
          - 玻璃态胶囊样式 + 移动端触控目标 ≥ 44pt 由 BackButton 内部处理
          - id="back-button" 供 skip-link 锚定
          - 固定定位 fixed top-4 left-4 z-50 由本组件传 className（与原内联实现 1:1 等价）
            NotFound 那边用 mt-10 px-6 py-2 居中布局，互不影响 */}
      <BackButton
        ref={backButtonRef}
        to="/"
        className="fixed top-4 left-4 z-50"
      >
        ← 返回
      </BackButton>

      {/* key={entry.slug}：路由切换 /p/A → /p/B 时强制 Html 子组件重建
           - React 按 key 变化识别为不同 element 实例 → unmount 旧 + mount 新
           - Html 内 useState(true) 让 loading 重置 true → shimmer 重新出现
           - 不加 key 时 EntryDetail 组件复用，iframe DOM 节点复用，
             loading 保持 false，shimmer 不再触发（08-17 code-review #2） */}
      <Html key={entry.slug} html={entry.content} title={entry.title} />

      {/* 底部「上一篇 / 下一篇」浮条 —— 与返回按钮同款玻璃态胶囊
          fixed 定位不进入 iframe 流，iframe 滚动与浮条互不影响 */}
      <PrevNextNav prev={prev} next={next} />
    </>
  );
}