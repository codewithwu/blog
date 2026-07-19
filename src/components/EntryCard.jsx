// EntryCard：文章 / 项目 统一卡片（"深海夜空"基调）。
//
// 设计目标（见 design.md §3 / D-8）：
//   - 玻璃态卡片：bg-brand-surface/85 + backdrop-blur-sm + border-brand-border/60。
//   - hover 抬升（保留）+ 双层紫青 box-shadow 发光 + 边框变 primary。
//   - focus 蓝色发光环（取代原 orange ring）。
//   - fallback 渐变替换为紫 / 蓝 / 青（呼应 D-2 色板），不含 orange / green。
//   - category chip 紫，tag chip 蓝，项目外链 hover 转 glow。
//
// 交互：
//   - 整卡 role="link" + tabIndex=0 + Enter/Space 键盘可达（CLAUDE.md 规则 a11y）。
//   - 项目 GitHub / Demo 用 <a> 嵌套，stopPropagation 避免连带触发整卡跳转。
//   - 入场动效用 useReveal：进入视口时 opacity/translate 过渡一次。
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Wrench, Github, ExternalLink } from 'lucide-react';
import { categories } from '../data/categories.js';
import useReveal from '../hooks/useReveal.js';

export default function EntryCard({ entry }) {
  const navigate = useNavigate();
  const [ref, visible] = useReveal();
  const go = useCallback(() => navigate(`/p/${entry.slug}`), [navigate, entry.slug]);

  const isArticle = entry.type === 'article';
  // 分类中文名唯一来源是 categories.js（CLAUDE.md 规则 5）
  const categoryName = entry.category
    ? categories.find((c) => c.slug === entry.category)?.name ?? entry.category
    : null;

  return (
    <div
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          go();
        }
      }}
      className={`group block overflow-hidden rounded-xl
                  bg-brand-surface/85 backdrop-blur-sm
                  border border-brand-border/60
                  hover:-translate-y-0.5 hover:border-brand-primary/50
                  hover:shadow-[0_0_0_1px_rgba(91,141,239,0.4),0_8px_32px_-8px_rgba(167,139,250,0.35)]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
                  focus-visible:shadow-[0_0_12px_rgba(76,201,240,0.45)]
                  transition-all duration-[250ms] ease-out cursor-pointer
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      // 入场过渡（400ms ease-out）与 hover 过渡（250ms）分工不同，
      // 这里显式覆写为入场时长，hover 由上面的 duration-[250ms] 负责
      style={{ transitionDuration: visible ? undefined : '400ms' }}
    >
      {/* 封面区：有 cover 渲染图，无 cover 用紫蓝青渐变 + 标题首字母兜底 */}
      {entry.cover ? (
        <img
          src={entry.cover}
          alt=""
          className="w-full aspect-video object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-video
                        bg-gradient-to-br from-brand-accent/25 via-brand-primary/20 to-brand-glow/25
                        flex items-center justify-center text-3xl font-bold text-brand-light/70">
          {entry.title.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="p-5">
        {/* type 徽章 + date（项目隐藏 date） */}
        <div className="flex items-center gap-2 text-xs text-brand-mid">
          <span className="inline-flex items-center gap-1">
            {isArticle ? <FileText size={13} /> : <Wrench size={13} />}
            {isArticle ? '文章' : '项目'}
          </span>
          {isArticle && (
            <>
              <span aria-hidden>·</span>
              <time>{entry.date}</time>
            </>
          )}
        </div>

        {/* 标题：Fraunces（h3 全局字体），hover 转 glow + 紫光 */}
        <h3 className="mt-2 text-lg font-semibold text-brand-light
                       group-hover:text-brand-glow transition-colors
                       group-hover:drop-shadow-[0_0_8px_rgba(76,201,240,0.35)]">
          {entry.title}
        </h3>

        {/* excerpt：最多 3 行截断 */}
        <p className="mt-2 text-sm text-brand-mid line-clamp-3">{entry.excerpt}</p>

        {/* 底部条：category chip（仅文章） + tags */}
        <ul className="mt-4 flex flex-wrap gap-2 items-center text-xs">
          {categoryName && (
            <li className="px-2 py-0.5 rounded bg-brand-accent/15 text-brand-accent">
              {categoryName}
            </li>
          )}
          {entry.tags.map((t) => (
            <li key={t} className="px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary">
              {t}
            </li>
          ))}
        </ul>

        {/* 项目外链：GitHub / Demo（仅项目且 links 存在时渲染） */}
        {!isArticle && entry.links && (
          <div className="mt-4 flex gap-3 text-sm">
            {entry.links.github && (
              <a
                href={entry.links.github}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-glow transition-colors"
              >
                <Github size={16} /> GitHub
              </a>
            )}
            {entry.links.demo && (
              <a
                href={entry.links.demo}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-glow transition-colors"
              >
                <ExternalLink size={16} /> Demo
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}