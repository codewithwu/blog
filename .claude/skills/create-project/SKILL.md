---
name: create-project
description: Use when the user wants to publish a draft project from projects-draft/ to the live blog. The user message **must contain explicit project-creation phrasing** such as "创建项目 xxx.md"、"创建项目 xxx"、"发布项目 xxx"、"把 xxx 项目上线"、"把 xxx 项目发出去"，or English equivalents like "create project xxx" or "publish project xxx". Mentioning "项目" alone (e.g. "项目里有 bug" or "我想看看项目") is NOT enough — the skill must not fire. A bare "创建 xxx.md" or "发布 xxx" with no project word is ambiguous between this skill and `create-article`; ask the user to clarify. Accepts space-separated filenames for batch publishes. Performs a pre-publish format check against the front-end rendering rules before any file moves, and pauses for user confirmation when issues are found. Do NOT trigger for editing already-published projects, deleting projects (use delete-project), or writing a brand-new draft from scratch.
---

# create-project

## What it does

Publishes one or more draft projects end-to-end. The drafts live at `projects-draft/<slug>.md`; after this skill runs, they have been moved to `projects/<slug>.md` and registered in the React frontend.

Per project, three places are touched (the same rule as `CLAUDE.md` rule 11):

1. The `.md` file moves from `projects-draft/` to `projects/`.
2. An `import` line is added in `src/data/projects.js`.
3. A metadata object is added to the `projects` array in the same file.

`src/pages/Projects.jsx` and `src/components/ProjectCard.jsx` consume the array directly through `src/lib/projects.js` — no JSX edits are needed once the data is registered.

## When to use

Trigger this skill **only** when the user message contains explicit project-creation phrasing. The phrase must combine a publish/create verb with the word "项目" (or "project" in English) — for example "创建项目" / "发布项目" / "把 xxx 项目上线" / "publish project xxx". Match phrases such as:

- "创建项目 RAG分层检索.md" / "创建项目 RAG分层检索"
- "把 react-tips 项目上线"
- "发布 projects-draft 里的项目"
- "publish project deploy-notes"

The phrase must NOT trigger if:

- It mentions "项目" without a publish/create verb (e.g. "项目里有 bug"、"我想看看项目"、"删除项目 xxx" — the last is `delete-project`).
- It has a publish/create verb but no "项目" / "project" (e.g. "把 hello-world 草稿发出去"、"创建 xxx.md") — this is too generic and could be an article. Treat as ambiguous and ask the user to disambiguate before invoking either `create-article` or `create-project`.

Strip a trailing `.md` if the user included it; the slug is what matters. Space-separated filenames mean a batch — process each one in order, stopping at the first unfixable issue.

## When NOT to use

- **Editing an already-published project** → use the `Edit` tool on the `.md` file directly.
- **Deleting a project** → use the `delete-project` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `projects-draft/`. If the user wants to write a new draft, just create the file in `projects-draft/` and stop.
- **Renaming a project** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/projects.js`.

## Project context

- Drafts live at `projects-draft/<slug>.md` (project root, *not* under `src/`).
- Published projects live at `projects/<slug>.md` (project root).
- The registry is `src/data/projects.js`. It contains both the `import` block and the `projects` array; both must be updated.
- Metadata fields, per `CLAUDE.md` rule 11: `slug / name / description / techStack / githubUrl / demoUrl / cover / content`. `slug` is the only key the skill needs to identify a project — `content` is the import variable, not a match target.
- Markdown is rendered by `src/lib/markdown.jsx` using `react-markdown` + `remark-gfm` + `rehype-highlight`. The `prose-*` classes in that file define what headings, tables, blockquotes, and code look like on screen.
- The page title in the project detail view (`src/pages/ProjectDetail.jsx`) is pulled from the `name` metadata field, *not* from the markdown's H1. That means the markdown H1 is a *section heading on the page*, not the page title. Picking the right H1 still matters for the in-page hierarchy.
- `ProjectHeader.jsx` (used by `ProjectDetail.jsx`) renders `name`, `description`, `techStack`, `githubUrl`, and `demoUrl` — and conditionally hides the GitHub/Demo links if the URLs are empty. `ProjectCard.jsx` (used by `Projects.jsx`) renders the same fields but **always** renders the GitHub link without checking. If `githubUrl` is `null` or empty, the card still shows a broken link — surface that in the format check.
- The `brand-guidelines` skill is **not** needed here — the markdown is the source, and `markdown.jsx` already enforces visual style.

## Workflow

Follow these steps in order. **Do not skip the format check or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.md` if present; the slug is the bare filename.
- Verify the file exists at `projects-draft/<slug>.md`. If any are missing, list them and stop.
- Verify `projects/<slug>.md` does **not** already exist. If it does, that project is already published — point the user to `delete-project` first.

