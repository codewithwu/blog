// useKbdHintDismissed 单测：localStorage 持久化 + storage 事件同步。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useKbdHintDismissed from '../src/hooks/useKbdHintDismissed.js';

const KEY = 'coolpanda_kbd_hint_dismissed';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Storage.prototype, 'getItem');
  vi.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useKbdHintDismissed', () => {
  it('初始未 dismiss 时返回 false', () => {
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(result.current.dismissed).toBe(false);
  });

  it('已 dismiss 后初始读 localStorage 返回 true', () => {
    localStorage.setItem(KEY, '1');
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(result.current.dismissed).toBe(true);
  });

  it('调用 dismiss() 写入 localStorage + state', () => {
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(result.current.dismissed).toBe(false);
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('localStorage 读取失败时降级为 false（catch + 不抛）', () => {
    Storage.prototype.getItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => renderHook(() => useKbdHintDismissed())).not.toThrow();
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(result.current.dismissed).toBe(false);
  });

  it('localStorage 写入失败时静默 catch（不抛 + state 仍更新）', () => {
    Storage.prototype.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(() => act(() => result.current.dismiss())).not.toThrow();
    expect(result.current.dismissed).toBe(true);
  });

  it('同源其它 Tab 的 storage 事件触发 state 同步', () => {
    const { result } = renderHook(() => useKbdHintDismissed());
    expect(result.current.dismissed).toBe(false);
    // 模拟另一 Tab 调用 setItem 后 dispatch storage 事件
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '1' }));
    });
    expect(result.current.dismissed).toBe(true);
  });
});