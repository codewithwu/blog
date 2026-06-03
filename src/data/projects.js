// 项目数据：metadata + ?raw 导入的 markdown 内容
// 字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content
import sample from '../../projects/_sample.md?raw';

const projects = [
  {
    slug: '_sample',
    name: '示例项目',
    description: '这是一个示例项目，用来演示项目页 + 详情页的工作流。',
    techStack: ['Markdown'],
    githubUrl: 'https://github.com/cooper/sample-project',
    demoUrl: null,
    cover: null,
    content: sample
  }
];

export default projects;
