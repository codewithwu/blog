# Design: Article Categories

**Date:** 2026-06-05
**Status:** Approved (pending user review of written spec)
**Scope:** Add a `category` field to articles (derived from a one-level subfolder under `articles/`), and a clickable filter UI on the articles list page.

## Background

The blog currently stores all articles flat in `articles/` and lists them in date order on `/articles`. Each article already has a free-form `tags` array, but tags are descriptive only — there is no way to filter the article list by topic. The user wants a separate, structured `category` axis: a Claude article is a Claude article, not just "tagged Claude". Categories are derived from physical file location (`articles/<category>/*.md`) and the front-end renders a clickable filter bar at the top of `/articles`.

## Goals

- Articles can be grouped into categories by placing them under `articles/<category>/` subfolders
- Each article's category is exposed as a `category` field in its metadata (single value, equals the subfolder name; `null` for top-level articles)
- `/articles` shows all articles; `/articles/category/:category` shows only that category's articles
- A clickable chip bar at the top of `/articles` lets the user switch categories
- Each `ArticleCard` shows the category as a clickable badge, distinct from the existing tags
- A new CLAUDE.md rule documents the category workflow

## Non-Goals

- No multi-level folder nesting. Only one level of subfolders under `articles/` is recognized as categories. Deeper nesting is treated as plain organization inside a category.
- No multiple categories per article. A file lives in exactly one folder, so it has at most one category.
- No change to the existing `tags` field semantics. Tags remain a free-form multi-value descriptor. `category` is independent.
- No frontmatter, no dynamic glob imports, no `gray-matter`. Loading remains manual `?raw` imports.
- No category-level cover/description/index page (e.g. `/categories`). A category is just a filter on the existing list.
- No tag-based filtering UI. Only the new category axis supports filtering.
- No change to `ArticleDetail` page content or layout beyond the existing card behavior.
- No new dependency.

## File-Level Changes

### New
- `articles/claude/Claude-Code-上下文管理.md` — moved from `articles/Claude-Code-上下文管理.md` (the only Claude-themed article today)
- `src/components/CategoryFilter.jsx` — chip bar that takes `{ categories, active }` and renders links

### Modified
- `src/data/articles.js` — import path for the Claude article changes; its metadata record gains `category: 'claude'`
- `src/lib/articles.js` — `listArticles` accepts an optional `{ category }` filter; new `listCategories()` returns `[{ slug, count }]`; new `findCategory(slug)` returns `{ slug, count } | null`
- `src/pages/Articles.jsx` — reads `useParams().category`, renders `<CategoryFilter>`, filters the list, updates the page title
- `src/components/ArticleCard.jsx` — outer wrapper changes from `<Link>` to `<div onClick>` (so the category badge inside can be a nested `<Link>`); new category badge rendered before the tags list, only when `article.category` is non-null
- `src/App.jsx` — new `<Route path="/articles/category/:category" element={<Articles />} />` between the existing `/articles` and `/articles/:slug` routes
- `CLAUDE.md` — append a new rule (item 13, after the existing content-folder rule which is item 12) describing the category workflow

### Deleted
- `articles/Claude-Code-上下文管理.md` (replaced by the new path under `claude/`)

## Data Model

### Article metadata (new field)
```js
{
  slug, title, excerpt, date, tags, cover, content,  // existing
  category: 'claude' | null                          // new
}
```

- `category` is a string equal to the subfolder name. To make the data file self-explanatory and to avoid surprise, the value is hard-coded in metadata; the file location is a convention, not a runtime derivation source. (See "Why not derive from path?" in Risks.)
- A top-level article has `category: null` (or the field omitted).

### Category chip ordering
- `listCategories()` returns categories sorted by article count descending; ties broken alphabetically by slug.

## Routing

```jsx
// src/App.jsx
<Route path="/articles" element={<Articles />} />
<Route path="/articles/category/:category" element={<Articles />} />
<Route path="/articles/:slug" element={<ArticleDetail />} />
```

