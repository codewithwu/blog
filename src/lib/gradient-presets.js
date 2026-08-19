// gradient-presets：EntryCard 无 cover 时的 fallback 渐变预设。
//
// 父任务 08-18-ux-optimization-suite P2-21：
//   - 原版所有卡片走同一渐变 `from-brand-accent/25 via-brand-primary/20 to-brand-glow/25`
//     视觉单调，多卡片堆叠时区分度低
//   - 新版按 entry.slug hash 选 4 套预设之一：相同 slug 永远同色（hash 稳定），
//     不同 slug 大概率分到不同色，视觉去重
//   - 全部走现有 brand-* token；不引入新色板（CLAUDE.md 规则 6 单一来源约束）
//
// 算法：
//   - djb2 hash：`(h * 33 + charCode) | 0`，经典字符串 hash；n < 100 时冲突率可接受
//   - 取绝对值 `% 4` 落到 4 套预设之一
//   - 负数处理：JS 位运算可能产生负值，用 Math.abs 取正
//
// 用法：
//   import { gradientForSlug } from '../lib/gradient-presets.js';
//   <div className={`bg-gradient-to-br ${gradientForSlug(slug)}`} />
export const FALLBACK_GRADIENTS = [
  // 紫 → 蓝 → 青（原版，作为缺省）
  'from-brand-accent/25 via-brand-primary/20 to-brand-glow/25',
  // 蓝 → 青 → 紫
  'from-brand-primary/25 via-brand-glow/20 to-brand-accent/25',
  // 青 → 紫 → 蓝
  'from-brand-glow/25 via-brand-accent/20 to-brand-primary/25',
  // 紫 → 青 → 蓝（accent 加深）
  'from-brand-accent/30 via-brand-glow/20 to-brand-primary/20',
];

export function gradientForSlug(slug) {
  let h = 5381; // djb2 初始值
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(h) % FALLBACK_GRADIENTS.length];
}