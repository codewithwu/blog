// 文章列表：取 listArticles()，按日期降序展示
import { listArticles } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  usePageTitle('文章');
  const articles = listArticles();
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">文章</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
