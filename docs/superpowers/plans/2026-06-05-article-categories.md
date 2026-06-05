# Article Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `category` field to articles (derived from a one-level subfolder under `articles/`) and a clickable filter UI on `/articles` that lists articles in the selected category.

**Architecture:** Three pure-function additions to `src/lib/articles.js` (TDD'd with vitest) feed one new `<CategoryFilter>` component and one updated `Articles` page. The `ArticleCard` outer wrapper changes from `<Link>` to `<div onClick>` to allow a nested category badge `<Link>`. A new route `/articles/category/:category` reuses the `Articles` component, with the param deciding whether to filter. No new dependencies, no frontmatter, no glob import.

**Tech Stack:** Vite (build), Vitest (test), React 18, react-router-dom v6, Tailwind CSS (via existing brand classes).

---

## File Structure

Files touched by this plan:

- `articles/claude/Claude-Code-上下文管理.md` (new — moved from `articles/`)
- `articles/Claude-Code-上下文管理.md` (deleted after move)
- `src/data/articles.js` (one import path + one metadata field)
- `src/lib/articles.js` (three new exports: filtered `listArticles`, `listCategories`, `findCategory`)
- `tests/articles.test.js` (TDD test cases for the three new exports)
- `src/components/CategoryFilter.jsx` (new — chip bar component)
- `src/components/ArticleCard.jsx` (outer wrapper change + category badge)
- `src/pages/Articles.jsx` (useParams + filter + filter bar + page title + empty state)
- `src/App.jsx` (one new `<Route>`)
- `CLAUDE.md` (one new numbered constraint appended as item 13)

No new dependencies. No file splits.

---

## Task 1: Move Claude article to `articles/claude/` and add `category` field

**Files:**
- Move: `articles/Claude-Code-上下文管理.md` → `articles/claude/Claude-Code-上下文管理.md`
- Modify: `src/data/articles.js` (one import path, one metadata field)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls articles/Claude-Code-上下文管理.md && git status --short
```
Expected: file listed; `git status --short` empty (clean tree). If dirty, commit or stash first.

- [ ] **Step 2: Create the `articles/claude/` folder and move the file using `git mv`**

Run:
```bash
mkdir -p articles/claude
git mv "articles/Claude-Code-上下文管理.md" "articles/claude/Claude-Code-上下文管理.md"
```
Expected: command exits 0. The quotes around the Chinese filename are required by bash.

- [ ] **Step 3: Update the import path in `src/data/articles.js`**

In `src/data/articles.js`, change line 7 from:
```js
import claudeCodeShangXiaWenGuanLi from '../../articles/Claude-Code-上下文管理.md?raw';
```
to:
```js
import claudeCodeShangXiaWenGuanLi from '../../articles/claude/Claude-Code-上下文管理.md?raw';
```

- [ ] **Step 4: Add `category: 'claude'` to the metadata record**

In `src/data/articles.js`, in the object for `slug: 'Claude-Code-上下文管理'` (currently lines 57–65), add a `category` field. Change:
```js
  {
    slug: 'Claude-Code-上下文管理',
    title: 'Claude Code 上下文管理',
    excerpt: '上下文不是被动容器，而是最昂贵的战略资源，需要主动调度与防守。',
    date: '2026-06-03',
    tags: ['Claude Code', '上下文', '工程'],
    cover: null,
    content: claudeCodeShangXiaWenGuanLi
  },
```
to:
```js
  {
    slug: 'Claude-Code-上下文管理',
    title: 'Claude Code 上下文管理',
    excerpt: '上下文不是被动容器，而是最昂贵的战略资源，需要主动调度与防守。',
    date: '2026-06-03',
    tags: ['Claude Code', '上下文', '工程'],
    cover: null,
    content: claudeCodeShangXiaWenGuanLi,
    category: 'claude'
  },
```

- [ ] **Step 5: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds, `dist/` is emitted, no Vite resolution errors. A typo in the import path would surface here.

- [ ] **Step 6: Run existing tests to confirm no regression**

Run:
```bash
npm test
```
Expected: all 3 existing tests pass. The Claude article's content should still be reachable through `findArticleBySlug('Claude-Code-上下文管理')` (the import path is the only thing that changed; the slug and content are unchanged).

- [ ] **Step 7: Commit**

Run:
```bash
git add articles/ src/data/articles.js
git status
```
Verify the move is staged as a rename (git detects it automatically) and the metadata edit is staged. Then:
```bash
git commit -m "Move Claude article to articles/claude/ and tag it with category 'claude'"
```

---

## Task 2: TDD `listArticles({ category })` filter

**Files:**
- Modify: `tests/articles.test.js` (add one `it` block)
- Modify: `src/lib/articles.js` (extend `listArticles` to accept a filter)

- [ ] **Step 1: Write the failing test**

In `tests/articles.test.js`, add a new `it` block at the end of the `describe`:

```js
  it('listArticles({ category: "claude" }) returns only that category, sorted by date desc', () => {
    const list = listArticles({ category: 'claude' });
    expect(list.length).toBeGreaterThan(0);
    for (const a of list) {
      expect(a.category).toBe('claude');
    }
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('listArticles({ category: "no-such-category" }) returns an empty array', () => {
    expect(listArticles({ category: 'no-such-category' })).toEqual([]);
  });
```

- [ ] **Step 2: Run the new tests and confirm they fail**

Run:
```bash
npm test -- --reporter=verbose
```
Expected: the 2 new tests FAIL. Both fail because `listArticles` does not yet understand `{ category }` and returns all articles (the second test expects `[]` for an unknown category but gets the full list).

- [ ] **Step 3: Implement the filter in `listArticles`**

In `src/lib/articles.js`, replace the body of `listArticles`:

```js
export function listArticles({ category } = {}) {
  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;
  return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run:
```bash
npm test
```
Expected: all 5 tests pass (3 pre-existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add tests/articles.test.js src/lib/articles.js
git commit -m "Add category filter to listArticles()"
```

---

## Task 3: TDD `listCategories()`

**Files:**
- Modify: `tests/articles.test.js` (add one `it` block)
- Modify: `src/lib/articles.js` (add `listCategories` export)

- [ ] **Step 1: Write the failing test**

In `tests/articles.test.js`, append to the `describe` block:

```js
import { findArticleBySlug, listArticles, listCategories } from '../src/lib/articles.js';
```

(Replace the existing import at the top of the file with this expanded import.)

Then append:

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
    // Currently only 'claude' is categorized (after Task 1)
    expect(cats.find((c) => c.slug === 'claude')?.count).toBe(1);
  });
```

- [ ] **Step 2: Run and confirm the new test fails**

Run:
```bash
npm test
```
Expected: the new test FAILS with `listCategories is not a function` (or similar import error).

- [ ] **Step 3: Implement `listCategories` in `src/lib/articles.js`**

Add below the existing `listArticles` function:

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

- [ ] **Step 4: Run and confirm the test passes**

Run:
```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/articles.test.js src/lib/articles.js
git commit -m "Add listCategories() returning [{slug, count}] sorted by count desc"
```

---

## Task 4: TDD `findCategory(slug)`

**Files:**
- Modify: `tests/articles.test.js` (add two `it` blocks)
- Modify: `src/lib/articles.js` (add `findCategory` export)

- [ ] **Step 1: Write the failing tests**

In `tests/articles.test.js`, update the import line at the top to:

```js
import { findArticleBySlug, findCategory, listArticles, listCategories } from '../src/lib/articles.js';
```

Then append:

```js
  it('findCategory returns {slug, count} for a known category', () => {
    const c = findCategory('claude');
    expect(c).toEqual({ slug: 'claude', count: 1 });
  });

  it('findCategory returns null for an unknown category', () => {
    expect(findCategory('no-such-category')).toBeNull();
  });
```

- [ ] **Step 2: Run and confirm the new tests fail**

Run:
```bash
npm test
```
Expected: the two new tests FAIL with `findCategory is not a function`.

- [ ] **Step 3: Implement `findCategory` in `src/lib/articles.js`**

Add below `listCategories`:

```js
export function findCategory(slug) {
  const count = articles.filter((a) => a.category === slug).length;
  return count > 0 ? { slug, count } : null;
}
```

- [ ] **Step 4: Run and confirm the tests pass**

Run:
```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/articles.test.js src/lib/articles.js
git commit -m "Add findCategory(slug) returning {slug, count} | null"
```

---

## Task 5: Add the `/articles/category/:category` route in `App.jsx`

**Files:**
- Modify: `src/App.jsx` (one new `<Route>` between the existing two)

- [ ] **Step 1: Add the new route**

In `src/App.jsx`, the current `<Routes>` block (lines 21–32) is:

```jsx
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
```

Insert the new route between the existing `/articles` and `/articles/:slug` lines:

```jsx
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/category/:category" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
```

The `Articles` import (line 3) is already there and is reused for both routes.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A route-syntax error would surface here.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "Add /articles/category/:category route reusing the Articles page"
```

---

## Task 6: Create the `CategoryFilter` component

**Files:**
- Create: `src/components/CategoryFilter.jsx`

- [ ] **Step 1: Create the file with the full component**

Write `src/components/CategoryFilter.jsx`:

```jsx
// 文章分类筛选 chip 栏：显示「全部」+ 所有有文章的分类，当前激活的实心高亮
import { NavLink, Link } from 'react-router-dom';

export default function CategoryFilter({ categories, active }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <NavLink
        to="/articles"
        end
        className={({ isActive }) =>
          `px-3 py-1.5 rounded-full text-sm transition-colors ${
            isActive
              ? 'bg-brand-orange text-white'
              : 'border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
          }`
        }
      >
        全部
      </NavLink>
      {categories.map((c) => {
        const isActive = active === c.slug;
        return (
          <Link
            key={c.slug}
            to={`/articles/category/${c.slug}`}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-brand-orange text-white'
                : 'border border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
            }`}
          >
            {c.slug} <span className="opacity-70">({c.count})</span>
          </Link>
        );
      })}
    </div>
  );
}
```

Note: the `end` prop on the "全部" `NavLink` ensures it is only active on the exact `/articles` path, not on `/articles/...` subpaths. The dynamic category chips use plain `Link` (not `NavLink`) because we compare against the `active` prop directly — `NavLink`'s default `isActive` would match any URL under `/articles/category/<slug>`, which is fine for an exact slug, but using the prop is simpler and matches the spec.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A JSX/import typo would surface here.

- [ ] **Step 3: Commit**

```bash
git add src/components/CategoryFilter.jsx
git commit -m "Add CategoryFilter component for the articles list"
```

---

## Task 7: Update `Articles.jsx` to use params, filter, and render the filter bar

**Files:**
- Modify: `src/pages/Articles.jsx` (full rewrite — file is small)

- [ ] **Step 1: Replace the file contents with the new implementation**

The current `src/pages/Articles.jsx` is 19 lines. Replace its entire contents with:

```jsx
// 文章列表：默认全部；URL 带 :category 时只显示该分类；URL 指向不存在的分类时空状态
import { useParams, Link } from 'react-router-dom';
import { listArticles, listCategories } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  const { category } = useParams();
  usePageTitle(category ? `${category} · 文章` : '文章');
  const articles = listArticles({ category });
  const categories = listCategories();
  const categoryExists = !category || categories.some((c) => c.slug === category);

  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-6">文章</h1>
      <CategoryFilter categories={categories} active={category ?? null} />
      {!categoryExists || articles.length === 0 ? (
        <div className="py-12 text-center text-brand-mid">
          <p>该分类下还没有文章。</p>
          <Link
            to="/articles"
            className="inline-block mt-4 text-brand-orange hover:underline"
          >
            查看全部文章
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
```

Notes on the empty-state logic:
- `categoryExists` is `false` when the URL has a `category` param but it is not in the chip list (typo, or a category that was emptied).
- The empty state also triggers when `articles.length === 0` defensively, even if the category exists. This should not happen today (every category in `categories` has ≥ 1 article by construction), but is a cheap safety net.
- The title and the empty state both run when `categoryExists` is `false`; the page title shows the raw slug, the empty state links back to `/articles`.

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A missing import or JSX typo would surface here.

- [ ] **Step 3: Manual visual check (dev server)**

Run `npm run dev` and visit:
- `http://localhost:5173/blog/#/articles` — should show the chip bar `[全部] [claude (1)]`, with "全部" highlighted, and all 8 article cards.
- `http://localhost:5173/blog/#/articles/category/claude` — should show the chip bar with "claude" highlighted, and only the Claude article card.
- `http://localhost:5173/blog/#/articles/category/zzz` — should show the empty state with "查看全部文章" link.
- Clicking each chip should navigate correctly; the browser title should update to "claude · 文章" or "文章".

Stop the dev server with Ctrl-C after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Articles.jsx
git commit -m "Wire Articles page to category param, filter bar, page title, and empty state"
```

---

## Task 8: Update `ArticleCard` for nested `<Link>` and add the category badge

**Files:**
- Modify: `src/components/ArticleCard.jsx` (full rewrite — file is small)

- [ ] **Step 1: Replace the file contents**

The current `src/components/ArticleCard.jsx` is 31 lines. Replace its entire contents with:

```jsx
// 文章卡片：外层用 div + onClick + useNavigate 整体可点；category 徽章作为嵌套 Link 跳转分类页
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ArticleCard({ article }) {
  const navigate = useNavigate();
  const go = useCallback(() => navigate(`/articles/${article.slug}`), [navigate, article.slug]);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
      className="group block p-6 rounded-xl bg-brand-surface border border-brand-mid/20
                 hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                 transition-all duration-300 cursor-pointer"
    >
      <h3 className="text-xl font-semibold text-brand-light group-hover:text-brand-orange">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-brand-mid">{article.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <time className="text-brand-mid">{article.date}</time>
        <ul className="flex flex-wrap gap-2 items-center">
          {article.category && (
            <li>
              <Link
                to={`/articles/category/${article.category}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange
                           hover:bg-brand-orange/25 transition-colors"
              >
                {article.category}
              </Link>
            </li>
          )}
          {article.tags.map((t) => (
            <li
              key={t}
              className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

Notes on the changes from the original:
- Outer element is `<div role="link" tabIndex={0}>` instead of `<Link>`. The whole card is clickable via `onClick` + `onKeyDown` (Enter) for accessibility. `useNavigate` is called inside `useCallback` to keep the handler stable.
- `cursor-pointer` is added so the div looks interactive.
- The category badge is wrapped in its own `<li>` (matching the existing tags which are also `<li>`) and rendered only when `article.category` is truthy. `e.stopPropagation()` prevents a click on the badge from also triggering the card's body click (defensive — the badge's `<Link>` would naturally not bubble to the `<div>`'s onClick, but the stopPropagation is cheap insurance).
- `flex-wrap` on the `<ul>` prevents a card with many tags from overflowing on narrow screens.
- The `hover:text-brand-orange` is no longer redundant on the `<h3>` (the old code had `group-hover:text-brand-orange hover:text-brand-orange`; the `hover:` is gone because the entire card hovers together now, not the heading alone).

- [ ] **Step 2: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Manual visual check (dev server)**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`:
- The Claude article card should show an orange "claude" badge before its tags.
- Clicking the badge should navigate to `/#/articles/category/claude` (only the badge, not the card body).
- Clicking the card body or title should still navigate to `/#/articles/Claude-Code-上下文管理`.
- Other article cards (without a category) should not show a category badge.
- Keyboard: tab to a card, press Enter, should navigate to the detail page.

Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticleCard.jsx
git commit -m "Convert ArticleCard to div+onClick and add clickable category badge"
```

---

## Task 9: Add the new rule 13 to `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (append a new numbered item)

- [ ] **Step 1: Read the current tail of `CLAUDE.md`**

Run:
```bash
tail -5 CLAUDE.md
```
Expected: the file ends with the existing item 12 (the `content/` folder rule).

- [ ] **Step 2: Append the new rule 13**

Open `CLAUDE.md` in an editor and add a new item 13 after item 12. The exact text to add:

```markdown
13. 文章的分类由一级子目录决定: `articles/<category>/foo.md` 表示 `foo.md` 属于 `category` 分类。`articles/foo.md` 是无分类文章 (`category: null`)。每新增一篇文章,如要分类,必须 (a) 在 `articles/<category>/` 下创建 .md 文件; (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'`。slug 仍须全局唯一,与分类无关。
```

The numbering is preserved (existing rules stay 1–12; the new one is 13).

- [ ] **Step 3: Verify the file**

Run:
```bash
grep -c "^[0-9]\+\. " CLAUDE.md
```
Expected: outputs `13` (the file now has 13 numbered rules).

Also visually confirm by `cat CLAUDE.md` that:
- Items 1–12 are unchanged
- Item 13 is the new text
- No other formatting was disturbed

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Document article category workflow in CLAUDE.md (rule 13)"
```

---

## Task 10: End-to-end verification (no commit)

This task is a final pass that walks through the spec's Verification section (steps 1–10). Run each step and confirm the expected outcome. No code changes; if any step fails, fix the issue and re-verify before declaring done.

- [ ] **Step 1: Layout check**

Run:
```bash
ls articles/claude/Claude-Code-上下文管理.md && \
  (test ! -f "articles/Claude-Code-上下文管理.md" && echo "OK: original removed")
```
Expected: prints `OK: original removed`.

- [ ] **Step 2: Build**

Run:
```bash
npm run build
```
Expected: build succeeds, `dist/` is emitted.

- [ ] **Step 3: Tests**

Run:
```bash
npm test
```
Expected: all tests pass (3 pre-existing + 2 listArticles filter + 1 listCategories + 2 findCategory = 8).

- [ ] **Step 4: List page (all)**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`.

Expected:
- All 8 article cards visible in date-desc order.
- Chip bar visible: `[全部] [claude (1)]`. "全部" is solid brand-orange (active); "claude" is ghost.
- Page title (browser tab) is "文章".

- [ ] **Step 5: List page (filtered)**

Click the "claude" chip.

Expected:
- URL becomes `/#/articles/category/claude`.
- Only the Claude article card is rendered.
- "claude" chip is solid brand-orange; "全部" is ghost.
- Browser tab title is "claude · 文章".

- [ ] **Step 6: Category badge on the card**

On the Claude article card, the orange "claude" badge is visible before the tag pills. Click the badge.

Expected: navigates to `/#/articles/category/claude` (same as Step 5). Click the card body. Expected: navigates to `/#/articles/Claude-Code-上下文管理` (the detail page).

- [ ] **Step 7: Nested-link safety**

In DevTools, inspect the Claude article card.

Expected:
- The outer element is a `<div>` (not `<a>`).
- The category badge is a nested `<a>` pointing to `/articles/category/claude`.
- Clicking the badge does not also trigger the card body click (verify by adding a `console.log` in the card's `onClick`, or by visual observation: URL ends in `/category/claude`, not the article detail).

Remove the debug `console.log` if added.

- [ ] **Step 8: Empty / unknown category**

Navigate to `http://localhost:5173/blog/#/articles/category/zzz`.

Expected:
- The page shows the empty state: text "该分类下还没有文章" plus a "查看全部文章" link to `/articles`.
- No chip is highlighted (both "全部" and "claude" appear as ghost, since "zzz" is not in the chip list).
- Browser tab title is "zzz · 文章".

- [ ] **Step 9: Detail page unaffected**

From `/articles`, click any non-Claude article card.

Expected: navigates to `/articles/<slug>`, the article body (including code fences) renders correctly.

- [ ] **Step 10: Routing collision check**

Verify three URLs (use the `npm run dev` server):
- `/#/articles/hello-world` — opens the hello-world detail page.
- `/#/articles/category/claude` — opens the filtered list.
- `/#/articles/category/hello-world` (a real slug used as a category name) — opens the empty state on the Articles page (the slug is not a real category), not the article detail.

- [ ] **Step 11: Stop the dev server**

Press Ctrl-C in the terminal running `npm run dev`.

- [ ] **Step 12: Final commit if any fix-ups were needed**

If Steps 4–10 required any small fix (a typo, a missing import, etc.), stage and commit those changes:

```bash
git status
# If anything is dirty:
git add <files>
git commit -m "Fix-ups from end-to-end verification"
```

If no fix-ups were needed, skip this step.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Add `category` field to article metadata | Task 1 |
| Move Claude article to `articles/claude/` | Task 1 |
| `listArticles({ category })` filter | Task 2 |
| `listCategories()` returning `[{slug, count}]` | Task 3 |
| `findCategory(slug)` returning `{slug, count} \| null` | Task 4 |
| New route `/articles/category/:category` | Task 5 |
| New `CategoryFilter` component | Task 6 |
| `Articles.jsx` uses params, filter, filter bar, page title, empty state | Task 7 |
| `ArticleCard` div+onClick outer + nested category badge | Task 8 |
| CLAUDE.md rule 13 | Task 9 |
| Spec verification section steps 1–10 | Task 10 |

All 10 spec requirements map to a task. No gaps.

**Placeholder scan:** No TBD/TODO/fill-in patterns. All code blocks are complete and runnable.

**Type consistency:** `listArticles({ category })`, `listCategories()` returning `[{slug, count}]`, `findCategory(slug)` returning `{slug, count} | null` — same shapes used in tests, in `Articles.jsx`, in `CategoryFilter.jsx`. The component props are `categories: {slug, count}[]` and `active: string | null` — consistent across Task 6 (definition) and Task 7 (caller).
