// articles util 的单元测试：验证 listArticles 排序、findArticleBySlug 查找
import { describe, it, expect } from 'vitest';
import { findArticleBySlug, findCategory, listArticles, listCategories } from '../src/lib/articles.js';

describe('articles util', () => {
  it('listArticles returns array sorted by date desc', () => {
    const list = listArticles();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    // 检查日期降序
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

  it('listArticles({ category: "claude" }) returns only that category, sorted by date desc', () => {
    const list = listArticles({ category: 'claude' });
    expect(list.length).toBeGreaterThan(0);
    for (const a of list) {
      expect(a.category).toBe('claude');
    }
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('listArticles({ category: "no-such-category" }) returns an empty array', () => {
    expect(listArticles({ category: 'no-such-category' })).toEqual([]);
  });

  it('listCategories returns each category with its article count, sorted by count desc', () => {
    const cats = listCategories();
    expect(cats.length).toBeGreaterThan(0);
    // Every entry has slug and count
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // Sorted by count desc
    for (let i = 0; i < cats.length - 1; i++) {
      expect(cats[i].count >= cats[i + 1].count).toBe(true);
    }
    // Currently only 'claude' is categorized (after Task 1)
    expect(cats.find((c) => c.slug === 'claude')?.count).toBe(1);
  });

  it('findCategory returns {slug, count} for a known category', () => {
    const c = findCategory('claude');
    expect(c).toEqual({ slug: 'claude', count: 1 });
  });

  it('findCategory returns null for an unknown category', () => {
    expect(findCategory('no-such-category')).toBeNull();
  });
});
