// NotFound：友好的 404 页面（"深海夜空"基调，戏剧化）。
//
// 设计（design.md D-7）：
//   - 巨大 404 数字：Fraunces italic + opsz:144 + text-[12rem] md:text-[16rem]，
//     文字渐变紫蓝青（bg-clip-text），是整站唯一一处显式色彩装饰。
//   - 文案："迷失在深海中 · 坐标 (0°, 0°)"（主）+ "这里什么都没有..."（次，dim 色弱化）。
//   - 全屏极光（<AuroraBackdrop intensity="fullscreen" />），60s 慢漂移，更戏剧化。
//   - 返回按钮复用 EntryDetail 同款玻璃态胶囊类名。
//
// 移动端 hover 守卫（子任务 08-16-mobile-hover-guard）：
//   返回首页链接的 hover 态（背景 / 边框 / shadow）与 EntryDetail 返回按钮同款，
//   触屏 tap 后也会残留视觉态。用 `[@media(hover:hover)]:` 包住 hover utility，
//   触屏用户看到的是默认态，避免 hover 残留。键盘 focus 仍按浏览器默认 outline。
//
// P0-2 改造（父任务 08-23-ux-optimization-suite，ui-ux-pro-max 诊断 C1+C4）：
//   - 加 skip-link：首个 Tab 元素是 "跳到主站导航"，与 EntryDetail 同款
//     让键盘 / 屏幕阅读器用户跳过装饰直接到 BackButton
//   - 加 useFocusBackOnMount(backButtonRef, [])：mount 后焦点送 BackButton
//   - 加 Esc 监听：document-level keydown → 焦点送 BackButton（INPUT/TEXTAREA 守卫）
//     与 EntryDetail.jsx:86-99 同款实现，避免抽 hook 增加复杂度（2 处使用复制即可）
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuroraBackdrop from '../components/AuroraBackdrop.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import useFocusBackOnMount from '../hooks/useFocusBackOnMount.js';
import BackButton from '../components/BackButton.jsx';
import { listEntries } from '../lib/entries.js';

export default function NotFound() {
  usePageTitle('404');
  // P2-25 改造（父任务 08-18-ux-optimization-suite）：404 列最近 3 条 entry
  //   - 帮助输错 slug / 外链失效的用户找回内容（之前只有「返回首页」按钮）
  //   - 数据：listEntries() 已经按 date desc 排序，直接 slice(0, 3) 拿最新 3 条
  //   - 视觉：玻璃态卡片 + 列表项 + react-router Link（保留 SPA）
  //   - a11y：列表用 <ul>/<li> 语义；链接 aria-label 拼 entry type 让屏幕阅读器更明确
  const recentEntries = listEntries().slice(0, 3);

  // P0-2：BackButton ref + mount focus（与 EntryDetail 同款）
  const backButtonRef = useRef(null);
  useFocusBackOnMount(backButtonRef, []);

  // P0-2：Esc 监听捕获焦点到 BackButton（与 EntryDetail 同款）
  //   - INPUT/TEXTAREA/SELECT 守卫：避免用户输入时抢焦点
  //   - contenteditable 守卫：覆盖 div / span 等被设 isContentEditable=true
  //   - Cmd / Ctrl / Alt 修饰键守卫：保留系统/扩展快捷键
  //   - e.preventDefault：阻止 Esc 触发浏览器其他默认行为（关闭全屏 / pointer lock 等）
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      backButtonRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {/* P0-2：skip-link（与 EntryDetail 同款）
            - sr-only 默认隐藏；focus:not-sr-only 让键盘聚焦时显示
            - WCAG 2.4.1 Bypass Blocks：让键盘 / 屏幕阅读器用户跳过装饰
            - 锚定 #back-button（BackButton 共享组件已设 id="back-button"） */}
      <a
        href="#back-button"
        className="sr-only focus:not-sr-only fixed top-2 left-1/2 -translate-x-1/2 z-[60]
                   glass-pill px-3 py-1.5 rounded-md text-sm font-mono"
      >
        跳到主站导航
      </a>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 全屏极光：fixed 覆盖视口，60s 漂移（比 Home 更慢，强化 404 戏剧化） */}
      <AuroraBackdrop intensity="fullscreen" />

      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* 404 数字：紫蓝青三色文字渐变（bg-clip-text），唯一显式色彩装饰；
            opsz:144 显式内联以落实 PRD D-7 */}
        <h1
          className="font-serif italic text-[12rem] md:text-[16rem] leading-none tracking-tighter
                     bg-gradient-to-br from-brand-accent via-brand-primary to-brand-glow
                     bg-clip-text text-transparent
                     drop-shadow-[0_0_32px_rgba(91,141,239,0.35)]"
          style={{ fontVariationSettings: "'opsz' 144" }}
        >
          404
        </h1>

        {/* 主文案：罗盘坐标感，accent 紫 */}
        <p className="mt-4 text-lg text-brand-accent font-mono">
          迷失在深海中 · 坐标 (0°, 0°)
        </p>

        {/* 次文案：dim 色更弱化 */}
        <p className="mt-2 text-sm text-brand-dim">这里什么都没有...</p>

        {/* 玻璃态返回按钮：BackButton 共享组件（与 EntryDetail 同款）
            - 父任务 08-18-ux-optimization-suite P0-1 抽出，单一来源管理返回按钮
            - 默认 aria-label="返回首页"、移动端触控目标 ≥ 44pt 由 BackButton 内部处理
            - className 保留 mt-10 px-6 py-2（NotFound 视觉居中按钮 vs 详情页左上角悬浮）
            - P0-2：ref={backButtonRef} 让 useFocusBackOnMount 在 mount 后下一帧 focus */}
        <BackButton to="/" className="mt-10 px-6 py-2" ref={backButtonRef}>
          返回首页
        </BackButton>

        {/* 最近 3 条 entry：仅当 listEntries 非空时显示 */}
        {recentEntries.length > 0 && (
          <div className="mt-12 text-left">
            <p className="text-xs font-mono text-brand-mid text-center mb-3">最近发布</p>
            <ul className="space-y-2">
              {recentEntries.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    to={`/p/${entry.slug}`}
                    aria-label={`${entry.type === 'article' ? '文章' : '项目'}：${entry.title}`}
                    className="glass-pill block px-4 py-3 rounded-md text-sm
                               [@media(hover:hover)]:hover:border-brand-glow/70
                               [@media(hover:hover)]:hover:text-brand-glow
                               transition-all duration-200"
                  >
                    <div className="text-brand-light font-medium truncate">{entry.title}</div>
                    <div className="text-xs text-brand-dim font-mono mt-1">{entry.date}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
}