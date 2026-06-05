# Article Categories — 10-Category Taxonomy (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the v1 free-form `category` field into a fixed 10-category taxonomy with Chinese display names, and migrate the 8 existing articles into the new folder structure.

**Architecture:** A new `src/data/categories.js` is the single source of truth for category metadata (slug, Chinese display name, fixed display order). `listCategories()` in `src/lib/articles.js` is rewritten to merge live article counts onto this static list, return entries in the fixed order, and hide empty categories. The three UI surfaces (`CategoryFilter`, `ArticleCard`, `Articles` page title) swap from `slug` to `name` for display while keeping slug as the URL/route param. Four articles are moved into new folders (`tool/`, `prompt/`, `notes/`); `hello-world.md` is renamed to `你好，世界.md` and moved to `notes/`; the now-empty `articles/claude/` folder is deleted. The unused `findCategory` helper is removed.

**Tech Stack:** Vite (build), Vitest (test), React 18, react-router-dom v6, Tailwind CSS (via existing brand classes). No new dependencies.

**Builds on:** `2026-06-05-article-categories.md` (v1 plan). All v1 code is already merged; this plan modifies it in place. The v1 design spec is `docs/superpowers/specs/2026-06-05-article-categories-design.md`; the v2 design spec is `docs/superpowers/specs/2026-06-05-article-categories-taxonomy-design.md`.

---

## File Structure

Files touched by this plan:

- `src/data/categories.js` (new — 10-category metadata + slug set)
- `src/lib/articles.js` (rewrite `listCategories` to merge with `categories.js`; delete `findCategory`)
- `src/data/articles.js` (4 import paths + 4 `category` field updates; 1 file rename)
- `src/components/CategoryFilter.jsx` (`{c.slug}` → `{c.name}`)
- `src/components/ArticleCard.jsx` (badge text: raw slug → looked-up Chinese name; add `categories` import)
- `src/pages/Articles.jsx` (`usePageTitle` argument uses looked-up Chinese name)
- `tests/articles.test.js` (rewrite `listCategories` test for new behavior; delete `findCategory` test)
- `articles/claude/` (deleted after Task 9)
- `articles/tool/`, `articles/prompt/`, `articles/notes/` (new folders)
- `CLAUDE.md` (rule 13 rewritten to enumerate the 10 categories)

No new dependencies. No file splits.

---

## Task 1: Create `src/data/categories.js`

**Files:**
- Create: `src/data/categories.js`

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls src/data/ && git status --short
```
Expected: `articles.js` and `projects.js` exist; `categories.js` is not listed. `git status --short` is empty (clean tree). If dirty, commit or stash first.

- [ ] **Step 2: Create `src/data/categories.js`**

Write the file:

```js
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
```

- [ ] **Step 3: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A syntax error in the new file would surface here.

- [ ] **Step 4: Commit**

```bash
git add src/data/categories.js
git commit -m "Add categories.js with 10 fixed slugs and Chinese display names"
```

---

## Task 2: TDD rewrite `listCategories()` and remove `findCategory`

**Files:**
- Modify: `tests/articles.test.js` (rewrite the `listCategories` test, delete the `findCategory` tests)
- Modify: `src/lib/articles.js` (rewrite `listCategories`; remove `findCategory`)

- [ ] **Step 1: Confirm `findCategory` has no callers**

Run:
```bash
grep -rn "findCategory" src/ tests/ 2>&1
```
Expected: only matches are inside `src/lib/articles.js` itself (the export) and the test file's import/test blocks. If any other file imports or calls `findCategory`, **stop and report** — the v2 design says it has no callers, but verify before deleting.

- [ ] **Step 2: Update the test imports and replace the `listCategories` test**

In `tests/articles.test.js`, the import line at the top of the file is currently:

```js
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
```

Replace it with:

```js
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
import { categories } from '../src/data/categories.js';
```

(Adding the `categories` import; `findCategory` was never imported, so nothing to remove from this line.)

Then **replace** the existing `listCategories` test block:

```js
  it('listCategories returns each category with its article count, sorted by count desc', () => {
    const cats = listCategories();
    expect(cats.length).toBeGreaterThan(0);
    // Every entry has slug and count
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // Sorted by count desc
    for (let i = 0; i < cats.length - 1; i++) {
      expect(cats[i].count >= cats[i + 1].count).toBe(true);
    }
    // All four categories present with expected counts
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.count]));
    expect(bySlug.claude).toBe(1);
    expect(bySlug.agent).toBe(2);
    expect(bySlug.llm).toBe(3);
    expect(bySlug.rag).toBe(1);
    // llm should sort first by count desc
    expect(cats[0].slug).toBe('llm');
  });
