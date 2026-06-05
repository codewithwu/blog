// 文章查找工具：从 data 层封装列表与单篇查询，方便测试
import articles from '../data/articles.js';
import { categories } from '../data/categories.js';

export function listArticles({ category } = {}) {
  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;
  return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function findArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}

export function listCategories() {
  const counts = new Map();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return categories
    .filter((c) => counts.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, count: counts.get(c.slug) }));
}
