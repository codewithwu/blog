# Projects Page — Markdown Content per Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `/projects` page so each project can carry long-form markdown content (mirroring the article system), with a new detail route `/projects/:slug` and a `ProjectDetail` page. A minimal `projects/_sample.md` fixture ships with this change to make the detail page testable in CI and visible in the dev server from the first run.

**Architecture:** Mirror the article system end-to-end. A new `projects/` folder at the project root holds per-project `.md` files. `src/data/projects.js` imports them via Vite's `?raw` suffix and exports a metadata+content array. A new `src/lib/projects.js` exposes `listProjects()` and `findProjectBySlug(slug)` (same shape as `src/lib/articles.js`). A new `src/pages/ProjectDetail.jsx` renders a `ProjectHeader` (name / description / tech stack / links) above a `<Markdown>` body, with a `<Navigate replace />` fallback to `/projects` when the slug is not found. `ProjectCard` is wrapped in a `<Link>` so the list cards become clickable.

**Tech Stack:** React 18, react-router-dom (HashRouter, `Link` / `useParams` / `Navigate`), Vite `?raw` import, react-markdown (via existing `src/lib/markdown.jsx`), lucide-react, Tailwind brand colors, Vitest.

> **Reminder:** `CLAUDE.md` item 5 requires the `brand-guidelines` skill for any UI/visual work. Invoke it before authoring the `ProjectHeader` and `ProjectDetail` components (Tasks 3 and 4) so the visual rhythm (card padding, divider line, color usage) matches the rest of the site.

---

## File Structure

Files touched by this plan:

- `projects/` (new folder at project root)
  - `projects/_sample.md` (new — minimal demo project: heading + paragraph + code block + blockquote)
- `src/data/projects.js` (rewritten — empty `id`-style entries replaced with a `slug`-keyed array; imports `_sample.md?raw`)
- `src/lib/projects.js` (new — `listProjects()` and `findProjectBySlug(slug)`, mirrors `src/lib/articles.js`)
- `src/components/ProjectCard.jsx` (modified — wraps inner card in a `<Link to={`/projects/${slug}`}>` when `content` is present; falls back to static card otherwise)
- `src/components/ProjectHeader.jsx` (new — detail-page header: name / description / tech-stack badges / GitHub & Demo links)
- `src/pages/ProjectDetail.jsx` (new — `:slug` route page; renders `ProjectHeader` + `<Markdown>` body; `<Navigate replace />` fallback)
- `src/App.jsx` (modified — adds `<Route path="/projects/:slug" element={<ProjectDetail />} />`)
- `tests/projects.test.js` (new — mirrors `tests/articles.test.js` in scope)
- `CLAUDE.md` (modified — appends item 11, the project-authoring workflow constraint)
- `code_map.md` (modified — §4 data layer table, §5 route table, §6 task lookup)

No new dependencies. No file splits. No new folders under `src/`.

---

## Task 1: Add the sample fixture and rewrite `src/data/projects.js`

**Files:**
- Create: `projects/_sample.md`
- Modify: `src/data/projects.js` (full rewrite — see Step 3)

- [ ] **Step 1: Create the `projects/` folder and the sample fixture**

Run:
```bash
mkdir -p projects
```

Then create `projects/_sample.md` with this exact content (UTF-8, LF newlines, no trailing blank line beyond the final newline):

```markdown
# 示例项目

这是一个**示例项目**，用来演示项目页与详情页的工作流。

- 项目数据存放在 `src/data/projects.js`
- Markdown 源文件存放在 `projects/` 目录
- 详情页路由：`/projects/:slug`

## 代码块示例

```js
import Markdown from '../lib/markdown.jsx';

<Markdown>{project.content}</Markdown>
```

> 这个示例项目可以随时删除，只要同时移除 `data/projects.js` 里对应的条目即可。
```

Save the file.

- [ ] **Step 2: Verify the fixture file**

Run:
```bash
ls -la projects/_sample.md && head -3 projects/_sample.md
```

