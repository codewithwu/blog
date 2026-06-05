# Design: Article Categories — AI Topic Grouping

**Date:** 2026-06-05
**Status:** Approved (pending user review of written spec)
**Scope:** Flatten the six AI-related sub-categories (`llm`, `prompt`, `rag`, `agent`, `tool`, `industry`) into a single `articles/ai/` folder, and surface a "AI 主题" aggregation chip on the article list page that links to `/articles/category/ai` and shows the union of those six sub-categories.
**Builds on:** `2026-06-05-article-categories-taxonomy-design.md` (v2), which locked down the 10-category taxonomy and the Chinese display names. That taxonomy stays; this spec adds an optional `group` field on each category and a `groups` array, and changes the physical layout of `articles/`.

## Background

After v2, the 10 categories are fixed and the article list page renders one chip per category. The six AI buckets (`llm`, `prompt`, `rag`, `agent`, `tool`, `industry`) are individually routable and each currently lives in its own subfolder under `articles/`. The user now wants:

1. The six AI buckets' `.md` files moved out of their six separate subfolders and into a single `articles/ai/` folder. The `metadata.category` value (one of the 10 real slugs) is preserved, so URL filtering by sub-category (`/articles/category/llm`, etc.) keeps working.
2. A new "AI 主题" chip on the article list page, placed right after "全部", that aggregates the six sub-categories. Clicking it navigates to `/articles/category/ai` and shows the merged article list.
3. The `articles/notes/` folder (and any future non-AI folders) stays as it is.

The mental model: `articles/` is a physical layout hint. The 10 fixed slugs in `metadata.category` remain the source of truth for what each article *is*. "AI 主题" is a **view** that aggregates six of those slugs — not a new category.

## Goals

- All AI-themed `.md` files live under `articles/ai/`, regardless of which of the six sub-categories they belong to.
- `metadata.category` for these files keeps its existing value (`'llm' | 'prompt' | 'rag' | 'agent' | 'tool' | 'industry'`).
- The article list page chip bar shows, in this order: `[全部] [AI 主题 (7)] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`.
- Clicking the "AI 主题" chip navigates to `/#/articles/category/ai` and shows the union of the six sub-categories' articles, in date-desc order.
- The "AI 主题" chip is highlighted when the URL is `/articles/category/ai`; the six sub-category chips are not.
- The page title on `/articles/category/ai` is `AI 主题 · 文章`.
- The `AI 主题` chip is hidden if none of the six sub-categories has any articles (i.e. the group is empty), consistent with v2's "hide empty categories" behavior.
- A new optional `group` field on `categories.js` and a top-level `groups` array make this data-driven: future groups (`engineering` etc.) can be added by editing `categories.js` alone.
- The six sub-categories continue to appear as individual chips, routable to their own filter pages.
- File moves use `git mv` to preserve history.

## Non-Goals

- No new category slug. The `categorySlugSet` still has exactly 10 entries. `'ai'` is a group slug, never a `metadata.category` value.
- No new URL route. The existing `Route path="/articles/category/:category"` accepts any string; `Articles.jsx` learns to recognize the group slug `'ai'` and expand it.
- No visual nesting in the chip bar (no "AI 主题 ▾ → LLM / Prompt / RAG / ..." dropdown). The chips are flat; the "AI 主题" chip is just one more item in the row.
- No sectioned grouping of the article grid on `/articles/category/ai`. The merged list is a single flat grid in date-desc order.
- No build-time check that the `group` field in `categories.js` actually points to a real group. `lib/articles.js` will simply not emit a chip for an unknown group slug.
- No constraint that a file in `articles/ai/` must have an AI-group `metadata.category`. The folder is a physical hint; the metadata is the source of truth. A future author can drop a `notes`-flavored file in `articles/ai/` if they want — it will appear in the `notes` filter and the `notes` chip, not the AI chip.
- No second group yet. Only `ai` exists. The data model supports more, but only one is declared.
- No change to `ArticleDetail.jsx` (the detail page still shows the sub-category badge from `metadata.category`).

## The Group Concept

A **group** is a named aggregation of one or more categories. Concretely:

- A group has a `slug` (used in URL) and a `name` (shown in the UI).
- A category may optionally declare `group: '<group-slug>'` to belong to that group.
- A group is **defined** in the top-level `groups` array in `categories.js`.
- A group **appears in the chip bar** only when at least one of its member categories has at least one article. Its chip's `count` is the sum of its members' counts.
- The group chip is rendered **once, at the position of the first member category in `categories.js`**, before that member's own chip. Subsequent members in the same group do not get a second group chip — the group is rendered exactly once.

