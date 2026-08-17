// Home 键盘快捷键单测（j/k/Enter + /）：
//   - j 焦点下移、k 焦点上移，首尾环形
//   - Enter 跳转到 /p/:slug（MemoryRouter 通过 initialEntries + 当前路径验证）
//   - / 键聚焦搜索框，且不写入字符
//   - 输入框聚焦时 j/k/Enter 全部禁用
//   - 带 Cmd/Ctrl/Alt 时不劫持
//
// 测试入口：用 vitest 自带的 fireEvent.keyDown 在 window 上派发 keydown，
// 与 useKeyboardShortcuts 内部 window.addEventListener('keydown') 对应。
//
// 数据与 home.test.jsx 复用同一 fixture（vi.mock articles / projects）；
// 这里独立文件，避免 home.test.jsx 越改越长。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'kbd-article-1',
      title: '键盘一',
      excerpt: 'A',
      date: '2026-06-15',
      type: 'article',
      tags: ['A'],
      cover: null,
      links: null,
      content: '<p>1</p>',
      category: 'ai',
    },
    {
      slug: 'kbd-article-2',
      title: '键盘二',
      excerpt: 'B',
      date: '2026-05-15',
      type: 'article',
      tags: ['B'],
      cover: null,
      links: null,
      content: '<p>2</p>',
      category: 'ai',
    },
    {
      slug: 'kbd-article-3',
      title: '键盘三',
      excerpt: 'C',
      date: '2026-04-15',
      type: 'article',
      tags: ['C'],
      cover: null,
      links: null,
      content: '<p>3</p>',
      category: 'ai',
    },
  ],
}));

vi.mock('../src/data/projects.js', () => ({
  default: [
    {
      slug: 'kbd-project-1',
      title: '键盘项目',
      excerpt: 'P',
      date: '1970-01-01',
      type: 'project',
      category: null,
      tags: ['TS'],
      cover: null,
      links: null,
      content: '<p>p</p>',
    },
  ],
}));

const Home = (await import('../src/pages/Home.jsx')).default;

function renderHome(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Home />
    </MemoryRouter>
  );
}

// 渲染时同步把当前 location.pathname 写到 data-path 属性上，便于断言导航结果。
// MemoryRouter 不动 window.location，所以走自定义探针。
function LocationProbe({ children }) {
  const location = useLocation();
  return (
    <div data-path={location.pathname} data-hash={location.hash}>
      {children}
    </div>
  );
}

function renderHomeWithProbe(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationProbe>
        <Home />
      </LocationProbe>
    </MemoryRouter>
  );
}

// 找到当前 focused 卡片的 DOM 节点（带强制 ring-brand-glow）。
// 我们把"焦点卡"实现为强制 ring-2 ring-brand-glow（不依赖 :focus-visible），
// 用 className 匹配定位。
// 注意：所有卡片都带 `focus-visible:ring-brand-glow`（Tab/鼠标聚焦时的语义环），
// 所以单匹配 ring-brand-glow 不够；必须区分"无条件 ring-brand-glow"。
// 强制版包含 "ring-2 ring-brand-glow"（无 focus-visible: 前缀），
// 而默认版是 "focus-visible:ring-2 focus-visible:ring-brand-glow"。
// 用 negative lookbehind `(?<!focus-visible:)` 排除被前缀污染的位置。
function findFocusedCard(container) {
  const cards = container.querySelectorAll('[role="link"]');
  return (
    Array.from(cards).find((el) =>
      /(?<!focus-visible:)\bring-brand-glow\b/.test(el.className)
    ) ?? null
  );
}

