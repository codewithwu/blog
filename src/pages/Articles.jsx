// 文章列表：默认全部；URL 带 :category 时只显示该分类；URL 指向不存在的分类时空状态
import { useParams, Link } from 'react-router-dom';
import { listArticles, listCategories } from '../lib/articles.js';
import { groups } from '../data/categories.js';
import ArticleCard from '../components/ArticleCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  const { category } = useParams();
  const chips = listCategories();
  // categoryMeta 查找：先在 chip 列表（含组 chip）里找；找不到时 fallback 到 groups，
  // 让 group slug（'ai'）也能拿到中文显示名用于页面标题。
  // chip 列表已经包含组条目，所以正常情况下第一个 find 就命中；
  // groups.find fallback 是为防御未来直接传 group slug 但 listCategories 顺序变化等边界情况。
  const categoryMeta = category
    ? chips.find((c) => c.slug === category)
      ?? groups.find((g) => g.slug === category)
      ?? null
    : null;
  usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
  const articles = listArticles({ category });
  const categoryExists = !category || !!categoryMeta;

  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-6">文章</h1>
      <CategoryFilter categories={chips} active={category ?? null} />
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
