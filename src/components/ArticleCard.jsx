// 文章卡片：外层用 div + onClick + useNavigate 整体可点；category 徽章作为嵌套 Link 跳转分类页
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ArticleCard({ article }) {
  const navigate = useNavigate();
  const go = useCallback(() => navigate(`/articles/${article.slug}`), [navigate, article.slug]);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); }}
      className="group block p-6 rounded-xl bg-brand-surface border border-brand-mid/20
                 hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                 transition-all duration-300 cursor-pointer"
    >
      <h3 className="text-xl font-semibold text-brand-light group-hover:text-brand-orange">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-brand-mid">{article.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <time className="text-brand-mid">{article.date}</time>
        <ul className="flex flex-wrap gap-2 items-center">
          {article.category && (
            <li>
              <Link
                to={`/articles/category/${article.category}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange
                           hover:bg-brand-orange/25 transition-colors"
              >
                {article.category}
              </Link>
            </li>
          )}
          {article.tags.map((t) => (
            <li
              key={t}
              className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