Concretely for `ai`, the AI 主题 chip renders once, at the position of the first AI category in `categories.js` (currently `llm`). The 6 AI sub-category chips follow it.

## Data Model

### `src/data/categories.js` (modified)

```js
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
```

- The fixed `categories` order is the display order. The `group: 'ai'` markers do not reorder the chips — they just signal which categories are AI members.
- `categorySlugSet` is unchanged in semantics: still 10 entries. `groups[0].slug` is intentionally not in this set.

### `src/data/articles.js` (modified)

- 6 import paths change from `../../articles/<old-subfolder>/<name>.md?raw` to `../../articles/ai/<name>.md?raw` (see Migration Map).
- `metadata.category` for each of these 6 articles is unchanged: stays `'llm' | 'prompt' | 'rag' | 'agent' | 'tool'`.
- The `notes` article's import path and `metadata.category: 'notes'` are unchanged.

## `src/lib/articles.js` (rewritten)

The two public functions change:

### `listArticles({ category })`

When `category` is a group slug (e.g. `'ai'`), expand to its members and filter on the union:

```js
import articles from '../data/articles.js';
import { categories, groups, categorySlugSet } from '../data/categories.js';

// 推导：每个 group 的 members 是 categories.js 中声明了该 group 的所有分类 slug。
// 这样新增/删除 group 成员只动 categories.js，lib 自动跟着变。
const groupMembersBySlug = new Map(
  groups.map((g) => [
    g.slug,
    categories.filter((c) => c.group === g.slug).map((c) => c.slug),
  ])
);

export function listArticles({ category } = {}) {
  if (!category) {
    return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  const memberSlugs = groupMembersBySlug.get(category);
  const targetSlugs = memberSlugs ?? [category];
  // 注意：metadata.category 永远是 10 个原 slug 之一（categorySlugSet 守门），
  // targetSlugs 里出现 group slug（'ai'）也不会误匹配，因为没有文章 category === 'ai'。
  const filtered = articles.filter((a) => targetSlugs.includes(a.category));
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

- Single-category call (`listArticles({ category: 'llm' })`) behaves exactly as v2 — `memberSlugs` is `undefined`, falls through to `[category]`, the filter is `a.category === 'llm'`.
- Group call (`listArticles({ category: 'ai' })`) computes `targetSlugs = ['llm', 'prompt', 'rag', 'agent', 'tool', 'industry']` and filters on `Array.includes`. Result is the union, in date-desc order.
- No new function on the public surface. The single `listArticles` handles both cases.

### `listCategories()` (modified)

Returns a flat array of chip entries. Each entry is either a group chip or a category chip. Order matches `categories.js`, with the group chip inserted once at the position of the first member.

```js
export function listCategories() {
  const counts = new Map();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }

  // 哪些 group 至少有一个成员有文章？(count > 0)
  const groupCounts = new Map();
  for (const c of categories) {
    if (!c.group) continue;
    const cnt = counts.get(c.slug) ?? 0;
    if (cnt > 0) {
      groupCounts.set(c.group, (groupCounts.get(c.group) ?? 0) + cnt);
    }
  }

  const groupBySlug = new Map(groups.map((g) => [g.slug, g]));
  const emittedGroups = new Set();
  const out = [];

  for (const c of categories) {
    if (
      c.group &&
      groupBySlug.has(c.group) &&
      !emittedGroups.has(c.group)
    ) {
      out.push({
        slug: c.group,
        name: groupBySlug.get(c.group).name,
        count: groupCounts.get(c.group) ?? 0,
        isGroup: true,
      });
      emittedGroups.add(c.group);
    }
    if (counts.has(c.slug)) {
      out.push({ slug: c.slug, name: c.name, count: counts.get(c.slug) });
    }
  }
  return out;
}
```

Result for today's data (7 articles, 6 sub-categories in use):

```js
[
  { slug: 'ai',    name: 'AI 主题',       count: 7, isGroup: true },
  { slug: 'llm',   name: 'LLM 原理与基础', count: 2 },
  { slug: 'prompt',name: '提示工程',       count: 1 },
  { slug: 'rag',   name: '检索增强生成',   count: 1 },
  { slug: 'agent', name: 'AI 智能体',      count: 1 },
  { slug: 'tool',  name: 'AI 工具与产品',  count: 2 },
  { slug: 'notes', name: '随笔与思考',     count: 1 },
]
```

- The group chip is emitted **once** (`emittedGroups` set guards the dedup).
- Categories with zero articles are still filtered out (preserves v2 behavior). A group with no members having articles is also filtered out (its members would all be 0, so `groupCounts` would not contain the slug).
- A category that declares `group: 'something-not-in-groups'` falls through the `groupBySlug.has(c.group)` check and renders as a plain category chip. Defensive against typos in `categories.js`.

### `findArticleBySlug(slug)` (unchanged)

- No change.

## UI

### `src/components/CategoryFilter.jsx` (minimal change)

The component already takes `categories` from `listCategories()` and renders one chip per entry. The new entries have an `isGroup: true` field. The component renders them with the same active/inactive styling — **no visual change** for group chips vs. category chips. The `isGroup` field is opaque to the component; it just iterates the array.

The only behavior change: the active-state check `active === c.slug` works the same way for group slugs (`'ai'`) as for category slugs (`'llm'`). No new props, no new state, no new branches.

### `src/pages/Articles.jsx` (modified)

- `categoryMeta` lookup must recognize both category slugs and group slugs. Today it's `categories.find((c) => c.slug === category)`. After: try `categories` first, then `groups`.
- The page title uses `categoryMeta.name` either way.

```jsx
import { listArticles, listCategories } from '../lib/articles.js';
import { groups } from '../data/categories.js';

