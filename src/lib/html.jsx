// 渲染项目详情正文：统一走 iframe srcDoc。
// - 完整 HTML 文档（首部为 <!doctype> 或 <html>）：直接塞进 srcDoc
// - HTML 片段：包成最小文档（<!doctype html><html><head><meta ...><meta ...></head><body>...</body></html>），
//   这样片段也走独立视口，不再继承宿主页面的 Tailwind/字体栈
// 两种形态视觉一致：iframe 严格 100vh、无边框、占满 viewport。
//
// Trust model: 项目 HTML 由作者控制（projects/<slug>.html），不是外部输入。
//
// 两个非显然的坑：
//  1. 锚点链接会被导航到父页面
//     Chromium 在 srcDoc iframe 里会把 document.baseURI 设为父页面的 URL，
//     所以 `<a href="#essence">` 实际解析为 `http://host/blog/#essence`，
//     点击后 iframe 被导航到父页面，React Router 找不到该路径就 404。
//     修复：往 head 里注入 `<base href="about:srcdoc">`，让锚点回到 iframe
//     自己的 `about:srcdoc#xxx`，变成同文档 hash 跳转（仅滚动）。
//  2. target="_blank" 被静默拦截
//     sandbox 默认禁止弹窗，需要 `allow-popups` 才会打开新标签页。
//     `allow-forms` 是为了放行项目里偶尔出现的 <form>（如设置面板）。
//
// 加载期 shimmer 占位（08-16 iframe-shimmer-a11y）：
//   - 为什么需要：详情页 iframe 是 100vh，srcDoc 是同步字符串，浏览器解析极快，
//     但 iframe 元素首次挂载到首帧渲染之间仍有 ~50ms 缝隙（与网速、机器无关，
//     是 React commit → iframe DOM 挂载 → 解析 srcDoc → 绘制首帧的固有延迟）。
//     这段缝隙内用户看到的是宿主页面的背景透过半透明 iframe 渗出——闪白屏。
//   - 解决：iframe 外层包一个 relative 容器；初始 loading=true 时叠一个 absolute
//     shimmer 占位（bg-brand-surface/40 + backdrop-blur-sm + animate-pulse，玻璃态
//     呼应整站氛围）；iframe onLoad 触发后 setLoading(false)，占位通过 opacity-100
//     → opacity-0 + transition-opacity duration-300 淡出。
//   - onLoad 不可靠的兜底：srcDoc 模式下浏览器可能因为「文档已就绪」直接跳过 load
//     事件（特别是 SPA 内 srcDoc 是同步字符串）。这里额外用 requestAnimationFrame
//     作为兜底——iframe mount 后下一帧就主动 setLoading(false)；这样即使 onLoad 没
//     触发，最多延迟一帧就隐藏 shimmer，不会出现「永远 loading」的卡死态。
//   - title 属性：iframe 的 title 给屏幕阅读器朗读，让用户知道这块 iframe 内容是什么
//     （EntryDetail 传入 entry.title）；不支持 i18n，本期都是中文站名。
import { useState, useEffect } from 'react';

export default function Html({ html, title = 'Project detail' }) {
  const raw = html || '';
  const head = raw.trim().toLowerCase();
  const isFullDocument =
    head.startsWith('<!doctype') || head.startsWith('<html>') || head.startsWith('<html ');

  let srcDoc = isFullDocument
    ? raw
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${raw}</body></html>`;

  // 注入 <base href="about:srcdoc">，让锚点链接走 iframe 自己的文档，
  // 而不是被父页面的 baseURI 拽走。已存在 <base> 的文档保持原样不动。
  if (!/<base\b/i.test(srcDoc)) {
    srcDoc = srcDoc.replace(
      /<head(\s*[^>]*)>/i,
      '<head$1><base href="about:srcdoc">'
    );
    // 兜底：没 <head> 的极简文档，插到文档开头
    if (!/<base\b/i.test(srcDoc)) {
      srcDoc = `<base href="about:srcdoc">` + srcDoc;
    }
  }

  // iframe 加载期 shimmer 占位：useState(true) → setLoading(false) 后淡出
  const [loading, setLoading] = useState(true);

  // 兜底：srcDoc 模式下浏览器可能跳过 onLoad 事件（见文件头注释）。
  // 这里在 iframe mount 后下一帧就主动 setLoading(false)，避免 shimmer 永远不消失。
  // 如果 onLoad 正常触发，它会先 setLoading(false)；后续重复 setState(false) 是 no-op，
  // React 不会触发额外 render（State 是对象比较）。
  useEffect(() => {
    // 兜底隐藏 shimmer：iframe mount 后下一帧（rAF）主动 setLoading(false)。
    // 如果 onLoad 已经触发，setLoading(false) 是 React no-op，不会重复 render。
    // rAF 在生产浏览器里约 16ms 后回调，恰好覆盖 iframe 首次挂载 → 首帧渲染
    // 这段缝隙。如果 onLoad 已经触发并把 loading 切到 false，本 rAF 再调一次
    // setLoading(false) 也是 no-op。
    const raf = requestAnimationFrame(() => setLoading(false));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* 加载期玻璃态 shimmer 占位
          - 永远挂在 DOM 里（用 opacity 切换可见性），让 transition-opacity 真正生效
            （unmount 会跳过 transition）；同时不影响 iframe 交互（pointer-events-none）
          - absolute inset-0 铺满父容器
          - bg-brand-surface/40 + backdrop-blur-sm：半透明玻璃态，呼应整站氛围
          - animate-pulse：Tailwind 内建脉冲动画，呼吸感
          - transition-opacity duration-300：opacity-100 → opacity-0 淡出 300ms
          - aria-hidden：占位对屏幕阅读器隐藏，避免把「loading shimmer」读给用户 */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-brand-surface/40 backdrop-blur-sm animate-pulse pointer-events-none
                    transition-opacity duration-300
                    ${loading ? 'opacity-100' : 'opacity-0'}`}
      />
      <iframe
        srcDoc={srcDoc}
        title={title}
        className="w-full h-screen border-0"
        sandbox="allow-scripts allow-popups allow-forms"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}