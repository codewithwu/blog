// iframe-link-bridge：注入到 srcDoc iframe 内的桥接脚本。
//
// 父任务 08-18-ux-optimization-suite P1-8/15/16（iframe 同站链接拦截）：
//   - 问题：项目 / 文章 HTML 作者可能写 <a href="#/p/foo"> 或 <a href="/blog/#/p/foo">
//     期望同站路由跳转（react-router HashRouter 接管）。但：
//     a) <a href="#/foo"> 在 sandbox about:srcdoc iframe 内，点击无反应（base href
//        已修但只有 #anchor 走 about:srcdoc，#/foo 这种是路由 hash 不走 iframe）
//     b) <a href="/blog/#/p/foo"> 跳父页面 reload，丢失 SPA 状态
//     c) <a href="https://external.com"> 应保留新窗口打开（sandbox allow-popups 已开）
//     d) <a href="#section">（纯锚点）应保留 iframe 内滚动
//
//   - 解决：在 srcDoc 内注入一段 <script>，捕获 capture phase click，识别同站路由
//     href 并改走 window.parent.location.hash（让父 HashRouter 接管）
//
//   - 不加 iframe allow-same-origin：bridge 脚本走 window.parent 访问父不依赖同源；
//     跨 origin 也只是 location.hash 这个「单属性写入」操作，浏览器允许
//
// 拦截规则（isRouterHref）：
//   - /^\#\//.test(href)         以 #/ 开头（HashRouter 路由）→ 拦截
//   - /^\/(?!\/)/.test(href)      以 / 开头（不是 // 即不是 protocol-relative URL）→ 拦截
//   - 含 origin 跨域或 http(s):// → 不拦截（走默认 target=_blank 或新窗口）
//
// 边缘 case：
//   - 作者写了 target="_blank" 且 href 是路由：preventDefault + 改 parent.hash
//     （target=_blank 是误用，作者本意是"跳详情页"，纠正之）
//   - 作者写了 onclick="location.href=..." → 不拦截（不走 click event；本期限制）
//   - capture phase 确保比作者 inline onclick 先执行
//
// 实现细节：
//   - 用 capture phase（addEventListener 第三参 true）确保比作者 onclick 早
//   - preventDefault 阻止浏览器默认行为（iframe 内同文档跳转或 reload）
//   - window.parent.location.hash = newHref 让父 React Router 接管
//     HashRouter 内部监听 hashchange 事件 → 重新匹配 Routes
//
// 注入位置（src/lib/html.jsx）：
//   - 在 <base href="about:srcdoc"> 之后，避免被 base 覆盖
//   - 完整文档：插入 <head> 末尾
//   - 片段：lib/html.jsx 包装时已有 <head>，直接追加
export const BRIDGE_SCRIPT = `
(function(){
  function isRouterHref(href){
    if(!href) return false;
    // 同站路由：#/ / /blog/... 走父 HashRouter
    return href.charAt(0) === '#' && href.length > 1 && href.charAt(1) === '/'
        || href.charAt(0) === '/' && href.charAt(1) !== '/';
  }
  function normalizeHash(href){
    // /blog/#/p/foo → #/p/foo（去掉 base path）
    // /#/p/foo       → #/p/foo
    // #/p/foo        → #/p/foo（不变）
    var hashIdx = href.indexOf('#');
    if(hashIdx >= 0) return href.substring(hashIdx);
    return '#' + href;
  }
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!isRouterHref(href)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      window.parent.location.hash = normalizeHash(href);
    } catch(err) {
      // parent 不可访问（同源限制极端情况）；退化到当前 iframe 内 location
      // 但因为 base href=about:srcdoc，#/<path> 不会触发 router；
      // 这种情况下用户点链接无反应；本期不解决
    }
  }, true);
})();
`.trim();