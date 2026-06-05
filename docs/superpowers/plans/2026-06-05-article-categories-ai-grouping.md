# Article Categories — AI Topic Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the 7 AI-themed articles into a single `articles/ai/` folder, and add a "AI 主题" aggregation chip on the article list page that links to `/articles/category/ai` and shows the union of the 6 AI sub-categories (`llm`, `prompt`, `rag`, `agent`, `tool`, `industry`).

**Architecture:** `src/data/categories.js` gains a `groups` array and an optional `group` field on each category. `src/lib/articles.js` learns to (a) expand group slugs in `listArticles({category})` and (b) emit a group chip in `listCategories()` at the position of the group's first member. `src/pages/Articles.jsx` falls back to `groups` for the page title when a group slug is in the URL. The 7 `.md` files currently under `articles/{agent,llm,prompt,rag,tool}/` are `git mv`'d into `articles/ai/`; their import paths in `src/data/articles.js` are updated; the 5 now-empty subfolders are removed. `metadata.category` values stay unchanged (still one of the 10 fixed slugs) — `'ai'` is a group slug, never a category slug.

**Tech Stack:** Vite (build), Vitest (test), React 18, react-router-dom v6, Tailwind CSS (via existing brand classes). No new dependencies.

**Builds on:** `2026-06-05-article-categories-taxonomy.md` (v2 plan). The 10-category taxonomy and the v2 chip-bar mechanics stay; this plan adds a group layer on top. The v2 design spec is `docs/superpowers/specs/2026-06-05-article-categories-taxonomy-design.md`; this plan's design spec is `docs/superpowers/specs/2026-06-05-article-categories-ai-grouping-design.md`.

---

## File Structure

Files touched by this plan:

- `src/data/categories.js` (add `groups` export; add `group: 'ai'` on 6 categories)
- `src/lib/articles.js` (rewrite `listArticles` to expand group slugs; rewrite `listCategories` to emit a group chip)
- `src/data/articles.js` (7 import paths updated, all 7 files move to `articles/ai/`)
- `src/pages/Articles.jsx` (rename local `categories` → `chips`; add `groups.find` fallback for page title)
- `tests/articles.test.js` (add 3 new test cases; update existing order test to expect `ai` at front)
- `articles/ai/` (new folder, 7 files moved in)
- `articles/agent/`, `articles/llm/`, `articles/prompt/`, `articles/rag/`, `articles/tool/` (deleted, all empty after moves)
- `articles/notes/` (untouched)

No new dependencies. No file splits. `CategoryFilter.jsx`, `ArticleCard.jsx`, `App.jsx`, `ArticleDetail.jsx`, `CLAUDE.md` are all unchanged.

---

## Task 1: TDD — add the `groups` concept to `categories.js` + `lib/articles.js`

**Files:**
- Modify: `src/data/categories.js` (add `groups` export; add `group: 'ai'` on 6 categories)
- Modify: `tests/articles.test.js` (add 3 new test cases; update existing order test)
- Modify: `src/lib/articles.js` (rewrite `listArticles` and `listCategories`)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls src/data/categories.js && grep -c "group:" src/data/categories.js
```
Expected: file exists; `grep -c` returns `0` (no `group:` field yet). If `grep -c` is non-zero, stop and report.

- [ ] **Step 2: Add `groups` export and `group` field to `src/data/categories.js`**

In `src/data/categories.js`, find the top of the file (the comment line `// 文章分类的元数据：单一来源（slug + 中文显示名 + 固定展示顺序）。`) and **replace the entire file body** with:

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

Verify:
```bash
grep -c "group:" src/data/categories.js
```
Expected: `7` (one in the `groups` array comment-style reference, plus 6 in `categories`).

