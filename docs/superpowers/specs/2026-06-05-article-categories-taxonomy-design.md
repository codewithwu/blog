# Design: Article Categories — 10-Category Taxonomy (v2)

**Date:** 2026-06-05
**Status:** Approved (pending user review of written spec)
**Scope:** Expand the existing free-form `category` field into a fixed 10-category taxonomy, add Chinese display names, and migrate the eight existing articles into the new structure.
**Builds on:** `2026-06-05-article-categories-design.md` (v1), which introduced the `category` field, `listCategories()`, and the `CategoryFilter` chip bar. That infrastructure stays; this spec only tightens the taxonomy and the UI display name.

## Background

The v1 design introduced a `category` string field on each article and a chip-bar filter on `/articles`. In the week since, four categories have organically appeared (`llm`, `claude`, `agent`, `rag`) plus one unclassified `hello-world.md` at the top of `articles/`. The user now wants to:

1. Lock down a **fixed** set of ten categories (folder names are constrained to this list).
2. Cover both AI/ML topics and non-AI topics (engineering, product, life, resources) — the current four categories are all AI sub-fields, so the taxonomy needs to grow to accommodate the user's broader writing plans.
3. Stop showing the raw English slug (e.g. `llm`) in the UI; show a **Chinese display name** instead (e.g. `LLM 原理与基础`).
4. Drop the `claude/` folder — `Claude Code 上下文管理` is a review of one AI product, and a new general `tool/` (AI 工具与产品) bucket is the right home for it alongside other AI-product write-ups.

## Goals

