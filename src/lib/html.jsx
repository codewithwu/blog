// 渲染项目详情正文：统一走 iframe srcDoc。
// - 完整 HTML 文档（首部为 <!doctype> 或 <html>）：直接塞进 srcDoc
// - HTML 片段：包成最小文档（<!doctype html><html><head><meta ...><meta ...></head><body>...</body></html>），
//   这样片段也走独立视口，不再继承宿主页面的 Tailwind/字体栈
// 两种形态视觉一致：iframe 严格 100vh、无边框、占满 viewport。
// 作者对自己写的 HTML 负责，组件不做清洗。
export default function Html({ html }) {
  const head = (html || '').trim().toLowerCase();
  const isFullDocument = head.startsWith('<!doctype') || head.startsWith('<html');

  const srcDoc = isFullDocument
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html || ''}</body></html>`;

  return (
    <iframe
      srcDoc={srcDoc}
      title="Project detail"
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
