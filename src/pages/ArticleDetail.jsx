// 文章详情：从 URL 取 slug，查文章，渲染 markdown
import { useParams, Link } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Markdown from '../lib/markdown.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);
  usePageTitle(article?.title || '未找到文章');

  if (!article) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-3xl font-bold text-brand-light">文章不存在</h1>
        <Link to="/articles" className="mt-4 inline-block text-brand-blue hover:text-brand-orange">
          ← 返回文章列表
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/articles" className="text-sm text-brand-blue hover:text-brand-orange">
        ← 返回
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-brand-light">{article.title}</h1>
      <div className="mt-2 flex items-center gap-3 text-sm text-brand-mid">
        <time>{article.date}</time>
        <ul className="flex gap-2">
          {article.tags.map((t) => (
            <li key={t} className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <Markdown>{article.content}</Markdown>
      </div>
    </article>
  );
}