Also:
```bash
node -e "import('./src/data/categories.js').then(m => { console.log('groups:', m.groups); console.log('catSlugs:', m.categories.map(c => c.slug)); console.log('slugSet size:', m.categorySlugSet.size); })"
```
Expected: `groups: [ { slug: 'ai', name: 'AI 主题' } ]`, `catSlugs: [ 'llm', 'prompt', 'rag', 'agent', 'tool', 'industry', 'engineering', 'product', 'notes', 'resources' ]`, `slugSet size: 10`.

- [ ] **Step 3: Add the `groups` import to `src/lib/articles.js`**

In `src/lib/articles.js`, the current import is:

```js
import articles from '../data/articles.js';
import { categories } from '../data/categories.js';
```

Replace with:

```js
import articles from '../data/articles.js';
import { categories, groups } from '../data/categories.js';
```

(The function bodies of `listArticles` and `listCategories` stay unchanged at this point — they will be rewritten in Step 6.)

- [ ] **Step 4: Update the existing `listCategories` order test in `tests/articles.test.js`**

In `tests/articles.test.js`, the existing test for `listCategories` order currently asserts:

```js
const slugsInOrder = cats.map((c) => c.slug);
const expectedOrder = categories
  .filter((c) => ['llm', 'agent', 'rag', 'notes', 'prompt', 'tool'].includes(c.slug))
  .map((c) => c.slug);
expect(slugsInOrder).toEqual(expectedOrder);
```

After this plan, `listCategories()` will return a 7-element array starting with the group chip `'ai'`, then the 5 AI sub-categories with articles, then `'notes'`. Replace the existing assertion block:

```js
const slugsInOrder = cats.map((c) => c.slug);
const expectedOrder = categories
  .filter((c) => ['llm', 'agent', 'rag', 'notes', 'prompt', 'tool'].includes(c.slug))
  .map((c) => c.slug);
expect(slugsInOrder).toEqual(expectedOrder);
```

with:

```js
const slugsInOrder = cats.map((c) => c.slug);
// 期望顺序：AI 主题组 chip 在第一位，然后是 5 个有文章的 AI 子分类（按 categories.js 顺序），
// 最后是 notes。
// 'industry' 没有文章，所以不出现在 AI 子分类里。
const expectedOrder = [
  'ai',
  ...categories
    .filter((c) => c.group === 'ai' && ['llm', 'prompt', 'rag', 'agent', 'tool'].includes(c.slug))
    .map((c) => c.slug),
  'notes',
];
expect(slugsInOrder).toEqual(expectedOrder);
// First chip must be the group, with isGroup: true
expect(cats[0].slug).toBe('ai');
expect(cats[0].isGroup).toBe(true);
expect(cats[0].name).toBe('AI 主题');
expect(cats[0].count).toBe(7);
```

Note: the `counts` assertions further down (`bySlug.llm === 2`, `bySlug.agent === 1`, etc.) are unchanged — they still describe per-category counts.

- [ ] **Step 5: Add 3 new test cases to `tests/articles.test.js`**

**Add at the end of the `describe('articles util', ...)` block** (after the last `it(...)` block, before the closing `});`):

```js
  it('listArticles({ category: "ai" }) returns the union of all 6 AI sub-categories, date-desc', () => {
    const list = listArticles({ category: 'ai' });
    // 7 articles total: 2 llm + 1 prompt + 1 rag + 1 agent + 2 tool = 7
    expect(list.length).toBe(7);
    // Every returned article has a category in the AI group
    for (const a of list) {
      expect(['llm', 'prompt', 'rag', 'agent', 'tool']).toContain(a.category);
    }
    // Sorted by date desc
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('listArticles({ category: "ai" }) does not include notes or non-AI categories', () => {
    const list = listArticles({ category: 'ai' });
    for (const a of list) {
      expect(a.category).not.toBe('notes');
      expect(a.category).not.toBe('ai');  // 'ai' is a group slug, never a metadata.category value
    }
  });

  it('listCategories emits the AI group chip exactly once, even with 6 group members', () => {
    const cats = listCategories();
    const groupChips = cats.filter((c) => c.isGroup);
    expect(groupChips.length).toBe(1);
    expect(groupChips[0].slug).toBe('ai');
    // The group chip's count equals the sum of its members' counts
    const memberSlugs = ['llm', 'prompt', 'rag', 'agent', 'tool'];
    const memberCounts = cats
      .filter((c) => memberSlugs.includes(c.slug))
      .map((c) => c.count);
    const sumOfMembers = memberCounts.reduce((s, n) => s + n, 0);
    expect(groupChips[0].count).toBe(sumOfMembers);
  });
```

