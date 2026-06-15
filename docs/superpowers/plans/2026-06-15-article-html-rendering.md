# Article HTML Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch article detail page (`/articles/:slug`) from markdown to HTML, mirroring project detail page — 100vh iframe + floating back link + hidden Navbar.

**Architecture:** ArticleDetail reuses `Html` component unchanged. `App.jsx` extends its Navbar-hide regex to cover `/articles/:slug` (excluding `/articles/category/:category`). Old `Markdown` component and 4 markdown-related dependencies are removed. `create-article` skill switches to `.html` flow. CLAUDE.md rules 10/11 are rewritten to a unified "articles and projects both use HTML" rule.

**Tech Stack:** React 18, Vite 5, Vitest 1, React Testing Library 14, lucide-react, react-router-dom 6, HashRouter. No new dependencies; 4 markdown deps removed.

**Spec:** `docs/superpowers/specs/2026-06-15-article-html-rendering-design.md`

---

## File Map

**Create:**
- `tests/article-detail.test.jsx` — ArticleDetail component test (3 cases)

**Modify:**
- `src/pages/ArticleDetail.jsx` — rewrite to use `<Html>` + `<Navigate>` + floating back link
- `src/App.jsx` — add `isArticleDetail` regex, merge into `isFullBleedDetail`
- `src/data/articles.js` — empty array
- `src/index.css` — remove `hljs-*` styles
- `package.json` — remove 4 markdown deps
- `CLAUDE.md` — rewrite rules 10 and 11
- `tests/articles.test.js` — update assertions for empty array
- `create-article` skill (located at `.claude/skills/create-article/SKILL.md` or similar)

**Delete:**
- `src/lib/markdown.jsx`
- `articles/notes/你好，世界.md`

**Touched by `npm install` after `package.json` edit:**
- `package-lock.json` — auto-regenerated

---

## Task 1: Update articles util tests to expect empty array

**Files:**
- Modify: `tests/articles.test.js`

- [ ] **Step 1: Replace the `listArticles returns array sorted by date desc` test**

In `tests/articles.test.js`, replace the test at lines 7-15:

```js
  it('listArticles returns array sorted by date desc', () => {
    const list = listArticles();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });
```

with:

```js
  it('listArticles returns an empty array when no articles are registered', () => {
    expect(listArticles()).toEqual([]);
  });

  it('listArticles with category filter still returns an empty array when no articles exist', () => {
    expect(listArticles({ category: 'ai' })).toEqual([]);
  });
```

- [ ] **Step 2: Replace the `findArticleBySlug returns the article when slug matches` test**

In `tests/articles.test.js`, replace the test at lines 16-21:

```js
  it('findArticleBySlug returns the article when slug matches', () => {
    const article = findArticleBySlug('hello-world');
    expect(article).toBeDefined();
    expect(article.slug).toBe('hello-world');
    expect(article.content).toContain('# 你好，世界');
  });
```

with:

```js
  it('findArticleBySlug returns undefined for hello-world (the markdown article has been retired)', () => {
    expect(findArticleBySlug('hello-world')).toBeUndefined();
  });
```

- [ ] **Step 3: Update the `listCategories` test to expect empty**

In `tests/articles.test.js`, replace the test at lines 31-43:

```js
  it('listCategories returns categories in the fixed order from categories.js, with slug+name+count, hiding empty buckets', () => {
    const cats = listCategories();
    for (const c of cats) {
      expect(typeof c.slug).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.count).toBe('number');
      expect(c.count).toBeGreaterThan(0);
    }
    // 当前有文章的分类：ai (7) 和 notes (1)，按 categories.js 声明顺序排列
    expect(cats.map((c) => c.slug)).toEqual(['ai', 'notes']);
    expect(cats[0]).toMatchObject({ slug: 'ai', name: 'AI', count: 7 });
    expect(cats[1]).toMatchObject({ slug: 'notes', name: '随笔与思考', count: 1 });
  });
```