Expected: the `ls` output shows the file with a non-zero size; `head -3` prints the first 3 lines (`# 示例项目` / blank / `这是一个**示例项目**...`).

- [ ] **Step 3: Rewrite `src/data/projects.js`**

Replace the entire contents of `src/data/projects.js` with the following:

```js
// 项目数据：metadata + ?raw 导入的 markdown 内容
// 字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content
import sample from '../../projects/_sample.md?raw';

const projects = [
  {
    slug: '_sample',
    name: '示例项目',
    description: '这是一个示例项目，用来演示项目页 + 详情页的工作流。',
    techStack: ['Markdown'],
    githubUrl: 'https://github.com/cooper/sample-project',
    demoUrl: null,
    cover: null,
    content: sample
  }
];

export default projects;
```

> Note on the `id` → `slug` rename: the previous file used `id: 'p1'` etc. The new file uses `slug: '_sample'` (and future entries will use `slug: 'todo-app'`, etc.). The field name aligns with `src/data/articles.js`.

- [ ] **Step 4: Confirm Vite can resolve the `?raw` import**

Run:
```bash
npm run build
```

Expected: build completes with no errors. A quick sanity check that the markdown is bundled:

```bash
grep -l "示例项目" dist/assets/*.js | head -1
```

Expected: at least one file in `dist/assets/*.js` matches, confirming the sample markdown was bundled via `?raw`.

- [ ] **Step 5: Commit**

```bash
git add projects/_sample.md src/data/projects.js
git commit -m "Add projects/_sample.md fixture and rewrite data/projects.js with slug + content"
```

---

## Task 2: Add the helper library with TDD (failing test → implementation → pass)

**Files:**
- Create: `tests/projects.test.js`
- Create: `src/lib/projects.js`

- [ ] **Step 1: Write the failing test**

Create `tests/projects.test.js` with this exact content:

```js
// projects util 单元测试：listProjects / findProjectBySlug
import { describe, it, expect } from 'vitest';
import { findProjectBySlug, listProjects } from '../src/lib/projects.js';

describe('projects util', () => {
  it('listProjects returns a non-empty array', () => {
    const list = listProjects();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('findProjectBySlug returns the project when slug matches', () => {
    const project = findProjectBySlug('_sample');
    expect(project).toBeDefined();
    expect(project.slug).toBe('_sample');
    expect(project.content).toContain('# 示例项目');
  });

  it('findProjectBySlug returns undefined when not found', () => {
    expect(findProjectBySlug('not-a-real-slug')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails (the helper doesn't exist yet)**

Run:
```bash
npm test -- tests/projects.test.js
```

Expected: FAIL with an import error (the module `../src/lib/projects.js` cannot be found, or `findProjectBySlug` is not exported from it). The `vitest` output will name the missing export.

- [ ] **Step 3: Implement the helper**

Create `src/lib/projects.js` with this exact content:

```js
// 项目查找工具：从 data 层封装列表与单条查询
// 不排序：项目无 date 字段，按数组声明顺序展示
import projects from '../data/projects.js';

export function listProjects() {
  return [...projects];
}

export function findProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run:
```bash
npm test -- tests/projects.test.js
```

Expected: all 3 tests PASS. The test runner shows a green checkmark next to each `it(...)` block.

- [ ] **Step 5: Run the full test suite to confirm no regression on the article tests**

Run:
```bash
npm test
```

Expected: 6 tests pass total — 3 from `tests/articles.test.js` + 3 from `tests/projects.test.js`. No failures, no warnings about deprecated APIs.

- [ ] **Step 6: Commit**

```bash
git add tests/projects.test.js src/lib/projects.js
git commit -m "Add src/lib/projects.js helper and unit tests"
```

---

## Task 3: Add the new route and the `ProjectDetail` page

**Files:**
- Create: `src/components/ProjectHeader.jsx`
- Create: `src/pages/ProjectDetail.jsx`
- Modify: `src/App.jsx` (add one `<Route>` line)

- [ ] **Step 1: Invoke the brand-guidelines skill before writing UI code**

