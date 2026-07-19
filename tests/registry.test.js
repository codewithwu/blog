// 生产 registry 完整性：不 mock，直接读真实 data，防止漏改 metadata 导致运行时错误。
// 与 entries.test.js 分文件，避免那里的 vi.mock 污染真实数据。
import { describe, it, expect } from 'vitest';
import articles from '../src/data/articles.js';
import projects from '../src/data/projects.js';
import { categorySlugSet } from '../src/data/categories.js';

describe('registry 完整性', () => {
  it('每篇文章 category 是 6 个固定 slug 之一，且 type 为 article', () => {
    for (const a of articles) {
      expect(categorySlugSet.has(a.category)).toBe(true);
      expect(a.type).toBe('article');
    }
  });

  it('每个项目 type 为 project、category 为 null，且有 title/excerpt/tags/content', () => {
    for (const p of projects) {
      expect(p.type).toBe('project');
      expect(p.category).toBeNull();
      expect(typeof p.title).toBe('string');
      expect(typeof p.excerpt).toBe('string');
      expect(Array.isArray(p.tags)).toBe(true);
      expect(typeof p.content).toBe('string');
    }
  });

  it('所有 slug 全局唯一（文章 + 项目）', () => {
    const slugs = [...articles, ...projects].map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
