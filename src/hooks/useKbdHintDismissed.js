// useKbdHintDismissed：用户是否已永久关闭键盘快捷键提示浮层。
//
// 父任务 08-18-ux-optimization-suite P1-12：
//   - localStorage 持久化用户选择（key: `coolpanda_kbd_hint_dismissed`）
//   - localStorage 读取失败时降级为 false（每次都显示，try/catch 兜底）
//   - 写入失败不影响 UI（catch 静默）
//   - 用 lazy init + listener 模式：组件 mount 时读一次；后续 storage 事件触发
//     同步（多 Tab 同步）
//
// 用法：
//   const { dismissed, dismiss } = useKbdHintDismissed();
//   {!dismissed && <KeyboardHint onDismiss={dismiss} />}
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'coolpanda_kbd_hint_dismissed';

// 安全读取：localStorage 在 jsdom 默认存在；某些隐私模式 / file:// 可能抛异常
function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默：写入失败不影响 UI（用户每次都看到提示，但不致命）
  }
}

export default function useKbdHintDismissed() {
  const [dismissed, setDismissed] = useState(readDismissed);

  // 监听同源其它 Tab 的 storage 事件：用户在 Tab A 关闭提示，Tab B 也应同步
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      setDismissed(e.newValue === '1');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    writeDismissed(true);
  }, []);

  return { dismissed, dismiss };
}