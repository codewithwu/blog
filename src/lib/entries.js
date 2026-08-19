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
    // P2-22 改造（父任务 08-18-ux-optimization-suite）：readingTime 可选字段
    //   - 缺省回退 null（UI 不显示「X 分钟阅读」）
    //   - 数字（分钟）或 null
    //   - 未来作者可在 articles.js / projects.js metadata 加 readingTime: 5
    readingTime: e.readingTime ?? null,
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

// findNeighbors：返回指定 slug 的「上一篇 / 下一篇」邻居。
//
// 实现思路：复用 listEntries()（已经按 date 降序合并 articles + projects，
// 项目 '1970-01-01' 自然沉底），再做 findIndex 取前后位置。
//
// 返回结构：
//   {
//     prev:    Entry | null,   // 上一篇 = 时间上更早（更老）。当 current 是最新的
//                              // 时为 null（没有比它更早的邻居）。
//     current: Entry,           // 当前条目（必传 slug 命中后才返回，所以一定存在）
//     next:    Entry | null,   // 下一篇 = 时间上更新（较新）。当 current 是最老的
//                              // 时为 null（没有比它更新的邻居；包括项目沉底情况）。
//   }
//
// 语义说明（与 prd 验收一致）：
//   - 「上一篇」= date 更早的 entry（时间上靠前/之前的）
//   - 「下一篇」= date 更新的 entry（时间上靠后/之后的）
//   - 在 desc 数组里：idx 越小越新，idx 越大越老
//   - 所以「上一篇」= idx+1（更老），「下一篇」= idx-1（更新）
//
// 边界语义：
//   - slug 不在 allEntries 里 → 返回 null（让调用方决定走 Navigate 回首页或兜底）
//     这样调用方拿到 null 时知道当前 entry 不存在，应该先 early-return，
//     避免在详情页「未找到」时还尝试渲染浮条。
//   - 列表只有 1 个 entry → prev / next 都是 null（只有 current）
//   - 列表 ≥ 2 个 → 至少有一个方向有邻居
//   - 当前 entry 是最新的 → prev 指向第二新的（即 idx+1 = 更老的那个）
//   - 当前 entry 是最老的（含项目沉底） → next 为 null
//
// 复杂度 O(n)（与 findEntryBySlug 同阶）；n < 100 时无需 memoize，
// 详情页每次 route 切换只调用一次，开销可忽略。
export function findNeighbors(slug) {
  const list = listEntries();
  const idx = list.findIndex((e) => e.slug === slug);
  if (idx === -1) return null;
  return {
    // 上一篇 = 时间上更早 = desc 数组里靠后 = idx+1
    prev: idx < list.length - 1 ? list[idx + 1] : null,
    current: list[idx],
    // 下一篇 = 时间上更新 = desc 数组里靠前 = idx-1
    next: idx > 0 ? list[idx - 1] : null,
  };
}

// entryCount：内容总数，供 Hero 展示。
export function entryCount() {
  return allEntries.length;
}

// mostRecentDate：返回所有 entry 中最大的 date（YYYY-MM-DD 字符串字典序 = 日期序）。
// 父任务 08-18-ux-optimization-suite P1-4：Hero LAST_UPDATED 从硬编码改为派生。
// 找不到任何 entry 时返回 null（Hero 显示「—」）。
//
// 实现：
//   - reduce 一次遍历，O(n)；n < 100 时无需 memoize
//   - 直接比较 ISO date 字符串（YYYY-MM-DD 字典序与日期序一致，无需 new Date）
//   - 项目 date 默认回退 '1970-01-01'，所以全空 articles 时项目会"赢"；
//     这是合理的：项目至少被更新过
export function mostRecentDate() {
  if (allEntries.length === 0) return null;
  return allEntries.reduce((max, e) => (e.date > max ? e.date : max), allEntries[0].date);
}
