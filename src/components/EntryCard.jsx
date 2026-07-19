// EntryCard：文章 / 项目 统一卡片。
//
// 设计目标（见 design.md §5）：文章与项目共用一张卡，靠 type 徽章 / category chip /
// links 图标区分来源，视觉上克制——极弱边框 + 轻微 hover 抬升，符合"极简留白"基调。
//
// 交互：
//   - 整卡可点击跳详情页 /p/:slug（用 useNavigate，参考旧 ArticleCard 的 role="link" 模式，
//     保证键盘可达）。
//   - 项目的 GitHub / Demo 外链是卡内嵌套 <a>，点击时 stopPropagation，避免连带触发整卡跳转。
//   - 入场动效由 useReveal 控制：进入视口时 opacity/translate 过渡一次。
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
  // 分类中文名唯一来源是 categories.js（CLAUDE.md 规则 12）
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
      className={`group block overflow-hidden rounded-xl bg-brand-surface
                  border border-brand-mid/10
                  hover:-translate-y-0.5 hover:shadow-md hover:border-brand-mid/20
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark
                  transition-all duration-[250ms] ease-out cursor-pointer
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      // 入场过渡（400ms ease-out）与 hover 过渡（250ms）分工不同，
      // 这里显式覆写为入场时长，hover 由上面的 duration-[250ms] 负责
      style={{ transitionDuration: visible ? undefined : '400ms' }}
    >
      {/* 封面区：有 cover 渲染图，无 cover 用品牌渐变 + 标题首字母兜底（沿用旧 ProjectCard 逻辑） */}
      {entry.cover ? (
        <img
          src={entry.cover}
          alt=""
          className="w-full aspect-video object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-brand-orange/30 via-brand-blue/20 to-brand-green/30
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

        {/* 标题：Poppins（h3 全局字体），hover 转 brand-orange */}
        <h3 className="mt-2 text-lg font-semibold text-brand-light group-hover:text-brand-orange transition-colors">
          {entry.title}
        </h3>

        {/* excerpt：最多 3 行截断 */}
        <p className="mt-2 text-sm text-brand-mid line-clamp-3">{entry.excerpt}</p>

        {/* 底部条：category chip（仅文章） + tags */}
        <ul className="mt-4 flex flex-wrap gap-2 items-center text-xs">
          {categoryName && (
            <li className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange">
              {categoryName}
            </li>
          )}
          {entry.tags.map((t) => (
            <li key={t} className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue">
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
                className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange"
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
                className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange"
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
