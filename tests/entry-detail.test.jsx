// EntryDetail 单测：/p/:slug 渲染全屏 iframe + 悬浮「← 返回」按钮，找不到 slug 时跳回 /。
// 用 vi.mock 提供测试 registry，字段形状完整匹配生产 Entry。
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'sample-entry',
      title: '示例内容',
      excerpt: '示例',
      date: '2026-06-15',
      type: 'article',
      tags: ['示例'],
      cover: null,
      links: null,
      content: '<!doctype html><html><body><p>正文</p></body></html>',
      category: 'notes',
    },
  ],
}));

vi.mock('../src/data/projects.js', () => ({ default: [] }));

const EntryDetail = (await import('../src/pages/EntryDetail.jsx')).default;

function renderAt(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/p/:slug" element={<EntryDetail />} />
        <Route path="/" element={<div data-testid="home">home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EntryDetail', () => {
  it('有效 slug 渲染 iframe', () => {
    const { container } = renderAt('/p/sample-entry');
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('iframe 是全屏 + 正确 sandbox（无 same-origin）', () => {
    const { container } = renderAt('/p/sample-entry');
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('渲染固定左上角「← 返回」按钮', () => {
    const { container, getByRole } = renderAt('/p/sample-entry');
    const btn = getByRole('button');
    expect(btn.textContent).toContain('返回');
    expect(btn.className).toMatch(/fixed/);
    expect(btn.className).toMatch(/top-4/);
    expect(btn.className).toMatch(/left-4/);
    // 返回按钮应是 <button>，不是旧的 <a href="/articles">
    expect(container.querySelector('a[href="/articles"]')).toBeNull();
  });

  it('找不到 slug 时 Navigate 回首页', () => {
    const { container } = renderAt('/p/non-existent');
    expect(container.querySelector('[data-testid="home"]')).not.toBeNull();
  });
});
