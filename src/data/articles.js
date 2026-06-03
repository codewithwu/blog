// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 markdown 源文件
import helloWorld from '../../articles/hello-world.md?raw';
import deployNotes from '../../articles/deploy-notes.md?raw';

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
    slug: 'deploy-notes',
    title: 'GitHub Pages 部署笔记',
    excerpt: '使用 HashRouter + GitHub Actions 自动部署。',
    date: '2026-06-01',
    tags: ['部署', 'GitHub'],
    cover: null,
    content: deployNotes
  }
];

export default articles;
