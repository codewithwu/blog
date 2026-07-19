// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 .html 源文件

import agentToolAllAtOnce from '../../content/agent-tool-all-at-once.html?raw';
import intimateRelationshipCurve from '../../content/intimate-relationship-curve.html?raw';

const articles = [
  {
    slug: 'agent-tool-all-at-once',
    title: '智能体应该一次性把所有工具都给它吗？',
    excerpt:
      '工具过多会膨胀上下文、降低选择准确率并增加成本，应按场景动态筛选、路由或检索工具。',
    date: '2026-06-10',
    type: 'article',
    category: 'ai',
    tags: ['LangChain', 'Agent', 'Tool', '设计模式'],
    cover: null,
    links: null,
    content: agentToolAllAtOnce,
  },
  {
    slug: 'intimate-relationship-curve',
    title: '亲密关系曲线',
    excerpt:
      '以星图般曲线描绘亲密关系从相识、心动、冲突到理解与并肩同行的十一阶段。',
    date: '2026-07-19',
    type: 'article',
    category: 'notes',
    tags: ['亲密关系', '随笔', '可视化'],
    cover: null,
    links: null,
    content: intimateRelationshipCurve,
  },
];

export default articles;
