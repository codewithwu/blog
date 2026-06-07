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

  return (
    <iframe
      srcDoc={srcDoc}
      title={title}
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-popups allow-forms"
    />
  );
}
