// Home 页面单测：渲染 Hero（站名 + entry 数）、SearchBar（搜索 + type 切换）、
// 瀑布流卡片 + 过滤行为。
//
// 用 vi.mock 提供稳定 fixture registry；EntryCard 用 useNavigate，需 Router 包裹。
// jsdom 无 IntersectionObserver，useReveal 会降级为立即可见，卡片正常出现在 DOM。
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
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
    {
      slug: 'extra-article',
      title: '亲密关系曲线',
      excerpt: '关于亲密关系的随笔',
      date: '2025-12-01',
      type: 'article',
      tags: ['随笔'],
      cover: null,
      links: null,
      content: '<p>y</p>',
      category: 'notes',
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
    expect(getByText(/3 篇内容/)).not.toBeNull();
  });

  it('渲染所有 entry 卡片（文章 + 项目）', () => {
    const { getByText } = renderHome();
    expect(getByText('首页文章')).not.toBeNull();
    expect(getByText('首页项目')).not.toBeNull();
    expect(getByText('亲密关系曲线')).not.toBeNull();
  });

  it('文章卡显示 category 中文名，项目卡显示 GitHub 外链', () => {
    const { getByText, container } = renderHome();
    expect(getByText('AI')).not.toBeNull(); // ai → 中文名 AI
    expect(getByText('随笔与思考')).not.toBeNull(); // notes → 中文名
    const gh = container.querySelector('a[href="https://example.com"]');
    expect(gh).not.toBeNull();
  });

  it('瀑布流容器使用 CSS columns', () => {
    // P2-26 改造（父任务 08-18-ux-optimization-suite）：断点 sm → md
    //   - 原文期望 sm:columns-2（640px）；新版期望 md:columns-2（768px）
    //   - 640-768px 单列 → 768-1024px 双列，避免单列过宽
    const { container } = renderHome();
    const cols = container.querySelector('.columns-1');
    expect(cols).not.toBeNull();
    expect(cols.className).toMatch(/md:columns-2/);
    expect(cols.className).toMatch(/lg:columns-3/);
    expect(cols.className).toMatch(/2xl:columns-4/);
  });

  it('渲染 SearchBar：搜索框 + 三段 type 切换', () => {
    const { container } = renderHome();
    // 搜索框 input 存在 + aria-label 正确
    const input = container.querySelector('input[type="search"]');
    expect(input).not.toBeNull();
    expect(input.getAttribute('aria-label')).toBe('搜索内容');
    // segmented control：全部 / 文章 / 项目 三段
    const group = container.querySelector('[role="group"][aria-label="按类型筛选"]');
    expect(group).not.toBeNull();
    const buttons = group.querySelectorAll('button');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toBe('全部');
    expect(buttons[1].textContent).toBe('文章');
    expect(buttons[2].textContent).toBe('项目');
    // 默认选中「全部」（aria-pressed=true）
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
  });
});