with:

```js
  it('listCategories returns an empty array when no articles exist (all buckets hidden)', () => {
    expect(listCategories()).toEqual([]);
  });
```

- [ ] **Step 4: Replace the `listArticles({ category: "ai" }) returns only articles whose category is exactly "ai", date-desc` test**

In `tests/articles.test.js`, replace the test at lines 53-62:

```js
  it('listArticles({ category: "ai" }) returns only articles whose category is exactly "ai", date-desc', () => {
    const list = listArticles({ category: 'ai' });
    expect(list.length).toBe(7);
    for (const a of list) {
      expect(a.category).toBe('ai');
    }
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });
```

with:

```js
  it('listArticles({ category: "ai" }) returns an empty array when no articles exist', () => {
    expect(listArticles({ category: 'ai' })).toEqual([]);
  });
```

- [ ] **Step 5: Delete the redundant empty-category tests**

Delete the test at lines 27-29:

```js
  it('listArticles({ category: "no-such-category" }) returns an empty array', () => {
    expect(listArticles({ category: 'no-such-category' })).toEqual([]);
  });
```

Delete the test at lines 45-51:

```js
  it('listCategories omits categories that have zero articles (python / engineering / product / resources)', () => {
    const slugs = listCategories().map((c) => c.slug);
    expect(slugs).not.toContain('python');
    expect(slugs).not.toContain('engineering');
    expect(slugs).not.toContain('product');
    expect(slugs).not.toContain('resources');
  });
```

Delete the test at lines 64-69:

```js
  it('listArticles({ category: "ai" }) does not include notes or any other category', () => {
    const list = listArticles({ category: 'ai' });
    for (const a of list) {
      expect(a.category).not.toBe('notes');
    }
  });
```

Delete the test at lines 71-75:

```js
  it('listArticles({ category: "notes" }) returns exactly the hello-world article', () => {
    const list = listArticles({ category: 'notes' });
    expect(list.length).toBe(1);
    expect(list[0].slug).toBe('hello-world');
  });
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test -- tests/articles.test.js`
Expected: FAIL — `listArticles()` currently returns 1 article (the hello-world markdown), but the new tests expect `[]`. `findArticleBySlug('hello-world')` currently returns the article, but the new test expects `undefined`. `listCategories()` currently returns 2 entries, but the new test expects `[]`.

- [ ] **Step 7: Commit the failing test**

```bash
git add tests/articles.test.js
git commit -m "test(articles): update util tests to expect empty data array"
```

---

## Task 2: Empty the articles data file

**Files:**
- Modify: `src/data/articles.js`

- [ ] **Step 1: Replace the contents of `src/data/articles.js`**

The current file (16 lines) is:

```js
// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 markdown 源文件
import helloWorld from '../../articles/notes/你好，世界.md?raw';

const articles = [
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld,
    category: 'notes'
  }
];

export default articles;
```

Replace it entirely with:

```js
// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 .html 源文件
// 当前为空，后续通过 create-article 技能发布新 HTML 文章时填入
const articles = [];

export default articles;
```

- [ ] **Step 2: Run tests to verify Task 1 tests now pass**

Run: `npm test -- tests/articles.test.js`
Expected: PASS — all updated tests now match the empty array.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: PASS for `tests/articles.test.js` and `tests/content.test.js`. Other test files may still pass or fail depending on remaining work — that's expected at this point.

- [ ] **Step 4: Commit**

```bash
git add src/data/articles.js
git commit -m "refactor(articles): empty data array; markdown article retired"
```

---

## Task 3: Create the article detail test file (failing)

**Files:**
- Create: `tests/article-detail.test.jsx`

- [ ] **Step 1: Create `tests/article-detail.test.jsx` with three test cases**

Write the file `tests/article-detail.test.jsx`:

