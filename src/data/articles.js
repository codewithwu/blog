// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 markdown 源文件
import helloWorld from '../../articles/hello-world.md?raw';
import ragFenCengJianSuo from '../../articles/RAG分层检索.md?raw';

const articles = [
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld
  },
  {
    slug: 'RAG分层检索',
    title: 'RAG分层检索',
    excerpt: '在RAG（Retrieval-Augmented Generation）系统中，检索策略的设计直接影响最终生成效果。核心目标只有两个',
    date: '2026-06-03',
    tags: ['RAG', '检索'],
    cover: null,
    content: ragFenCengJianSuo
  }
];

export default articles;
