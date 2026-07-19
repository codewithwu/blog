// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 .html 源文件

import intimateRelationshipCurve from '../../content/intimate-relationship-curve.html?raw';

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
];

export default articles;
