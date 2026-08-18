// useFocusBackOnMount：组件 mount / deps 变化后下一帧自动 focus 到给定 ref。
//
// 动机（父任务 08-18-ux-optimization-suite P0-2）：
//   - 详情页 EntryDetail mount 时浏览器默认焦点落到 <body> 或 iframe（iframe 接管
//     焦点上下文，键盘用户陷入 iframe 焦点陷阱）
//   - a11y 友好做法：mount 后主动 focus 到 BackButton，让屏幕阅读器与键盘用户
//     立即知道「这是详情页，按 ← 可返回」
//
// 行为：
//   - deps 变化（首次 mount 也算变化）→ rAF 后 ref.current.focus({ preventScroll: true })
//   - 跟踪 hasFocusedRef：仅在 mount 后第一次与 deps 真变化时 focus
//     防止用户主动 Tab 走开后又抢回焦点
//
// 守卫：
//   - ref.current 可能为 null（forwardRef + 异步 attach）；rAF 后调用时已 attach
//   - preventScroll: true：避免 focus 触发浏览器"聚焦即滚动"，保持当前滚动位置
//     （详情页 mount 时 iframe 占满视口，滚动会让用户失去上下文）
//
// 用法：
//   const backButtonRef = useRef(null);
//   useFocusBackOnMount(backButtonRef, [entry.slug]);
//   <BackButton ref={backButtonRef} ... />
//
// 测试注意：
//   - jsdom rAF 是异步的（polyfill 成 setTimeout(16)），测试里 spy rAF 同步化
//     才能在 act() 内观察到 focus（见 tests/entry-detail.test.jsx beforeEach）
import { useEffect, useRef } from 'react';

/**
 * 在 mount 与 deps 变化时把焦点送到给定 ref 指向的元素。
 *
 * @param {React.RefObject<HTMLElement>} ref - 目标元素的 ref
 * @param {React.DependencyList} deps - 触发重新 focus 的依赖数组
 */
export default function useFocusBackOnMount(ref, deps) {
  // 跟踪「本组件是否曾主动 focus 过」+「上一次 deps 快照」
  // 仅在首次 mount 与 deps 真变化时才 focus，避免用户主动操作后抢焦点
  const stateRef = useRef({ focused: false, deps: null });

  useEffect(() => {
    const prev = stateRef.current;
    const depsChanged =
      prev.deps === null || !shallowEqual(prev.deps, deps);

    if (!depsChanged && prev.focused) {
      // deps 没变 + 已 focus 过 → 不抢
      return;
    }

    // rAF 等 React commit + ref attach 完成；rAF 后调 .focus() 才有效
    const raf = requestAnimationFrame(() => {
      ref.current?.focus({ preventScroll: true });
      stateRef.current = { focused: true, deps };
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// 浅比较 deps 数组（deps 通常是 [entry.slug] 这种长度 ≤ 3 的小数组）
// 比 JSON.stringify 快，且能正确处理 ref / function 等非可序列化对象（虽然本
// 用途里 deps 都是基本类型，但保持通用更稳）
function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}