export default function Articles() {
  const { category } = useParams();
  const chips = listCategories();          // 重命名：这是给 CategoryFilter 的 chip 列表
  const categoryMeta = category
    ? chips.find((c) => c.slug === category)
      ?? groups.find((g) => g.slug === category)
      ?? null
    : null;
  usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
  const articles = listArticles({ category });
  const categoryExists = !category || !!categoryMeta;

  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-6">文章</h1>
      <CategoryFilter categories={chips} active={category ?? null} />
      {/* 其余不变 */}
    </section>
  );
}
```

- Rename the local `categories` to `chips` to avoid shadowing the import from `../data/categories.js`. The chip array is now the source for both the filter and the title lookup, so the rename makes the flow obvious.
- `groupBySlug`/`groups.find` fallback is only used for the page title (the group chip's `count` and `isGroup` come from `listCategories()` already). The `?? null` at the end keeps the existing "unknown slug" behavior.

### `src/components/ArticleCard.jsx` (no change)

- The card's category badge still uses `metadata.category` (one of the 10 real slugs) and looks it up in `categories` for the Chinese name. This is unchanged. In the AI 主题 view, each card shows its own sub-category badge (e.g. "LLM 原理与基础"), as expected.

## Routing

No change to `App.jsx`. The existing route `<Route path="/articles/category/:category">` already accepts any string in the `:category` param. The new behavior lives in `listArticles` (expansion) and `Articles.jsx` (title lookup).

## Migration Map (7 articles, 6 file moves)

All moves done with `git mv` to preserve history.

| Current path | New path | `category` |
|---|---|---|
| `articles/agent/Agent 性能量化.md` | `articles/ai/Agent 性能量化.md` | `'agent'` |
| `articles/llm/AI技术底层.md` | `articles/ai/AI技术底层.md` | `'llm'` |
| `articles/llm/DeepSeek 的"降本增效"之道.md` | `articles/ai/DeepSeek 的"降本增效"之道.md` | `'llm'` |
| `articles/prompt/长对话中模型忘记系统指令.md` | `articles/ai/长对话中模型忘记系统指令.md` | `'prompt'` |
| `articles/rag/RAG分层检索.md` | `articles/ai/RAG分层检索.md` | `'rag'` |
| `articles/tool/Claude-Code-上下文管理.md` | `articles/ai/Claude-Code-上下文管理.md` | `'tool'` |
| `articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` | `articles/ai/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` | `'tool'` |

Untouched:
- `articles/notes/你好，世界.md` (`'notes'`) — stays put.

Net effect on the folder tree:

```
articles/
├── ai/                              (new, 7 files)
│   ├── Agent 性能量化.md
│   ├── AI技术底层.md
│   ├── DeepSeek 的"降本增效"之道.md
│   ├── 长对话中模型忘记系统指令.md
│   ├── RAG分层检索.md
│   ├── Claude-Code-上下文管理.md
│   └── OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md
└── notes/
    └── 你好，世界.md