describe('Home 键盘快捷键（j/k/Enter + /）', () => {
  beforeEach(() => {
    // 每次测试前清空 body，避免上一轮 focus 残留影响
    document.body.innerHTML = '';
  });

  it('初始焦点在第一张卡（强制 ring 视觉）', () => {
    const { container } = renderHome();
    const focused = findFocusedCard(container);
    expect(focused).not.toBeNull();
    // 第一张卡 title = 键盘一
    expect(focused.textContent).toContain('键盘一');
  });

  it('按 j：焦点下移', () => {
    const { container } = renderHome();
    fireEvent.keyDown(window, { key: 'j' });
    const focused = findFocusedCard(container);
    expect(focused).not.toBeNull();
    expect(focused.textContent).toContain('键盘二');
  });

  it('在最后一张按 j：环形回到第一张', () => {
    const { container } = renderHome();
    // fixture 有 4 张：3 articles + 1 project
    fireEvent.keyDown(window, { key: 'j' }); // 1
    fireEvent.keyDown(window, { key: 'j' }); // 2
    fireEvent.keyDown(window, { key: 'j' }); // 3（项目）
    const last = findFocusedCard(container);
    expect(last.textContent).toContain('键盘项目');
    fireEvent.keyDown(window, { key: 'j' }); // 环形回 0
    const wrapped = findFocusedCard(container);
    expect(wrapped.textContent).toContain('键盘一');
  });

  it('按 k：焦点上移', () => {
    const { container } = renderHome();
    fireEvent.keyDown(window, { key: 'k' });
    const focused = findFocusedCard(container);
    expect(focused).not.toBeNull();
    // 从 0 上移 → 末尾
    expect(focused.textContent).toContain('键盘项目');
  });

  it('在第一张按 k：环形到最后一张', () => {
    const { container } = renderHome();
    fireEvent.keyDown(window, { key: 'k' });
    const focused = findFocusedCard(container);
    expect(focused.textContent).toContain('键盘项目');
  });

  it('按 /：搜索框获得焦点，且不写入字符', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe(''); // / 不被写入
  });

  it('搜索框聚焦时按 j/k：不切换焦点卡片', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'j' }); // 在 input 上派发，确保守卫生效
    const focused = findFocusedCard(container);
    expect(focused.textContent).toContain('键盘一'); // 仍是第一张
  });

  it('带 Ctrl 修饰键时 j 不劫持', () => {
    const { container } = renderHome();
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    const focused = findFocusedCard(container);
    expect(focused.textContent).toContain('键盘一'); // 不变
  });

  it('带 Meta 修饰键时 k 不劫持', () => {
    const { container } = renderHome();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const focused = findFocusedCard(container);
    expect(focused.textContent).toContain('键盘一');
  });

  it('带 Alt 修饰键时 / 不劫持（且不 focus 搜索框）', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    fireEvent.keyDown(window, { key: '/', altKey: true });
    expect(document.activeElement).not.toBe(input);
  });

  it('Enter 触发导航（焦点卡为「键盘三」→ pathname 变 /p/kbd-article-3）', () => {
    const { container } = renderHomeWithProbe();
    expect(container.querySelector('[data-path]').getAttribute('data-path')).toBe('/');
    fireEvent.keyDown(window, { key: 'j' }); // 0 → 1（键盘二）
    fireEvent.keyDown(window, { key: 'j' }); // 1 → 2（键盘三）
    fireEvent.keyDown(window, { key: 'Enter' });
    // Home 用 useNavigate('/p/<slug>')，MemoryRouter 会同步把 pathname 切过去
    expect(container.querySelector('[data-path]').getAttribute('data-path')).toBe(
      '/p/kbd-article-3'
    );
  });

  it('输入框聚焦时按 Enter 不导航', () => {
    const { container } = renderHomeWithProbe();
    const input = container.querySelector('input[type="search"]');
    input.focus();
    fireEvent.keyDown(input, { key: 'Enter' });
    // URL 应保持 /
    expect(container.querySelector('[data-path]').getAttribute('data-path')).toBe('/');
  });

  // Regression：focus-steal bug
  // 修复前：Home 的 useEffect deps 含 filteredEntries（每次 render 都新建数组引用），
  //         → 输入框 typing 时 effect 重跑 → cardRefs.current[focusedIndex].focus() 抢焦点
  //         → 用户无法继续输入
  // 修复后：用 lastFocusedRef 跟踪上次实际应用的 focusedIndex，
  //         filteredEntries 引用变化但 focusedIndex 没变时不再调 .focus()
  it('Regression：输入框输入时焦点不被卡片抢走（focus-steal）', () => {
    const { container } = renderHome();
    const input = container.querySelector('input[type="search"]');
    // 1. 用户先聚焦搜索框（按 / 模拟）
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);

    // 2. 用户在搜索框输入字符 —— 这是触发 focus-steal 的关键路径
    //    模拟 React 受控输入：fireEvent.change 触发 onChange，Home 重新渲染，
    //    filteredEntries 数组引用变化但 focusedIndex 不变
    fireEvent.change(input, { target: { value: '键' } });

    // 3. 断言：输入框仍是活动元素（焦点没被卡片抢走）
    expect(document.activeElement).toBe(input);
    // 输入框的值被正确更新
    expect(input.value).toBe('键');
  });

  it('Regression：focusedIndex 实际变化时仍正确同步 DOM 焦点', () => {
    const { container } = renderHome();
    // 按 j 后应该同步聚焦第二张卡
    fireEvent.keyDown(window, { key: 'j' });
    const focused = findFocusedCard(container);
    expect(focused.textContent).toContain('键盘二');
    // 第二张卡的 DOM 节点应该是活动元素
    const cards = container.querySelectorAll('[role="link"]');
    expect(document.activeElement).toBe(cards[1]);
  });
});
