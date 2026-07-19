// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 .html 源文件

import intimateRelationshipCurve from '../../content/intimate-relationship-curve.html?raw';
import claudeCodeTamingGuide from '../../content/claude-code-taming-guide.html?raw';

const articles = [
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
  {
    slug: 'claude-code-taming-guide',
    title: 'Claude Code 调教指南：七种武器，让AI程序员真正听懂你的话',
    excerpt:
      'Anthropic 把自定义机制分成七类，按加载时机、上下文开销、执行权限划分。本文逐类拆解 CLAUDE.md / rules / skills / subagents / hooks / output styles / append-system-prompt，并给出选择指南与五个常见踩坑信号。',
    date: '2026-07-19',
    type: 'article',
    category: 'ai',
    tags: ['Claude Code', 'Anthropic', '提示工程', '工作流'],
    cover: null,
    links: null,
    content: claudeCodeTamingGuide,
  },
];

export default articles;
