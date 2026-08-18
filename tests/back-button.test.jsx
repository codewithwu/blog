// BackButton 共享组件单测：验证 forwardRef + glass-pill 样式 + 移动端触控目标。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BackButton from '../src/components/BackButton.jsx';

beforeEach(() => {
  // 测试 useFocusBackOnMount 风格的 rAF 同步化（BackButton 本身不用 rAF，但
  // 共享 setup 让所有用 rAF 的 hook 测试可观察）
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

function renderBackButton(props = {}) {
  return render(
    <MemoryRouter>
      <BackButton to="/" {...props} />
    </MemoryRouter>
  );
}

describe('BackButton 共享组件', () => {
  it('默认渲染为 <a>（react-router Link） + aria-label="返回首页"', () => {
    const { container } = renderBackButton();
    const a = container.querySelector('a[aria-label="返回首页"]');
    expect(a).not.toBeNull();
    expect(a.getAttribute('href')).toBe('/');
  });

  it('默认文本为「← 返回」', () => {
    const { container } = renderBackButton();
    expect(container.querySelector('a').textContent).toBe('← 返回');
  });

  it('接受 children prop 覆盖默认文本', () => {
    const { container } = renderBackButton({ children: '返回首页' });
    expect(container.querySelector('a').textContent).toBe('返回首页');
  });

  it('接受 ariaLabel prop 覆盖默认 aria-label', () => {
    const { container } = renderBackButton({ ariaLabel: '回到首页' });
    expect(container.querySelector('a').getAttribute('aria-label')).toBe('回到首页');
  });

  it('id="back-button" 供 skip-link 锚定', () => {
    const { container } = renderBackButton();
    expect(container.querySelector('a#back-button')).not.toBeNull();
  });

  it('玻璃态样式：含 glass-pill utility class', () => {
    const { container } = renderBackButton();
    expect(container.querySelector('a').className).toMatch(/glass-pill/);
  });

  it('移动端触控目标 ≥ 44pt（min-h/min-w utility）', () => {
    const { container } = renderBackButton();
    const cls = container.querySelector('a').className;
    expect(cls).toMatch(/min-h-\[44px\]/);
    expect(cls).toMatch(/min-w-\[44px\]/);
  });

  it('接受 className 追加样式（用于 fixed top-left 定位等场景）', () => {
    const { container } = renderBackButton({ className: 'fixed top-4 left-4 z-50' });
    const cls = container.querySelector('a').className;
    expect(cls).toMatch(/fixed/);
    expect(cls).toMatch(/top-4/);
    expect(cls).toMatch(/left-4/);
    expect(cls).toMatch(/z-50/);
    // 同时保留 glass-pill 与触控目标
    expect(cls).toMatch(/glass-pill/);
    expect(cls).toMatch(/min-h-\[44px\]/);
  });

  it('forwardRef 暴露 DOM 引用（EntryDetail 用它做 mount focus）', () => {
    const ref = createRef();
    renderBackButton({ ref });
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName.toLowerCase()).toBe('a');
  });
});