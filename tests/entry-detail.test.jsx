// EntryDetail 单测：/p/:slug 渲染全屏 iframe + 悬浮「← 返回」按钮 + OG/Twitter meta，
// 找不到 slug 时跳回 /。
// 用 vi.mock 提供测试 registry，字段形状完整匹配生产 Entry。
//
// HelmetProvider 是 react-helmet-async 的强制依赖（CLAUDE.md 规则 6 + 生产 main.jsx
// 也已包裹）；测试里也必须包，否则 <Helmet> 会 throw「Cannot read properties of
// undefined (reading 'add')」。
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor, act, fireEvent } from '@testing-library/react';
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
    {
      slug: 'sample-entry-2',
      title: '第二篇示例',
      excerpt: '第二篇摘要',
      date: '2026-05-01',
      type: 'article',
      tags: ['示例'],
      cover: null,
      links: null,
      content: '<!doctype html><html><body><p>正文2</p></body></html>',
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
  let history;
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
    history = result.history; // MemoryRouter v6 exposes history on result
  });
  return { ...result, helmetData, history };
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
    const { container } = await renderAt('/p/sample-entry');
    // 父任务 08-18-ux-optimization-suite P0-1：BackButton 抽出来共享组件，
    // 实现是 react-router <Link>（保留 SPA 路由 + prefetch）；不再是 <button>
    // 用 aria-label + id 精确定位返回按钮；否则 PrevNextNav 的 disabled 按钮也会命中
    const btn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    expect(btn).not.toBeNull();
    expect(btn.tagName.toLowerCase()).toBe('a'); // react-router Link 渲染为 <a>
    expect(btn.textContent).toContain('返回');
    // 旧实现是 fixed top-4 left-4 玻璃态胶囊；BackButton 共享组件不带 fixed 定位
    // （EntryDetail 自己在 BackButton 外层加 fixed className，但当前实现把 fixed 职责
    // 也下沉到 BackButton，所以这里改检查玻璃态基类 glass-pill 与 min-h-[44px] 移动端触控）
    expect(btn.className).toMatch(/glass-pill/);
    expect(btn.className).toMatch(/min-h-\[44px\]/);
    // a11y：按钮应带 aria-label="返回首页"，让屏幕阅读器朗读更明确
    expect(btn.getAttribute('aria-label')).toBe('返回首页');
    // skip-link 应存在（08-18 P0-3），首个 Tab 焦点元素
    const skipLink = container.querySelector('a[href="#back-button"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink.textContent).toContain('跳到主站导航');
  });

  it('找不到 slug 时显示内嵌 404 卡片（不 Navigate 跳首页）', async () => {
    // 父任务 08-18-ux-optimization-suite P1 顺手实现：原来 <Navigate to="/" replace />
    // 直接跳回首页，改为在 /p/:slug 路由显示内嵌「文章不存在」+ BackButton，
    // 保持 history 栈干净
    const { container } = await renderAt('/p/non-existent');
    // 不应跳回首页（[data-testid="home"] 不存在）
    expect(container.querySelector('[data-testid="home"]')).toBeNull();
    // 应显示内嵌 404 文案
    expect(container.textContent).toContain('文章不存在或已被移除');
    expect(container.textContent).toContain('/p/non-existent');
    // BackButton 仍存在且 aria-label 正确
    const btn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    expect(btn).not.toBeNull();
  });

  // P1-3 改造（父任务 08-23-ux-optimization-suite）：内嵌 404 复用 NotFound 视觉
  it('AC-1/P1-3：内嵌 404 包含 AuroraBackdrop + 巨大渐变 404 数字（与 NotFound 对齐）', async () => {
    const { container } = await renderAt('/p/non-existent');
    // AuroraBackdrop 渲染标记：含 aurora-bg class + -z-10 装饰层
    expect(container.querySelector('.aurora-bg')).not.toBeNull();
    // 巨大渐变 404 数字：bg-clip-text utility + opsz:144
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toBe('404');
    expect(h1.className).toMatch(/bg-clip-text/);
    expect(h1.className).toMatch(/from-brand-accent/);
    expect(h1.className).toMatch(/via-brand-primary/);
    expect(h1.className).toMatch(/to-brand-glow/);
    expect(h1.className).toMatch(/text-\[12rem\]/);
    // opsz:144 inline style（巨字戏剧化）
    expect(h1.getAttribute('style')).toMatch(/opsz.*144/);
  });

  // P1-3：内嵌 404 仍保留 /p/:slug 路由
  it('AC-2/P1-3：内嵌 404 保留 /p/:slug 路由（不 navigate 到 /）', async () => {
    const { container } = await renderAt('/p/non-existent');
    // 渲染内容是内嵌 404 而非 Home（[data-testid="home"] 不存在）证明没有 navigate 到 /
    expect(container.querySelector('[data-testid="home"]')).toBeNull();
    // 内嵌 404 显示 + 包含当前 slug
    expect(container.textContent).toContain('文章不存在或已被移除');
    expect(container.textContent).toContain('/p/non-existent');
    // BackButton href="/"：点击会跳回首页（这是预期行为），但当前 URL 不变
    const backBtn = container.querySelector('a[aria-label="返回首页"]');
    expect(backBtn?.getAttribute('href')).toBe('/');
  });

  // P1-3：内嵌 404 mount 后 BackButton 获得焦点（ref 复用 useFocusBackOnMount）
  it('AC-3/P1-3：内嵌 404 mount 后 BackButton 获得焦点', async () => {
    await renderAt('/p/non-existent');
    // rAF 已 mock 同步化（beforeEach），focus 立即生效
    const backBtn = document.querySelector('a[id="back-button"]');
    expect(backBtn).not.toBeNull();
    expect(document.activeElement).toBe(backBtn);
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

  it('og:url 含当前 entry 的 hash 路径（08-17 F1：HashRouter 不丢 #/p/<slug>）', async () => {
    // jsdom 默认 window.location.hash 是 ''；手动模拟 HashRouter 下的 URL
    window.history.replaceState(null, '', '/#/p/sample-entry');
    await renderAt('/p/sample-entry');
    await waitFor(() => {
      const ogUrl = document.head.querySelector('meta[property="og:url"]');
      expect(ogUrl?.getAttribute('content')).toMatch(/#\/p\/sample-entry$/);
    });
    // 还原避免污染后续测试
    window.history.replaceState(null, '', '/');
  });

  it('切换 slug 时 iframe 被强制重建（08-17 F2：<Html key={slug}>）', async () => {
    // 第一次渲染 sample-entry，记录 DOM 节点
    const { container, unmount } = await renderAt('/p/sample-entry');
    const iframeA = container.querySelector('iframe');
    expect(iframeA).not.toBeNull();
    // 卸载前保存引用
    const nodeA = iframeA;
    unmount();

    // 重新渲染 sample-entry-2
    const result2 = await renderAt('/p/sample-entry-2');
    const iframeB = result2.container.querySelector('iframe');
    expect(iframeB).not.toBeNull();
    // React 用 key 变化识别为不同 element 实例 → unmount 旧 + mount 新
    // iframeB 是新节点，DOM 引用与 iframeA 不同
    expect(iframeB).not.toBe(nodeA);
    // 内容也对应换了 entry
    expect(iframeB.getAttribute('srcDoc')).toContain('正文2');
  });

  // 父任务 08-18-ux-optimization-suite P0-1 + P0-2：mount 后下一帧自动 focus BackButton
  it('mount 后 BackButton 自动获得焦点（a11y：避免焦点落到 iframe）', async () => {
    const { container } = await renderAt('/p/sample-entry');
    // rAF 在 beforeEach 已同步化，render 完成后 BackButton 应已 focused
    const backBtn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    expect(backBtn).not.toBeNull();
    expect(document.activeElement).toBe(backBtn);
  });

  // 父任务 08-18-ux-optimization-suite P0-1：Esc 跳出 iframe 焦点陷阱
  it('按 Esc 把焦点送回 BackButton', async () => {
    const { container } = await renderAt('/p/sample-entry');
    const backBtn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    // 模拟焦点离开：blur BackButton，让 focus 不在它上面
    backBtn.blur();
    expect(document.activeElement).not.toBe(backBtn);
    // 派发 Esc 键 → 应把焦点拉回 BackButton
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(document.activeElement).toBe(backBtn);
  });

  it('输入框聚焦时按 Esc 不抢焦点（守卫 input）', async () => {
    const { container } = await renderAt('/p/sample-entry');
    const backBtn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    backBtn.blur();
    // 模拟文档中存在 input 且聚焦 → Esc 不应抢焦点
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement).toBe(input);
    document.body.removeChild(input);
  });

  it('带 Ctrl 修饰键的 Esc 不抢焦点（守卫修饰键）', async () => {
    const { container } = await renderAt('/p/sample-entry');
    const backBtn = container.querySelector('[aria-label="返回首页"][id="back-button"]');
    backBtn.blur();
    fireEvent.keyDown(document, { key: 'Escape', ctrlKey: true });
    expect(document.activeElement).not.toBe(backBtn);
  });
});
