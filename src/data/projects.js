// 项目数据：metadata + ?raw 导入的 HTML 片段
// 字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content
import articles from '../../projects/articles.html?raw';
import claudeTaskMonitor from '../../projects/claude-task-monitor.html?raw';

const projects = [
  {
    slug: 'articles',
    name: '作文评分智能体 · 高考七维',
    description: '基于 LangGraph 的多维度评分系统。标准 4 维 / 高考 7 维双模式，条件短路精准识别跑题卷；纯前端 SPA 部署于 GitHub Pages，墨韵设计贯穿始终。',
    techStack: ['LangGraph', 'React 18', 'TypeScript', 'Vite 5', 'Zod', 'Vitest'],
    githubUrl: 'https://github.com/codewithwu/langgraph-essay-grading',
    demoUrl: 'https://codewithwu.github.io/langgraph-essay-grading/',
    cover: null,
    content: articles
  },
  {
    slug: 'claude-task-monitor',
    name: 'Claude Task Monitor',
    description: 'VS Code 侧边栏里实时监控本机所有 Claude Code CLI 会话的执行状态。开源、MIT、跨 IDE。',
    techStack: ['TypeScript', 'Node.js', 'VS Code Extension API', 'chokidar', 'vitest'],
    githubUrl: 'https://github.com/codewithwu/Claude-Task-Monitor',
    demoUrl: null,
    cover: null,
    content: claudeTaskMonitor
  },
];

export default projects;
