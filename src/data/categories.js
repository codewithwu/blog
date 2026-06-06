// 文章分类元数据：单一来源（slug + 中文显示名 + 固定展示顺序）
// 6 个分类都是扁平的，没有 group / 子分类概念。
export const categories = [
  { slug: 'ai',          name: 'AI' },
  { slug: 'python',      name: 'Python' },
  { slug: 'engineering', name: '软件工程与开发实践' },
  { slug: 'product',     name: '产品与设计' },
  { slug: 'notes',       name: '随笔与思考' },
  { slug: 'resources',   name: '资源整理' },
];

// 6 个分类 slug 的集合，用于校验 metadata.category。
export const categorySlugSet = new Set(categories.map((c) => c.slug));
