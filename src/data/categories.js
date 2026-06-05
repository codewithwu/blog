// 文章分类的元数据：单一来源（slug + 中文显示名 + 固定展示顺序）。
// 任何 UI 上展示的中文分类名、URL 用 slug、分类筛选的固定顺序，都以本文件为准。
// 修改顺序 = 修改分类筛选条上 chip 的先后顺序；新增条目 = 新增一个允许的分类。
export const categories = [
  { slug: 'llm',         name: 'LLM 原理与基础' },
  { slug: 'prompt',      name: '提示工程' },
  { slug: 'rag',         name: '检索增强生成' },
  { slug: 'agent',       name: 'AI 智能体' },
  { slug: 'tool',        name: 'AI 工具与产品' },
  { slug: 'industry',    name: 'AI 行业观察' },
  { slug: 'engineering', name: '软件工程与开发实践' },
  { slug: 'product',     name: '产品与设计' },
  { slug: 'notes',       name: '随笔与思考' },
  { slug: 'resources',   name: '资源整理' },
];

export const categorySlugSet = new Set(categories.map((c) => c.slug));