describe('Home 搜索过滤（与分类正交）', () => {
  it('type 切到「文章」只剩文章卡片（隐藏项目）', () => {
    const { getByText, queryByText, container } = renderHome();
    const group = container.querySelector('[role="group"][aria-label="按类型筛选"]');
    const articleBtn = group.querySelectorAll('button')[1];
    fireEvent.click(articleBtn);
    expect(getByText('首页文章')).not.toBeNull();
    expect(getByText('亲密关系曲线')).not.toBeNull();
    // 项目被过滤
    expect(queryByText('首页项目')).toBeNull();
    // 当前激活态切到「文章」
    expect(articleBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('type 切到「项目」只剩项目卡片（隐藏文章）', () => {
    const { getByText, queryByText, container } = renderHome();
    const group = container.querySelector('[role="group"][aria-label="按类型筛选"]');
    const projectBtn = group.querySelectorAll('button')[2];
    fireEvent.click(projectBtn);
    expect(getByText('首页项目')).not.toBeNull();
    expect(queryByText('首页文章')).toBeNull();
    expect(queryByText('亲密关系曲线')).toBeNull();
  });

  it('搜索 query "亲密" 命中「亲密关系曲线」卡片', () => {
    const { getByText, queryByText, container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.change(input, { target: { value: '亲密' } });
    expect(getByText('亲密关系曲线')).not.toBeNull();
    expect(queryByText('首页文章')).toBeNull();
    expect(queryByText('首页项目')).toBeNull();
  });

  it('搜索不存在的字串显示空状态「没有匹配的内容」', () => {
    const { container, getByText } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.change(input, { target: { value: 'xyz不存在' } });
    expect(getByText('没有匹配的内容')).not.toBeNull();
    // 瀑布流 columns 容器不应渲染（被空态取代）
    expect(container.querySelector('.columns-1')).toBeNull();
  });

  it('query + type 同时生效（AND 关系）', () => {
    const { getByText, queryByText, container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    const group = container.querySelector('[role="group"][aria-label="按类型筛选"]');
    // 切到「文章」+ 输入「首页」→ 仅命中文章类含"首页"的条目（项目摘要含"项目摘要"不命中"首页"）
    fireEvent.click(group.querySelectorAll('button')[1]); // 文章
    fireEvent.change(input, { target: { value: '首页' } });
    expect(getByText('首页文章')).not.toBeNull();
    expect(queryByText('首页项目')).toBeNull();
    expect(queryByText('亲密关系曲线')).toBeNull();
  });

  it('X 清除按钮在 query 非空时出现，点击清空并恢复全部卡片', () => {
    const { container, queryByLabelText, getByText } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.change(input, { target: { value: 'xyz不存在' } });
    // 清除按钮出现
    const clearBtn = queryByLabelText('清除搜索');
    expect(clearBtn).not.toBeNull();
    fireEvent.click(clearBtn);
    // query 清空后全部卡片恢复
    expect(getByText('首页文章')).not.toBeNull();
    expect(getByText('首页项目')).not.toBeNull();
    expect(getByText('亲密关系曲线')).not.toBeNull();
    // input value 已清空
    expect(input.value).toBe('');
  });

  it('Esc 在搜索框聚焦时清空 query', () => {
    const { container, getByText, queryByText } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.change(input, { target: { value: '亲密' } });
    expect(getByText('亲密关系曲线')).not.toBeNull();
    expect(queryByText('首页文章')).toBeNull();
    // Esc → 清空 → 全部恢复
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
    expect(getByText('首页文章')).not.toBeNull();
    expect(getByText('首页项目')).not.toBeNull();
    expect(getByText('亲密关系曲线')).not.toBeNull();
  });

  it('点击 X 清除按钮后 input 仍持有焦点（08-17 F3）', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    // 先让 input 获得焦点并输入触发 X 出现
    input.focus();
    fireEvent.change(input, { target: { value: 'xyz' } });
    const clearBtn = container.querySelector('button[aria-label="清除搜索"]');
    expect(clearBtn).not.toBeNull();
    fireEvent.click(clearBtn);
    // X unmount 后 input 仍应是 activeElement（而非 body）
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('');
  });

  it('过滤到 0 → 清空 → 焦点自动回到第一张卡片（08-17 F4）', async () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    // 过滤到 0：focusedIndex=0，但 length===0 时 effect 早返
    fireEvent.change(input, { target: { value: 'xyz不存在' } });
    expect(container.querySelector('.columns-1')).toBeNull(); // 空态
    // 清空 → length 恢复 → prevLength===0 && currentLength>0 触发自动 focus
    fireEvent.change(input, { target: { value: '' } });
    // flush effect（useEffect 是异步的，jsdom 里需 act flush）
    await act(async () => {});
    // 第一张卡片应自动获得焦点
    const firstCard = container.querySelector('[role="link"]');
    expect(firstCard).not.toBeNull();
    expect(document.activeElement).toBe(firstCard);
  });

  // 父任务 08-18-ux-optimization-suite P0-5/P0-6：useDeferredValue + spinner
  it('搜索走 deferred value（entryCount <= 20 时不显示 spinner）', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.change(input, { target: { value: '首页' } });
    // entryCount fixture = 3（< 20）→ showSearchSpinner 应为 false → 无 Loader2
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  // 父任务 08-18-ux-optimization-suite P1-17：Hero LAST_UPDATED 从 entries 派生
  it('Hero LAST_UPDATED 派生自最新 entry date（2026-06-15 是 fixture 中最大）', () => {
    const { getByText } = renderHome();
    // fixture: 2 篇文章 date 分别为 2026-06-15 和 2025-12-01 → 取最大 2026-06-15
    expect(getByText(/最后更新 · 2026-06-15/)).not.toBeNull();
  });

  // 父任务 08-18-ux-optimization-suite P2-20：tag chip 点击 → 触发搜索
  it('tag chip 点击 → setQuery + 搜索框自动 focus（不触发整卡 navigate）', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    // 找到第一张卡片的第一个 tag chip（fixture 中首页文章 tag=RAG）
    const tagBtn = container.querySelector('button.text-brand-primary');
    expect(tagBtn).not.toBeNull();
    fireEvent.click(tagBtn);
    // input value 应被填充为 tag 文本
    expect(input.value).toBe('RAG');
    // input 应自动 focus（allow user to continue typing）
    expect(document.activeElement).toBe(input);
  });
});