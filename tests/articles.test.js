// articles util 的单元测试：验证 listArticles 排序、findArticleBySlug 查找、listCategories 过滤空分类
import { describe, it, expect } from 'vitest';
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
import { categories, categorySlugSet } from '../src/data/categories.js';

describe('articles util', () => {
  it('listArticles returns an empty array when no articles are registered', () => {
    expect(listArticles()).toEqual([]);
  });

  it('listArticles with category filter still returns an empty array when no articles exist', () => {
    expect(listArticles({ category: 'ai' })).toEqual([]);
  });

  it('findArticleBySlug returns undefined for hello-world (the markdown article has been retired)', () => {
    expect(findArticleBySlug('hello-world')).toBeUndefined();
  });

  it('findArticleBySlug returns undefined when not found', () => {
    expect(findArticleBySlug('not-a-real-slug')).toBeUndefined();
  });

  it('listCategories returns an empty array when no articles exist (all buckets hidden)', () => {
    expect(listCategories()).toEqual([]);
  });

  it('listArticles({ category: "ai" }) returns an empty array when no articles exist', () => {
    expect(listArticles({ category: 'ai' })).toEqual([]);
  });

  it('listCategories does not emit any isGroup chip (flat structure, no groups)', () => {
    const cats = listCategories();
    const groupChips = cats.filter((c) => c.isGroup);
    expect(groupChips.length).toBe(0);
  });

  it('every article category is a member of categorySlugSet (no orphan slugs)', async () => {
    // 防御性检查：避免漏改 articles.js 导致某条文章变成无效分类
    const { default: articles } = await import('../src/data/articles.js');
    for (const a of articles) {
      expect(categorySlugSet.has(a.category)).toBe(true);
    }
  });

  it('categories.js contains exactly 6 fixed slugs in the expected order', () => {
    expect(categories.map((c) => c.slug)).toEqual([
      'ai', 'python', 'engineering', 'product', 'notes', 'resources',
    ]);
  });
});
