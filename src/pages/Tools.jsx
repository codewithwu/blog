// 工具页：按 category 分组的卡片网格
// 移动 1 列 / 平板 2 列 / 桌面 3 列（grid 响应式断点控制）
import tools from '../data/tools.js';
import ToolCard from '../components/ToolCard.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Tools() {
  usePageTitle('工具');
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">工具</h1>
      <div className="space-y-8">
        {tools.map((group) => (
          <div key={group.category}>
            <h2 className="text-lg font-semibold text-brand-orange mb-4">{group.category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((t) => (
                <ToolCard key={t.name} tool={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
