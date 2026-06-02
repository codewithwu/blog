// 工具卡片：图标 + 名称 + 描述
// icon 是 lucide-react 组件名字符串，用 * as Icons 一次性导入再用名字取
import * as Icons from 'lucide-react';

export default function ToolCard({ tool }) {
  // 动态解析图标：data 里只存字符串名，运行时按名取组件
  // 找不到对应图标时回退到 Wrench，避免 undefined 导致渲染崩溃
  const Icon = Icons[tool.icon] || Icons.Wrench;
  return (
    <div className="p-4 rounded-xl bg-brand-surface border border-brand-mid/20
                    hover:-translate-y-1 hover:shadow-lg hover:border-brand-blue/40
                    transition-all duration-300 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-blue/15 text-brand-blue
                      flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-brand-light">{tool.name}</h3>
        <p className="text-sm text-brand-mid mt-1">{tool.desc}</p>
      </div>
    </div>
  );
}
