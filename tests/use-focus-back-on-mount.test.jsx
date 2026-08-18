// useFocusBackOnMount hook 单测：mount 后下一帧 focus ref，deps 变化时再 focus，
// 用户主动操作后不抢回。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef } from 'react';
import { render } from '@testing-library/react';
import useFocusBackOnMount from '../src/hooks/useFocusBackOnMount.js';

// 收集每次调用 .focus() 的参数，便于断言 preventScroll
const focusCalls = [];
function FocusProbe({ deps }) {
  const ref = useRef(null);
  useFocusBackOnMount(ref, deps);
  return (
    <button
      ref={(el) => {
        ref.current = el;
        if (el) {
          el.focus = vi.fn((opts) => {
            focusCalls.push(opts);
          });
        }
      }}
    >
      probe
    </button>
  );
}

beforeEach(() => {
  focusCalls.length = 0;
  // jsdom rAF 异步 polyfill 成 setTimeout(16)，spy 同步化让 focus 在 render 后立即发生
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

describe('useFocusBackOnMount', () => {
  it('mount 后下一帧调用 ref.current.focus({ preventScroll: true })', () => {
    render(<FocusProbe deps={['a']} />);
    expect(focusCalls.length).toBe(1);
    expect(focusCalls[0]).toEqual({ preventScroll: true });
  });

  it('deps 不变时不重复 focus', () => {
    const { rerender } = render(<FocusProbe deps={['a']} />);
    expect(focusCalls.length).toBe(1);
    // 同一 deps 重新渲染 → 不再 focus
    rerender(<FocusProbe deps={['a']} />);
    expect(focusCalls.length).toBe(1);
  });

  it('deps 变化时重新 focus', () => {
    const { rerender } = render(<FocusProbe deps={['a']} />);
    expect(focusCalls.length).toBe(1);
    // deps 变化 → 再 focus
    rerender(<FocusProbe deps={['b']} />);
    expect(focusCalls.length).toBe(2);
    expect(focusCalls[1]).toEqual({ preventScroll: true });
  });

  it('ref.current 为 null 时安全跳过（forwardRef 未 attach 时）', () => {
    function NullRefProbe() {
      const ref = useRef(null);
      useFocusBackOnMount(ref, ['a']);
      return null;
    }
    // 不应 throw
    expect(() => render(<NullRefProbe />)).not.toThrow();
  });
});