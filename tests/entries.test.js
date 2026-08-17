// entries util 单元测试：合并 articles + projects → 统一 Entry，排序、类型断言、slug 查找。
// 用 vi.mock 提供稳定 fixture registry，不依赖生产内容数量（避免内容漂移导致测试脆弱）。
import { describe, it, expect, vi } from 'vitest';
import { categories, categorySlugSet } from '../src/data/categories.js';

// mock 必须在动态 import 被测模块之前声明（见 testing-and-quality.md）。
// 字段形状完整匹配生产 metadata（articles.js / projects.js）。
vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'a-old',
      title: '旧文章',
      excerpt: '较早的文章',
      date: '2024-01-01',
      type: 'article',
      tags: ['x'],
      cover: null,
      links: null,
      content: '<p>old</p>',
      category: 'ai',
    },
    {
      slug: 'a-new',
      title: '新文章',
      excerpt: '较新的文章',
      date: '2026-06-15',
      type: 'article',
      tags: ['y'],
      cover: null,
      links: null,
      content: '<p>new</p>',
      category: 'notes',
    },
  ],
}));

vi.mock('../src/data/projects.js', () => ({
  default: [
    {
      slug: 'proj-1',
      title: '示例项目',
      excerpt: '一个项目',
      date: '1970-01-01',
      type: 'project',
      category: null,
      tags: ['ts'],
      cover: null,
      links: { github: 'https://example.com', demo: null },
      content: '<p>project</p>',
    },
  ],
}));

const { listEntries, findEntryBySlug, entryCount, findNeighbors } = await import('../src/lib/entries.js');

describe('entries util', () => {
  it('listEntries 合并文章与项目', () => {
    const list = listEntries();
    expect(list.length).toBe(3);
    const types = list.map((e) => e.type).sort();
    expect(types).toEqual(['article', 'article', 'project']);
  });

  it('listEntries 按 date 降序排序，项目（1970）沉底', () => {
    const slugs = listEntries().map((e) => e.slug);
    expect(slugs).toEqual(['a-new', 'a-old', 'proj-1']);
  });

  it('findEntryBySlug 命中文章', () => {
    const e = findEntryBySlug('a-new');
    expect(e).toBeDefined();
    expect(e.type).toBe('article');
    expect(e.category).toBe('notes');
  });

  it('findEntryBySlug 命中项目并保留 links', () => {
    const e = findEntryBySlug('proj-1');
    expect(e).toBeDefined();
    expect(e.type).toBe('project');
    expect(e.category).toBeNull();
    expect(e.links.github).toBe('https://example.com');
  });

  it('findEntryBySlug miss 返回 undefined', () => {
    expect(findEntryBySlug('not-real')).toBeUndefined();
  });

  it('entryCount 等于合并总数', () => {
    expect(entryCount()).toBe(3);
  });

  it('文章 category 必须属于 6 个固定 slug', () => {
    for (const e of listEntries()) {
      if (e.type === 'article') {
        expect(categorySlugSet.has(e.category)).toBe(true);
      }
    }
  });

  // findNeighbors 语义：prev = 时间上更早（older），next = 时间上更新（newer）。
  // fixture 顺序：listEntries() desc = [a-new(2026-06-15), a-old(2024-01-01), proj-1(1970)]
  // - a-new 是最新的 → prev = a-old，next = null
  // - a-old 在中间 → prev = proj-1，next = a-new
  // - proj-1 是最老的（含 project 沉底）→ prev = null，next = a-old
  it('findNeighbors 最新文章：prev = 更老的邻居，next = null', () => {
    const n = findNeighbors('a-new');
    expect(n).not.toBeNull();
    expect(n.current.slug).toBe('a-new');
    expect(n.prev.slug).toBe('a-old'); // 时间更早（2024 < 2026）
    expect(n.next).toBeNull();          // 没有比 2026-06-15 更新的
  });

  it('findNeighbors 中间文章：双向都有邻居', () => {
    const n = findNeighbors('a-old');
    expect(n).not.toBeNull();
    expect(n.current.slug).toBe('a-old');
    expect(n.prev.slug).toBe('proj-1'); // 时间更早（1970 < 2024）
    expect(n.next.slug).toBe('a-new');   // 时间更新（2026 > 2024）
  });

  it('findNeighbors 项目（最老，沉底）：prev = null，next = 更新的邻居', () => {
    const n = findNeighbors('proj-1');
    expect(n).not.toBeNull();
    expect(n.current.slug).toBe('proj-1');
    expect(n.prev).toBeNull();        // 没有比 1970-01-01 更老的
    expect(n.next.slug).toBe('a-old'); // 时间更新（2024 > 1970）
  });

  it('findNeighbors miss 返回 null', () => {
    expect(findNeighbors('not-real')).toBeNull();
  });
});

describe('categories registry（固定集合，与旧 articles.test.js 合同一致）', () => {
  it('categories.js 恰好包含 6 个固定 slug，顺序固定', () => {
    expect(categories.map((c) => c.slug)).toEqual([
      'ai', 'python', 'engineering', 'product', 'notes', 'resources',
    ]);
  });
});
