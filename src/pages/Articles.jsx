// 文章列表：默认全部；URL 带 :category 时只显示该分类；URL 指向不存在的分类时空状态
import { useParams, Link } from 'react-router-dom';
import { listArticles, listCategories } from '../lib/articles.js';
import { groups } from '../data/categories.js';
import ArticleCard from '../components/ArticleCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  const { category } = useParams();
  const categories = listCategories();
  // categoryMeta 查找：先在 chip 列表（含组 chip）里找；找不到时 fallback 到 groups。
  // chip 列表里没有组条目（组里没有任何分类有文章）的罕见情况：fallback 让页面标题
  // 仍能显示组的中文名（如 'AI 主题 · 文章'），而不是默认的 '文章'——给用户
  // 一个明确的"该组暂无内容"信号，而不是"未知分类"信号。
  // 注：当前所有 AI 分类都有文章，listCategories() 返回的列表一定包含 AI 主题组 chip，所以 fallback 不会触发；
  // 此处保留是为未来可能出现的"空组"路径。
  const categoryMeta = category
    ? categories.find((c) => c.slug === category)
      ?? groups.find((g) => g.slug === category)
      ?? null
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
