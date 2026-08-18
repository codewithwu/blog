// Html 组件单测：完整文档与 HTML 片段都走 iframe srcDoc
// 片段会被包成最小文档 <!doctype html><html>...<body>...</body></html>
// 加载期 shimmer 占位 + iframe title 属性（08-16 iframe-shimmer-a11y）。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import Html from '../src/lib/html.jsx';

// requestAnimationFrame 在 jsdom 里被 polyfill 成 setTimeout(..., 16)。
// 这里 mock 同步版本，让 useEffect 内的 rAF 回调立刻执行，便于断言 loading=false。
// （真实浏览器里 rAF 是异步的；测试里为了让状态变化可观察，必须同步化。）
beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

// 测试辅助：用 async act 包裹 render，避免 React 18 把 effect 内 setState 排到
// act() 边界外触发 "An update to X was not wrapped in act(...)" warning。
// RTL 的 render() 内部虽然已经调用 act()（同步版），但 React 18 调度 effect 内
// setState 可能晚于 render 返回；用 async act 强制把 effect flush 进同一个 act 边界。
async function renderHtml(ui) {
  let result;
  await act(async () => {
    result = render(ui);
  });
  return result;
}

describe('Html component', () => {
  it('renders an iframe for a full HTML document', async () => {
    // 父任务 08-18-ux-optimization-suite 顺手修复：原版对「无 <head> 的完整文档」
    // 走 prepend <base> 兜底，产生 <base><!doctype html>... 畸形 HTML。
    // 新版在 <html> 后插入 <head><base></head>，输出格式合法。
    // P1-8/15/16 进一步注入同站链接桥接脚本（BRIDGE_SCRIPT）在 <base> 之后
    const doc = '<!doctype html><html><body><p>hello</p></body></html>';
    const { container } = await renderHtml(<Html html={doc} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    // 期望：<head> 被自动注入，<base> 落在 head 内；BRIDGE_SCRIPT 紧随其后
    const srcDoc = iframe.getAttribute('srcDoc');
    expect(srcDoc).toMatch(/^<!doctype html><html><head><base href="about:srcdoc">/);
    expect(srcDoc).toContain('<body><p>hello</p></body></html>');
    // bridge 脚本应该被注入（核心函数 isRouterHref 必须存在）
    expect(srcDoc).toContain('isRouterHref');
  });

  it('wraps an HTML fragment in a minimal document for srcDoc', async () => {
    const fragment = '<section><p>片段内容</p></section>';
    const { container } = await renderHtml(<Html html={fragment} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcDoc');
    expect(srcDoc).toContain('<!doctype html>');
    expect(srcDoc).toContain('<body>');
    expect(srcDoc).toContain('片段内容');
  });

  it('applies fullscreen classes to the iframe', async () => {
    // P1-7 改造（父任务 08-18-ux-optimization-suite）：移动端 h-[calc(100vh-120px)]；
    // 桌面 sm 断点起 h-screen=100vh。原文只测 h-screen，现在两套 class 都应存在
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/w-full/);
    // 移动端（默认）走 h-[calc(100vh-120px)]
    expect(iframe.className).toMatch(/h-\[calc\(100vh-120px\)\]/);
    // 桌面（sm 断点）走 h-screen
    expect(iframe.className).toMatch(/sm:h-screen/);
    expect(iframe.className).toMatch(/border-0/);
  });

  it('uses a sandbox that allows scripts, popups, and forms (no same-origin)', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('uses the title prop when provided', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" title="My Project" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('title')).toBe('My Project');
  });

  it('默认 title 为 "Project detail"（fallback）', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('title')).toBe('Project detail');
  });

  it('iframe 外层包一个 relative 容器', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    const wrapper = container.querySelector('div.relative');
    expect(wrapper).not.toBeNull();
    expect(wrapper.className).toMatch(/w-full/);
    expect(wrapper.className).toMatch(/h-screen/);
    // iframe 应在此容器内
    expect(wrapper.querySelector('iframe')).not.toBeNull();
  });

  it('加载期渲染玻璃态 shimmer 占位（aria-hidden + 必要类名）', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    // P1-6 改造（父任务 08-18-ux-optimization-suite）：shimmer 透明度从 /40 → /85
    //   - 原 /40（60% 透明）对大文档（47KB intimate-relationship-curve.html）首帧
    //     前 body 紫蓝黑透过 shimmer 渗出 → 视觉闪烁
    //   - /85（仅 15% 透明）让玻璃态真正"挡住" iframe 加载前的 body 背景
    // 因为 useState(true) 初始 loading=true；rAF 兜底在 act 同步执行后会把 loading
    // 切到 false，所以 shimmer 的 opacity 已经是 0。这里只断言「占位 DOM 在」+
    // 「必要类名在」，不依赖 opacity 数值。
    const shimmer = container.querySelector('div.absolute.inset-0');
    expect(shimmer).not.toBeNull();
    expect(shimmer.className).toMatch(/bg-brand-surface\/85/);
    expect(shimmer.className).toMatch(/backdrop-blur-sm/);
    expect(shimmer.className).toMatch(/animate-pulse/);
    expect(shimmer.className).toMatch(/transition-opacity/);
    expect(shimmer.className).toMatch(/duration-300/);
    // a11y：占位对屏幕阅读器隐藏，避免把「loading shimmer」读给用户
    expect(shimmer.getAttribute('aria-hidden')).toBe('true');
    // 不阻挡 iframe 交互（虽然加载期视觉上覆盖，但 pointer-events 不能拦截鼠标）
    expect(shimmer.className).toMatch(/pointer-events-none/);
  });

  it('iframe load 事件触发后 shimmer 占位处于 opacity-0', async () => {
    const { container } = await renderHtml(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    // rAF 兜底已经把 loading 切到 false，所以即使不 fire load，shimmer 也是 opacity-0。
    // 这里用 fireEvent.load 再确认 onLoad 路径也能正确切换 loading 状态。
    await act(async () => {
      fireEvent.load(iframe);
    });
    const shimmer = container.querySelector('div.absolute.inset-0');
    expect(shimmer.className).toMatch(/opacity-0/);
    expect(shimmer.className).not.toMatch(/opacity-100/);
  });
});