// 文章列表：默认全部；URL 带 :category 时只显示该分类；URL 指向不存在的分类时空状态
import { useParams, Link } from 'react-router-dom';
import { listArticles, listCategories } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  const { category } = useParams();
  const categories = listCategories();
  const categoryMeta = category
    ? categories.find((c) => c.slug === category) ?? null
    : null;
  usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
  const articles = listArticles({ category });
  const categoryExists = !category || !!categoryMeta;

  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-6">文章</h1>
      <CategoryFilter categories={categories} active={category ?? null} />
      {!categoryExists || articles.length === 0 ? (
        <div className="py-12 text-center text-brand-mid">
          <p>该分类下还没有文章。</p>
          <Link
            to="/articles"
            className="inline-block mt-4 text-brand-orange hover:underline"
          >
            查看全部文章
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