```jsx
// ArticleDetail 组件单测：详情页路由下渲染 iframe + 悬浮返回链接，
// 找不到 slug 时跳回 /articles。用 vi.mock 提供一个测试用文章 fixture，
// 不污染 src/data/articles.js 的生产数据。
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../src/data/articles.js', () => ({
  default: [
    {
      slug: 'sample-article',
      title: '示例文章',
      excerpt: '示例',
      date: '2026-06-15',
      tags: ['示例'],
      cover: null,
      content: '<!doctype html><html><body><p>正文</p></body></html>',
      category: 'notes'
    }
  ]
}));

const ArticleDetail = (await import('../src/pages/ArticleDetail.jsx')).default;

function renderAt(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/articles" element={<div data-testid="list">list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ArticleDetail', () => {
  it('renders an iframe for a valid slug', () => {
    const { container } = renderAt('/articles/sample-article');
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
  });

  it('renders the iframe with fullscreen classes and proper sandbox', () => {
    const { container } = renderAt('/articles/sample-article');
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('renders a floating back link to /articles', () => {
    const { container } = renderAt('/articles/sample-article');
    const link = container.querySelector('a[href="/articles"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('返回文章列表');
  });

  it('positions the back link as fixed top-left', () => {
    const { container } = renderAt('/articles/sample-article');
    const link = container.querySelector('a[href="/articles"]');
    expect(link.className).toMatch(/fixed/);
    expect(link.className).toMatch(/top-4/);
    expect(link.className).toMatch(/left-4/);
  });

  it('navigates to /articles when slug is not found', () => {
    const { container } = renderAt('/articles/non-existent-slug');
    // <Navigate> renders nothing; the list route is mounted instead
    const list = container.querySelector('[data-testid="list"]');
    expect(list).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/article-detail.test.jsx`
Expected: FAIL — current `ArticleDetail` renders `<Markdown>` (no iframe), shows title/date/tags instead of a back link, and renders "文章不存在" JSX (not `<Navigate>`). The "valid slug" test will fail because no iframe exists; the "sandbox" assertion will fail; the "back link" tests will fail; the "not found" test will fail because the JSX is rendered in place rather than navigating.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/article-detail.test.jsx
git commit -m "test(article-detail): add failing tests for iframe + back link + navigate"
```

---

## Task 4: Rewrite ArticleDetail to use Html component

**Files:**
- Modify: `src/pages/ArticleDetail.jsx`

- [ ] **Step 1: Replace the contents of `src/pages/ArticleDetail.jsx`**

The current file (45 lines) starts with:

```js
// 文章详情：从 URL 取 slug，查文章，渲染 markdown
import { useParams, Link } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Markdown from '../lib/markdown.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
```

Replace the entire file with:

```jsx
// 文章详情：URL :slug → 查文章，渲染悬浮「返回文章列表」按钮 + 100vh iframe。
// Navbar 在 App.jsx 的路由级逻辑下隐藏，详情页 viewport 完全让给 iframe。
// 找不到 slug 时 <Navigate replace /> 跳回 /articles。
import { useParams, Link, Navigate } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);
  usePageTitle(article?.title || '未找到文章');

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <>
      <Link
        to="/articles"
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm
                   bg-brand-dark/70 text-brand-light
                   border border-brand-mid/30
                   backdrop-blur-sm
                   hover:bg-brand-dark/90 hover:border-brand-orange/60
                   transition-colors"
      >
        ← 返回文章列表
      </Link>
      <Html html={article.content} title={article.title} />
    </>
  );
}
```

- [ ] **Step 2: Run the new test file to verify it passes**

Run: `npm test -- tests/article-detail.test.jsx`
Expected: PASS — all 5 test cases pass. The `sandbox` attribute is `allow-scripts allow-popups allow-forms` (matches `Html` component line 47).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: All test files pass except anything that imports `src/lib/markdown.jsx` (none should, after the rewrite). The article-detail test suite should be green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ArticleDetail.jsx
git commit -m "feat(articles): render detail page with Html component + iframe + back link"
```

