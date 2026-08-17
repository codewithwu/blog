// useKeyboardShortcuts：全局键盘快捷键 hook（用于 Home 页面）。
//
// 设计目标（见 .trellis/tasks/08-16-keyboard-shortcuts/prd.md）：
//   - Home 卡片间 j/k 移动焦点（环形），Enter 进入；/ 聚焦搜索框
//   - 输入框聚焦时所有快捷键禁用（避免输入 "j" 被吞掉）
//   - 带 Cmd/Ctrl/Alt 修饰键时不劫持（保留浏览器 / 系统快捷键）
//   - 详情页不响应（Home 卸载 → useEffect 清理 → listener 自动移除）
//
// API：
//   useKeyboardShortcuts({ onJ, onK, onEnter, onSlash })
//   handlers 走 ref-based 模式（避免每次 render 都重挂 listener）：
//     const handlersRef = useRef(handlers);
//     handlersRef.current = handlers;  // 每次 render 同步更新最新回调
//
// 守卫（按顺序短路判断）：
//   1. event.target 是 <input> / <textarea> / contenteditable → 直接 return
//      用户在输入框打字时不应触发导航
//   2. event.metaKey / ctrlKey / altKey 任一为 true → return
//      保留 Cmd+J / Ctrl+K / Alt+Enter 等系统/扩展组合键
//   3. shiftKey 不拦截（预留未来快捷键组合能力）
//
// preventDefault 仅在 / 触发时调用：
//   / 字符本身要避免被写入搜索框；其它键无需 preventDefault。
//
// 不返回 focusedIndex：
//   Home 在自己的 useState 里维护 focusedIndex，hook 只负责分发按键事件。
//   返回 state 会引入不必要的耦合（hook 不知道 entries 列表）。
import { useEffect, useRef } from 'react';

/**
 * 判断元素是否属于"可编辑"区域：<input> / <textarea> / contenteditable。
 * 用 tagName + isContentEditable 双重判断，规避 SVGElement 等 corner case。
 */
function isEditableElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  // contenteditable 容器（div / span 等被设置 isContentEditable=true）
  if (el.isContentEditable) return true;
  return false;
}

/**
 * 检测修饰键：metaKey（macOS Cmd / Windows Meta）/ ctrlKey / altKey 任一按下视为组合键。
 * shiftKey 不参与判断（保留给未来快捷键，例如 Shift+/ = ?）。
 */
function hasModifier(e) {
  return e.metaKey || e.ctrlKey || e.altKey;
}

export default function useKeyboardShortcuts(handlers = {}) {
  // 把 handlers 装到 ref 上：每次 render 同步最新值，但 listener 始终只挂一次。
  // 这样 onJ 闭包里读到的 setState 永远是当前组件实例的最新引用，
  // 避免把 handlers 加进 useEffect 依赖导致每次 render 都重新挂 listener。
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e) => {
      // 输入框聚焦 → 全部跳过（守卫 1）
      if (isEditableElement(e.target)) return;
      // 带 Cmd/Ctrl/Alt → 跳过（守卫 2）
      if (hasModifier(e)) return;

      switch (e.key) {
        case 'j':
          handlersRef.current.onJ?.();
          break;
        case 'k':
          handlersRef.current.onK?.();
          break;
        case 'Enter':
          handlersRef.current.onEnter?.();
          break;
        case '/':
          // / 字符若不 preventDefault 会写入刚聚焦的搜索框；
          // 我们想用 / 聚焦搜索框而非输入 /，所以必须拦住默认行为
          e.preventDefault();
          handlersRef.current.onSlash?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    // 卸载时自动解绑，详情页不响应 j/k 即由此而来
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // 依赖空数组：listener 只挂载/卸载一次，handler 走 ref 拿最新值
}
