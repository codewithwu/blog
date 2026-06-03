# Design: Projects Page — Markdown Content per Project

**Date:** 2026-06-03
**Status:** Approved (pending user review of written spec)
**Scope:** Extend the existing `/projects` page so each project can carry long-form markdown content (mirroring the article pattern), with a new detail route `/projects/:slug` and a `ProjectDetail` page.

## Background

The blog has a `/projects` page (routed from `App.jsx`, rendered by `src/pages/Projects.jsx`) and a data file `src/data/projects.js` containing three static placeholder projects. Today each project is rendered as a `ProjectCard` showing only a name, a one-line description, a tech-stack list, and a GitHub/Demo link — there is no way to attach long-form content (project write-ups, design notes, screenshots) per project.

The user wants to put per-project markdown files in a new `projects/` folder at the project root and have each `.md` render as the body of a project detail page, the same way `articles/*.md` render on `/articles/:slug`.

## Goals

- A new `projects/` folder at the project root holds per-project markdown source files.
- Each project's markdown body renders on a new detail page at `/projects/:slug`.
- The `/projects` list page keeps the existing card-grid layout; cards become clickable links to the detail page.
- Project data (slug, name, description, tech stack, links) lives in `src/data/projects.js`, imported via Vite `?raw` — mirroring `src/data/articles.js`.
- The detail page reuses `src/lib/markdown.jsx` so code highlighting, GFM, and typography stay consistent with articles.
- A `create-project` skill, frontmatter-driven auto-discovery, and any UI redesign are explicitly **not** in scope.

## Non-Goals

