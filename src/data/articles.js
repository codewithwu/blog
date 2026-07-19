// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 .html 源文件

import sirchmunkDeepDive from '../../articles/ai/sirchmunk-deep-dive.html?raw';

const articles = [
  {
    slug: 'sirchmunk-deep-dive',
    title: 'Sirchmunk 深度解读：把"原始数据"喂给 LLM 的无索引智能检索',
    excerpt: '如果你做过 RAG，第一反应几乎都是：把文档切块、灌进向量库、再做一次 retrieve-and-rerank。Sirchmunk 是 ModelScope 团队开源的反其道而行之的方案：不维护向量索引，直接对原始文件做检索，让知识"自己长出结构"。',
    date: '2026-06-15',
    type: 'article',
    tags: ['RAG', '检索', 'Agent'],
    cover: null,
    links: null,
    content: sirchmunkDeepDive,
    category: 'ai',
  },
];

export default articles;
