// 文章分组的元数据：单一来源（slug + 中文显示名 + 固定展示顺序）
// 一个 category 可选地声明 group: '<group-slug>'，归属某个 group。
// 同一个 group 的成员按它们在 categories 中的顺序串成 chip 列，
// group chip 本身插在 group 第一个成员前面渲染一次。
export const groups = [
  { slug: 'ai', name: 'AI 主题' },
];

export const categories = [
  { slug: 'llm',         name: 'LLM 原理与基础',     group: 'ai' },
  { slug: 'prompt',      name: '提示工程',           group: 'ai' },
  { slug: 'rag',         name: '检索增强生成',       group: 'ai' },
  { slug: 'agent',       name: 'AI 智能体',          group: 'ai' },
  { slug: 'tool',        name: 'AI 工具与产品',      group: 'ai' },
  { slug: 'industry',    name: 'AI 行业观察',        group: 'ai' },
  { slug: 'engineering', name: '软件工程与开发实践' },
  { slug: 'product',     name: '产品与设计' },
  { slug: 'notes',       name: '随笔与思考' },
  { slug: 'resources',   name: '资源整理' },
];

// 仍然是 10 个原分类 slug 的集合，用于校验 metadata.category。
// group slug 'ai' 不在集合里——它是组标识，不是分类 slug。
export const categorySlugSet = new Set(categories.map((c) => c.slug));
