// NotFound：友好的 404 页面（"深海夜空"基调，戏剧化）。
//
// 设计（design.md D-7）：
//   - 巨大 404 数字：Fraunces italic + opsz:144 + text-[12rem] md:text-[16rem]，
//     文字渐变紫蓝青（bg-clip-text），是整站唯一一处显式色彩装饰。
//   - 文案："迷失在深海中 · 坐标 (0°, 0°)"（主）+ "这里什么都没有..."（次，dim 色弱化）。
//   - 全屏极光（<AuroraBackdrop intensity="fullscreen" />），60s 慢漂移，更戏剧化。
//   - 返回按钮复用 EntryDetail 同款玻璃态胶囊类名。
import { Link } from 'react-router-dom';
import AuroraBackdrop from '../components/AuroraBackdrop.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('404');
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 全屏极光：fixed 覆盖视口，60s 漂移（比 Home 更慢，强化 404 戏剧化） */}
      <AuroraBackdrop intensity="fullscreen" />

      <div className="relative z-10 text-center px-6">
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

        {/* 玻璃态返回按钮（与 EntryDetail 同款） */}
        <Link
          to="/"
          className="inline-block mt-10 px-6 py-2 rounded-md text-sm font-mono
                     bg-brand-surface/60 text-brand-light
                     border border-brand-primary/40
                     backdrop-blur-md
                     shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
                     hover:bg-brand-surface-2/70 hover:border-brand-glow/70
                     hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]
                     transition-all duration-200"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}