Run the `brand-guidelines` skill (CLAUDE.md item 5 mandates it for any UI work). Re-read its current guidance to make sure the components below follow the site's existing color/typography/spacing conventions.

- [ ] **Step 2: Create `ProjectHeader`**

Create `src/components/ProjectHeader.jsx` with this exact content:

```jsx
// 项目详情头部：标题、描述、技术栈徽章、GitHub/Demo 链接
// 与 ProjectCard 共享徽章/链接样式，但字号更大以适配详情页
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectHeader({ project }) {
  return (
    <header className="mt-6">
      <h1 className="text-4xl font-bold text-brand-light">{project.name}</h1>
      <p className="mt-3 text-base text-brand-mid">{project.description}</p>
      {project.techStack && project.techStack.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.techStack.map((t) => (
            <li key={t} className="px-2 py-0.5 text-xs rounded bg-brand-green/15 text-brand-green">
              {t}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-4 text-sm">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <Github size={16} /> GitHub
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `ProjectDetail`**

Create `src/pages/ProjectDetail.jsx` with this exact content:

```jsx
// 项目详情：URL :slug → 查项目，渲染 ProjectHeader + markdown 正文
// 找不到 slug 时 <Navigate replace /> 跳回 /projects
import { useParams, Link, Navigate } from 'react-router-dom';
import { findProjectBySlug } from '../lib/projects.js';
import Markdown from '../lib/markdown.jsx';
import ProjectHeader from '../components/ProjectHeader.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = findProjectBySlug(slug);
  usePageTitle(project?.name || '未找到项目');

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/projects" className="text-sm text-brand-blue hover:text-brand-orange">
        ← 返回项目列表
      </Link>
      <ProjectHeader project={project} />
      <div className="mt-8">
        <Markdown>{project.content}</Markdown>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Add the new route to `App.jsx`**

Read `src/App.jsx` (it should still be 35 lines as in the spec). Edit it to add the import and the new route. The diff:

```jsx
// Add this import after the Projects import (around line 5):
import ProjectDetail from './pages/ProjectDetail.jsx';
```

```jsx
// Add this <Route> right after the existing /projects <Route> (around line 24):
<Route path="/projects/:slug" element={<ProjectDetail />} />
```

The final `App.jsx` should look like this (note: only the new line is added — everything else is unchanged):

```jsx
// 全局布局：Navbar + PageTransition(Outlet) + Footer
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <PageTransition>
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
        </PageTransition>
      </main>
      <Footer />
    </HashRouter>
  );
}
```

- [ ] **Step 5: Build to confirm everything compiles**

Run:
```bash
npm run build
```

