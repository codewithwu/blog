// 项目发布 registry：metadata + ?raw 导入的 HTML 源文件
//
// 瀑布流重构后，项目与文章合并为统一 Entry（见 src/lib/entries.js），
// 因此项目字段与文章对齐：
//   - title      （原 name）
//   - excerpt    （原 description）
//   - tags       （原 techStack，直接迁移）
//   - type       统一为 'project'，供 lib 层区分渲染
//   - category   项目没有分类概念，恒为 null
//   - date       项目通常无显式日期；统一回退 '1970-01-01'，仅用于排序（UI 隐藏）
//   - links      { github, demo }，UI 用 lucide 图标按钮渲染
//   - cover      封面相对路径，缺失留 null（EntryCard 用渐变兜底）
//   - content    ?raw 导入的 HTML

import introduce from '../../content/introduce.html?raw';

const projects = [
  {
    slug: 'introduce',
    title: 'Claude Task Monitor',
    excerpt:
      '在 VS Code 活动栏侧边栏实时监控本机所有 Claude Code CLI 会话的执行状态。',
    date: '1970-01-01',
    type: 'project',
    category: null,
    tags: ['VS Code', 'Claude Code', 'TypeScript', 'Extension', '开发者工具'],
    cover: null,
    links: {
      github: 'https://github.com/codewithwu/Claude-Task-Monitor',
      demo: null,
    },
    content: introduce,
  },
];

export default projects;
