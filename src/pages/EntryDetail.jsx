// EntryDetail：文章 / 项目 统一详情页（路由 /p/:slug）。
//
// 契约（CLAUDE.md 规则 10d + design.md §9）：
//   - 正文走 100vh iframe（复用 src/lib/html.jsx 的 Html 组件，含 srcDoc / sandbox / base 注入）
//   - 全局无 Navbar / Footer；顶部仅一个固定悬浮「← 返回」按钮
//   - 找不到 slug 时 <Navigate replace /> 跳回首页 /
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
  usePageTitle(entry?.title || '未找到内容');

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm
                   bg-brand-dark/70 text-brand-light
                   border border-brand-mid/30
                   backdrop-blur-sm
                   hover:bg-brand-dark/90 hover:border-brand-orange/60
                   transition-colors"
      >
        ← 返回
      </button>
      <Html html={entry.content} title={entry.title} />
    </>
  );
}