Expected: build completes with no errors. The new `ProjectDetail` chunk will appear in the bundle output (e.g. `assets/ProjectDetail-*.js`).

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectHeader.jsx src/pages/ProjectDetail.jsx src/App.jsx
git commit -m "Add ProjectDetail page, ProjectHeader, and /projects/:slug route"
```

---

## Task 4: Make `ProjectCard` clickable

**Files:**
- Modify: `src/components/ProjectCard.jsx`

- [ ] **Step 1: Read the current `ProjectCard.jsx` to confirm its structure**

Run:
```bash
cat src/components/ProjectCard.jsx
```

Expected: 37 lines — a single function component that returns one `<div>` with the cover, name, description, tech stack, and links. No `Link` import yet.

- [ ] **Step 2: Rewrite `ProjectCard.jsx` to wrap the card in a `<Link>`

Replace the entire contents of `src/components/ProjectCard.jsx` with the following (this is a refactor that keeps the existing visual design intact and adds the click-to-detail behavior):

```jsx
// 项目卡片：名称、描述、技术栈、GitHub/Demo 链接
// 整张卡可点击：包一层 <Link> 跳到 /projects/<slug>
// 没有 content 字段的项目退化为静态卡（不会跳转 404）
import { Link } from 'react-router-dom';
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project }) {
  const inner = (
    <div className="p-6 rounded-xl bg-brand-surface border border-brand-mid/20
                    hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                    transition-all duration-300 flex flex-col">
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-orange/30 via-brand-blue/20 to-brand-green/30
                      flex items-center justify-center text-3xl font-bold text-brand-light/70">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-brand-light">{project.name}</h3>
      <p className="mt-2 text-sm text-brand-mid flex-1">{project.description}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {project.techStack.map((t) => (
          <li key={t} className="px-2 py-0.5 text-xs rounded bg-brand-green/15 text-brand-green">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-3 text-sm">
        <a href={project.githubUrl} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
          <Github size={16} /> GitHub
        </a>
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>
    </div>
  );

  if (!project.content) {
    return inner;
  }

  return <Link to={`/projects/${project.slug}`} className="block">{inner}</Link>;
}
```

> Behavioral notes:
> - The `<Link>` wraps the entire existing `<div>` so the whole card is the click target. The hover lift (`hover:-translate-y-1`) still works because it lives on the inner `<div>`.
> - `!project.content` fallback: in this codebase every project has `?raw`-imported content, so the guard is defensive — if the invariant is ever broken the card still renders (just without a link) instead of throwing.

- [ ] **Step 3: Build to confirm no syntax errors**

Run:
```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 4: Manual smoke test in the dev server**

Run:
```bash
npm run dev
```

In a browser:
1. Visit `http://localhost:5173/blog/#/projects` — confirm exactly one project card is shown (示例项目).
2. Hover the card — confirm the lift animation + orange border highlight still works.
3. Click the card — confirm the URL becomes `http://localhost:5173/blog/#/projects/_sample` and the detail page renders the sample markdown (heading "示例项目", the "代码块示例" code block with JS syntax highlighting, and the closing blockquote).
4. Click the "← 返回项目列表" link at the top of the detail page — confirm it returns to the list.
5. Visit `http://localhost:5173/blog/#/projects/does-not-exist` directly — confirm the URL immediately changes to `/#/projects` (the `<Navigate replace />` fallback).

Press `Ctrl+C` in the terminal to stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectCard.jsx
git commit -m "Wrap ProjectCard in <Link> so list cards navigate to /projects/:slug"
```

---

## Task 5: Update `CLAUDE.md` with the project-authoring workflow constraint

**Files:**
- Modify: `CLAUDE.md` (append item 11)

- [ ] **Step 1: Read the current `CLAUDE.md` to confirm exact format**

Run:
```bash
cat CLAUDE.md
```

Expected: 10 numbered items, each on its own line, prefixed with `N. ` and starting with Chinese text. The 10th item is the article-authoring workflow.

- [ ] **Step 2: Append item 11**

Append this single line at the end of `CLAUDE.md` (after item 10, with a trailing newline):

```
11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .md 文件放入 `projects/`;(b) 在 `src/data/projects.js` 中加一行 `import ... from '../../projects/xxx.md?raw'`;(c) 在 `projects` 数组中加一条 metadata 记录(字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content)
```

- [ ] **Step 3: Verify the file**

Run:
```bash
tail -3 CLAUDE.md
```

Expected: the last 3 lines are item 10 (article workflow), item 11 (project workflow, just appended), and an empty line. The line numbering is consecutive: 10, then 11.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "Document project-authoring workflow in CLAUDE.md"
```

---

## Task 6: Update `code_map.md` (data layer, route table, task lookup)

**Files:**
- Modify: `code_map.md` (three localized edits)

- [ ] **Step 1: Update §4 — data layer table for `projects.js`**

Find this row in the `§4` table:

```
| `src/data/projects.js` | `[{ id, name, description, techStack, githubUrl, demoUrl, cover }]` | 直接在数组里加一项 |
```

Replace it with:

```
| `src/data/projects.js` | `[{ slug, name, description, techStack, githubUrl, demoUrl, cover, content }]` | 1) 把 `.md` 放进项目根目录的 `projects/`；2) 在数组顶部 `import xxx from '../../projects/xxx.md?raw'` 并 push 一项；3) 把 `content: xxx` 填进去 |
```

- [ ] **Step 2: Update §5 — add the new route row**

Find this block in the §5 route table:

```
| `/projects` | `Projects` | `src/pages/Projects.jsx` |
| `/skills` | `Skills` | `src/pages/Skills.jsx` |
```

Replace with:

```
| `/projects` | `Projects` | `src/pages/Projects.jsx` |
| `/projects/:slug` | `ProjectDetail` | `src/pages/ProjectDetail.jsx` |
| `/skills` | `Skills` | `src/pages/Skills.jsx` |
```

- [ ] **Step 3: Update §6 — replace the "加一个项目" task row**

Find this row in the §6 task-lookup table:

```
| **加一个项目** | 在 `src/data/projects.js` 数组里加一项（`id` 不要重复） |
```

Replace it with:

```
| **加一个项目** | 1) 把 `.md` 放进 `projects/<slug>.md`（项目根目录）<br>2) 在 `src/data/projects.js` 顶部 `import xxx from '../../projects/<slug>.md?raw'` 并 push 一项<br>3) 删除自带的 `projects/_sample.md` 示例（可选） |
```

- [ ] **Step 4: Verify the edits**

Run:
```bash
grep -n "projects" code_map.md | head -20
```

Expected: the grep output shows the new strings are present in §4, §5, and §6 (e.g. `'../../projects/xxx.md?raw'`, `/projects/:slug`, and `projects/<slug>.md`).

- [ ] **Step 5: Commit**

```bash
git add code_map.md
git commit -m "Update code_map.md for projects markdown content (data shape, route, workflow)"
```

---

## Task 7: Final end-to-end verification

**Files:** none (read-only checks)

- [ ] **Step 1: Confirm the final on-disk layout**

Run:
```bash
ls projects/ && echo "---" && ls src/lib/ src/components/ src/pages/ | sort
```

Expected:
- `projects/` shows `_sample.md`
- `src/lib/` includes `articles.js` and `projects.js`
- `src/components/` includes `ProjectHeader.jsx` and `ProjectCard.jsx`
- `src/pages/` includes `ProjectDetail.jsx` and `Projects.jsx`

- [ ] **Step 2: Run the full test suite**

Run:
```bash
npm test
```

Expected: 6 tests pass total — 3 from `tests/articles.test.js` + 3 from `tests/projects.test.js`. No failures, no warnings.

- [ ] **Step 3: Run a production build**

Run:
```bash
npm run build
```

Expected: build completes with no errors. `dist/` is refreshed. The output should reference `ProjectDetail` and the bundled sample markdown in the chunk names.

- [ ] **Step 4: Confirm both article and project content is present in the built bundle**

Run:
```bash
grep -l "你好，世界" dist/assets/*.js | head -1
echo "---"
grep -l "示例项目" dist/assets/*.js | head -1
```

Expected: both greps return at least one match. The first confirms articles still bundle correctly (regression check); the second confirms the new sample markdown is bundled.

- [ ] **Step 5: Review the commit log**

Run:
```bash
git log --oneline -10
```

Expected: 6 new commits from this plan appear at the top, in order:
1. `Add projects/_sample.md fixture and rewrite data/projects.js with slug + content`
2. `Add src/lib/projects.js helper and unit tests`
3. `Add ProjectDetail page, ProjectHeader, and /projects/:slug route`
4. `Wrap ProjectCard in <Link> so list cards navigate to /projects/:slug`
5. `Document project-authoring workflow in CLAUDE.md`
6. `Update code_map.md for projects markdown content (data shape, route, workflow)`

- [ ] **Step 6: Final manual smoke test (recommended)**

Run:
```bash
npm run dev
```

In a browser, walk through:
- `http://localhost:5173/blog/#/projects` — list shows one card.
- Click the card — detail page renders the sample markdown with code highlighting on the JS block.
- Use the in-page "← 返回项目列表" link — returns to the list.
- Visit `/#/projects/does-not-exist` — URL changes back to `/#/projects`.
- Visit `/#/articles/hello-world` — article detail still works (regression check, no UI changes there).

Press `Ctrl+C` in the terminal to stop the dev server.

---

## Self-Review

**Spec coverage:**
- ✅ "Background / Goals" → covered by preamble
- ✅ "Non-Goals" (no frontmatter, no glob auto-discovery, no create-skill) → respected throughout — every step uses `?raw` + manual metadata entry
- ✅ "File-Level Changes / New" (`projects/`, `projects/_sample.md`, `src/lib/projects.js`, `src/pages/ProjectDetail.jsx`, `src/components/ProjectHeader.jsx`, `tests/projects.test.js`) → covered by Tasks 1, 2, 3
- ✅ "File-Level Changes / Modified" (`src/data/projects.js`, `src/components/ProjectCard.jsx`, `src/App.jsx`, `CLAUDE.md`, `code_map.md`) → covered by Tasks 1, 3, 4, 5, 6
- ✅ "Data Shape" (id → slug, content field, listProjects no sort) → covered by Task 1 Step 3 and Task 2 Step 3
- ✅ "Code Sketch — src/data/projects.js" → covered by Task 1 Step 3 (verbatim, with one sample entry)
- ✅ "Code Sketch — src/pages/ProjectDetail.jsx" → covered by Task 3 Step 3 (verbatim)
- ✅ "Code Sketch — src/components/ProjectCard.jsx" → covered by Task 4 Step 2 (verbatim)
- ✅ "Routing Change" → covered by Task 3 Step 4 (verbatim, one new `<Route>` line)
- ✅ "New Constraint in CLAUDE.md" → covered by Task 5 Step 2 (verbatim)
- ✅ "Tests" → covered by Task 2 (verbatim 3-test block)
- ✅ "Verification" (7 numbered items in spec) → covered by Task 7 Steps 1–6 (with bonus Step 6 manual smoke)
- ✅ "Risks" (empty content guard, URL change, no date sort) → mitigated by Task 4 Step 2 (defensive `!project.content` guard) and Task 2 Step 3 (no sort, declaration order)
- ✅ "Out of Scope" (create-project skill, frontmatter, delete-project skill) → explicitly not in this plan

**Placeholder scan:** No "TBD", "TODO", "implement later", or vague instructions. Every step has either exact commands, exact file content, or an exact code diff. The `brand-guidelines` mention in Task 3 Step 1 is a process reminder (per `CLAUDE.md` item 5), not a placeholder.

**Type / name consistency:**
- `findProjectBySlug(slug)` is used identically in `src/lib/projects.js` (Task 2 Step 3), `tests/projects.test.js` (Task 2 Step 1), and `src/pages/ProjectDetail.jsx` (Task 3 Step 3).
- `listProjects()` is used identically in `src/lib/projects.js` and `tests/projects.test.js`.
- The `slug` field name is consistent across `src/data/projects.js` (Task 1 Step 3), `src/lib/projects.js` (Task 2 Step 3), `src/components/ProjectCard.jsx` (Task 4 Step 2 — uses `project.slug`), `src/pages/ProjectDetail.jsx` (Task 3 Step 3 — passes `project` to `ProjectHeader`), and `src/components/ProjectHeader.jsx` (Task 3 Step 2).
- The `content` field name is consistent across `src/data/projects.js` (Task 1 Step 3), `src/lib/projects.js` test (Task 2 Step 1), `src/components/ProjectCard.jsx` (Task 4 Step 2 — `if (!project.content)` guard), and `src/pages/ProjectDetail.jsx` (Task 3 Step 3 — `<Markdown>{project.content}</Markdown>`).
- The route path `/projects/:slug` is consistent in `src/App.jsx` (Task 3 Step 4) and `src/components/ProjectCard.jsx` (Task 4 Step 2 — `` `/projects/${project.slug}` ``).
- The `?raw` import path `../../projects/<slug>.md?raw` is consistent in `src/data/projects.js` (Task 1 Step 3) and `CLAUDE.md` item 11 (Task 5 Step 2) and `code_map.md` §6 (Task 6 Step 3).
