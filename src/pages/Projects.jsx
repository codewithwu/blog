// 项目页：卡片网格（移动 1 列 / 平板 2 列 / 桌面 3 列）
import projects from '../data/projects.js';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Projects() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">项目</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}