```

with:

```js
  it('listCategories returns categories in the fixed order from categories.js, with slug+name+count, hiding empty buckets', () => {
    const cats = listCategories();
    // Every entry has slug (string), name (string), count (number > 0)
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // Order matches categories.js (the v1 articles cover 4 of the 10 buckets)
    const slugsInOrder = cats.map((c) => c.slug);
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'claude'].includes(c.slug))
      .map((c) => c.slug);
    expect(slugsInOrder).toEqual(expectedOrder);
    // Counts are correct
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.count]));
    expect(bySlug.llm).toBe(3);
    expect(bySlug.agent).toBe(2);
    expect(bySlug.rag).toBe(1);
    expect(bySlug.claude).toBe(1);
    // Names are looked up from categories.js
    const llm = cats.find((c) => c.slug === 'llm');
    expect(llm.name).toBe('LLM 原理与基础');
  });

  it('listCategories omits categories that have zero articles (no "prompt" / "tool" / "notes" etc. yet)', () => {
    const cats = listCategories();
    const slugs = cats.map((c) => c.slug);
    // None of the empty buckets should appear
    expect(slugs).not.toContain('prompt');
    expect(slugs).not.toContain('tool');
    expect(slugs).not.toContain('notes');
    expect(slugs).not.toContain('industry');
    expect(slugs).not.toContain('engineering');
    expect(slugs).not.toContain('product');
    expect(slugs).not.toContain('resources');
  });
```

Then **delete** the two `findCategory` test blocks (they will fail once `findCategory` is removed):

```js
  it('findCategory returns {slug, count} for a known category', () => {
    const c = findCategory('claude');
    expect(c).toEqual({ slug: 'claude', count: 1 });
  });

  it('findCategory returns null for an unknown category', () => {
    expect(findCategory('no-such-category')).toBeNull();
  });
```

Remove those two `it` blocks in their entirety.

- [ ] **Step 3: Run tests and confirm the new tests FAIL**

Run:
```bash
npm test -- --reporter=verbose
```
Expected:
- The new `listCategories` tests FAIL (the new behavior is not yet implemented).
- The two old `findCategory` tests still PASS at this point (the export hasn't been removed yet) — that's fine; they get removed in Step 5.
- All other pre-existing tests PASS.

If anything else fails, stop and report.

- [ ] **Step 4: Rewrite `listCategories` in `src/lib/articles.js`**

In `src/lib/articles.js`, add the import at the top:

```js
import articles from '../data/articles.js';
import { categories } from '../data/categories.js';
```

Then **replace** the existing `listCategories` function:

```js
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
```

with:

```js
export function listCategories() {
  const counts = new Map();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  return categories
    .filter((c) => counts.has(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, count: counts.get(c.slug) }));
}
```

Behavior:
- Iterates `categories.js` (the fixed order) rather than the live article list.
- Hides categories with zero articles (preserves v1 chip-bar behavior).
- Each entry now has `slug`, `name`, and `count` — consumers no longer need to look up the display name separately.

- [ ] **Step 5: Remove the `findCategory` export**

In `src/lib/articles.js`, **delete** the entire `findCategory` function:

```js
export function findCategory(slug) {
  const count = articles.filter((a) => a.category === slug).length;
  return count > 0 ? { slug, count } : null;
}
```

The remaining functions are `listArticles`, `listCategories`, and `findArticleBySlug`.

- [ ] **Step 6: Run tests and confirm they pass**

Run:
```bash
npm test -- --reporter=verbose
```
Expected: all tests pass. The 6 pre-existing tests (`listArticles` sorted, `findArticleBySlug` match/miss, `listArticles({category:claude})`, `listArticles({category:no-such})`, plus the 2 new `listCategories` tests) all green. The two deleted `findCategory` tests are gone.

- [ ] **Step 7: Commit**

```bash
git add tests/articles.test.js src/lib/articles.js
git commit -m "Rewrite listCategories() to merge with categories.js, drop findCategory"
```

---

## Task 3: Update `CategoryFilter` to display the Chinese name

**Files:**
- Modify: `src/components/CategoryFilter.jsx` (one-line text change)

- [ ] **Step 1: Replace `c.slug` with `c.name` in the chip text**

In `src/components/CategoryFilter.jsx`, find the line:

```jsx
            {c.slug} <span className="opacity-70">({c.count})</span>
