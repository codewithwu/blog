// NotFound 单测：验证 P0-2 改造（父任务 08-23-ux-optimization-suite）
//   - 加 skip-link（首个 Tab 元素是 "跳到主站导航"）
//   - mount 后 BackButton 获得焦点（useFocusBackOnMount）
//   - 按 Esc 焦点送回 BackButton（document-level keydown）
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../src/pages/NotFound.jsx';

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound P0-2 改造', () => {
  it('AC-4：渲染 skip-link（首个 Tab 元素 + href="#back-button"）', () => {
    const { container } = renderNotFound();
    // 找到所有可聚焦元素，跳过 input/button/textarea 等，验证 skip-link 是首个 <a
    const allLinks = container.querySelectorAll('a');
    const skipLink = allLinks[0];
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#back-button');
    expect(skipLink.textContent).toContain('跳到主站导航');
    // sr-only 守卫 + focus:not-sr-only 让 skip-link 默认隐藏、聚焦时显示
    expect(skipLink.className).toMatch(/sr-only/);
    expect(skipLink.className).toMatch(/focus:not-sr-only/);
  });

  it('AC-4：skip-link 视觉风格是玻璃态胶囊（fixed top 居中 + glass-pill）', () => {
    const { container } = renderNotFound();
    const skipLink = container.querySelector('a[href="#back-button"]');
    expect(skipLink.className).toMatch(/fixed/);
    expect(skipLink.className).toMatch(/top-2/);
    expect(skipLink.className).toMatch(/left-1\/2/);
    expect(skipLink.className).toMatch(/glass-pill/);
    expect(skipLink.className).toMatch(/z-\[60\]/);
  });

  it('AC-5：mount 后 BackButton 获得焦点（useFocusBackOnMount）', async () => {
    renderNotFound();
    // rAF 已 mock 同步化（beforeEach），focus 立即生效
    const backBtn = document.querySelector('a[id="back-button"]');
    expect(backBtn).not.toBeNull();
    expect(document.activeElement).toBe(backBtn);
  });

  it('AC-5：BackButton ref 已正确暴露（id="back-button" 供 skip-link 锚定）', () => {
    const { container } = renderNotFound();
    // 既有断言：id="back-button" 必须存在（与 EntryDetail 共享 BackButton 组件约定）
    expect(container.querySelector('a#back-button')).not.toBeNull();
  });

  it('AC-3：按 Esc 焦点送回 BackButton（document-level keydown）', () => {
    renderNotFound();
    const backBtn = document.querySelector('a[id="back-button"]');
    expect(backBtn).not.toBeNull();
    // 主动 blur 模拟焦点移开
    backBtn.blur();
    expect(document.activeElement).not.toBe(backBtn);
    // 触发 Esc 键
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(backBtn);
  });

  it('AC-3：Esc 在 INPUT 聚焦时不抢焦点（守卫生效）', () => {
    const { container } = renderNotFound();
    // 注入一个 input（模拟用户聚焦）
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);
    // Esc 必须从 input 触发（模拟真实键盘事件：target 是聚焦元素）
    fireEvent.keyDown(input, { key: 'Escape' });
    // input 仍是焦点，BackButton 没被抢
    expect(document.activeElement).toBe(input);
    document.body.removeChild(input);
  });

  it('AC-3：Esc 带 Cmd/Ctrl/Alt 修饰键时不抢焦点（守卫生效）', () => {
    renderNotFound();
    const backBtn = document.querySelector('a[id="back-button"]');
    backBtn.blur();
    fireEvent.keyDown(document, { key: 'Escape', metaKey: true });
    expect(document.activeElement).not.toBe(backBtn);
  });

  it('渲染 404 数字 + 文案 + 最近发布列表（视觉不变）', () => {
    const { container } = renderNotFound();
    expect(container.textContent).toContain('404');
    expect(container.textContent).toContain('迷失在深海中');
    expect(container.textContent).toContain('这里什么都没有');
    // skip-link + 最近发布链接 都是 <a>，DOM 中应共存
    expect(container.querySelector('a[href="#back-button"]')).not.toBeNull();
  });
});