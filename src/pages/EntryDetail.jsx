// EntryDetail：文章 / 项目 统一详情页（路由 /p/:slug）。
//
// 契约（CLAUDE.md 规则 4 + design.md §3）：
//   - 正文走 100vh iframe（复用 src/lib/html.jsx 的 Html 组件，含 srcDoc / sandbox / base 注入）
//   - 全局无 Navbar / Footer；顶部仅一个固定悬浮「← 返回」按钮
//   - 找不到 slug 时 <Navigate replace /> 跳回首页 /
//   - 底部加「上一篇 / 下一篇」浮条（PrevNextNav），让用户无需返回首页即可翻下一篇
//   - 通过 <Helmet> 注入 OG / Twitter Card meta，便于社交分享（微信/Twitter/LinkedIn）
//
// 新基调（design.md D-6）：返回按钮升级为玻璃态胶囊
//   - bg-brand-surface/60 + backdrop-blur-md（更强玻璃感）
//   - border-brand-primary/40（紫蓝边）
//   - 微光 shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
//   - hover：边框变 glow/70 + 紫光增强
//   - 字体：JetBrains Mono（font-mono）增强工程感
//
// 返回按钮用 navigate('/') 而非 navigate(-1)：后者在直接打开外链时行为不可预测
// （历史栈可能为空），跳首页更稳定（见 prd R4）。
//
// 移动端 hover 守卫（子任务 08-16-mobile-hover-guard）：
//   返回按钮的 hover 态（背景 / 边框 / shadow 切换）也会在触屏 tap 后残留，
//   与 EntryCard 同款原因（iOS Safari 尤其严重）。同用 `[@media(hover:hover)]:`
//   包住 hover utility，确保只有真有 hover 能力的设备才触发视觉反馈；
//   触屏用户看到的是默认态，体验与系统原生行为一致。
//   键盘 focus 仍按浏览器默认行为显示 outline（按钮本身无 focus-visible 自定义样式）。
//
// 浮条设计：
//   - 位置：bottom-6 居中（fixed），与左上角返回按钮（top-4 left-4）视觉无重叠
//   - 风格：与返回按钮同款玻璃态胶囊（保持视觉一致）
//   - 数据：findNeighbors(slug) 在 allEntries（articles+projects 合并降序）中定位前后邻居
//   - 路由切换时：父组件 entry prop 变 → 子组件 PrevNextNav prev/next 也变，
//     整页用同一组件实例，不闪屏；新 iframe 由 key 变化强制重建（依赖 react-router 的 route key）
//
// OG / Twitter Card meta：
//   - 数据来源：entry.title + entry.excerpt
//   - URL 拼接：window.location.origin + window.location.pathname 自动包含 GitHub Pages base
//   - og:image 用单品牌图（public/og-default.png，1200×630 PNG，78 KB；详见
//     scripts/generate-og-image.py）。当前所有 entry cover: null，未来有 cover 时再加分
//     支用 entry.cover。
//   - SPA + Helmet 限制：爬虫（Twitterbot / Facebook）大多不执行 JS，分享卡片在用户
//     复制链接时由客户端 JS 渲染才完整生效；本期已知限制，未来若需 SEO 强可见需引入
//     vite-plugin-prerender 做静态预渲染（out of scope）。
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { findEntryBySlug, findNeighbors } from '../lib/entries.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import PrevNextNav from '../components/PrevNextNav.jsx';

export default function EntryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const entry = findEntryBySlug(slug);

  // 早返回必须在 usePageTitle 之前：否则无效 slug 会先把 document.title 改成
  // 「未找到内容 · Cool Panda」，再被 Home 的 usePageTitle 覆盖 — 标签栏闪烁。
  // entry 已确定存在，下方 hook 直接用 entry.title（去掉 '|| 未找到内容' 兜底）。
  if (!entry) {
    return <Navigate to="/" replace />;
  }

  usePageTitle(entry.title);

  // 计算 prev / next 邻居。entry 已存在（上面已 early return），
  // 所以 findNeighbors 一定不会返回 null；用对象解构拿 prev / next。
  // 这里不 useMemo：findNeighbors 是 O(n)，详情页每次 route 切换只调用一次。
  const { prev, next } = findNeighbors(entry.slug);

  // OG / Twitter Card meta 数据
  //   - ogUrl: 当前页绝对 URL
  //     * pathname 自动含 GitHub Pages base（/blog/）
  //     * 必须拼 hash：HashRouter 下 pathname 永远是 /blog/，真实 entry URL 是 #/p/<slug>
  //       旧实现 ${origin}${pathname} 丢 hash，og:url 永远指向站点根，
  //       社交分享卡点击跳首页（08-17 code-review #1）
  //     * window.location.hash 自带前导 #，无需手动加
  //   - ogImage: 单品牌图绝对 URL；import.meta.env.BASE_URL 末尾带 /，直接拼文件名
  //   - description: 优先 excerpt，缺失兜底用 title
  const ogUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  const ogImage = `${window.location.origin}${import.meta.env.BASE_URL}og-default.png`;
  const description = entry.excerpt ?? entry.title;

  return (
    <>
      {/* OG / Twitter Card meta：社交分享卡片来源
          - og:type=article（项目也用 article，因为 og:project 不是标准 type）
          - twitter:card=summary_large_image（适配 1200×630 大图）
          - 未来若 entry 有 cover，加 <meta property="og:image" content={entry.cover} /> 分支 */}
      <Helmet>
        <meta property="og:type" content="article" />
        <meta property="og:title" content={entry.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Cool Panda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={entry.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      {/* aria-label="返回首页" 给屏幕阅读器更明确的语义：
          按钮文本「← 返回」屏幕阅读器会朗读成「左箭头 返回」，加了 aria-label
          后会被覆盖成「返回首页」，更接近人类自然语言，也避免被「←」这种符号
          干扰（部分阅读器对特殊符号处理不一致）。 */}
      <button
        type="button"
        aria-label="返回首页"
        onClick={() => navigate('/')}
        // glass-pill: 玻璃态胶囊 + 紫蓝边 + 微光 + hover 紫光增强（src/index.css @layer components）
        className="glass-pill fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm font-mono"
      >
        ← 返回
      </button>
      {/* key={entry.slug}：路由切换 /p/A → /p/B 时强制 Html 子组件重建
           - React 按 key 变化识别为不同 element 实例 → unmount 旧 + mount 新
           - Html 内 useState(true) 让 loading 重置 true → shimmer 重新出现
           - 不加 key 时 EntryDetail 组件复用，iframe DOM 节点复用，
             loading 保持 false，shimmer 不再触发（08-17 code-review #2） */}
      <Html key={entry.slug} html={entry.content} title={entry.title} />
      {/* 底部「上一篇 / 下一篇」浮条 —— 与返回按钮同款玻璃态胶囊
          fixed 定位不进入 iframe 流，iframe 滚动与浮条互不影响 */}
      <PrevNextNav prev={prev} next={next} />
    </>
  );
}