```

Replace with:

```jsx
            {c.name} <span className="opacity-70">({c.count})</span>
```

The `to` prop on the `<Link>` stays `/articles/category/${c.slug}` — the URL is still slug-based, only the visible text changes.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manual visual check (dev server)**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`. Expected: the chip bar now shows `[全部] [LLM 原理与基础 (3)] [AI 智能体 (2)] [检索增强生成 (1)] [Claude Code (1)]` (or whatever the `claude` → `tool` rename will eventually look like — at this point the slug is still `claude` so the Chinese name from `categories.js` is `Claude Code`). Confirm:
- Chips show the Chinese name (not `llm`, `agent`, etc.).
- Counts match what's in `articles.js`.
- The order is the fixed order from `categories.js`, not count-sorted.
- Clicking a chip navigates to the same URL as before (`/#/articles/category/<slug>`).

Stop the dev server with Ctrl-C after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/components/CategoryFilter.jsx
git commit -m "CategoryFilter shows Chinese name from categories.js instead of raw slug"
```

---

## Task 4: Update `ArticleCard` badge to show the Chinese name

**Files:**
- Modify: `src/components/ArticleCard.jsx` (import `categories`, add a name lookup, swap the badge text)

- [ ] **Step 1: Add the import and a name lookup, swap the badge text**

The current top of `src/components/ArticleCard.jsx`:

```jsx
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
```

Replace with:

```jsx
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories } from '../data/categories.js';
```

Then find the badge `<Link>` body:

```jsx
              <Link
                to={`/articles/category/${article.category}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange
                           hover:bg-brand-orange/25 transition-colors"
              >
                {article.category}
              </Link>
```

Replace with:

```jsx
              <Link
                to={`/articles/category/${article.category}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange
                           hover:bg-brand-orange/25 transition-colors"
              >
                {categories.find((c) => c.slug === article.category)?.name ?? article.category}
              </Link>
```

The `find` is O(n) over 10 entries — fine to run on every render. The `?? article.category` fallback keeps the badge from going blank if a future article references a slug that was deleted from `categories.js`.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manual visual check (dev server)**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`. Expected: every article card's category badge shows the Chinese name (e.g. `Claude Code`, `AI 智能体`, `LLM 原理与基础`, `检索增强生成`) instead of the raw slug. Cards without a category (none today, but the `hello-world` article has `category: null`) show no badge.

Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticleCard.jsx
git commit -m "ArticleCard badge shows Chinese category name from categories.js"
```

---

## Task 5: Update `Articles.jsx` page title to use the Chinese name

**Files:**
- Modify: `src/pages/Articles.jsx` (swap `usePageTitle` to use a looked-up name)

- [ ] **Step 1: Replace the title logic**

In `src/pages/Articles.jsx`, find:

```jsx
  const { category } = useParams();
  usePageTitle(category ? `${category} · 文章` : '文章');
  const articles = listArticles({ category });
  const categories = listCategories();
  const categoryExists = !category || categories.some((c) => c.slug === category);
```

Replace with:

```jsx
  const { category } = useParams();
  const categories = listCategories();
  const categoryMeta = category
    ? categories.find((c) => c.slug === category)
    : null;
  usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
  const articles = listArticles({ category });
  const categoryExists = !category || !!categoryMeta;
```

Two behavior changes:
- The page title uses the Chinese name (e.g. `LLM 原理与基础 · 文章`) when the URL's slug resolves to a real category.
- When the URL's slug is unknown (e.g. someone visits `/#/articles/category/zzz`), the title falls back to `'文章'` (the same as the no-param title) instead of `"zzz · 文章"`. Rationale: with a fixed category list, an unknown slug is a typo or stale URL, and showing a garbage title is worse than the generic title. The empty-state copy still links back to `/articles` so the user can recover.

Note: the v1 spec said unknown slugs should show the raw slug in the title ("zzz · 文章"). This is a small behavior tweak from the v1 spec, justified by the v2 design's introduction of display names — the title is now a human-readable name, and an unknown slug has no name to display.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manual visual check (dev server)**

Run `npm run dev` and visit:
- `http://localhost:5173/blog/#/articles` — browser tab title is `文章`.
- `http://localhost:5173/blog/#/articles/category/llm` — tab title is `LLM 原理与基础 · 文章`.
- `http://localhost:5173/blog/#/articles/category/zzz` — tab title is `文章` (not `zzz · 文章`), and the empty state is rendered.

Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Articles.jsx
git commit -m "Articles page title uses Chinese category name; unknown slug falls back to default title"
```

---

## Task 6: Migrate `hello-world.md` to `articles/notes/你好，世界.md` and tag with `notes`

**Files:**
- Move: `articles/hello-world.md` → `articles/notes/你好，世界.md`
- Modify: `src/data/articles.js` (one import path, add `category: 'notes'`)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls articles/hello-world.md && test ! -d articles/notes && echo "OK: notes/ does not exist yet"
```
Expected: `hello-world.md` exists, `notes/` does not. (If `notes/` already exists from a prior failed attempt, stop and report.)

- [ ] **Step 2: Create `articles/notes/` and `git mv` the file with the new name**

Run:
```bash
mkdir -p articles/notes
git mv "articles/hello-world.md" "articles/notes/你好，世界.md"
```
Expected: command exits 0. The quotes around the Chinese filename are required by bash.

Verify with:
```bash
ls articles/notes/ && (test ! -f articles/hello-world.md && echo "OK: original removed")
```
Expected: `你好，世界.md` is listed; `OK: original removed` is printed.

- [ ] **Step 3: Update the import path in `src/data/articles.js`**

In `src/data/articles.js`, change line 2 from:

```js
import helloWorld from '../../articles/hello-world.md?raw';
```

to:

```js
import helloWorld from '../../articles/notes/你好，世界.md?raw';
```

- [ ] **Step 4: Add `category: 'notes'` to the metadata record**

In `src/data/articles.js`, the `hello-world` record is currently:

```js
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld
  },
```

Change to:

```js
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld,
    category: 'notes'
  },
```

The `slug` stays `hello-world` so existing URLs and `findArticleBySlug('hello-world')` keep working. The variable name `helloWorld` in the import is unrelated to the filename.

- [ ] **Step 5: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A typo in the new import path would surface here.

- [ ] **Step 6: Run tests**

Run:
```bash
npm test
```
Expected: all tests pass. The new `listCategories` test should now include `notes` in the expected list (it gets a count of 1).

Wait — the test was written assuming `notes` is empty. After this task, `notes` is no longer empty. Update the test now:

In `tests/articles.test.js`, find:

```js
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'claude'].includes(c.slug))
      .map((c) => c.slug);
```

Replace with:

```js
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'claude', 'notes'].includes(c.slug))
      .map((c) => c.slug);
```

And in the "omits empty buckets" test, remove the `notes` exclusion:

```js
    expect(slugs).not.toContain('prompt');
    expect(slugs).not.toContain('tool');
    expect(slugs).not.toContain('notes');  // ← delete this line
    expect(slugs).not.toContain('industry');
```

Re-run `npm test` and confirm green.

- [ ] **Step 7: Commit**

```bash
git add articles/ src/data/articles.js tests/articles.test.js
git commit -m "Move hello-world to articles/notes/ with category 'notes'"
```

---

## Task 7: Migrate `长对话中模型忘记系统指令.md` from `articles/llm/` to `articles/prompt/`

**Files:**
- Move: `articles/llm/长对话中模型忘记系统指令.md` → `articles/prompt/长对话中模型忘记系统指令.md`
- Modify: `src/data/articles.js` (one import path, change `category` from `'llm'` to `'prompt'`)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls articles/llm/长对话中模型忘记系统指令.md && test ! -d articles/prompt && echo "OK: prompt/ does not exist yet"
```
Expected: file exists, `prompt/` does not. (If `prompt/` already exists, stop and report.)

- [ ] **Step 2: `git mv` the file**

Run:
```bash
mkdir -p articles/prompt
git mv "articles/llm/长对话中模型忘记系统指令.md" "articles/prompt/长对话中模型忘记系统指令.md"
```
Expected: command exits 0.

Verify:
```bash
ls articles/prompt/ && (test ! -f "articles/llm/长对话中模型忘记系统指令.md" && echo "OK: original removed")
```

- [ ] **Step 3: Update the import path in `src/data/articles.js`**

In `src/data/articles.js`, change line 9 from:

```js
import changDuiHuaZhongMoXingWangJiXiTongZhiLing from '../../articles/llm/长对话中模型忘记系统指令.md?raw';
```

to:

```js
import changDuiHuaZhongMoXingWangJiXiTongZhiLing from '../../articles/prompt/长对话中模型忘记系统指令.md?raw';
```

- [ ] **Step 4: Change `category: 'llm'` to `category: 'prompt'` in the metadata record**

In `src/data/articles.js`, find the record with `slug: '长对话中模型忘记系统指令'` (currently near the end of the array). Change its `category` field from `'llm'` to `'prompt'`.

- [ ] **Step 5: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 6: Update the test for the new bucket**

In `tests/articles.test.js`, the test asserting the expected order currently includes `notes` after Task 6. Add `prompt`:

```js
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'claude', 'notes', 'prompt'].includes(c.slug))
      .map((c) => c.slug);
