// 技能进度条：name + 百分比 + 水平进度条
// 进度条颜色按 level 区间分档：>= 80 橙，>= 60 蓝，其他绿
export default function SkillBar({ name, level }) {
  const colorClass =
    level >= 80 ? 'bg-brand-orange' :
    level >= 60 ? 'bg-brand-blue'   :
                  'bg-brand-green';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-brand-light">{name}</span>
        <span className="text-brand-mid">{level}%</span>
      </div>
      <div className="h-2 rounded-full bg-brand-surface overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-700`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
