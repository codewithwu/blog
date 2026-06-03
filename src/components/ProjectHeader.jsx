// 项目详情头部：标题、描述、技术栈徽章、GitHub/Demo 链接
// 与 ProjectCard 共享徽章/链接样式，但字号更大以适配详情页
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectHeader({ project }) {
  return (
    <header className="mt-6">
      <h1 className="text-4xl font-bold text-brand-light">{project.name}</h1>
      <p className="mt-3 text-base text-brand-mid">{project.description}</p>
      {project.techStack && project.techStack.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.techStack.map((t) => (
            <li key={t} className="px-2 py-0.5 text-xs rounded bg-brand-green/15 text-brand-green">
              {t}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-4 text-sm">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <Github size={16} /> GitHub
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>
    </header>
  );
}
