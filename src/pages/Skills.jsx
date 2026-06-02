// 技能页：按 category 分组的进度条
import skills from '../data/skills.js';
import SkillBar from '../components/SkillBar.jsx';

export default function Skills() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">技能</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {skills.map((group) => (
          <div key={group.category} className="p-6 rounded-xl bg-brand-surface border border-brand-mid/20">
            <h2 className="text-lg font-semibold text-brand-orange mb-4">{group.category}</h2>
            <div className="space-y-4">
              {group.items.map((s) => (
                <SkillBar key={s.name} name={s.name} level={s.level} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