- The 10 categories are the **only** valid values for an article's `category` field. Adding a new value requires editing `src/data/categories.js`.
- The 10 categories cover both AI topics (6 buckets) and non-AI topics (4 buckets), with non-overlapping scopes.
- A new `src/data/categories.js` is the single source of truth for category metadata (slug, Chinese display name, fixed display order).
- `listCategories()` returns categories in the fixed order from `categories.js`, **merged with live article counts**, and **only including categories that have at least one article** (preserve v1's "hide empty categories" behavior).
- `CategoryFilter` and `ArticleCard` render the Chinese display name from `categories.js`; the URL slug is unchanged.
- The page title on `/articles/category/:slug` uses the Chinese display name (e.g. `LLM 原理与基础 · 文章`).
- All eight existing articles are migrated into the new folders and given the correct `category` value, with the file moves done via `git mv` to preserve history.
- `CLAUDE.md` rule 13 is updated to enumerate the 10 categories and make "must belong to one of them" an explicit rule.

## Non-Goals

- No multi-category support. The `category` field stays a single string. An article that spans two of the 10 buckets (e.g. an industry-strategy piece that also explains MoE architecture) gets the one best fit; the other angle lives in `tags`.
- No build-time validation that `category` is in the allowed set. Authoring discipline (CLAUDE.md rule 13) is the only check. YAGNI.
- No internationalization. Only Chinese display names.
- No change to the article-list page layout, routing, or chip-bar mechanics beyond the display-name swap.
- No change to `tags` semantics. Tags remain a free-form multi-value descriptor.
- No empty-state copy change. The existing "该分类下还没有文章" stays.

## The 10 Categories

| slug | Chinese display name | Scope |
|---|---|---|
| `llm` | LLM 原理与基础 | 模型架构、训练、能力、局限 |
| `prompt` | 提示工程 | 系统指令、prompt 设计技巧 |
| `rag` | 检索增强生成 | RAG、检索策略、知识增强 |
| `agent` | AI 智能体 | 智能体架构、性能、多智能体 |
| `tool` | AI 工具与产品 | Claude Code、OpenClaw 等工具的使用与对比 |
| `industry` | AI 行业观察 | 行业动态、商业模式、厂商策略 |
| `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得 |
| `product` | 产品与设计 | 产品设计、UX、交互 |
| `notes` | 随笔与思考 | 读书、生活、个人反思 |
| `resources` | 资源整理 | 书单、工具推荐、学习路线 |

**Boundary call-outs** (to settle ambiguities when an article fits more than one):

- `tool` is specifically for **AI product** reviews and usage (e.g. Claude Code, OpenClaw, Cursor). General developer tools (VSCode, vim) belong in `engineering`.
- `agent` is for **agent theory, architecture, and methodology** (e.g. "Agent 性能量化" — how to evaluate any agent). Reviews of specific agent products belong in `tool`.
- `industry` covers the **business / market / strategy** view of AI; technical deep-dives on a specific model's architecture belong in `llm` (or `agent` for agent architectures).
- `prompt` is for reusable **prompt design patterns** and instruction-crafting. Articles whose main payload is the model behavior that emerges from a prompt (e.g. "long-context forgetting" as a model phenomenon) stay in `llm`. The rule of thumb: if the article would still exist if you replaced "prompt" with "fine-tuning" as the technique, it belongs in `llm`; if it's specifically about crafting the right text to send to the model, it belongs in `prompt`.
- `notes` is the home for **personal / reflective** writing (读书笔记、生活随笔、个人反思). The introductory `hello-world.md` post lives here.

## Data Model

### New file: `src/data/categories.js`

```js
// 文章分类的元数据：单一来源（slug + 中文显示名 + 固定展示顺序）
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
```

- The array order is the **display order** in the chip bar — fixed, not sorted by count. Readers see the same navigation regardless of how many articles each bucket has.
- The slug set is exported as a convenience constant; v1 has no use for it, but having it ready makes a future build-time check trivial.

### `listCategories()` (modified)

```js
import articles from '../data/articles.js';
import { categories } from '../data/categories.js';

export function listCategories() {
  const counts = new Map();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return categories
    .filter((c) => counts.has(c.slug))            // hide empty categories
    .map((c) => ({ ...c, count: counts.get(c.slug) }));  // keep fixed order from categories.js
}
```

- Iterates `categories.js` (fixed order), not the live article list (which would be count-sorted). Drop the `sort((a, b) => b.count - a.count ...)` line that v1 had.
- Categories with zero articles are filtered out, preserving v1's chip-bar behavior. If the user later wants all 10 chips visible (with `0` counts), this is a one-line change.

### Other v1 functions unchanged
- `listArticles({ category })` — string-equality filter on `category`, no change.
- `findArticleBySlug(slug)` — no change.
- `findCategory(slug)` (v1) — no callers remain; will be **deleted** as part of this work (see Deleted).

## Migration Map (existing 8 articles)

All moves done with `git mv` to preserve history.

| Current path | New path | New `category` value |
|---|---|---|
| `articles/hello-world.md` | `articles/notes/你好，世界.md` | `'notes'` |
| `articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` | `articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` | `'tool'` |
| `articles/agent/Agent 性能量化.md` | (unchanged) | `'agent'` |
| `articles/llm/AI技术底层.md` | (unchanged) | `'llm'` |
| `articles/llm/DeepSeek 的"降本增效"之道.md` | (unchanged) | `'llm'` |
| `articles/llm/长对话中模型忘记系统指令.md` | `articles/prompt/长对话中模型忘记系统指令.md` | `'prompt'` |
| `articles/claude/Claude-Code-上下文管理.md` | `articles/tool/Claude-Code-上下文管理.md` | `'tool'` |
| `articles/rag/RAG分层检索.md` | (unchanged) | `'rag'` |

Net effect on the folder tree:
- `articles/claude/` becomes empty → folder deleted.
- `articles/tool/` becomes a new folder with two files (OpenClaw, Claude Code).
- `articles/prompt/` becomes a new folder with one file.
- `articles/notes/` becomes a new folder with one file (`hello-world.md` renamed to `你好，世界.md`).

Slug note: `hello-world.md` and `你好，世界.md` are the same content. The slug in metadata stays `hello-world` (URLs don't break). The **filename** becomes `你好，世界.md` for consistency with other Chinese-titled articles, but the import in `articles.js` is bound by variable name (`helloWorld`), not by filename.

## File-Level Changes

### New
- `src/data/categories.js` — see Data Model above.
- `articles/tool/` (folder, with two files migrated in)
- `articles/prompt/` (folder, with one file migrated in)
- `articles/notes/` (folder, with one file migrated in)

### Modified
- `src/data/articles.js` — 4 import paths updated and 4 `category` field values updated, one per file move in the Migration Map. See Migration Map.
- `src/lib/articles.js` — `listCategories()` rewritten to merge with `categories.js` (see Data Model). `findCategory` is deleted.
- `src/components/CategoryFilter.jsx` — chip text changes from `{c.slug}` to `{c.name}`.
- `src/components/ArticleCard.jsx` — badge text changes from `{article.category}` to a Chinese display name lookup.
- `src/pages/Articles.jsx` — `usePageTitle` argument changes from `category` (raw slug) to the looked-up Chinese name; the `<h1>` stays `"文章"`; `categoryExists` still uses raw slug.
- `CLAUDE.md` — rule 13 is rewritten to enumerate the 10 categories. See "New Constraint in CLAUDE.md" below.

### Deleted
- `articles/claude/` (empty folder after the one file moves out)
- `src/lib/articles.js`'s `findCategory` export (no callers after this change)

### No change
- `src/App.jsx` — route pattern `/articles/category/:category` stays; the param is still a slug.
- `src/pages/ArticleDetail.jsx` — no change.
- All other pages (`/`, `/about`, `/projects`, `/skills`, `/tools`) — no change.

## Code Diff Sketch

`src/components/CategoryFilter.jsx`:
```jsx
// before
{c.slug} <span className="opacity-70">({c.count})</span>

// after
{c.name} <span className="opacity-70">({c.count})</span>
```

`src/components/ArticleCard.jsx`:
```jsx
// before
{article.category && (
  <Link to={`/articles/category/${article.category}`} ...>
    {article.category}
  </Link>
)}

// after
{article.category && (() => {
  const meta = categories.find((c) => c.slug === article.category);
  return (
    <Link to={`/articles/category/${article.category}`} ...>
      {meta?.name ?? article.category}
    </Link>
  );
})()}
```
(Or hoist the lookup to a small `useMemo`/constant above the return — author can pick the cleaner shape; behavior is the same. The fallback `?? article.category` is defensive in case a future article references a category that was deleted from `categories.js`.)

`src/pages/Articles.jsx`:
```jsx
// before
usePageTitle(category ? `${category} · 文章` : '文章');
const categoryExists = !category || categories.some((c) => c.slug === category);

// after
const categoryMeta = category
  ? categories.find((c) => c.slug === category)
  : null;
usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
const categoryExists = !category || !!categoryMeta;
```

## New Constraint in CLAUDE.md

Rewrite the existing rule 13 to enumerate the 10 categories. The new wording:

> 13. 文章的分类由一级子目录决定, 但 10 个分类是**固定的**——不允许自创新的 slug。新增文章必须放在以下 10 个文件夹之一, 并在 metadata 记录里写明对应 `category`:
>
> | slug | 中文显示名 | 范围 |
> |---|---|---|
> | `llm` | LLM 原理与基础 | 模型架构、训练、能力、局限 |
> | `prompt` | 提示工程 | 系统指令、prompt 设计技巧 |
> | `rag` | 检索增强生成 | RAG、检索策略、知识增强 |
> | `agent` | AI 智能体 | 智能体架构、性能、多智能体 |
> | `tool` | AI 工具与产品 | Claude Code、OpenClaw 等工具的使用与对比 |
> | `industry` | AI 行业观察 | 行业动态、商业模式、厂商策略 |
> | `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得 |
> | `product` | 产品与设计 | 产品设计、UX、交互 |
> | `notes` | 随笔与思考 | 读书、生活、个人反思 |
> | `resources` | 资源整理 | 书单、工具推荐、学习路线 |
>
> 每新增一篇文章, 必须同时: (a) 把 .md 文件放入 `articles/<category>/`; (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'` 字段 (其他字段见第 10 条)。slug 仍须全局唯一, 与分类无关。中文显示名存放在 `src/data/categories.js`, 是 UI 上 chip 文字和页面标题的唯一来源, 改显示名要同步改 `categories.js` 而不是 articles.js。

## Verification

After implementation, in order:

1. **Folder layout** — `articles/` has exactly 10 subfolders: `llm`, `prompt`, `rag`, `agent`, `tool`, `industry`, `engineering`, `product`, `notes`, `resources`. No `claude/` folder remains. No top-level `.md` files (other than the auto-generated `README.md` if one exists; verify with `ls articles/*.md`).
2. **Git history preserved** — `git log --follow articles/tool/Claude-Code-上下文管理.md` shows the original commit that introduced the file under `claude/`.
3. **Build** — `npm run build` completes with no errors and emits `dist/`.
4. **Dev server** — `npm run dev` starts cleanly.
5. **List page (all)** — `/articles` shows all 8 article cards in date-desc order. The chip bar shows: `[全部] [LLM 原理与基础 (3)] [AI 智能体 (1)] [AI 工具与产品 (2)] [提示工程 (1)] [检索增强生成 (1)] [随笔与思考 (1)]` (6 chips, the 4 empty categories are hidden). "全部" is highlighted.
6. **List page (filtered)** — clicking the "AI 工具与产品" chip navigates to `/#/articles/category/tool`, the page title becomes "AI 工具与产品 · 文章", and only the two `tool/` articles render. The "AI 工具与产品" chip is highlighted.
7. **Category badge** — on any article card, the category badge shows the Chinese name (e.g. "AI 工具与产品") in brand-orange, distinct from the blue tag pills. Clicking it lands on the corresponding category filter page. Clicking the card body still navigates to the article detail page.
8. **Fixed order** — confirm the chip bar order on `/articles` matches the order in `categories.js` (LLM → Prompt → RAG → Agent → Tool → Industry → Engineering → Product → Notes → Resources), not sorted by count.
9. **Hello-world migration** — `/articles/hello-world` still loads (slug preserved). Its category badge shows "随笔与思考". It appears in the "随笔与思考" filter and is also still listed in "全部".
10. **Old URL safety** — visiting `/#/articles/category/claude` (the now-defunct slug) shows the empty state, since `claude` is not a slug in `categories.js`. No chip is highlighted. The page title is "claude · 文章" (raw slug — the URL stays for the user to fix, per v1 spec).
11. **Detail page unaffected** — clicking a card still navigates to `/articles/:slug` and renders the markdown body.
12. **Routing collision check** — confirm `/articles/foo` (real slug) still opens detail; `/articles/category/tool` opens the filter; `/articles/category/foo` (no such category) opens the empty state, not detail.

## Risks

- **Hard-coded category list drift** — `articles.js` references slugs; `categories.js` is the metadata source. If a slug is added to `articles.js` but not to `categories.js`, the badge falls back to the raw slug (defensive `??` in `ArticleCard`), and the article silently disappears from the chip bar. Mitigation: CLAUDE.md rule 13 makes the workflow explicit; the defensive fallback prevents a crash; the build passes either way. YAGNI to add a build check.
- **Loss of `findCategory` callers** — v1 added `findCategory` but never used it after the v1 spec's commit `3814c30`. The "no callers" claim needs to be re-verified by `grep -r findCategory src/` before deletion. If any UI consumes it, port the logic into `useMemo`/inline lookups using `categories.find`.
- **Move vs. delete+create** — moving files with `git mv` preserves history. A pure shell `mv` (or filesystem move without git) is also fine because git will detect the rename on the next `git add -A` — but using `git mv` is more explicit and self-documenting.
- **`hello-world` slug stays** — renaming the file from `hello-world.md` to `你好，世界.md` changes the import variable name (still `helloWorld` in JS, no problem) but leaves the slug field untouched, so URLs and `findArticleBySlug('hello-world')` keep working. Don't accidentally change the slug.
- **Empty categories drift into the chip bar** — if a user later removes the last article from a category, it stops appearing in the chip bar (intended). If they want all 10 visible regardless, change the `.filter((c) => counts.has(c.slug))` line in `listCategories` to keep them all (the count is 0).
- **Slug collision between a future top-level `notes.md` and the `notes/` folder** — same risk class as v1's Claude collision. The routing order in `App.jsx` (`/articles/category/:category` before `/articles/:slug`) means a category-named slug would never be routable as detail. Documented in CLAUDE.md rule 13 already.

## Out of Scope (Future Work)

- **Build-time category validation** — a Vite plugin or a simple `articles.js` self-test that asserts every `category` value is in `categorySlugSet`. Trivial to add later; not justified today for a single-author blog.
- **Multi-category support** — `categories: string[]` instead of `category: string`. Would require a different folder convention (e.g. `_uncategorized/`) and changes to `listArticles` (any-match instead of equality) and the filter UI (AND vs OR).
- **Category description / cover / hero image** — a future `categories.js` could grow `{ slug, name, description, cover }` to power a `/categories` index page. The slug+name shape shipped today leaves that door open.
- **Tag-based filtering** — orthogonal to categories; would need a parallel `listTags()` helper and a separate filter route.
- **Internationalization** — the `name` field could become a function `name(locale)` returning a localized string. Today's audience is Chinese-only, so a plain string is fine.
- **Category-level page** — `/categories` showing all 10 as a grid. Easy to add later using the same `listCategories()` helper, but explicitly not asked for.
- **Auto-derive `category` from folder path** — would require moving from manual `?raw` imports to `import.meta.glob`. Already a non-goal in v1 and still is here.
