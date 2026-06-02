// 时间轴节点：左侧时间，中间绿色圆点，右侧内容
export default function TimelineItem({ year, title, subtitle, desc }) {
  return (
    <li className="relative pl-8 pb-8 border-l border-brand-mid/30 last:border-l-transparent">
      <span className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-green
                       ring-4 ring-brand-green/20" />
      <div className="text-sm text-brand-mid">{year}</div>
      <h3 className="mt-1 text-lg font-semibold text-brand-light">{title}</h3>
      {subtitle && <div className="text-sm text-brand-orange">{subtitle}</div>}
      {desc && <p className="mt-2 text-sm text-brand-light/80">{desc}</p>}
    </li>
  );
}
