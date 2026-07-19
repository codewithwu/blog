// Hero：瀑布流首页顶部的极简品牌区。
//
// 设计（见 design.md §7）：站名「极客熊猫」+ 一行随内容数变化的 tagline + entry 总数。
// 不 sticky，用户自然往下滚就进入瀑布流。tagline 用 CSS 淡入动画（heroFade，见 index.css），
// 靠 key={count} 触发重挂载来播放动画（粗暴但足够，避免引入动画库）。
import { entryCount } from '../lib/entries.js';

const SITE_NAME = '极客熊猫';

// tagline 候选：按 entry 数量档位切换，制造"随站点成长"的趣味点
function pickTagline(count) {
  if (count <= 0) return '欢迎';
  if (count <= 3) return '开始记录';
  if (count <= 10) return '持续记录 AI 与工程心得';
  return '保持好奇，持续输出';
}

export default function Hero() {
  const count = entryCount();
  const tagline = pickTagline(count);

  return (
    <header className="pt-20 pb-12 md:pt-28 md:pb-16 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-brand-light tracking-tight">
        {SITE_NAME}
      </h1>
      <p className="mt-4 text-brand-mid">
        一个极简博客 · {count} 篇内容
      </p>
      {/* key={count} 让档位变化时重挂载，重新播放 heroFade 淡入 */}
      <p key={count} className="mt-2 text-sm text-brand-orange animate-heroFade">
        {tagline}
      </p>
    </header>
  );
}