Compute the camelCase import variable name. The convention in this project is filename-segments-joined-and-Capitalized (e.g. `hello-world` → `helloWorld`, `deploy-notes` → `deployNotes`). For filenames with non-ASCII characters (e.g. `RAG分层检索`), use a transliteration you can defend — or ask the user to pick one. Keep the variable name consistent in the import line and the metadata object.

### 2. Read each draft and run the format check

For each draft, read the full file and check the following. The check exists because the front-end renderer (`src/lib/markdown.jsx`) and the project detail page (`src/pages/ProjectDetail.jsx`) impose a few constraints that aren't obvious from a quick glance at the markdown.

**(a) H1 hygiene**
- There should be exactly one H1 (`# …`) and it should be one of the first non-blank lines.
- Multiple H1s are confusing: the first H1 visually competes with the page title bar, and the other H1s are sized like section headings.
- Zero H1s is also a smell — the in-page hierarchy will skip a level, and the `name` field will look disconnected from the body.

**(b) Image paths must be relative**
- Any `![](http…)` or `![](https…)` is a problem. GitHub Pages will load these fine, but they pull in a hard dependency on a third-party host and break the offline-rendering guarantee. Per `CLAUDE.md` rule 3, all images must use relative paths. If an image is missing from the repo, flag it but don't auto-fix.

**(c) Code fences should declare a language**
- ```` ```js ```` highlights; ```` ``` ```` does not. If the draft has code without a language tag and the code is more than a couple of lines, flag it so the author can pick a language.

**(d) No raw HTML blocks**
- `react-markdown` allows HTML by default, but the page CSS targets prose elements. Raw `<div>`/`<table>`/etc. will render with no styling and will look out of place. Flag for review.

**(e) Filename ↔ slug ↔ import-variable consistency**
- The slug must equal the filename (sans `.md`). The import variable must be a valid JS identifier derived from the slug in a way the user can defend. If the slug has non-ASCII characters, surface this and ask the user to either accept the variable name or rename the file.

**(f) URL hygiene in the body**
- The markdown may mention GitHub/Demo URLs that the author intends to surface in metadata. If the body contains `https://github.com/...` or `https://...demo...`-style links, mention them in the plan so the user can confirm whether they should be moved to `githubUrl` / `demoUrl`. A link in the body that is *also* in the metadata is fine (the body gives context); a body link that the author forgot to register as metadata is a smell.

**How to behave when issues are found:** list every issue, file by file, in one block. Do **not** move any files yet. Tell the user which checks passed and which need attention, and let them decide:

- fix the draft themselves and re-run, or
- proceed anyway with a clear "I know, do it anyway" acknowledgment.

Per the user's preference, this skill does **not** auto-fix. It pauses.

### 3. Infer metadata

For each draft, propose a metadata block. Defaults:

