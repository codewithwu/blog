// 项目数据：metadata + ?raw 导入的 HTML 片段
// 字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content
import articles from '../../projects/articles.html?raw';

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
];

export default projects;
