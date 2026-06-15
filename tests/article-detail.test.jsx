// ArticleDetail 组件单测：详情页路由下渲染 iframe + 悬浮返回链接，
// 找不到 slug 时跳回 /articles。用 vi.mock 提供一个测试用文章 fixture，
// 不污染 src/data/articles.js 的生产数据。
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'sample-article',
      title: '示例文章',
      excerpt: '示例',
      date: '2026-06-15',
      tags: ['示例'],
      cover: null,
      content: '<!doctype html><html><body><p>正文</p></body></html>',
      category: 'notes'
    }
  ]
}));

const ArticleDetail = (await import('../src/pages/ArticleDetail.jsx')).default;

function renderAt(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/articles" element={<div data-testid="list">list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ArticleDetail', () => {
  it('renders an iframe for a valid slug', () => {
    const { container } = renderAt('/articles/sample-article');
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
  });

  it('renders the iframe with fullscreen classes and proper sandbox', () => {
    const { container } = renderAt('/articles/sample-article');
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('renders a floating back link to /articles', () => {
    const { container } = renderAt('/articles/sample-article');
    const link = container.querySelector('a[href="/articles"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('返回文章列表');
  });

  it('positions the back link as fixed top-left', () => {
    const { container } = renderAt('/articles/sample-article');
    const link = container.querySelector('a[href="/articles"]');
    expect(link.className).toMatch(/fixed/);
    expect(link.className).toMatch(/top-4/);
    expect(link.className).toMatch(/left-4/);
  });

  it('navigates to /articles when slug is not found', () => {
    const { container } = renderAt('/articles/non-existent-slug');
    // <Navigate> renders nothing; the list route is mounted instead
    const list = container.querySelector('[data-testid="list"]');
    expect(list).not.toBeNull();
  });
});