// articles util 的单元测试：验证 listArticles 排序、findArticleBySlug 查找、listCategories 过滤空分类
import { describe, it, expect } from 'vitest';
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
import { categories, categorySlugSet } from '../src/data/categories.js';

describe('articles util', () => {
  it('listArticles returns array sorted by date desc', () => {
    const list = listArticles();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('findArticleBySlug returns the article when slug matches', () => {
    const article = findArticleBySlug('hello-world');
    expect(article).toBeDefined();
    expect(article.slug).toBe('hello-world');
    expect(article.content).toContain('# 你好，世界');
  });

  it('findArticleBySlug returns undefined when not found', () => {
    expect(findArticleBySlug('not-a-real-slug')).toBeUndefined();
  });

  it('listArticles({ category: "no-such-category" }) returns an empty array', () => {
    expect(listArticles({ category: 'no-such-category' })).toEqual([]);
  });

  it('listCategories returns categories in the fixed order from categories.js, with slug+name+count, hiding empty buckets', () => {
    const cats = listCategories();
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // 当前有文章的分类：ai (7) 和 notes (1)，按 categories.js 声明顺序排列
    expect(cats.map((c) => c.slug)).toEqual(['ai', 'notes']);
    expect(cats[0]).toMatchObject({ slug: 'ai', name: 'AI', count: 7 });
    expect(cats[1]).toMatchObject({ slug: 'notes', name: '随笔与思考', count: 1 });
  });

  it('listCategories omits categories that have zero articles (python / engineering / product / resources)', () => {
    const slugs = listCategories().map((c) => c.slug);
    expect(slugs).not.toContain('python');
    expect(slugs).not.toContain('engineering');
    expect(slugs).not.toContain('product');
    expect(slugs).not.toContain('resources');
  });

  it('listArticles({ category: "ai" }) returns only articles whose category is exactly "ai", date-desc', () => {
    const list = listArticles({ category: 'ai' });
    expect(list.length).toBe(7);
    for (const a of list) {
      expect(a.category).toBe('ai');
    }
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('listArticles({ category: "ai" }) does not include notes or any other category', () => {
    const list = listArticles({ category: 'ai' });
    for (const a of list) {
      expect(a.category).not.toBe('notes');
    }
  });

  it('listArticles({ category: "notes" }) returns exactly the hello-world article', () => {
    const list = listArticles({ category: 'notes' });
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe('hello-world');
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