```

The "omits empty buckets" test should remove the `prompt` exclusion:

```js
    expect(slugs).not.toContain('prompt');  // ← delete this line
    expect(slugs).not.toContain('tool');
```

Also, the `bySlug.llm` count assertion was `3` — it should now be `2` (the article moved out of `llm`):

```js
    expect(bySlug.llm).toBe(2);
```

Re-run `npm test` and confirm green.

- [ ] **Step 7: Commit**

```bash
git add articles/ src/data/articles.js tests/articles.test.js
git commit -m "Move long-context-forgetting article to articles/prompt/ with category 'prompt'"
```

---

## Task 8: Migrate `OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` from `articles/agent/` to `articles/tool/`

**Files:**
- Move: `articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md` → `articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md`
- Modify: `src/data/articles.js` (one import path, change `category` from `'agent'` to `'tool'`)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls "articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md" && test ! -d articles/tool && echo "OK: tool/ does not exist yet"
```
Expected: file exists, `tool/` does not.

- [ ] **Step 2: `git mv` the file**

Run:
```bash
mkdir -p articles/tool
git mv "articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md" "articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md"
```

Verify:
```bash
ls articles/tool/ && (test ! -f "articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md" && echo "OK: original removed")
```

- [ ] **Step 3: Update the import path in `src/data/articles.js`**

