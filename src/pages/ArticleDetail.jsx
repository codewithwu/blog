// 文章详情：URL :slug → 查文章，渲染悬浮「返回文章列表」按钮 + 100vh iframe。
// Navbar 在 App.jsx 的路由级逻辑下隐藏，详情页 viewport 完全让给 iframe。
// 找不到 slug 时 <Navigate replace /> 跳回 /articles。
import { useParams, Link, Navigate } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);
  usePageTitle(article?.title || '未找到文章');

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <>
      <Link
        to="/articles"
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm
                   bg-brand-dark/70 text-brand-light
                   border border-brand-mid/30
                   backdrop-blur-sm
                   hover:bg-brand-dark/90 hover:border-brand-orange/60
                   transition-colors"
      >
        ← 返回文章列表
      </Link>
      <Html html={article.content} title={article.title} />
    </>
  );
}
