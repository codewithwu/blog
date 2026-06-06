// 项目详情：URL :slug → 查项目，渲染悬浮「返回项目列表」按钮 + 100vh iframe。
// Navbar 在 App.jsx 的路由级逻辑下隐藏，详情页 viewport 完全让给 iframe。
// 找不到 slug 时 <Navigate replace /> 跳回 /projects。
import { useParams, Link, Navigate } from 'react-router-dom';
import { findProjectBySlug } from '../lib/projects.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = findProjectBySlug(slug);
  usePageTitle(project?.name || '未找到项目');

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <>
      <Link
        to="/projects"
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm
                   bg-brand-dark/70 text-brand-light
                   border border-brand-mid/30
                   backdrop-blur-sm
                   hover:bg-brand-dark/90 hover:border-brand-orange/60
                   transition-colors"
      >
        ← 返回项目列表
      </Link>
      <Html html={project.content} title={project.name} />
    </>
  );
}