- **`name`** — content of the first H1. Strip a leading `#` and surrounding whitespace. This is the page title bar; pick the most descriptive H1 if there are multiple.
- **`description`** — the first non-heading, non-empty paragraph, truncated to roughly 60–80 Chinese characters or 100–120 English characters, ending at a sentence boundary when possible. If the first paragraph is a list, a code block, or a table, skip it and use the first prose paragraph.
- **`techStack`** — array of short labels. Heuristics, in priority order:
  1. An explicit "## 技术栈" / "Tech Stack" heading in the body, followed by a list.
  2. Repeated tech nouns near the top of the body (e.g. "用 React + Node 写的" → `['React', 'Node']`).
  3. Languages declared in the first few code fences (e.g. ```` ```ts ```` → `'TypeScript'`).
  4. If nothing is salient, fall back to `[]` and flag it — the card will look bare.
- **`githubUrl`** — `https://github.com/...` URL. Heuristics, in priority order:
  1. Explicit "## GitHub" heading or `> GitHub: <url>` line in the body.
  2. The first `https://github.com/...` link in the body.
  3. Fall back to `null`. Flag this: the card will render a broken link to `/` because `ProjectCard.jsx` doesn't guard the GitHub link.
- **`demoUrl`** — URL of a live demo. Heuristics, in priority order:
  1. Explicit "## Demo" / "## 在线" heading or `> Demo: <url>` line in the body.
  2. The first `https://...` link in the body that is *not* a `github.com` URL.
  3. Fall back to `null`. `ProjectCard.jsx` already guards this with `project.demoUrl && (...)`, so `null` is safe.
- **`cover`** — `null`, matching the convention in existing projects.
- **`slug`** — the filename sans `.md`.
- **`content`** — the import variable (set during step 4).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves. Pay special attention to `techStack`, `githubUrl`, and `demoUrl` — these are the fields most likely to be wrong on the first pass, so flag every inference with the heuristic used.

### 4. Show the plan and confirm

Print a structured plan, one block per project:

```
即将发布 1 个项目：

1. 示例项目.md
   - 文件:  projects-draft/示例项目.md → projects/示例项目.md
   - 名称:  示例项目
   - slug:  示例项目
   - 描述:  这是一个示例项目，用来演示项目页与详情页的工作流。
   - 技术栈: []（未在正文中找到明确的"技术栈"段落或代码语言标签，请确认）
   - GitHub:  null（正文中未找到 GitHub 链接。ProjectCard 会渲染一个指向 / 的空链接，是否确认？）
   - Demo:    null
   - import: src/data/projects.js
       import shiLiXiangMu from '../../projects/示例项目.md?raw';
   - 数组:  src/data/projects.js
       { slug: '示例项目', name: '示例项目', description: '…', techStack: [], githubUrl: null, demoUrl: null, cover: null, content: shiLiXiangMu }

格式检查结果：
  ✓ H1 数量正确（1 个）
  ✓ 图片路径全部为相对路径
  ✓ 代码块均带语言标签
  ✓ 无原始 HTML
  ⚠ 文件名包含非 ASCII 字符，import 变量名 shiLiXiangMu 是否确认？

确认发布？（y/n）  如需修改 metadata，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to name/description/techStack/githubUrl/demoUrl, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 5. Execute

Process each project in order. For each:

1. `Bash mv projects-draft/<slug>.md projects/<slug>.md` to move the file.
2. `Edit` `src/data/projects.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style). If the file is currently `const projects = [];` with no import block yet, add the import line *above* the array.
3. `Edit` `src/data/projects.js` to add the metadata object at the end of the `projects` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be).

If a step fails mid-project, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 6. Verify

For each newly published project, run a quick grep to confirm all three touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/projects.js
ls projects/<slug>.md projects-draft/<slug>.md 2>&1
grep -rn "projects-draft" src/ 2>&1
```

Expected: one import line, one `slug:` reference, the file in `projects/`, no `projects-draft/<slug>.md` left, no leftover `projects-draft` references under `src/`.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 7. Report

Print one line per project confirming the move and the three touch points:

```
已发布 `示例项目`：
  - projects/示例项目.md
  - src/data/projects.js: import + 数组条目
  - 格式检查: 全部通过 / 已知 1 项警告已确认
```

If the user wants to preview, point them at the project's URL on the dev server (`/#/projects/<slug>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Draft has no H1** — block. The user should add an H1 to anchor the in-page hierarchy; the `name` field alone isn't enough.
- **Draft has only an H1 and no body** — block. There's no description to extract and no real content to publish.
- **A techStack entry clashes with an existing project's entry** — that's fine. Labels are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **`githubUrl` resolves to `null`** — the user almost certainly wants *something* there. Don't proceed without an explicit confirmation in the plan, because `ProjectCard.jsx` will render a broken link.
- **User says "创建 projects-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.md` file in `projects-draft/`, in alphabetical order. If any single project fails the format check, pause the whole batch and ask.
- **User passes a path like `src/data/projects.js`** instead of a slug — ask for clarification; this skill operates on filenames in `projects-draft/`, not on registry paths.