In `src/data/articles.js`, change line 4 from:

```js
import openClawVsHermars from '../../articles/agent/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md?raw';
```

to:

```js
import openClawVsHermars from '../../articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md?raw';
```

- [ ] **Step 4: Change `category: 'agent'` to `category: 'tool'` in the metadata record**

In `src/data/articles.js`, find the record with `slug: 'OpenClaw（龙虾）与Hermars（爱马仕）使用体验'` and change its `category` field from `'agent'` to `'tool'`.

- [ ] **Step 5: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 6: Update the test for the new bucket**

In `tests/articles.test.js`, add `tool` to the expected order:

```js
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'claude', 'notes', 'prompt', 'tool'].includes(c.slug))
      .map((c) => c.slug);
```

And remove the `tool` exclusion from "omits empty buckets":

```js
    expect(slugs).not.toContain('tool');  // ← delete this line
    expect(slugs).not.toContain('industry');
```

The `bySlug.agent` count should now be `1` (the article moved out of `agent`):

```js
    expect(bySlug.agent).toBe(1);
```

Re-run `npm test` and confirm green.

- [ ] **Step 7: Commit**

```bash
git add articles/ src/data/articles.js tests/articles.test.js
git commit -m "Move OpenClaw vs Hermars article to articles/tool/ with category 'tool'"
```

---