```

The 5 now-empty subfolders (`agent/`, `llm/`, `prompt/`, `rag/`, `tool/`) are removed with `git rm -r`. (`industry/`, `engineering/`, `product/`, `resources/` were never created on disk — they only existed as labels in `categories.js`.)

## File-Level Changes

### Modified
- `src/data/categories.js` — adds `groups` export, adds `group: 'ai'` on 6 categories. (The `categorySlugSet` and the 10 category slugs themselves are unchanged.)
- `src/data/articles.js` — 6 import paths updated.
- `src/lib/articles.js` — `listArticles` learns to expand group slugs; `listCategories` emits a group chip once at the position of the first member; `groupMembersBySlug` is derived from `categories` and `groups`.
- `src/pages/Articles.jsx` — local variable rename, fallback lookup in `groups` for the page title.

### Deleted
- `articles/agent/` (empty after move)
- `articles/llm/` (empty after move)
- `articles/prompt/` (empty after move)
- `articles/rag/` (empty after move)
- `articles/tool/` (empty after move)

### No change
- `src/App.jsx`
- `src/components/CategoryFilter.jsx` (no edit needed; iterates the chip array as-is)
- `src/components/ArticleCard.jsx`
- `src/pages/ArticleDetail.jsx`
- `src/pages/Home.jsx`, `Projects.jsx`, `ProjectDetail.jsx`, `Skills.jsx`, `Tools.jsx`, `About.jsx`, `NotFound.jsx`
- `src/lib/content.js`
- `src/components/Navbar.jsx`, `Footer.jsx`, `PageTransition.jsx`
- `content/`, `projects/`
- `CLAUDE.md`

## Code Diff Sketch

`src/lib/articles.js` (full rewrite — the only non-trivial diff):

```js
// 完整版见 "src/lib/articles.js (rewritten)" 章节。
// 关键变化：
//   - 引入 groups 推导：const groupMembersBySlug = new Map(groups.map(g => [g.slug, members]));
//   - listArticles 接受 group slug，用 includes 代替 ===。
//   - listCategories 在遍历 categories 时，遇到第一个声明了 group 的成员，push 组条目一次。
```

`src/pages/Articles.jsx`:

```jsx
// before
const categories = listCategories();
const categoryMeta = category
  ? categories.find((c) => c.slug === category)
  : null;

// after
const chips = listCategories();
const categoryMeta = category
  ? chips.find((c) => c.slug === category)
    ?? groups.find((g) => g.slug === category)
    ?? null
  : null;
```

(`usePageTitle`, `listArticles`, `categoryExists`, JSX body all unchanged.)

## Verification

After implementation, in order:

1. **Folder layout** — `ls articles/` shows exactly `ai/` and `notes/`. No `agent/`, `llm/`, `prompt/`, `rag/`, `tool/`, `industry/`, `engineering/`, `product/`, `resources/` directories exist. No top-level `.md` files.
2. **Git history preserved** — `git log --follow articles/ai/Claude-Code-上下文管理.md` walks back through the previous location in `articles/tool/` and earlier in `articles/claude/`.
3. **Build** — `npm run build` completes with no errors and emits `dist/`.
4. **Dev server** — `npm run dev` starts cleanly.
5. **List page (all)** — `/articles` shows 8 article cards in date-desc order. The chip bar is exactly: `[全部] [AI 主题 (7)] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`. "全部" is highlighted.
6. **AI aggregation page** — clicking the "AI 主题 (7)" chip navigates to `/#/articles/category/ai`. The page title is "AI 主题 · 文章". All 7 AI articles are rendered in date-desc order. The "AI 主题" chip is highlighted; the six sub-category chips are not.
7. **Sub-category page** — clicking the "AI 工具与产品 (2)" chip navigates to `/#/articles/category/tool`. The page title is "AI 工具与产品 · 文章". Only the 2 tool articles render. The "AI 工具与产品" chip is highlighted; "AI 主题" is not.
8. **Detail page unaffected** — clicking a card on `/articles/category/ai` (or any other view) navigates to `/articles/:slug` and renders the markdown body. The category badge on the card still shows the sub-category name (e.g. "LLM 原理与基础"), not "AI 主题".
9. **`/articles` ↔ `/articles/category/ai` round-trip** — click "AI 主题" → URL is `/#/articles/category/ai`, 7 cards. Click "全部" → URL is `/#/articles`, 8 cards. The page title reverts to "文章".
10. **No chip cross-highlight** — on `/articles/category/ai`, only the "AI 主题" chip is solid orange. On `/articles/category/llm`, only the "LLM 原理与基础" chip is solid orange.
11. **Empty-group case** — temporarily move all 7 AI articles' `metadata.category` to `'notes'` (and re-run the dev server) — the "AI 主题" chip should disappear from the chip bar (no member has articles). Restore afterward.
12. **Empty category case** — confirm "提示工程" still appears with count `1` (not affected by the AI grouping work).
13. **URL safety for unknown slugs** — visiting `/#/articles/category/foo` shows the empty state. The page title is "foo · 文章" (raw slug). No chip is highlighted. The "AI 主题" chip is not highlighted (because the URL slug is `foo`, not `ai`).
14. **Routing collision check** — confirm `/articles/hello-world` (real slug) still opens detail; `/articles/category/llm` opens the AI-sub-category filter; `/articles/category/ai` opens the AI-aggregated filter; `/articles/category/foo` (no such slug) opens the empty state, not detail.
15. **`metadata.category` is never `'ai'`** — `grep -r "category: 'ai'" src/` returns nothing. The group slug is internal to the URL/chip layer; the data file uses the 10 real slugs.

