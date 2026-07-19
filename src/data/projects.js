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
import articles from '../../projects/articles.html?raw';
import claudeTaskMonitor from '../../projects/claude-task-monitor.html?raw';

const projects = [
  {
    slug: 'articles',
    title: '作文评分智能体 · 高考七维',
    excerpt: '基于 LangGraph 的多维度评分系统。标准 4 维 / 高考 7 维双模式，条件短路精准识别跑题卷；纯前端 SPA 部署于 GitHub Pages，墨韵设计贯穿始终。',
    date: '1970-01-01',
    type: 'project',
    category: null,
    tags: ['LangGraph', 'React 18', 'TypeScript', 'Vite 5', 'Zod', 'Vitest'],
    cover: null,
    links: {
      github: 'https://github.com/codewithwu/langgraph-essay-grading',
      demo: 'https://codewithwu.github.io/langgraph-essay-grading/',
    },
    content: articles,
  },
  {
    slug: 'claude-task-monitor',
    title: 'Claude Task Monitor',
    excerpt: 'VS Code 侧边栏里实时监控本机所有 Claude Code CLI 会话的执行状态。开源、MIT、跨 IDE。',
    date: '1970-01-01',
    type: 'project',
    category: null,
    tags: ['TypeScript', 'Node.js', 'VS Code Extension API', 'chokidar', 'vitest'],
    cover: null,
    links: {
      github: 'https://github.com/codewithwu/Claude-Task-Monitor',
      demo: null,
    },
    content: claudeTaskMonitor,
  },
];

export default projects;