- React Router v6 matches in declaration order, so `/articles` (1 segment) and `/articles/category/:category` (3 segments) and `/articles/:slug` (2 segments) do not collide.
- The `/articles` and `/articles/category/:category` routes share the same `Articles` component; the component reads `useParams().category` to decide whether to filter.
- The page title is set via `usePageTitle`:
  - `/articles` → `"文章"`
  - `/articles/category/:category` → `"<category> · 文章"` (e.g. `"claude · 文章"`)
  - If the URL contains a `category` param that does not match any real category (e.g. someone types `/articles/category/foo` where no `foo` exists, or a category was emptied), the page shows the empty state described in UI below. The page title still shows the raw slug. This is intentional — the URL stays intact for the user to fix.

## Library Functions

`src/lib/articles.js`:

```js
import articles from '../data/articles.js';

export function listArticles({ category } = {}) {
  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;
  return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function listCategories() {
  const counts = new Map();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export function findCategory(slug) {
  const count = articles.filter((a) => a.category === slug).length;
  return count > 0 ? { slug, count } : null;
}

export function findArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}
```

## UI

### `Articles.jsx`

```
┌───────────────────────────────────────────────┐
│  文章                                         │  <- h1, kept as is
│                                               │
│  [全部] [claude (1)] [ai基础 (2)] ...         │  <- CategoryFilter
│                                               │
│  ┌─────────────┐  ┌─────────────┐             │
│  │  ArticleCard│  │  ArticleCard│             │
│  └─────────────┘  └─────────────┘             │
└───────────────────────────────────────────────┘
```

