// 项目详情：URL :slug → 查项目，渲染 ProjectHeader + HTML 正文
// 找不到 slug 时 <Navigate replace /> 跳回 /projects
import { useParams, Link, Navigate } from 'react-router-dom';
import { findProjectBySlug } from '../lib/projects.js';
import Html from '../lib/html.jsx';
import ProjectHeader from '../components/ProjectHeader.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = findProjectBySlug(slug);
  usePageTitle(project?.name || '未找到项目');

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/projects" className="text-sm text-brand-blue hover:text-brand-orange">
        ← 返回项目列表
      </Link>
      <ProjectHeader project={project} />
      <div className="mt-8">
        <Html html={project.content} />
      </div>
    </article>
  );
}
