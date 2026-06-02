// 项目卡片：名称、描述、技术栈、GitHub/Demo 链接
// 移动端 1 列、桌面 3 列（父容器 grid 控制）
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project }) {
  return (
    <div className="p-6 rounded-xl bg-brand-surface border border-brand-mid/20
                    hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                    transition-all duration-300 flex flex-col">
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-orange/30 via-brand-blue/20 to-brand-green/30
                      flex items-center justify-center text-3xl font-bold text-brand-light/70">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-brand-light">{project.name}</h3>
      <p className="mt-2 text-sm text-brand-mid flex-1">{project.description}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {project.techStack.map((t) => (
          <li key={t} className="px-2 py-0.5 text-xs rounded bg-brand-green/15 text-brand-green">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-3 text-sm">
        <a href={project.githubUrl} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
          <Github size={16} /> GitHub
        </a>
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>
    </div>
  );
}
