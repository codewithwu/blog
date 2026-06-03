// 技能条目：技能名 + 等级徽章（一行布局）
// 等级颜色按 brand-guidelines：精通=橙、熟练=蓝、进阶=绿
const LEVEL_STYLES = {
  精通: 'bg-brand-orange/15 text-brand-orange border-brand-orange/40',
  熟练: 'bg-brand-blue/15   text-brand-blue   border-brand-blue/40',
  进阶: 'bg-brand-green/15  text-brand-green  border-brand-green/40',
};

export default function SkillBar({ name, level }) {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES['进阶'];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-brand-light">{name}</span>
      <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full
                       text-xs font-medium border ${style}`}>
        {level}
      </span>
    </div>
  );
}
