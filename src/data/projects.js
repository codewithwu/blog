// 项目数据：metadata + ?raw 导入的 markdown 内容
// 字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content
import _sample from '../../projects/_sample.md?raw';

const projects = [
  {
    slug: '_sample',
    name: '示例项目',
    description: '这是一个示例项目，用来演示项目页与详情页的工作流。',
    techStack: ['JavaScript'],
    githubUrl: null,
    demoUrl: null,
    cover: null,
    content: _sample
  },
];

export default projects;
