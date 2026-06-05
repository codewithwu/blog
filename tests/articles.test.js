// articles util 的单元测试：验证 listArticles 排序、findArticleBySlug 查找
import { describe, it, expect } from 'vitest';
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
import { categories } from '../src/data/categories.js';

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

  it('listCategories returns categories in the fixed order from categories.js, with slug+name+count, hiding empty buckets', () => {
    const cats = listCategories();
    // Every entry has slug (string), name (string), count (number > 0)
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // Order matches categories.js. NOTE: the spec text named "claude" as one of
    // the expected slugs, but `claude` is intentionally not in categories.js
    // (Task 9 will migrate the lone claude article away). The new
    // listCategories iterates categories.js, so `claude` is dropped as an
    // orphan — only `llm`, `rag`, and `agent` survive.
    const slugsInOrder = cats.map((c) => c.slug);
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'notes', 'prompt', 'tool'].includes(c.slug))
      .map((c) => c.slug);
    expect(slugsInOrder).toEqual(expectedOrder);
    // Counts are correct for the canonical categories
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.count]));
    expect(bySlug.llm).toBe(2);
    expect(bySlug.agent).toBe(1);
    expect(bySlug.rag).toBe(1);
    // Names are looked up from categories.js
    const llm = cats.find((c) => c.slug === 'llm');
    expect(llm.name).toBe('LLM 原理与基础');
  });

  it('listCategories omits categories that have zero articles (no "prompt" / "notes" etc. yet)', () => {
    const cats = listCategories();
    const slugs = cats.map((c) => c.slug);
    // None of the empty buckets should appear
    expect(slugs).not.toContain('industry');
    expect(slugs).not.toContain('engineering');
    expect(slugs).not.toContain('product');
    expect(slugs).not.toContain('resources');
  });
});