- [ ] **Step 6: Run tests and confirm the new tests FAIL**

Run:
```bash
npm test -- --reporter=verbose
```
Expected:
- The updated `listCategories` order test FAILS (the `ai` group chip is not yet emitted by `listCategories`).
- The 3 new test cases FAIL (`listArticles` does not yet expand `'ai'`; `listCategories` does not yet emit a group chip).
- All other pre-existing tests still PASS.

If anything else fails, stop and report.

- [ ] **Step 7: Rewrite `listArticles` in `src/lib/articles.js`**

In `src/lib/articles.js`, **replace** the existing `listArticles` function:

```js
export function listArticles({ category } = {}) {
  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;
  return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

with:

```js
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
  // group slug (如 'ai') 展开为成员列表；单分类 slug 走 fallback。
  const memberSlugs = groupMembersBySlug.get(category);
  const targetSlugs = memberSlugs ?? [category];
  // 注意：metadata.category 永远是 10 个原 slug 之一（categorySlugSet 守门），
  // targetSlugs 里出现 group slug（'ai'）也不会误匹配，因为没有文章 category === 'ai'。
  const filtered = articles.filter((a) => targetSlugs.includes(a.category));
  return [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

Behavior:
- `listArticles({ category: 'llm' })` — same as v2 (single-category filter).
- `listArticles({ category: 'ai' })` — `targetSlugs = ['llm', 'prompt', 'rag', 'agent', 'tool', 'industry']`, filters on `Array.includes`, returns the union.
- `listArticles({ category: 'foo' })` — neither a group slug nor a category slug, `targetSlugs = ['foo']`, no article matches, returns `[]` (preserves v2 behavior for unknown slugs).

- [ ] **Step 8: Rewrite `listCategories` in `src/lib/articles.js`**

In `src/lib/articles.js`, **replace** the existing `listCategories` function:

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

with:

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

Behavior:
- Iterates `categories` in fixed order. When it hits a category with `group: '<slug>'` for the first time, it pushes the group chip once.
- Group chip has `isGroup: true`. Category chips don't (the field is absent).
- Categories with 0 articles are filtered out (preserves v2 behavior). A group whose members all have 0 articles does not appear either (its `groupCounts` entry is never created because no `cnt > 0` ever fires).
- A category that declares `group: 'unknown-slug'` falls through `groupBySlug.has(c.group)` and renders as a plain category chip. Defensive against typos.

- [ ] **Step 9: Run tests and confirm they pass**

Run:
```bash
npm test -- --reporter=verbose
```
Expected: all tests pass. The `listArticles` test for `'ai'` returns 7 articles. The `listCategories` test asserts `['ai', 'llm', 'prompt', 'rag', 'agent', 'tool', 'notes']` order with `isGroup: true` on the first entry.

- [ ] **Step 10: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/data/categories.js src/lib/articles.js tests/articles.test.js
git commit -m "Add AI 主题 group: data-driven aggregation across 6 sub-categories"
```

---

## Task 2: Update `Articles.jsx` page title to resolve group slugs

**Files:**
- Modify: `src/pages/Articles.jsx` (add `groups` import; rename local `categories` → `chips`; add `groups.find` fallback for page title)

- [ ] **Step 1: Read the current `Articles.jsx` top section**

Open `src/pages/Articles.jsx`. The first ~20 lines currently are:

```jsx
// 文章列表：默认全部；URL 带 :category 时只显示该分类；URL 指向不存在的分类时空状态
import { useParams, Link } from 'react-router-dom';
import { listArticles, listCategories } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  const { category } = useParams();
  const categories = listCategories();
  const categoryMeta = category
    ? categories.find((c) => c.slug === category)
    : null;
  usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章');
  const articles = listArticles({ category });
  const categoryExists = !category || !!categoryMeta;
```

- [ ] **Step 2: Add the `groups` import and rename the local variable**

In `src/pages/Articles.jsx`, find the import line:

```jsx
import { listArticles, listCategories } from '../lib/articles.js';
```

Replace with:

```jsx
import { listArticles, listCategories } from '../lib/articles.js';
import { groups } from '../data/categories.js';
```

Then find:

```jsx
  const categories = listCategories();
  const categoryMeta = category
    ? categories.find((c) => c.slug === category)
    : null;
```

Replace with:

```jsx
  const chips = listCategories();
  // categoryMeta 查找：先在 chip 列表（含组 chip）里找；找不到时 fallback 到 groups，
  // 让 group slug（'ai'）也能拿到中文显示名用于页面标题。
  // chip 列表已经包含组条目，所以正常情况下第一个 find 就命中；
  // groups.find fallback 是为防御未来直接传 group slug 但 listCategories 顺序变化等边界情况。
  const categoryMeta = category
    ? chips.find((c) => c.slug === category)
      ?? groups.find((g) => g.slug === category)
      ?? null
    : null;
```

- [ ] **Step 3: Update the `<CategoryFilter>` props reference**

In `src/pages/Articles.jsx`, find:

```jsx
      <CategoryFilter categories={categories} active={category ?? null} />
```

Replace with:

```jsx
      <CategoryFilter categories={chips} active={category ?? null} />
```

(The `categories` → `chips` rename needs to be applied to the JSX prop as well. After this step, the file no longer references a local `categories` variable.)

- [ ] **Step 4: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Manual visual check (dev server)**

Run `npm run dev` and visit:
- `http://localhost:5173/blog/#/articles` — chip bar shows `[全部] [AI 主题 (7)] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`. "全部" is highlighted.
- `http://localhost:5173/blog/#/articles/category/ai` — all 7 AI articles render in date-desc order; the "AI 主题" chip is highlighted; sub-category chips are not. Browser tab title: `AI 主题 · 文章`.
- `http://localhost:5173/blog/#/articles/category/llm` — only the 2 `llm` articles render; the "LLM 原理与基础" chip is highlighted; the "AI 主题" chip is NOT highlighted (active state is only on the matched slug). Browser tab title: `LLM 原理与基础 · 文章`.

Stop the dev server with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Articles.jsx
git commit -m "Articles page title resolves group slugs via groups lookup"
```

---

## Task 3: Move 7 files into `articles/ai/` and update 7 import paths in `articles.js`

**Files:**
- Move: 7 files (5 source folders → 1 target folder)
- Modify: `src/data/articles.js` (7 import paths updated)
- Delete: 5 now-empty subfolders

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls articles/ai 2>&1 || echo "OK: ai/ does not exist yet"
ls articles/agent/Agent*.md 2>&1
ls articles/llm/*.md 2>&1
ls articles/prompt/*.md 2>&1
ls articles/rag/*.md 2>&1
ls articles/tool/*.md 2>&1
```
Expected: `ai/` does not exist; the other 5 subfolders each have 1–2 files (total 7). The 7 files are:
- `articles/agent/Agent 性能量化.md`
- `articles/llm/AI技术底层.md`
- `articles/llm/DeepSeek 的"降本增效"之道.md`
- `articles/prompt/长对话中模型忘记系统指令.md`
- `articles/rag/RAG分层检索.md`
- `articles/tool/Claude-Code-上下文管理.md`
- `articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md`

If `articles/ai/` already exists, stop and report.

- [ ] **Step 2: Create `articles/ai/` and `git mv` all 7 files**

Run:
```bash
mkdir -p articles/ai
git mv "articles/agent/Agent 性能量化.md" "articles/ai/Agent 性能量化.md"
git mv "articles/llm/AI技术底层.md" "articles/ai/AI技术底层.md"
git mv 'articles/llm/DeepSeek 的"降本增效"之道.md' 'articles/ai/DeepSeek 的"降本增效"之道.md'
git mv "articles/prompt/长对话中模型忘记系统指令.md" "articles/ai/长对话中模型忘记系统指令.md"
git mv "articles/rag/RAG分层检索.md" "articles/ai/RAG分层检索.md"
git mv "articles/tool/Claude-Code-上下文管理.md" "articles/ai/Claude-Code-上下文管理.md"
git mv "articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md" "articles/ai/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md"
```

Note on shell quoting:
- Files with parens (e.g. `OpenClaw（龙虾）...` and `Agent 性能量化.md` (has space)) need double quotes.
- The file with the embedded double quote (`DeepSeek 的"降本增效"之道.md`) needs **single quotes** because the double quotes inside would otherwise terminate a double-quoted shell string. The other files use double quotes.

Expected: all 7 commands exit 0.

Verify:
```bash
ls articles/ai/ && echo "---" && ls articles/agent/ articles/llm/ articles/prompt/ articles/rag/ articles/tool/ 2>&1
```
Expected: `articles/ai/` lists 7 files; the 5 source folders are empty (the `ls` will show "No such file or directory" or empty for the rmdir step later — at this point the folders exist but are empty).

- [ ] **Step 3: Remove the 5 now-empty subfolders**

Run:
```bash
rmdir articles/agent articles/llm articles/prompt articles/rag articles/tool
```

`rmdir` (not `rm -rf`) only succeeds when the folder is empty — a non-empty state would surface as a build error, not silent data loss.

Verify:
```bash
ls -d articles/agent articles/llm articles/prompt articles/rag articles/tool 2>&1
```
Expected: all 5 print "No such file or directory".

Also:
```bash
ls -d articles/*/
```
Expected: exactly two entries — `articles/ai/` and `articles/notes/`.

- [ ] **Step 4: Update the 7 import paths in `src/data/articles.js`**

In `src/data/articles.js`, the 8 import lines currently are:

```js
import helloWorld from '../../articles/notes/你好，世界.md?raw';
import ragFenCengJianSuo from '../../articles/rag/RAG分层检索.md?raw';
import openClawVsHermars from '../../articles/tool/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md?raw';
import agentXingNengLiangHua from '../../articles/agent/Agent 性能量化.md?raw';
import aiJiShuDiCeng from '../../articles/llm/AI技术底层.md?raw';
import claudeCodeShangXiaWenGuanLi from '../../articles/tool/Claude-Code-上下文管理.md?raw';
import deepSeekJiangBenZengXiao from '../../articles/llm/DeepSeek 的“降本增效”之道.md?raw';
import changDuiHuaZhongMoXingWangJiXiTongZhiLing from '../../articles/prompt/长对话中模型忘记系统指令.md?raw';
```

(Note: line 8 uses `“` and `”` (curly Chinese quotes), not straight `"`. Vite accepts either, but be careful when matching text — match the curly quotes exactly.)

Replace the 7 lines (all except `helloWorld`) with these, in the same order:

```js
import helloWorld from '../../articles/notes/你好，世界.md?raw';
import ragFenCengJianSuo from '../../articles/ai/RAG分层检索.md?raw';
import openClawVsHermars from '../../articles/ai/OpenClaw（龙虾）与Hermars（爱马仕）使用体验.md?raw';
import agentXingNengLiangHua from '../../articles/ai/Agent 性能量化.md?raw';
import aiJiShuDiCeng from '../../articles/ai/AI技术底层.md?raw';
import claudeCodeShangXiaWenGuanLi from '../../articles/ai/Claude-Code-上下文管理.md?raw';
import deepSeekJiangBenZengXiao from '../../articles/ai/DeepSeek 的“降本增效”之道.md?raw';
import changDuiHuaZhongMoXingWangJiXiTongZhiLing from '../../articles/ai/长对话中模型忘记系统指令.md?raw';
```

The `metadata.category` values in the array below are **unchanged** (still `'llm' | 'prompt' | 'rag' | 'agent' | 'tool'`; `'notes'` for `hello-world`).

- [ ] **Step 5: Verify with `npm run build`**

Run:
```bash
npm run build
```
Expected: build succeeds. A typo in any import path would surface here as a "Cannot find module" or raw-loader error.

- [ ] **Step 6: Run tests**

Run:
```bash
npm test
```
Expected: all 30 tests pass (27 pre-existing + 3 new from Task 1). The `listArticles({category: 'ai'})` test returns 7 articles; the `listCategories` order test asserts the `ai` chip is first.

- [ ] **Step 7: Manual visual check (dev server)**

Run `npm run dev` and visit:
- `http://localhost:5173/blog/#/articles` — 8 article cards visible, chip bar is `[全部] [AI 主题 (7)] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`. "全部" is highlighted.
- Click "AI 主题" — URL becomes `/#/articles/category/ai`, 7 AI articles render, "AI 主题" chip is highlighted.
- Click "AI 工具与产品" — URL becomes `/#/articles/category/tool`, 2 tool articles render, "AI 工具与产品" chip is highlighted, "AI 主题" is not.
- Click any article card — detail page loads with the correct content and category badge.

Stop the dev server with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add articles/ src/data/articles.js
git commit -m "Flatten 6 AI sub-categories into articles/ai/, drop 5 empty subdirs"
```

---

## Task 4: End-to-end verification (no code changes)

This task walks through the spec's 15-step Verification section. No code changes; if any step fails, fix the issue and re-verify before declaring done.

- [ ] **Step 1: Folder layout check**

Run:
```bash
ls -d articles/*/ | sort
```
Expected output (alphabetical):
```
articles/ai/
articles/notes/
```

The `agent/`, `industry/`, `engineering/`, `llm/`, `product/`, `prompt/`, `rag/`, `resources/`, `tool/` folders must NOT appear.

- [ ] **Step 2: Git history preserved for moved files**

Run:
```bash
git log --oneline --follow articles/ai/Claude-Code-上下文管理.md | head -5
```
Expected: at least one commit referencing `tool/...` (the v2 move from `claude/` to `tool/`) plus this plan's move to `ai/`. This confirms the rename chain survived the third `git mv`.

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
Expected: all 30 tests pass. The 3 new tests from Task 1 are green. The updated `listCategories` order test passes with `['ai', 'llm', 'prompt', 'rag', 'agent', 'tool', 'notes']`.

- [ ] **Step 5: List page (all) — verify chip bar**

Run `npm run dev` and visit `http://localhost:5173/blog/#/articles`.

Expected:
- 8 article cards visible in date-desc order.
- Chip bar shows exactly: `[全部] [AI 主题 (7)] [LLM 原理与基础 (2)] [提示工程 (1)] [检索增强生成 (1)] [AI 智能体 (1)] [AI 工具与产品 (2)] [随笔与思考 (1)]`.
- "全部" is solid brand-orange; the others are ghost.
- Browser tab title: `文章`.

- [ ] **Step 6: AI aggregation page**

Click the "AI 主题 (7)" chip.

Expected:
- URL becomes `/#/articles/category/ai`.
- All 7 AI articles render in date-desc order (note: `hello-world` is NOT in this list — it has `category: 'notes'`).
- The "AI 主题" chip is solid brand-orange; the six sub-category chips are ghost.
- Browser tab title: `AI 主题 · 文章`.

- [ ] **Step 7: Sub-category page**

Click the "AI 工具与产品 (2)" chip.

Expected:
- URL becomes `/#/articles/category/tool`.
- Only the 2 `tool/` articles render (OpenClaw vs Hermars, Claude Code 上下文管理).
- The "AI 工具与产品" chip is solid brand-orange; "AI 主题" and the other sub-categories are ghost.
- Browser tab title: `AI 工具与产品 · 文章`.

- [ ] **Step 8: Detail page unaffected**

Click any article card (e.g. on `/articles/category/ai`, click the first card). Expected: navigates to `/articles/:slug`, the article body renders correctly, the category badge on the detail page still shows the sub-category name (e.g. `LLM 原理与基础`), not `AI 主题`.

- [ ] **Step 9: `/articles` ↔ `/articles/category/ai` round-trip**

From `/articles/category/ai` (after Step 6), click "全部". Expected: URL becomes `/#/articles`, all 8 articles visible (including `hello-world`), tab title is `文章`. Click "AI 主题" again. Expected: back to the 7-article AI view.

- [ ] **Step 10: No chip cross-highlight**

On `/articles/category/ai`, only the "AI 主题" chip is solid orange. On `/articles/category/llm`, only the "LLM 原理与基础" chip is solid orange (the "AI 主题" chip is ghost, even though the AI group includes `llm`). This is the intended behavior: the active state matches the URL slug, not the group membership.

- [ ] **Step 11: Empty group case (manual temporary check)**

Temporarily move all 7 AI articles' `metadata.category` to `'notes'` in `src/data/articles.js` (i.e. change every `category: 'llm'`, `'prompt'`, `'rag'`, `'agent'`, `'tool'` to `category: 'notes'`). Re-run `npm run dev` and visit `/#/articles`. Expected: the "AI 主题" chip is gone from the chip bar (no group member has any articles, so the group is hidden). Chip bar shows only: `[全部] [随笔与思考 (8)]`.

**Important:** restore the `metadata.category` values afterward (this is a temporary verification, not a real change). Re-run `npm test` to confirm all tests pass after restoring.

- [ ] **Step 12: Unknown slug safety**

Visit `http://localhost:5173/blog/#/articles/category/foo` (any string that's not a real slug and not `'ai'`). Expected:
- Empty state is rendered: text "该分类下还没有文章" + "查看全部文章" link to `/articles`.
- No chip is highlighted.
- The "AI 主题" chip is not highlighted (URL slug is `foo`, not `ai`).
- Browser tab title: `文章` (the title falls back to default for unknown slugs, per the v2 spec; the group fallback in `Articles.jsx` only fires for known group slugs like `'ai'`).

- [ ] **Step 13: Routing collision check**

Verify three URLs:
- `/#/articles/hello-world` — opens the hello-world detail page.
- `/#/articles/category/tool` — opens the filtered list (two articles).
- `/#/articles/category/hello-world` (a real slug used as a category name) — opens the empty state on the Articles page (the slug is not a real category), NOT the article detail.

- [ ] **Step 14: `metadata.category` is never `'ai'`**

Run:
```bash
grep -rn "category: 'ai'" src/
```
Expected: no output. The group slug `'ai'` is internal to the URL/chip layer; the data file uses the 10 real slugs.

- [ ] **Step 15: Stop the dev server and final commit**

Press Ctrl-C in the terminal running `npm run dev`.

If any verification step required a small fix (a typo, a missing import, etc.):
```bash
git status
# If anything is dirty:
git add <files>
git commit -m "Fix-ups from end-to-end verification"
```

If no fix-ups were needed, skip the commit.

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| New `groups` array in `categories.js` | Task 1 |
| `group: 'ai'` field on 6 categories | Task 1 |
| `listArticles({category: 'ai'})` expands to union of 6 sub-categories | Task 1 |
| `listCategories()` emits the AI 主题 chip first with aggregated count, `isGroup: true` | Task 1 |
| Group chip emitted exactly once (with 6 members) | Task 1 |
| Empty group (0 members with articles) hides the group chip | Task 1 (defensive; verified manually in Task 4 Step 11) |
| `Articles.jsx` resolves group slugs for page title | Task 2 |
| `CategoryFilter` needs no changes (chip array iteration is opaque to `isGroup`) | Task 2 (no edit) |
| 7 file moves into `articles/ai/` | Task 3 |
| 5 empty subdirs removed | Task 3 |
| 7 import paths updated in `articles.js` | Task 3 |
| `metadata.category` values unchanged | Task 3 (explicitly preserved) |
| 15-step Verification section from spec | Task 4 |

All 12 spec items map to a task. No gaps.

**2. Placeholder scan:** No `TBD` / `TODO` / "implement later" patterns. All code blocks are complete and runnable. The "stop and report" instructions are defensive checks, not placeholders.

**3. Type consistency:**
- `groups = Array<{slug: string, name: string}>` everywhere (Task 1 categories.js, Task 1 lib/articles.js, Task 2 Articles.jsx).
- `categories[].group?: string` (optional field; absent on 4 non-AI categories).
- `listArticles({category})` returns `Article[]`; behavior depends on `category` being a group slug (Map hit), a category slug (Map miss → `[category]`), or omitted (all).
- `listCategories()` returns `Array<{slug, name, count, isGroup?}>`. `isGroup: true` only on the group chip; absent on category chips. Consumers don't need to know about `isGroup` — they iterate the array. The test in Task 4 Step 10 implicitly confirms the chip bar's active-state logic doesn't break on `isGroup: true` entries.
- `chips` (renamed from local `categories` in Articles.jsx) is the same array shape as v2's `categories`, plus the new group chip. `CategoryFilter` consumes it without changes.
- `groupMembersBySlug` is built once at module load (Task 1 Step 7). It's not exported; it's an internal optimization.

**4. Subtle issues caught during self-review:**
- **Vite source paths with curly quotes:** `DeepSeek 的"降本增效"之道.md` uses Chinese curly quotes (`“` `”`), which are valid filename characters on macOS/Linux. Vite's `?raw` import doesn't decode them, so the import path must match the filename exactly. The plan uses single-quoted shell strings in the `git mv` command (line 4) because double quotes inside the filename would otherwise terminate a double-quoted shell string.
- **`rmdir` vs `rm -rf`:** Step 3 uses `rmdir` (not `rm -rf`) so it only succeeds when the folder is actually empty. An accidental non-empty state would surface as a build error, not silent data loss.
- **Vite glob discovery of new files:** `git mv` only updates the git index, not the filesystem watcher. After `git mv`, the file's *content path* (from Vite's perspective) is the new path. The import statement in `articles.js` must point to the new path for Vite to find it. Steps 2 and 4 must happen in the same commit (Task 3 commits them together).
- **`metadata.category` is never `'ai'`:** explicitly verified in Task 4 Step 14. The group slug is internal to the URL/chip layer; `articles.js` always uses the 10 real slugs.
- **Shell quoting around parens:** `Agent 性能量化.md` has a space (no parens), and `OpenClaw（龙虾）...` has full-width parens. The full-width parens are valid shell characters inside double quotes (they're not glob metacharacters), so the `git mv` commands use double quotes for these files. The `DeepSeek` file with the embedded double quote uses single quotes for the shell string.
- **Test ordering:** Task 1's Step 4 (update existing test) and Step 5 (add new tests) both happen before Step 7-8 (implementation). The implementation in Steps 7-8 makes the new tests pass. This is the TDD loop: write failing tests, implement, verify passing.
- **Empty-state title behavior:** in Task 2, the page title for an unknown slug falls back to `'文章'` (not the raw slug). The v2 spec established this; the `groups.find` fallback in `Articles.jsx` doesn't change it. The fallback only fires for known group slugs like `'ai'`, where `chips.find` misses but `groups.find` hits.
