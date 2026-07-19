// 统一内容查询层（Entry 抽象）
//
// 瀑布流重构后，文章与项目合并为同一内容类型 Entry。页面只调用本模块，
// 不直接 import data 层，也不需要知道 article / project 的字段差异。
//
// 数据来源仍分两个 registry（保留分文件惯例，减小 diff）：
//   - src/data/articles.js（type: 'article'，带 category）
//   - src/data/projects.js（type: 'project'，category 恒为 null，date 回退 '1970-01-01'）
//
// Entry 形状（见 design.md §3）：
//   { slug, title, excerpt, date, type, category, tags, cover, links, content }
import articles from '../data/articles.js';
import projects from '../data/projects.js';

// 合并两个 registry。articles / projects 里已带 type / category / links 字段，
// 这里做一层防御性 normalize：确保缺省字段也有安全默认值，避免 UI 读到 undefined。
function normalize(list) {
  return list.map((e) => ({
    slug: e.slug,
    title: e.title,
    excerpt: e.excerpt,
    // 项目常无 date，回退 '1970-01-01' 让它在降序排序里自然沉底
    date: e.date || '1970-01-01',
    type: e.type,
    category: e.category ?? null,
    tags: e.tags ?? [],
    cover: e.cover ?? null,
    links: e.links ?? null,
    content: e.content,
  }));
}

// 全部 entry 的合并数组（articles + projects），未排序。
const allEntries = [...normalize(articles), ...normalize(projects)];

// listEntries：返回按 date 降序排列的所有 entry。
// 项目 date 为 '1970-01-01' 会自然排到最后，符合「文章优先展示」的预期。
export function listEntries() {
  return [...allEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// findEntryBySlug：全局唯一 slug 查询。slug 在文章与项目间也保证唯一，
// 所以无需按 type 区分，直接线性查找即可。
export function findEntryBySlug(slug) {
  return allEntries.find((e) => e.slug === slug);
}

// entryCount：内容总数，供 Hero 展示。
export function entryCount() {
  return allEntries.length;
}
