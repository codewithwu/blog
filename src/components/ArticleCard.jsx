// 文章卡片：标题、摘要、日期、标签，点击进入详情
import { Link } from 'react-router-dom';

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block p-6 rounded-xl bg-brand-surface border border-brand-mid/20
                 hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                 transition-all duration-300"
    >
      <h3 className="text-xl font-semibold text-brand-light group-hover:text-brand-orange">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-brand-mid">{article.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <time className="text-brand-mid">{article.date}</time>
        <ul className="flex gap-2">
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
    </Link>
  );
}
