// EntryDetail 单测：/p/:slug 渲染全屏 iframe + 悬浮「← 返回」按钮 + OG/Twitter meta，
// 找不到 slug 时跳回 /。
// 用 vi.mock 提供测试 registry，字段形状完整匹配生产 Entry。
//
// HelmetProvider 是 react-helmet-async 的强制依赖（CLAUDE.md 规则 6 + 生产 main.jsx
// 也已包裹）；测试里也必须包，否则 <Helmet> 会 throw「Cannot read properties of
// undefined (reading 'add')」。
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, HelmetData } from 'react-helmet-async';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'sample-entry',
      title: '示例内容',
      excerpt: '示例摘要文本',
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

// 每个测试独立 HelmetProvider + HelmetData 上下文（避免 meta 在不同测试间串台）
// HelmetData 是 react-helmet-async 提供的测试钩子，承载当前已注入的 meta 状态
// 用 async act 包裹 render，flush 掉 Html 组件 effect 内的 rAF setLoading 触发，
// 避免 React 18 act() warning（详见 tests/html.test.jsx 同名注释）
async function renderAt(initialPath) {
  const helmetData = new HelmetData({});
  let result;
  await act(async () => {
    result = render(
      <HelmetProvider context={helmetData}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/p/:slug" element={<EntryDetail />} />
            <Route path="/" element={<div data-testid="home">home</div>} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );
  });
  return { ...result, helmetData };
}

afterEach(() => {
  cleanup();
  // 清掉 Helmet 注入到 <head> 的 meta，避免跨测试污染
  document.head.querySelectorAll('meta[data-rh]').forEach((n) => n.remove());
  document.head.querySelectorAll('title[data-rh]').forEach((n) => n.remove());
});

// Html 组件内部 useEffect 用 requestAnimationFrame 兜底隐藏 shimmer 占位。
// jsdom 的 rAF 是异步的（~16ms），若不 mock 会让 React 在 render 返回后再
// 触发 state update，触发 act() warning。这里把 rAF 同步化，让 effect 在
// render 期间就完成，让测试更稳定（也契合「srcDoc 极快渲染」的语义）。
beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

describe('EntryDetail', () => {
  it('有效 slug 渲染 iframe', async () => {
    const { container } = await renderAt('/p/sample-entry');
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('iframe 是全屏 + 正确 sandbox（无 same-origin）', async () => {
    const { container } = await renderAt('/p/sample-entry');
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('渲染固定左上角「← 返回」按钮', async () => {
    const { container, getByRole } = await renderAt('/p/sample-entry');
    const btn = getByRole('button');
    expect(btn.textContent).toContain('返回');
    expect(btn.className).toMatch(/fixed/);
    expect(btn.className).toMatch(/top-4/);
    expect(btn.className).toMatch(/left-4/);
    // 返回按钮应是 <button>，不是旧的 <a href="/articles">
    expect(container.querySelector('a[href="/articles"]')).toBeNull();
    // a11y：按钮应带 aria-label="返回首页"，让屏幕阅读器朗读更明确
    expect(btn.getAttribute('aria-label')).toBe('返回首页');
  });

  it('找不到 slug 时 Navigate 回首页', async () => {
    const { container } = await renderAt('/p/non-existent');
    expect(container.querySelector('[data-testid="home"]')).not.toBeNull();
  });

  it('注入 OG / Twitter Card meta（Helmet）', async () => {
    await renderAt('/p/sample-entry');
    // react-helmet-async 是异步注入（setState in useEffect），用 waitFor 等 meta 出现
    await waitFor(() => {
      const ogTitle = document.head.querySelector('meta[property="og:title"]');
      expect(ogTitle?.getAttribute('content')).toBe('示例内容');
    });
    const ogImage = document.head.querySelector('meta[property="og:image"]');
    const twitterCard = document.head.querySelector('meta[name="twitter:card"]');
    expect(ogImage?.getAttribute('content')).toMatch(/\/og-default\.png$/);
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
  });
});
