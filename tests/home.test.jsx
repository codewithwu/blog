// Home 页面单测：渲染 Hero（站名 + entry 数）与瀑布流卡片。
// 用 vi.mock 提供稳定 fixture registry。EntryCard 用 useNavigate，需要 Router 包裹。
// jsdom 无 IntersectionObserver，useReveal 会降级为立即可见，卡片正常出现在 DOM。
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'home-article',
      title: '首页文章',
      excerpt: '摘要',
      date: '2026-06-15',
      type: 'article',
      tags: ['RAG'],
      cover: null,
      links: null,
      content: '<p>x</p>',
      category: 'ai',
    },
  ],
}));

vi.mock('../src/data/projects.js', () => ({
  default: [
    {
      slug: 'home-project',
      title: '首页项目',
      excerpt: '项目摘要',
      date: '1970-01-01',
      type: 'project',
      category: null,
      tags: ['TS'],
      cover: null,
      links: { github: 'https://example.com', demo: null },
      content: '<p>y</p>',
    },
  ],
}));

const Home = (await import('../src/pages/Home.jsx')).default;

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Home />
    </MemoryRouter>
  );
}

describe('Home 瀑布流首页', () => {
  it('渲染站名与 entry 总数', () => {
    const { getByText } = renderHome();
    expect(getByText('Cool Panda')).not.toBeNull();
    expect(getByText(/2 篇内容/)).not.toBeNull();
  });

  it('渲染所有 entry 卡片（文章 + 项目）', () => {
    const { getByText } = renderHome();
    expect(getByText('首页文章')).not.toBeNull();
    expect(getByText('首页项目')).not.toBeNull();
  });

  it('文章卡显示 category 中文名，项目卡显示 GitHub 外链', () => {
    const { getByText, container } = renderHome();
    expect(getByText('AI')).not.toBeNull(); // ai → 中文名 AI
    const gh = container.querySelector('a[href="https://example.com"]');
    expect(gh).not.toBeNull();
  });

  it('瀑布流容器使用 CSS columns', () => {
    const { container } = renderHome();
    const cols = container.querySelector('.columns-1');
    expect(cols).not.toBeNull();
    expect(cols.className).toMatch(/sm:columns-2/);
    expect(cols.className).toMatch(/lg:columns-3/);
  });
});
