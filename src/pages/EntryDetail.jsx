// EntryDetail：文章 / 项目 统一详情页（路由 /p/:slug）。
//
// 契约（CLAUDE.md 规则 4 + design.md §3）：
//   - 正文走 100vh iframe（复用 src/lib/html.jsx 的 Html 组件，含 srcDoc / sandbox / base 注入）
//   - 全局无 Navbar / Footer；顶部仅一个固定悬浮「← 返回」按钮
//   - 找不到 slug 时 <Navigate replace /> 跳回首页 /
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
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { findEntryBySlug } from '../lib/entries.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

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

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/')}
        // 玻璃态胶囊 + 紫蓝边 + 微光 + JetBrains Mono；hover 边框变 glow + 紫光增强
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm font-mono
                   bg-brand-surface/60 text-brand-light
                   border border-brand-primary/40
                   backdrop-blur-md
                   shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
                   hover:bg-brand-surface-2/70 hover:border-brand-glow/70
                   hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]
                   transition-all duration-200"
      >
        ← 返回
      </button>
      <Html html={entry.content} title={entry.title} />
    </>
  );
}