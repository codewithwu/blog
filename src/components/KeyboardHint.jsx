// KeyboardHint：Home 页面键盘快捷键可见提示。
//
// 父任务 08-18-ux-optimization-suite P1-11/12：
//   - **首次浮层**：Home 底部一行淡提示「按 j/k 切换 · Enter 进入 · / 搜索」
//     * 6 秒后自动消失（useEffect setTimeout）
//     * 用户点 × 立即消失 + 写 localStorage（永久关闭）
//   - **Cheat sheet 模态**：按 `?` 触发；列出全部快捷键
//     * 全屏 backdrop（bg-brand-dark/80 backdrop-blur-sm）
//     * 居中玻璃态卡片（同款 glass-pill 风格）+ 快捷键列表
//     * 按 `?` / Esc / 点击 backdrop 关闭
//
// 持久化：
//   - 浮层用 useKbdHintDismissed hook（localStorage key `coolpanda_kbd_hint_dismissed`）
//   - cheat sheet 永远可用（不持久化）
//
// a11y：
//   - 浮层 role="status" + aria-live="polite"：屏幕阅读器朗读一次后不打扰
//   - cheat sheet role="dialog" + aria-modal="true" + aria-labelledby
//   - × 关闭按钮 aria-label="关闭键盘提示"
//   - 键盘焦点管理：cheat sheet 打开时把焦点送入 dialog；关闭时送回触发按钮
//
// 实现细节：
//   - 不引入新依赖；用 React Portal 把 cheat sheet 挂到 body 末尾（z-index 不被父 overflow 影响）
//   - `?` 触发用 useKeyboardShortcuts 风格的 document keydown 监听（输入框聚焦时跳过）
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Keyboard } from 'lucide-react';
import useKbdHintDismissed from '../hooks/useKbdHintDismissed.js';

// 浮层自动消失时间（ms）
const HINT_AUTO_DISMISS_MS = 6000;

// 快捷键列表：cheat sheet 与浮层文案共享单一来源
const SHORTCUTS = [
  { keys: ['j'], desc: '下一张卡片' },
  { keys: ['k'], desc: '上一张卡片' },
  { keys: ['Enter'], desc: '打开详情' },
  { keys: ['/'], desc: '聚焦搜索' },
  { keys: ['?'], desc: '显示本提示' },
  { keys: ['Esc'], desc: '关闭提示' },
];

export default function KeyboardHint() {
  const { dismissed, dismiss } = useKbdHintDismissed();
  // 浮层可见：用户没 dismiss + 没过期 + 还没被关闭过
  const [hintVisible, setHintVisible] = useState(true);
  // cheat sheet 可见：用户按 `?` 触发
  const [cheatOpen, setCheatOpen] = useState(false);
  const triggerRef = useRef(null);

  // 浮层 6 秒自动消失
  useEffect(() => {
    if (dismissed || !hintVisible) return;
    const t = setTimeout(() => setHintVisible(false), HINT_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [dismissed, hintVisible]);

  // 全局 `?` 监听：弹出 cheat sheet
  // 守卫：
  //   - input / textarea / contenteditable 聚焦时跳过（用户正在编辑）
  //   - 带 Cmd/Ctrl/Alt 修饰键时跳过
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '?') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      triggerRef.current = e.target;
      setCheatOpen((v) => !v); // 切换：再按 `?` 关闭
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onHintDismiss = useCallback(() => {
    setHintVisible(false);
    dismiss();
  }, [dismiss]);

  const closeCheat = useCallback(() => {
    setCheatOpen(false);
    // 把焦点送回触发元素（按钮或 input 等），避免焦点丢失
    triggerRef.current?.focus?.();
  }, []);

  // 浮层显示条件：用户没永久关闭 + 还没过期
  const showHint = !dismissed && hintVisible;

  return (
    <>
      {/* 浮层：底部居中，淡提示 */}
      {showHint && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30
                     glass-pill inline-flex items-center gap-3
                     px-4 py-2 rounded-md text-xs font-mono
                     [@media(max-width:640px)]:text-[10px]
                     animate-heroFade"
        >
          <Keyboard size={14} aria-hidden />
          <span>按 j/k 切换 · Enter 进入 · / 搜索 · ? 帮助</span>
          <button
            type="button"
            onClick={onHintDismiss}
            aria-label="关闭键盘提示"
            className="[@media(hover:hover)]:hover:text-brand-light text-brand-mid
                       [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]
                       inline-flex items-center justify-center -mr-2 px-2 rounded
                       transition-colors"
          >
            <X size={12} aria-hidden />
          </button>
        </div>
      )}

      {/* Cheat sheet 模态：React Portal 挂到 body 末尾，避免被父 overflow / z-index 影响 */}
      {cheatOpen &&
        createPortal(
          <CheatSheet onClose={closeCheat} />,
          document.body,
        )}
    </>
  );
}

// Cheat sheet：全屏 backdrop + 居中玻璃态卡片 + 快捷键列表
function CheatSheet({ onClose }) {
  const dialogRef = useRef(null);

  // 打开时把焦点送入 dialog（首个 focusable 元素）
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Esc 关闭
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] bg-brand-dark/80 backdrop-blur-sm
                 flex items-center justify-center p-4"
      onClick={(e) => {
        // 点 backdrop 关闭（点击 dialog 内不关闭）
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbd-cheat-title"
        tabIndex={-1}
        className="glass-pill max-w-md w-full p-6 rounded-lg outline-none
                   [@media(max-width:640px)]:max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="kbd-cheat-title" className="font-serif italic text-xl text-brand-light">
            键盘快捷键
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭快捷键提示"
            className="[@media(hover:hover)]:hover:text-brand-light text-brand-mid
                       [@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]
                       inline-flex items-center justify-center w-8 h-8 rounded
                       transition-colors"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((s) => (
            <li key={s.keys.join('+')} className="flex items-center gap-3">
              <span className="inline-flex gap-1 shrink-0">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded font-mono text-xs
                               bg-brand-surface border border-brand-border
                               text-brand-light min-w-[2rem] text-center"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
              <span className="text-brand-mid">{s.desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-brand-dim">按 Esc 或点击背景关闭</p>
      </div>
    </div>
  );
}