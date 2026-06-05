// 文章查找工具：从 data 层封装列表与单篇查询，方便测试
import articles from '../data/articles.js';
import { categories, groups } from '../data/categories.js';

// 推导：每个 group 的 members 是 categories.js 中声明了该 group 的所有分类 slug。
// 这样新增/删除 group 成员只动 categories.js，lib 自动跟着变。
const groupMembersBySlug = new Map(
  groups.map((g) => [
    g.slug,
    categories.filter((c) => c.group === g.slug).map((c) => c.slug),
  ])
);

export function listArticles({ category } = {}) {
  if (!category) {
    return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  // group slug (如 'ai') 展开为成员列表；单分类 slug 走 fallback。
  const memberSlugs = groupMembersBySlug.get(category);
  const targetSlugs = memberSlugs ?? [category];
  // 注意：metadata.category 永远是 10 个原 slug 之一（categorySlugSet 守门），
  // targetSlugs 里出现 group slug（'ai'）也不会误匹配，因为没有文章 category === 'ai'。
  const filtered = articles.filter((a) => targetSlugs.includes(a.category));
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

  // 哪些 group 至少有一个成员有文章？(count > 0)
  const groupCounts = new Map();
  for (const c of categories) {
    if (!c.group) continue;
    const cnt = counts.get(c.slug) ?? 0;
    if (cnt > 0) {
      groupCounts.set(c.group, (groupCounts.get(c.group) ?? 0) + cnt);
    }
  }

  const groupBySlug = new Map(groups.map((g) => [g.slug, g]));
  const emittedGroups = new Set();
  const out = [];

  for (const c of categories) {
    if (
      c.group &&
      groupBySlug.has(c.group) &&
      !emittedGroups.has(c.group)
    ) {
      out.push({
        slug: c.group,
        name: groupBySlug.get(c.group).name,
        count: groupCounts.get(c.group) ?? 0,
        isGroup: true,
      });
      emittedGroups.add(c.group);
    }
    if (counts.has(c.slug)) {
      out.push({ slug: c.slug, name: c.name, count: counts.get(c.slug) });
    }
  }
  return out;
}
