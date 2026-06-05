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
    // 期望顺序：AI 主题组 chip 在第一位，然后是 5 个有文章的 AI 子分类（按 categories.js 顺序），
    // 最后是 notes。
    // 'industry' 没有文章，所以不出现在 AI 子分类里。
    const expectedOrder = [
      'ai',
      ...categories
        .filter((c) => c.group === 'ai' && ['llm', 'prompt', 'rag', 'agent', 'tool'].includes(c.slug))
        .map((c) => c.slug),
      'notes',
    ];
    expect(slugsInOrder).toEqual(expectedOrder);
    // First chip must be the group, with isGroup: true
    expect(cats[0].slug).toBe('ai');
    expect(cats[0].isGroup).toBe(true);
    expect(cats[0].name).toBe('AI 主题');
    expect(cats[0].count).toBe(7);
    // Counts are correct for the canonical categories
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.count]));
    expect(bySlug.llm).toBe(2);
    expect(bySlug.agent).toBe(1);
    expect(bySlug.rag).toBe(1);
    expect(bySlug.tool).toBe(2);
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

  it('listArticles({ category: "ai" }) returns the union of all 6 AI sub-categories, date-desc', () => {
    const list = listArticles({ category: 'ai' });
    // 7 articles total: 2 llm + 1 prompt + 1 rag + 1 agent + 2 tool = 7
    expect(list.length).toBe(7);
    // Every returned article has a category in the AI group
    for (const a of list) {
      expect(['llm', 'prompt', 'rag', 'agent', 'tool']).toContain(a.category);
    }
    // Sorted by date desc
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('listArticles({ category: "ai" }) does not include notes or non-AI categories', () => {
    const list = listArticles({ category: 'ai' });
    for (const a of list) {
      expect(a.category).not.toBe('notes');
      expect(a.category).not.toBe('ai');  // 'ai' is a group slug, never a metadata.category value
    }
  });

  it('listCategories emits the AI group chip exactly once, even with 6 group members', () => {
    const cats = listCategories();
    const groupChips = cats.filter((c) => c.isGroup);
    expect(groupChips.length).toBe(1);
    expect(groupChips[0].slug).toBe('ai');
    // The group chip's count equals the sum of its members' counts
    const memberSlugs = ['llm', 'prompt', 'rag', 'agent', 'tool'];
    const memberCounts = cats
      .filter((c) => memberSlugs.includes(c.slug))
      .map((c) => c.count);
    const sumOfMembers = memberCounts.reduce((s, n) => s + n, 0);
    expect(groupChips[0].count).toBe(sumOfMembers);
  });
});