---

## Task 5: Update App.jsx to hide Navbar on article detail route

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Verify the current regex behavior**

Read `src/App.jsx` and confirm the existing code at line 19 is:

```js
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
```

- [ ] **Step 2: Replace the regex logic**

In `src/App.jsx`, replace the line:

```js
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
```

with:

```js
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
  const isArticleDetail = /^\/articles\/(?!category\/)[^/]+/.test(location.pathname);
  const isFullBleedDetail = isProjectDetail || isArticleDetail;
```

- [ ] **Step 3: Update all references to the old name**

In `src/App.jsx`, replace the two remaining uses of `isProjectDetail`:

- On line 23 (`{!isProjectDetail && <Navbar />}`): change to `{!isFullBleedDetail && <Navbar />}`
- On line 24 (`<main className={isProjectDetail ? '' : 'max-w-5xl mx-auto px-6 py-8'}>`): change to `<main className={isFullBleedDetail ? '' : 'max-w-5xl mx-auto px-6 py-8'}>`

After this step, the regex check and the JSX usage should all be using the new variable name.

- [ ] **Step 4: Run the full test suite to ensure no regressions**

Run: `npm test`
Expected: All tests pass. `project-detail.test.jsx` should still pass (uses MemoryRouter, doesn't depend on App.jsx's Navbar logic).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): hide Navbar on /articles/:slug too (mirrors /projects/:slug)"
```

---

## Task 6: Delete the markdown.jsx component

**Files:**
- Delete: `src/lib/markdown.jsx`

- [ ] **Step 1: Verify no remaining imports of `markdown.jsx`**

Run: `grep -rn "lib/markdown" src/ tests/`
Expected: No output.

- [ ] **Step 2: Delete the file**

Run: `rm src/lib/markdown.jsx`

- [ ] **Step 3: Run the test suite**

Run: `npm test`
Expected: PASS — the file was unused after Task 4.

- [ ] **Step 4: Commit**

```bash
git add -u src/lib/markdown.jsx
git commit -m "chore(articles): remove unused Markdown component"
```

---

## Task 7: Remove hljs-* styles from index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Verify hljs-* styles are only in `src/index.css`**

Run: `grep -rn "hljs-" src/`
Expected: Only matches in `src/index.css` (lines 31-35). If any other file references `hljs-`, stop and investigate.

- [ ] **Step 2: Delete the hljs-* block from `src/index.css`**

In `src/index.css`, delete the entire block from line 30 to line 35 (the comment line plus 5 `.hljs-*` rules):

```css
/* 代码块高亮（highlight.js 主题定制：深色 + 品牌色） */
.hljs { background: #1c1b1a; color: #faf9f5; padding: 1rem; border-radius: 0.75rem; }
.hljs-comment, .hljs-quote { color: #b0aea5; }
.hljs-keyword, .hljs-selector-tag { color: #d97757; }
.hljs-string, .hljs-attr { color: #788c5d; }
.hljs-number, .hljs-literal { color: #6a9bcc; }
.hljs-title, .hljs-section { color: #faf9f5; font-weight: 600; }
```

After deletion, the file should end with the empty line(s) that previously followed this block. The `@tailwind` directives and the `fadeIn` keyframes stay.

- [ ] **Step 3: Run the test suite**

Run: `npm test`
Expected: PASS — no test references these classes.

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "style(css): remove hljs-* styles (markdown rendering retired)"
```

---

## Task 8: Remove markdown-related dependencies from package.json

**Files:**
- Modify: `package.json`
- Auto-modified: `package-lock.json`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -rn "react-markdown\|remark-gfm\|rehype-highlight\|@tailwindcss/typography" src/ tests/ vite.config.js tailwind.config.js`
Expected: No output.

- [ ] **Step 2: Remove the 4 entries from `package.json`**

In `package.json`, delete these 4 lines:

- Line 17: `"react-markdown": "^9.1.0",`
- Line 19: `"rehype-highlight": "^7.0.2",`
- Line 20: `"remark-gfm": "^4.0.1",`
- Line 23: `"@tailwindcss/typography": "^0.5.19",`

Be careful with trailing commas — `package.json` is JSON, so the remaining entries in the same array must keep valid comma structure.

- [ ] **Step 3: Run `npm install` to update `package-lock.json` and `node_modules`**

Run: `npm install`
Expected: Completes successfully. May emit warnings about removed packages. Should not error.

- [ ] **Step 4: Verify build still works**

Run: `npm run build`
Expected: Build succeeds. (Note: this exercises the full Vite production build path; any import from the removed packages would error out here.)

- [ ] **Step 5: Run the test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): remove react-markdown, remark-gfm, rehype-highlight, @tailwindcss/typography"
```

---

## Task 9: Remove the typography plugin reference from tailwind.config.js

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Check whether `prose` classes are still referenced**

Run: `grep -rn "prose" src/`
Expected: No output (we removed all markdown rendering in Task 4, and prose classes were only used by the Markdown component).

- [ ] **Step 2: Remove the typography import and plugin registration**

In `tailwind.config.js`, delete the import line (line 3):

```js
import typography from '@tailwindcss/typography';
```

And delete the plugins entry (line 26):

```js
  plugins: [typography]
```

If `plugins: []` becomes empty after the change, keep it as an empty array (Tailwind expects either an array or to omit the key). Omitting is cleaner:

Final file content should be:

```js
// Tailwind 配置：注入 Anthropic 品牌色（dark/light/mid/gray + orange/blue/green 点缀）
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}', './projects/**/*.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#141413',
          // surface：比 dark 略亮的近黑色表面色，用于卡片/引用/代码块底色
          surface: '#1c1b1a',
          light:  '#faf9f5',
          mid:    '#b0aea5',
          gray:   '#e8e6dc',
          orange: '#d97757',
          blue:   '#6a9bcc',
          green:  '#788c5d'
        }
      }
    }
  }
};
```

- [ ] **Step 3: Run the build to verify Tailwind still compiles**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js
git commit -m "chore(tailwind): remove @tailwindcss/typography plugin (no prose classes used)"
```

---

## Task 10: Delete the old markdown article file

**Files:**
- Delete: `articles/notes/你好，世界.md`

- [ ] **Step 1: Delete the file**

Run: `rm 'articles/notes/你好，世界.md'`

- [ ] **Step 2: Verify the file is gone**

Run: `ls articles/notes/`
Expected: Empty output (the directory may or may not exist as empty; if it does, that's fine — git doesn't track empty directories).

- [ ] **Step 3: Run tests to confirm nothing depended on the file**

Run: `npm test`
Expected: PASS. The data file no longer imports the .md file (we emptied `src/data/articles.js` in Task 2).

- [ ] **Step 4: Commit**

```bash
git add -u articles/notes/你好，世界.md
git commit -m "chore(articles): remove the retired hello-world markdown source"
```

---

## Task 11: Update CLAUDE.md rules 10 and 11

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read the current rules 10 and 11**

Read `CLAUDE.md` lines around rules 10, 11, 13. Confirm the existing text. Rules 10 and 11 are the .md/.html article-vs-project rules; rule 13 is the article categories rule (leave that alone).

- [ ] **Step 2: Rewrite rule 10**

Find the text of rule 10 (article source location and metadata schema) and replace it with a unified rule covering both articles and projects. The new rule should say:

> 文章与项目的源文件都使用 HTML（不再使用 markdown）。新增文章/项目时:
>
> - (a) 把 `.html` 文件放入 `articles/<category>/<slug>.html`（文章）或 `projects/<slug>.html`（项目）。文章可以是一个完整 HTML 文档（含 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装），也可以是一个 HTML 片段（单个根元素）。`src/lib/html.jsx` 会自动把片段包成最小文档。
> - (b) 在 `src/data/articles.js` 或 `src/data/projects.js` 中加 `import ... from '../../articles/<category>/xxx.html?raw'`（路径必须带子目录）或 `from '../../projects/xxx.html?raw'`
> - (c) 在 `articles` 或 `projects` 数组中加一条 metadata 记录:
>   - 文章:slug / title / excerpt / date / tags / cover / **content** / **category**（必填, 取自规则 13）
>   - 项目:slug / name / description / techStack / githubUrl / demoUrl / cover / **content**
> - (d) **详情页(`/articles/:slug` 和 `/projects/:slug`)统一为 100vh 全屏 iframe**(`<iframe className="w-full h-screen border-0" srcDoc={...} sandbox="allow-scripts allow-popups allow-forms" />`),HTML 文档按作者原样渲染;这两个路由下全局 `<Navbar />` 隐藏,顶部仅保留一个固定定位的「← 返回」悬浮按钮。
> - (e) **列表页卡片(文章卡 / 项目卡)不嵌入 iframe**,仍用主站 `brand-*` 类保持导航层风格统一。
> - (f) iframe 视口**不继承**主站 Tailwind 编译产物,作者在自己写的 HTML 内部需用内联 `<style>` 或 `<link rel="stylesheet">` 补全样式;`Html` 组件**不做事后消毒**,作者对自己写的内容负责。

- [ ] **Step 3: Delete or merge the old rule 11**

The current rule 11 is project-specific (it duplicates the iframe / Navbar / brand-* guidance that the new rule 10 already covers). Delete it. If the new rule 10 doesn't cover all of rule 11's nuance, fold the missing pieces in. Reference rule 10 for projects-related guidance.

- [ ] **Step 4: Verify CLAUDE.md still parses sensibly**

Re-read the modified CLAUDE.md to confirm:
- Rules 1-9 unchanged
- Rule 10 covers articles + projects (HTML, iframe, Navbar, sandbox, brand-* cards)
- Rule 11 either removed or condensed (and the rule number is reused, not skipped)
- Rule 12 (content folder rules) unchanged
- Rule 13 (article categories) unchanged
- No dangling references to `.md` for articles/projects

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): unify article and project rules under HTML rendering"
```

---

## Task 12: Update the create-article skill

**Files:**
- Modify: the `create-article` skill (find the file via `find .claude -name "SKILL.md" -path "*create-article*"` first if not sure of the path)

- [ ] **Step 1: Locate the skill file**

Run: `find .claude -type f -name "SKILL.md" 2>/dev/null | xargs grep -l "create-article\|article.*md\|article.*markdown" 2>/dev/null`
Expected: One path like `.claude/skills/create-article/SKILL.md` or `.claude/plugins/.../create-article/SKILL.md`.

- [ ] **Step 2: Read the current skill**

Read the entire SKILL.md. Note the key sections: trigger phrases, draft path, publish steps, format check.

- [ ] **Step 3: Update the trigger phrases and description**

Find the `description:` field in the YAML frontmatter and any mention of "md"/"markdown" in the description. Replace with HTML references. For example:

Old: `... triggers on phrases like "发布文章 xxx.md" ...`
New: `... triggers on phrases like "发布文章 xxx.html" or "把 xxx 文章上线" ...`

- [ ] **Step 4: Update the workflow steps**

In the SKILL.md body, find steps that:
- Reference `articles-draft/<category>/*.md` → change to `articles-draft/<category>/*.html`
- Mention "markdown 源文件" / "md 文件" → change to "HTML 源文件" / "html 文件"
- Mention the `Markdown` component or `react-markdown` → change to `Html` component and `srcDoc`
- Have a "format check" step (e.g., check for valid markdown frontmatter) → change to checking that the file is parseable HTML and that the file extension is `.html`

- [ ] **Step 5: Add the iframe-rendering note**

In the SKILL.md, add a note (probably in the "How to write a new article" or similar section):

> 文章 HTML 内部若用了 `text-brand-light` 等 Tailwind 类,在 iframe 视口里不会生效(iframe 不继承主站 Tailwind 编译产物)。作者需在文章 HTML 内部自己补全样式,例如内联 `<style>` 或 `<link rel="stylesheet">`。可以参考 `projects/articles.html` 的写法。

- [ ] **Step 6: Commit**

```bash
git add <path-to-skill>
git commit -m "skill(create-article): switch from .md to .html workflow"
```

---

## Task 13: Final verification

**Files:** None (read-only checks)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Build succeeds. Output in `dist/`.

- [ ] **Step 3: Verify no orphan references**

Run: `grep -rn "markdown\|hljs-\|prose\|react-markdown\|remark-gfm\|rehype-highlight\|@tailwindcss/typography" src/ tests/ 2>/dev/null`
Expected: No output.

- [ ] **Step 4: Manual dev server smoke test**

Run: `npm run dev` in a background terminal. Then in another terminal:

- Visit `http://localhost:5173/#/articles` — expect the empty state (no articles).
- Visit `http://localhost:5173/#/articles/non-existent-slug` — expect an immediate redirect to `/#/articles` (URL changes; Navbar stays visible throughout).
- Visit `http://localhost:5173/#/articles/category/ai` — expect the category filter UI; Navbar visible; no iframe.
- Visit `http://localhost:5173/#/projects/claude-task-monitor` — expect the project detail page (Navbar hidden, iframe fullscreen, back link). Confirms we didn't break the project detail.

- [ ] **Step 5: Final commit if any cleanup was needed**

If any of the above revealed an issue, fix it and commit. Otherwise, no commit needed at this step.

---

## Self-Review Notes

After writing this plan, I checked:

**Spec coverage:**
- ✅ Visual: 100vh iframe + back link + hidden Navbar → Task 4 (ArticleDetail rewrite) + Task 5 (App.jsx regex)
- ✅ File format: `.html` → Task 1-2 (data file emptied, references will become .html on next create-article), Task 12 (skill)
- ✅ Old article deletion → Task 10
- ✅ `Markdown` component + dependencies removed → Tasks 6, 7, 8, 9
- ✅ `create-article` skill updated → Task 12
- ✅ CLAUDE.md rules updated → Task 11
- ✅ Tests updated/added → Tasks 1, 3
- ✅ Navbar regex excludes `/articles/category/` → Task 5 uses `(?!category\/)` lookahead

**Placeholder scan:** No "TBD" / "TODO" / "implement later" / "add appropriate error handling" placeholders. All test code is concrete. All commands have expected output.

**Type/symbol consistency:** The component name `ArticleDetail`, function `findArticleBySlug`, component `Html`, hook `usePageTitle`, variable `isFullBleedDetail` (and the helpers `isProjectDetail` / `isArticleDetail`) are used consistently across Tasks 4 and 5. The `sandbox` attribute string `"allow-scripts allow-popups allow-forms"` matches the existing `Html` component.

**Things I noticed during writing that the spec didn't cover:**
- Task 9 (remove typography plugin from `tailwind.config.js`) — I added this in the plan even though the spec's file-change table only mentioned `package.json`. Removing the dependency from `package.json` without removing the `import` and `plugins: [typography]` from `tailwind.config.js` would break the build. The spec section "风险" mentions "若其他地方用到则保留 — 删之前先 grep 确认" but doesn't explicitly call out the config file. Adding Task 9 to be safe.
- The spec says `create-article` skill will be updated to "在提示里写明「可写完整 HTML 文档或 HTML 片段，`Html` 组件会自动包成最小文档」". Task 12 Step 5 covers this and the iframe-Tailwind note.
- The spec's "文件改动清单" listed `tests/content.test.js` and `tests/projects.test.js` as "不动" — Task 1 doesn't touch them, so this is consistent.
