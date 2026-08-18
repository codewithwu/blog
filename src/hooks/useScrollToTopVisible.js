// useScrollToTopVisible：监听 window.scrollY，超过 threshold 时返回 true。
//
// 父任务 08-18-ux-optimization-suite P1-10（滚回顶部按钮）：
//   - 阈值默认 = window.innerHeight（用户至少滚过 1 屏才出现按钮）
//   - rAF 节流：scroll 事件高频触发（每帧 1 次），用 rAF 把 setState 合并到下一帧
//   - passive listener：不阻塞滚动（移动端尤其重要）
//   - 卸载时清 rAF + 解绑 listener
//
// 用法：
//   const visible = useScrollToTopVisible();
//   {visible && <ScrollToTop />}
//
// 测试注意：
//   - jsdom 不支持 layout → window.innerHeight 默认 768；scrollY 通过
//     window.scrollTo() 模拟
//   - rAF 需要 spy 同步化才能在测试里观察到 setState
import { useEffect, useState } from 'react';

export default function useScrollToTopVisible(threshold) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 阈值用 ref-less 形式：每次 effect 跑时取最新 innerHeight
    // 不用 state 因为阈值变化时整个 effect 重新执行更直观
    const getThreshold = () =>
      threshold ?? (typeof window !== 'undefined' ? window.innerHeight : 0);

    let raf = 0;
    const update = () => {
      raf = 0;
      setVisible(window.scrollY > getThreshold());
    };
    const onScroll = () => {
      // rAF 节流：合并同一帧的多次 scroll 事件为 1 次 setState
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // 初始化：mount 时立刻检查（用户刷新页面时 scrollY 可能非 0）
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return visible;
}