## Task 9: Migrate `Claude-Code-上下文管理.md` from `articles/claude/` to `articles/tool/` and delete the now-empty `articles/claude/` folder

**Files:**
- Move: `articles/claude/Claude-Code-上下文管理.md` → `articles/tool/Claude-Code-上下文管理.md`
- Modify: `src/data/articles.js` (one import path, change `category` from `'claude'` to `'tool'`)
- Delete: `articles/claude/` (empty folder)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls articles/claude/ && ls articles/tool/Claude-Code-上下文管理.md 2>&1 || echo "OK: not yet in tool/"
```
Expected: `articles/claude/` shows `Claude-Code-上下文管理.md`. `articles/tool/Claude-Code-上下文管理.md` does not exist yet.

- [ ] **Step 2: `git mv` the file**

Run:
```bash
git mv "articles/claude/Claude-Code-上下文管理.md" "articles/tool/Claude-Code-上下文管理.md"
```

Verify:
```bash
ls articles/tool/ && (test ! -f "articles/claude/Claude-Code-上下文管理.md" && echo "OK: original removed")
```
Expected: `articles/tool/` now contains both `OpenClaw...md` and `Claude-Code-上下文管理.md`. The original under `claude/` is gone.

- [ ] **Step 3: Update the import path in `src/data/articles.js`**

In `src/data/articles.js`, change line 7 from:

```js
import claudeCodeShangXiaWenGuanLi from '../../articles/claude/Claude-Code-上下文管理.md?raw';
```

to:

```js
import claudeCodeShangXiaWenGuanLi from '../../articles/tool/Claude-Code-上下文管理.md?raw';
```

- [ ] **Step 4: Change `category: 'claude'` to `category: 'tool'` in the metadata record**

In `src/data/articles.js`, find the record with `slug: 'Claude-Code-上下文管理'` and change its `category` field from `'claude'` to `'tool'`.

- [ ] **Step 5: Delete the now-empty `articles/claude/` folder**

Run:
```bash
rmdir articles/claude
git add -A articles/claude  # stage the deletion if git is tracking the folder; usually rmdir is enough
git status --short
```
Expected: `articles/claude` shows as deleted in `git status`, no other untracked changes.

- [ ] **Step 6: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 7: Update the test for the new bucket**

In `tests/articles.test.js`, the test currently includes `claude` in the expected order. After this task, the `claude` bucket is empty (no articles reference it), so the test should:

1. Remove `claude` from the expected-order filter list:

```js
    const expectedOrder = categories
      .filter((c) => ['llm', 'agent', 'rag', 'notes', 'prompt', 'tool'].includes(c.slug))
      .map((c) => c.slug);
```

2. Remove the `bySlug.claude` assertion block:

```js
    expect(bySlug.claude).toBe(1);  // ← delete this line
```

3. Update the `tool` count to `2` (both tool articles are now in this bucket):

```js
    expect(bySlug.tool).toBe(2);  // add this line