- The chip bar sits directly under the `h1` and above the card grid.
- The active chip is highlighted (solid brand-orange); inactive chips are ghost (orange border, transparent fill).
- "全部" is always the first chip; it links to `/articles`.
- The chip list comes from `listCategories()` — categories with zero articles are not rendered, so a stale URL never shows a dead chip.
- If `useParams().category` is present but does not match any chip (typo'd URL, or a category was emptied), no chip is active, and the empty state below is shown. The URL stays put so the user can fix it.

### `CategoryFilter.jsx`

Props: `{ categories: { slug, count }[], active: string | null }`.

- Renders `<NavLink to="/articles">` for "全部" and one `<NavLink to={`/articles/category/${slug}`}>` per category.
- `NavLink` `isActive` for the dynamic route needs to compare against `active`, since `NavLink` only knows the exact path. Use the `className` function form.

```jsx
<NavLink
  to={`/articles/category/${slug}`}
  className={() => `px-3 py-1.5 rounded-full text-sm transition-colors ${
    active === slug
      ? 'bg-brand-orange text-white'
      : 'border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
  }`}
>
  {slug} <span className="opacity-70">({count})</span>
</NavLink>
```

### `ArticleCard.jsx`

- Outer wrapper changes from `<Link>` to `<div>` with `onClick` + `useNavigate` + `role="link"` + `tabIndex={0}` + `onKeyDown` (Enter to navigate) for accessibility. Reason: the card must contain a nested `<Link>` (the category badge) and HTML disallows nested anchors. `e.stopPropagation()` on the badge's click is unnecessary once the outer element is a `<div>`.
- A new category badge is rendered before the tags list, only when `article.category` is non-null:

```jsx
{article.category && (
  <Link
    to={`/articles/category/${article.category}`}
    className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange
               hover:bg-brand-orange/25 transition-colors"
    onClick={(e) => e.stopPropagation()}
  >
    {article.category}
  </Link>
)}
```

- The badge uses `brand-orange` (the existing primary color) to distinguish it from the blue tag pills. The stopPropagation is a defensive belt-and-suspenders in case the outer `<div>` ever bubbles a click.

### Empty state
- The article list area shows a single block: text "该分类下还没有文章" plus a `<Link to="/articles">查看全部文章</Link>`.
- This is the only place the empty UI lives; it does not appear on `/articles` (which is always non-empty in practice).

## New Constraint in CLAUDE.md

Append as a new item 13, immediately after the existing item 12 (which covers `content/`):

> 13. 文章的分类由一级子目录决定: `articles/<category>/foo.md` 表示 `foo.md` 属于 `category` 分类。`articles/foo.md` 是无分类文章 (`category: null`)。每新增一篇文章,如要分类,必须 (a) 在 `articles/<category>/` 下创建 .md 文件; (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'`。slug 仍须全局唯一,与分类无关。

(Renumbering: the existing rules are numbered 1–12. The new rule is appended as 13; the existing numbering is preserved.)

## Verification

After implementation, in order:

1. **Layout check** — `articles/claude/Claude-Code-上下文管理.md` exists; `articles/Claude-Code-上下文管理.md` does not.
2. **Build** — `npm run build` completes with no errors and emits `dist/`.
3. **Dev server** — `npm run dev` starts cleanly; visiting the dev URL redirects `/` → `/#/articles` and renders the list page.
4. **List page (all)** — `/articles` shows all 8 article cards in date-desc order. The new chip bar is visible: `[全部] [claude (1)]`. "全部" is highlighted.
5. **List page (filtered)** — clicking the "claude" chip navigates to `/#/articles/category/claude`, the URL updates, the page title becomes "claude · 文章", and only the Claude article card is rendered. The "claude" chip is highlighted.
6. **Category badge** — on the Claude article card, the orange "claude" badge is visible before the tags. Clicking it lands on `/#/articles/category/claude` (same as step 5). Clicking the card body still navigates to the article detail page.
7. **Nested-link safety** — open DevTools, inspect the Claude article card, confirm the outer element is a `<div>` (not `<a>`) and the category badge is a nested `<a>` pointing to the category route. Clicking the badge does not also trigger the card's body click.
8. **Empty / unknown category** — navigate to `/#/articles/category/zzz`. The page shows the empty state: text "该分类下还没有文章" plus a "查看全部文章" link to `/articles`. No chip is highlighted. The page title is "zzz · 文章".
9. **Detail page unaffected** — clicking a card on `/articles` still navigates to `/articles/:slug` and renders the article body.
10. **Routing collision check** — confirm `/articles/foo` (where `foo` is a real slug) still opens detail; `/articles/category/claude` opens the filter; `/articles/category/foo` (where `foo` is a real slug, not a category) opens the empty state (Articles page with no cards), not the article detail.

## Risks

- **Nested Link (HTML invalidity)** — the original `ArticleCard` wraps everything in a `<Link>`. Adding a nested `<Link>` for the category badge would produce `<a><a>...</a></a>`, which is invalid HTML and React will warn. Mitigation: convert the outer wrapper to `<div onClick>` + `useNavigate`, with `role="link"` and `tabIndex={0}` for a11y. The badge remains a `<Link>`.
- **Moving a tracked file with `mv` instead of `git mv`** — file history is lost. Mitigation: use `git mv articles/Claude-Code-上下文管理.md articles/claude/Claude-Code-上下文管理.md`.
- **Category field drifts from folder location** — the `category` value is hard-coded in metadata, so a future author could change the folder without updating the field (or vice versa). This is intentional: the value is the source of truth, the folder is a convention that mirrors it. The CLAUDE.md rule explicitly couples the two. We do not auto-derive the field from the path because that would require a Vite `import.meta.glob` rewrite (Non-Goals).
- **Slug collision between categories and articles** — `claude` could be both a category and a slug of a top-level article. Mitigation: the routing test in step 10 explicitly checks that `claude` as a category routes to the filter and a hypothetical article slug `claude` would route to detail; since today's slugs are derived from filenames, a future author naming a file `claude.md` (top-level) while a `claude/` folder exists would conflict. Documented in CLAUDE.md rule 13.
- **New route order** — `<Route path="/articles/:slug">` is listed last so `/articles/category/:category` (3 segments) is matched first. If a future route is added between them, this ordering must be preserved.

## Out of Scope (Future Work)

- **Auto-discovery via `import.meta.glob`** — if the user later wants the category workflow to be drop-file-in-folder with no JS edits, the natural follow-up is switching `articles.js` to a glob + frontmatter-based loader. Already noted in the previous relocation spec.
- **Multiple categories per article** — would require moving away from the one-folder-per-file convention (e.g. a `categories: ['claude', 'rag']` array, with the file living in `articles/_uncategorized/`).
- **Category index page** — `/categories` showing all categories as a grid. Easy to add later using the same `listCategories()` helper.
- **Tag-based filtering** — would need a parallel `listTags()` and a separate filter route. Not requested.
- **Category-specific cover or description** — would need a `categories.js` data file with `{ slug, name, cover, description }`. Not requested.
- **Display-name localization** — currently the slug `claude` is shown as-is. If Chinese names are wanted (e.g. "Claude" → "克洛德"), a `categories.js` map would be needed.
