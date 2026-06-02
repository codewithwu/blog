// 文章查找工具：从 data 层封装列表与单篇查询，方便测试
import articles from '../data/articles.js';

export function listArticles() {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function findArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}