## Risks

- **Group slug collides with a future article slug** — if someone names an article slug `ai`, then `/articles/ai` would clash with the future `/articles/category/ai` (3 segments vs 2 segments, no actual conflict in React Router, but a confusing mental model). Mitigation: trivial today (no such slug exists), and the same risk class exists for every category slug already. CLAUDE.md rule 13 already documents slug uniqueness.
- **`metadata.category: 'ai'` typo** — an author writes the group slug by mistake. `categorySlugSet` does not include `'ai'`, so the article's chip badge falls back to the raw slug (defensive in `ArticleCard`) and the article does not appear in any filter. The `??` fallback prevents a crash; the article is just invisible in the filter bar. Build-time validation could catch this — out of scope today.
- **Group chip count stale** — `listCategories` recomputes the count from articles on every render. If articles are added/removed at runtime, the chip count is correct by construction. The only failure mode is a future code path that bypasses `listCategories`, which would need to be added deliberately.
- **File history loss on `mv` (not `git mv`)** — using `mv` instead of `git mv` would lose file history. Mitigation: every move in the Migration Map uses `git mv`. The Verification step 2 spot-checks one file with `git log --follow`.
- **Filter on the AI page "feels off"** — the AI page mixes very different sub-categories in date order. An LLM 原理 article from June 3 may sit next to a Claude Code review from June 3 with no visual grouping. Mitigation: this matches the user's stated intent ("把跟 AI 相关的都放在一个分类中"). The sub-category badge on each card preserves the sub-distinction. If the user later wants sectioned groups, that's a follow-up.
- **`articles/ai/` becomes a "junk drawer"** — without folder structure, the file list can get long. Mitigation: `metadata.category` keeps the logical grouping; the `articles.js` import block is sorted by date (or could be sorted by sub-category if the author prefers). The disk layout is a soft convention; the metadata is the truth.
- **Renaming `articles/ai/` later** — moving files again is straightforward but loses the `git mv` history shortcut. Mitigation: pick the name carefully now. "ai" is short, neutral, and matches the "AI 主题" chip text.

## Out of Scope (Future Work)

- **Nested groups** — a group of groups. The data model assumes one level. Adding depth would need a `groupOfGroup` field or a recursive expansion. YAGNI for a single group.
- **Multi-group membership** — a category can only be in one group (`group: 'ai'`). If `tool` later needed to also be in a "developer-tools" group, the field would need to be `groups: ['ai', 'dev']`. Not needed today.
- **Group-level cover / description** — the `groups` shape could grow `{ slug, name, description, cover }` to power a `/categories` index page. Same as v2's "category-level page" future work, lifted to the group layer.
- **Build-time validation** — assert every `metadata.category` is in `categorySlugSet` and every `group` field references a real group slug. The `??` fallback in `ArticleCard` and the defensive `groupBySlug.has(c.group)` check in `listCategories` keep things from crashing; a real validator would be belt-and-suspenders.
- **Visual nesting in the chip bar** — collapsible sub-chips under "AI 主题". The current flat layout is simpler; nesting is a UI rewrite.
- **Grouped article grid on `/articles/category/ai`** — render the 7 articles as three sub-sections (LLM 原理 / 提示工程 / RAG / ...) instead of one flat grid. Different from the chip bar nesting; this is a grid-level grouping. The user did not ask for it.
- **Sort the article grid by sub-category on `/articles/category/ai`** — currently still date-desc. A future "group-by-sub-category" sort mode could be a chip on the page.
