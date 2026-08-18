// ScrollToTop：右下角浮动的「↑ 顶部」按钮。
//
// 父任务 08-18-ux-optimization-suite P1-10：
//   - 瀑布流 > 1 屏（window.scrollY > window.innerHeight）后右下角出现
//   - 点击 smooth scroll 到 0
//   - 移动端触控目标 ≥ 44pt（同款 BackButton / SearchBar）
//   - 不与 EntryDetail PrevNextNav 冲突：仅在 Home 渲染
//
// 视觉：
//   - glass-pill（同款玻璃态胶囊，与返回按钮 / PrevNextNav 一致）
//   - 固定定位 bottom-6 right-6（与 PrevNextNav 底部居中错开）
//   - z-40（低于 PrevNextNav z-50 / BackButton z-50，避免冲突）
//   - 切可见性用 opacity + pointer-events 切换（不 unmount，让 transition 平滑）
//
// a11y：
//   - aria-label="回到顶部"
//   - focus-visible 走浏览器默认 outline（玻璃态不需要额外 ring）
//
// 实现细节：
//   - 不引入新依赖（无 react-scroll-to-top 之类）
//   - smooth scroll 用浏览器原生 window.scrollTo({ behavior: 'smooth' })
//   - prefers-reduced-motion 时浏览器自动改 smooth 为 instant
import { ArrowUp } from 'lucide-react';
import useScrollToTopVisible from '../hooks/useScrollToTopVisible.js';

export default function ScrollToTop() {
  const visible = useScrollToTopVisible();

  const onClick = () => {
    // reduce-motion 用户：浏览器自动降级 smooth → instant（CSS spec 行为）
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="回到顶部"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`glass-pill fixed bottom-6 right-6 z-40
                  inline-flex items-center justify-center
                  w-10 h-10 sm:w-10 sm:h-10
                  [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]
                  [@media(max-width:640px)]:w-11 [@media(max-width:640px)]:h-11
                  rounded-md transition-opacity duration-200
                  ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <ArrowUp size={16} aria-hidden />
    </button>
  );
}