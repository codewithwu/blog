// Hero：瀑布流首页顶部的品牌区（"夜空下的极客"基调）。
//
// 设计（见 design.md §3 / D-5）：
//   - 极简站名 + 副文案 + 动态 tagline + 静态时间戳。
//   - 字体分工：站名 Fraunces italic 大字（serif 转角 + 大光学尺寸戏剧化）；
//     副文案继承 body 的 Plex Sans；tagline / 时间戳用 JetBrains Mono（工程感）。
//   - 站名 hover 转 glow 色 + 紫光；tagline 用 accent 紫 + 紫光文本。
//   - 极光漂移由 <AuroraBackdrop intensity="hero" /> 提供，作为 header 内首个子节点。
//   - 不 sticky：用户自然往下滚就进入瀑布流。
//   - tagline 切换靠 key={count} 重挂载触发 heroFade（粗暴但足够，避免引入动画库）。
import AuroraBackdrop from './AuroraBackdrop.jsx';
import { entryCount, mostRecentDate } from '../lib/entries.js';

const SITE_NAME = 'Cool Panda';

// tagline 候选：按 entry 数量档位切换，制造"随站点成长"的趣味点。
// 历史上有 `count <= 3` 返回空串的分支，但 entryCount=2（刚发新文章）时会
// 让 Hero tagline 整段消失，视觉上是回归 — 已删除空串分支，count<=10 都显示
// 「不定期更新」。
function pickTagline(count) {
  if (count <= 0) return '欢迎';
  if (count <= 10) return '不定期更新';
  return '保持好奇，持续输出';
}

export default function Hero() {
  const count = entryCount();
  const tagline = pickTagline(count);

  // P1-4 改造（父任务 08-18-ux-optimization-suite）：LAST_UPDATED 从硬编码改为派生
  //   - 数据源：lib/entries.js 的 mostRecentDate() 返回最大 date
  //   - 空库时显示「—」，避免误导
  //   - ISO date 字符串（YYYY-MM-DD）字典序与日期序一致，无需 Date 对象参与
  const lastUpdated = mostRecentDate() ?? '—';

  return (
    <header className="relative pt-20 pb-12 md:pt-28 md:pb-16 text-center overflow-hidden">
      {/* 极光漂移：限 Hero 容器内、30s 节奏，aria-hidden 防 AT 朗读 */}
      <AuroraBackdrop intensity="hero" />

      {/* 站名：Fraunces italic + opsz:144（最大光学尺寸，serif 转角戏剧化），editorial 巨幅 */}
      <h1
        className="font-serif italic text-[clamp(3rem,7vw,4.75rem)] leading-[1.05] tracking-tight text-brand-light
                   drop-shadow-[0_0_24px_rgba(167,139,250,0.25)]"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {SITE_NAME}
      </h1>

      {/* 副文案：Plex Sans + mid 色（继承 body font-family） */}
      <p className="mt-5 text-base text-brand-mid">
        熊猫博客 · {count} 篇内容
      </p>

      {/* 动态 tagline：JetBrains Mono + accent 紫 + 紫光文本，heroFade 600ms */}
      <p
        key={count}
        className="mt-3 text-sm font-mono text-brand-accent animate-heroFade
                   [text-shadow:0_0_12px_rgba(167,139,250,0.45)]"
      >
        {tagline}
      </p>

      {/* 时间戳：呼应"夜空下的实时钟"，JetBrains Mono + dim 色（更弱化） */}
      <p className="mt-2 text-xs font-mono text-brand-dim">
        最后更新 · {lastUpdated}
      </p>
    </header>
  );
}