```

Re-run `npm test` and confirm green.

- [ ] **Step 8: Commit**

```bash
git add articles/ src/data/articles.js tests/articles.test.js
git commit -m "Move Claude Code article to articles/tool/, drop articles/claude/ folder"
```

---

## Task 10: Rewrite `CLAUDE.md` rule 13 to enumerate the 10 categories

**Files:**
- Modify: `CLAUDE.md` (replace the existing rule 13)

- [ ] **Step 1: Read the current rule 13**

Run:
```bash
grep -n "13\." CLAUDE.md
```
Expected: a single line starting with `13.` near the end of the file.

- [ ] **Step 2: Replace rule 13**

Open `CLAUDE.md` and find the line that starts with `13. 文章的分类由一级子目录决定`. Replace the **entire** rule 13 (which is a single paragraph in the current file) with the following multi-line text:

```markdown
13. 文章的分类由一级子目录决定, 但 10 个分类是**固定的**——不允许自创新的 slug。新增文章必须放在以下 10 个文件夹之一, 并在 metadata 记录里写明对应 `category`:

    | slug | 中文显示名 | 范围 |
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

    每新增一篇文章, 必须同时: (a) 把 .md 文件放入 `articles/<category>/`; (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'` 字段 (其他字段见第 10 条)。slug 仍须全局唯一, 与分类无关。中文显示名存放在 `src/data/categories.js`, 是 UI 上 chip 文字和页面标题的唯一来源, 改显示名要同步改 `categories.js` 而不是 articles.js。
```

(4-space indent on the table and the trailing paragraph keeps it aligned with the bullet style of rules 1–12, which use the same indentation pattern.)

- [ ] **Step 3: Verify the file**

Run:
```bash
grep -c "^[0-9]\+\. " CLAUDE.md
```
Expected: outputs `13` (the file still has 13 numbered rules; rule 13 is now longer but still numbered 13).

Also `cat CLAUDE.md` and visually confirm:
- Items 1–12 are unchanged.
- Item 13 is the new text.
- No other formatting was disturbed.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Rewrite CLAUDE.md rule 13 with the fixed 10-category list"
```

---

## Task 11: End-to-end verification (no code changes)

This task walks through the spec's Verification section (steps 1–12). No code changes; if any step fails, fix the issue and re-verify before declaring done.

- [ ] **Step 1: Folder layout check**

Run:
```bash
ls -d articles/*/ | sort
```
Expected output (alphabetical):
```
articles/agent/
articles/industry/      ← may be empty
articles/engineering/   ← may be empty
articles/llm/
articles/notes/
articles/product/       ← may be empty
articles/prompt/
articles/rag/
articles/resources/     ← may be empty
articles/tool/
```

The `claude/` folder must NOT appear. (Empty folders for `industry`, `engineering`, `product`, `resources` are fine — git may or may not track them depending on `.gitignore`. Their absence is also fine.)

- [ ] **Step 2: Git history preserved for moved files**

Run:
```bash
git log --oneline --follow articles/tool/Claude-Code-上下文管理.md
```
Expected: at least one commit referencing `claude/...` (the v1 move) plus the v2 move to `tool/`. This confirms the rename chain survived the second `git mv`.

- [ ] **Step 3: Build**

Run:
```bash
npm run build
```
Expected: build succeeds, `dist/` is emitted.

- [ ] **Step 4: Tests**

Run:
```bash
npm test
```
Expected: all tests pass. Specifically, the `listCategories` test should show 5 categories in fixed order: `llm` (2), `agent` (1), `rag` (1), `tool` (2), `notes` (1).

- [ ] **Step 5: List page (all)**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`.

Expected:
- All 8 article cards visible in date-desc order.
- Chip bar shows 5 chips in fixed order: `[全部] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`.
- "全部" is solid brand-orange; the others are ghost.
- Page title (browser tab) is "文章".

- [ ] **Step 6: List page (filtered)**

Click the "AI 工具与产品" chip.

Expected:
- URL becomes `/#/articles/category/tool`.
- Only the two `tool/` articles render (OpenClaw vs Hermars, Claude Code 上下文管理).
- The "AI 工具与产品" chip is solid brand-orange; "全部" is ghost.
- Browser tab title is "AI 工具与产品 · 文章".

- [ ] **Step 7: Category badge on the card**

On the OpenClaw article card (or any card with a category), the orange badge shows "AI 工具与产品" in Chinese. Click the badge.

Expected: navigates to `/#/articles/category/tool` (same as Step 6). Click the card body or title. Expected: navigates to the article detail page.

- [ ] **Step 8: Fixed order check**

Confirm the chip bar order on `/articles` matches the order in `categories.js` (LLM → Prompt → RAG → Agent → Tool → Industry → Engineering → Product → Notes → Resources), with empty categories (`industry`, `engineering`, `product`, `resources`) hidden. The rendered order should be: 全部 → LLM 原理与基础 → 提示工程 → 检索增强生成 → AI 智能体 → AI 工具与产品 → 随笔与思考.

- [ ] **Step 9: Hello-world migration**

Visit `http://localhost:5173/blog/#/articles/hello-world`. Expected: loads the article body. Its category badge in the list view shows "随笔与思考". It appears in the "随笔与思考" filter.

- [ ] **Step 10: Old URL safety (defunct `claude` slug)**

Visit `http://localhost:5173/blog/#/articles/category/claude`. Expected:
- The empty state is rendered (text "该分类下还没有文章" + "查看全部文章" link to `/articles`).
- No chip is highlighted.
- Browser tab title is "文章" (not "claude · 文章" — the v2 design uses the default title when the slug is unknown).

- [ ] **Step 11: Detail page unaffected**

From `/articles`, click any article card. Expected: navigates to `/articles/<slug>`, the article body (including code fences) renders correctly.

- [ ] **Step 12: Routing collision check**

Verify three URLs (use the `npm run dev` server):
- `/#/articles/hello-world` — opens the hello-world detail page.
- `/#/articles/category/tool` — opens the filtered list (two articles).
- `/#/articles/category/hello-world` (a real slug used as a category name) — opens the empty state on the Articles page (the slug is not a real category), not the article detail.

- [ ] **Step 13: Stop the dev server**

Press Ctrl-C in the terminal running `npm run dev`.

- [ ] **Step 14: Final commit if any fix-ups were needed**

If Steps 5–12 required any small fix (a typo, a missing import, etc.), stage and commit those changes:

```bash
git status
# If anything is dirty:
git add <files>
git commit -m "Fix-ups from end-to-end verification"
```

If no fix-ups were needed, skip this step.

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| New `src/data/categories.js` with 10 slugs + Chinese names | Task 1 |
| `listCategories()` returns fixed-order, includes `name`, hides empty | Task 2 |
| Delete `findCategory` (no callers) | Task 2 |
| `CategoryFilter` displays `c.name` | Task 3 |
| `ArticleCard` badge displays Chinese name (lookup) | Task 4 |
| `Articles.jsx` page title uses Chinese name | Task 5 |
| Migrate `hello-world.md` → `articles/notes/你好，世界.md` + `category: 'notes'` | Task 6 |
| Migrate `长对话中模型忘记系统指令.md` → `articles/prompt/` + `category: 'prompt'` | Task 7 |
| Migrate `OpenClaw...md` → `articles/tool/` + `category: 'tool'` | Task 8 |
| Migrate `Claude-Code-上下文管理.md` → `articles/tool/` + `category: 'tool'` | Task 9 |
| Delete `articles/claude/` folder | Task 9 |
| CLAUDE.md rule 13 enumerates 10 categories | Task 10 |
| Spec verification section (12 steps) | Task 11 |

All 12 spec items map to a task. No gaps.

**2. Placeholder scan:** No `TBD` / `TODO` / "implement later" / "fill in" patterns. All code blocks are complete and runnable. The few places that say "if this fails, stop and report" are defensive check instructions, not placeholders.

**3. Type consistency:**
- `listCategories()` returns `Array<{slug: string, name: string, count: number}>` in all tasks (defined Task 2; consumed Tasks 3, 4, 5).
- `categories` is `Array<{slug, name}>` everywhere it's imported (Tasks 1, 2, 4).
- `categorySlugSet` is exported by Task 1 but unused in this plan; intentionally exported for future use per the spec.
- `article.category` is a string everywhere (no `categories: []` array).
- The `usePageTitle` argument shape is `${name} · 文章` (Tasks 5, 11) — consistent.
- `categoryExists` boolean semantics: `!category || !!categoryMeta` (Task 5) — the empty state triggers when the URL has a slug that doesn't resolve to a meta entry. This is the v2 semantics; the v1 semantics was `categories.some((c) => c.slug === category)`. Both produce the same result given the new `listCategories` (which only returns categories with articles), but the new version is clearer about why: no meta entry = unknown category = empty state.

**4. Subtle issues caught during self-review:**
- The test updates in Tasks 6–9 are sequenced so each task's test changes are local (just edit the filter array and the expected counts). A future implementer following the plan will see one test edit per task, not a giant rewrite.
- Task 6 changes the import variable name from `helloWorld` to... no wait, the variable name stays `helloWorld`. I caught that during the review and the task steps are correct. The `??` fallback in `ArticleCard` (Task 4) also handles the case where a slug in articles.js is missing from categories.js — defensive but cheap.
- The `findCategory` deletion in Task 2 is gated on a grep check (Step 1) — if a caller exists, the implementer stops before breaking the build.
- Task 9's Step 5 uses `rmdir` (not `rm -rf`) so it only succeeds when the folder is actually empty. An accidental non-empty state would surface as a build error, not silent data loss.