- No change to the article system.
- No introduction of YAML frontmatter or `import.meta.glob` auto-discovery (the project pattern mirrors the article pattern, which is manual import + manual metadata entry).
- No visual redesign of the `/projects` list or `ProjectCard` beyond making the card clickable.
- No `create-project` / `delete-project` skill in this round.
- No data migration: the three current placeholder projects are removed (they are not real projects — they point at `https://github.com/cooper/<name>` URLs that don't exist).

## File-Level Changes

### New

- `projects/` (folder at project root, empty at first — user will drop `.md` files in)
- `src/lib/projects.js` — exports `listProjects()` and `findProjectBySlug(slug)`, mirroring `src/lib/articles.js`
- `src/pages/ProjectDetail.jsx` — new detail page; renders project header + markdown body; redirects to `/projects` if slug not found (same fallback shape as `ArticleDetail`)
- `src/components/ProjectHeader.jsx` — small presentational component used by `ProjectDetail` to render the name, description, tech-stack badges, and GitHub/Demo links above the markdown
- `tests/projects.test.js` — unit tests mirroring `tests/articles.test.js`

### Modified

- `src/data/projects.js` — replaced entirely: empty array initially; the `?raw` import pattern matches `src/data/articles.js`; field shape changes from `id` to `slug` (see "Data Shape" below)
- `src/components/ProjectCard.jsx` — wrap the existing card `<div>` in a `<Link>` from `react-router-dom`; otherwise keep the visual design intact. `src/pages/Projects.jsx` itself does not need to change.
- `src/App.jsx` — add a new route `<Route path="/projects/:slug" element={<ProjectDetail />} />` directly under the existing `/projects` route
- `CLAUDE.md` — append an 11th constraint describing the project-authoring workflow (mirroring item 10 for articles)
- `code_map.md` — update §4 (data layer table), §5 (route table), §6 (task lookup) to include the new project-data fields, new route, and new authoring workflow

### Deleted

- None on disk; the three placeholder entries in `src/data/projects.js` are simply removed (the file itself is rewritten as part of "Modified")

## Data Shape

The shape of each entry in `src/data/projects.js` changes from the current `id`-keyed form to a `slug`-keyed form, so the field name aligns with articles:

```js
// before
{
  id: 'p1',
  name: 'Todo App',
  description: '...',
  techStack: ['React', 'Vite', 'Tailwind CSS'],
  githubUrl: '...',
  demoUrl: null,
  cover: null
}

// after
{
  slug: 'todo-app',                                  // 用于 URL: /projects/todo-app
  name: 'Todo App',                                  // 卡片与详情页标题
  description: '...',                                // 卡片与详情页描述
  techStack: ['React', 'Vite', 'Tailwind CSS'],
  githubUrl: '...',
  demoUrl: null,
  cover: null,
  content: todoAppMd                                 // '?raw' 导入的 markdown 字符串
}
```

`src/lib/projects.js` exposes two functions:

```js
export function listProjects() { return [...projects]; }           // 不排序：项目无日期字段
export function findProjectBySlug(slug) { return projects.find(p => p.slug === slug); }
```

`listProjects` deliberately does **not** sort by date — projects don't have a `date` field today and adding one is out of scope. If sort order matters, the user controls it by the order of entries in the array.

## Code Sketch — `src/data/projects.js`

```js
// 项目数据：metadata + ?raw 导入的 markdown 内容
// （初始为空，由后续新增项目时按 CLAUDE.md 第 11 条的流程填入）
const projects = [];
export default projects;
```

When the first project is added (not part of this design's implementation — only shown here for reference):

```js
import todoApp from '../../projects/todo-app.md?raw';

const projects = [
  {
    slug: 'todo-app',
    name: 'Todo App',
    description: '一个支持拖拽排序的待办事项应用。',
    techStack: ['React', 'Vite', 'Tailwind CSS'],
    githubUrl: 'https://github.com/cooper/todo-app',
    demoUrl: null,
    cover: null,
    content: todoApp
  }
];

export default projects;
```

## Code Sketch — `src/pages/ProjectDetail.jsx`

```jsx
// 项目详情：URL :slug → 查项目，渲染 ProjectHeader + markdown 正文
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

`ProjectHeader` renders the same name/description/tech-stack/links block that `ProjectCard` already has, with larger typography suitable for a detail page. This is a small refactor that prevents the same JSX from being duplicated in two places.

## Code Sketch — `src/components/ProjectCard.jsx`

```jsx
// 卡片可点击（包一层 <Link>）；空 content 时不渲染链接以避免跳转 404
import { Link } from 'react-router-dom';
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project }) {
  const inner = (
    <div className="...same existing styles...">
      {/* 占位封面 / name / description / techStack / github/demo links — 原样保留 */}
    </div>
  );

  if (!project.content) {
    return inner;     // 没有 markdown 内容的项目不渲染链接
  }

  return <Link to={`/projects/${project.slug}`} className="block">{inner}</Link>;
}
```

In practice every project **must** have a `content` field because the `?raw` import is at the top of `data/projects.js`; a missing `content` means the import itself is missing, which would fail the build. The defensive `!project.content` guard exists only to give a clearer runtime error if the invariant is ever broken.

## Routing Change

`src/App.jsx` gets one new line under the existing `/projects` route:

```jsx
<Route path="/projects/:slug" element={<ProjectDetail />} />
```

## New Constraint in CLAUDE.md

Append as item 11 to the existing numbered list:

> 11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .md 文件放入 `projects/`;(b) 在 `src/data/projects.js` 中加一行 `import ... from '../../projects/xxx.md?raw'`;(c) 在 `projects` 数组中加一条 metadata 记录(字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content)

## Tests — `tests/projects.test.js`

Mirror `tests/articles.test.js` in scope:

- `listProjects` returns an array (no ordering assertion — projects lack a date field)
- `findProjectBySlug('existing-slug')` returns the project
- `findProjectBySlug('not-a-real-slug')` returns `undefined`

The tests will be authored against the empty initial array. To make the "find existing" assertion meaningful, the implementation plan will add one minimal sample project (`projects/_sample.md` + matching entry) as a fixture, then the test asserts against that sample. If the user prefers to keep the array empty and skip the "find existing" assertion in CI, the implementation plan will surface that choice — see "Open Question" below.

## Verification

After implementation:

1. `projects/` folder exists at project root, empty (or with the sample fixture from "Tests" above).
2. `src/data/projects.js` is an empty array (or contains only the sample fixture).
3. `npm run build` succeeds with no errors.
4. `npm run dev` starts cleanly; visiting `/#/projects` shows the empty-state page (no cards) or, with the sample fixture, shows one card.
5. With the sample fixture: clicking the card navigates to `/#/projects/sample` and renders the markdown body inside the `Markdown` component (code highlighting, GFM tables work).
6. Visiting `/#/projects/does-not-exist` redirects to `/#/projects` (the `<Navigate replace />` fallback).
7. `npm run test` passes.

## Open Question (for the implementation plan to surface)

Should the initial commit include a `projects/_sample.md` sample project (so the detail page is testable in CI and visible in the dev server), or should the array stay empty and the detail page's first manual smoke test happen when the user adds their first real project? Both are reasonable; the implementation plan will ask the user at plan-execution time.

## Risks

- **Empty `content` field** — if a future contributor adds a metadata entry without a matching `?raw` import, the build fails. The `ProjectCard` guard and the CLAUDE.md item 11 (three-step rule) mitigate this.
- **URL change** — `/projects/p1` etc. no longer exist. Acceptable because the three entries were placeholders with fake GitHub URLs; no real bookmark traffic to preserve.
- **No date sort** — without a date field, projects display in array-declaration order. The user can reorder by editing the array; if they later want chronological order, add a `date` field then (not in scope here).

## Out of Scope (Future Work)

- A `create-project` skill (mirror of `create-article`): drop a `.md` in `articles-draft/`-equivalent, run a skill, get it registered.
- YAML frontmatter + `import.meta.glob` auto-discovery (mirror of the article-system's "Out of Scope" note in the prior spec).
- A `delete-project` skill.
- Re-introducing the three placeholder projects as real entries.
