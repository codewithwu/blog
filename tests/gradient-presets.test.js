// gradient-presets 单测：FALLBACK_GRADIENTS 预设 + gradientForSlug hash 稳定性。
import { describe, it, expect } from 'vitest';
import { FALLBACK_GRADIENTS, gradientForSlug } from '../src/lib/gradient-presets.js';

describe('gradient-presets', () => {
  it('FALLBACK_GRADIENTS 含 4 套预设且全部走 brand-* token', () => {
    expect(FALLBACK_GRADIENTS).toHaveLength(4);
    FALLBACK_GRADIENTS.forEach((preset) => {
      expect(preset).toMatch(/from-brand-(accent|primary|glow)/);
      expect(preset).toMatch(/via-brand-(accent|primary|glow)/);
      expect(preset).toMatch(/to-brand-(accent|primary|glow)/);
    });
  });

  it('gradientForSlug(slug) 同 slug 多次调用返回相同结果', () => {
    expect(gradientForSlug('introduce')).toBe(gradientForSlug('introduce'));
    expect(gradientForSlug('intimate-relationship-curve')).toBe(
      gradientForSlug('intimate-relationship-curve')
    );
  });

  it('gradientForSlug 总是返回 FALLBACK_GRADIENTS 之一', () => {
    const samples = [
      'introduce',
      'intimate-relationship-curve',
      'foo',
      'bar',
      'baz',
      'a-very-long-slug-with-many-words',
    ];
    samples.forEach((slug) => {
      const preset = gradientForSlug(slug);
      expect(FALLBACK_GRADIENTS).toContain(preset);
    });
  });

  it('不同 slug 大概率分到不同 preset（hash 分布）', () => {
    // 4 个 sample slug 至少分到 2 个不同 preset（hash 不应该全撞）
    const presets = new Set([
      'introduce',
      'intimate-relationship-curve',
      'foo',
      'bar',
    ].map(gradientForSlug));
    expect(presets.size).toBeGreaterThanOrEqual(2);
  });

  it('空 slug 不抛异常且返回 FALLBACK_GRADIENTS 之一', () => {
    // djb2 初始值 5381 加上无字符 → hash=5381, 5381 % 4 = 1，返回第二套预设
    // 测试只断言「不抛」+「结果是合法预设」
    expect(() => gradientForSlug('')).not.toThrow();
    expect(FALLBACK_GRADIENTS).toContain(gradientForSlug(''));
  });
});