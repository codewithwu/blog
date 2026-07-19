// useReveal：IntersectionObserver 包装，用于瀑布流卡片首次进入视口时的入场微动效。
//
// 为什么用 IntersectionObserver 而不是纯 CSS：
//   瀑布流卡片一次性挂载但分布在长页面里，纯 CSS 无法只在"滚动进入视口时"触发。
//   IO 精确捕捉进入视口的时机，且只触发一次（进入后立即 disconnect），零轮询开销。
//
// 用法：
//   const [ref, visible] = useReveal();
//   <div ref={ref} className={visible ? '入场后类' : '入场前类'} />
import { useEffect, useRef, useState } from 'react';

export default function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // 已可见就不再观察；SSR / 无 IO 环境（如老浏览器）直接降级为可见，避免内容永久隐藏
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect(); // 单次触发：入场后不再关心
        }
      },
      // 底部留 10% 余量：卡片刚露头就触发，视觉上更顺
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return [ref, visible];
}
