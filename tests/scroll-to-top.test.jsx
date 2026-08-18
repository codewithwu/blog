// ScrollToTop + useScrollToTopVisible 单测：阈值切换可见性 + 点击 smooth scroll。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import ScrollToTop from '../src/components/ScrollToTop.jsx';

beforeEach(() => {
  // jsdom rAF 同步化
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  // jsdom 默认 innerHeight = 768
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollY = 0;
});

describe('ScrollToTop', () => {
  it('初始 scrollY=0 时按钮不可见（opacity-0 + pointer-events-none）', () => {
    const { container } = render(<ScrollToTop />);
    const btn = container.querySelector('button[aria-label="回到顶部"]');
    expect(btn).not.toBeNull();
    expect(btn.className).toMatch(/opacity-0/);
    expect(btn.className).toMatch(/pointer-events-none/);
  });

  it('scrollY > innerHeight 时按钮可见（opacity-100 + pointer-events-auto）', () => {
    const { container } = render(<ScrollToTop />);
    const btn = container.querySelector('button[aria-label="回到顶部"]');
    // 模拟滚动超过阈值
    act(() => {
      window.scrollY = 1000;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(btn.className).toMatch(/opacity-100/);
    expect(btn.className).toMatch(/pointer-events-auto/);
    // aria-hidden 切到 false（屏幕阅读器可读）
    expect(btn.getAttribute('aria-hidden')).toBe('false');
    // tabIndex 切到 0（键盘可达）
    expect(btn.getAttribute('tabindex')).toBe('0');
  });

  it('点击调用 window.scrollTo({ top: 0, behavior: "smooth" })', () => {
    const { container } = render(<ScrollToTop />);
    const btn = container.querySelector('button[aria-label="回到顶部"]');
    // 让按钮可见
    act(() => {
      window.scrollY = 1000;
      window.dispatchEvent(new Event('scroll'));
    });
    fireEvent.click(btn);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('玻璃态样式：含 glass-pill utility', () => {
    const { container } = render(<ScrollToTop />);
    const btn = container.querySelector('button[aria-label="回到顶部"]');
    expect(btn.className).toMatch(/glass-pill/);
  });

  it('移动端触控目标 ≥ 44pt（min-h/min-w utility）', () => {
    const { container } = render(<ScrollToTop />);
    const btn = container.querySelector('button[aria-label="回到顶部"]');
    expect(btn.className).toMatch(/min-h-\[44px\]/);
    expect(btn.className).toMatch(/min-w-\[44px\]/);
  });
});