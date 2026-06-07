---
name: create-project
description: Use when the user wants to publish a draft project from projects-draft/ to the live blog. The user message **must contain explicit project-creation phrasing** such as "创建项目 xxx.html"、"创建项目 xxx"、"发布项目 xxx"、"把 xxx 项目上线"、"把 xxx 项目发出去"，or English equivalents like "create project xxx" or "publish project xxx". Mentioning "项目" alone (e.g. "项目里有 bug" or "我想看看项目") is NOT enough — the skill must not fire. A bare "创建 xxx.html" or "发布 xxx" with no project word is ambiguous between this skill and `create-article`; ask the user to clarify. Accepts space-separated filenames for batch publishes. Performs a pre-publish format check against the front-end rendering rules (drafts are moved as-is — no styling pass is applied), and pauses for user confirmation when issues are found. Do NOT trigger for editing already-published projects, deleting projects (use delete-project), or writing a brand-new draft from scratch.
---

# create-project

## What it does

Publishes one or more draft projects end-to-end. The drafts live at `projects-draft/<slug>.html`; this skill moves them to `projects/<slug>.html` **as-is** and registers them in the React frontend. No styling pass is applied — the author's original colors, fonts, and spacing land in the DOM unchanged.

Per project, three places are touched (the same rule as `CLAUDE.md` rule 11):

1. The `.html` file moves from `projects-draft/` to `projects/`.
2. An `import` line is added in `src/data/projects.js`.
3. A metadata object is added to the `projects` array in the same file.

`src/pages/Projects.jsx` and `src/components/ProjectCard.jsx` consume the array directly through `src/lib/projects.js` — no JSX edits are needed once the data is registered.

## When to use

Trigger this skill **only** when the user message contains explicit project-creation phrasing. The phrase must combine a publish/create verb with the word "项目" (or "project" in English) — for example "创建项目" / "发布项目" / "把 xxx 项目上线" / "publish project xxx". Match phrases such as:

- "创建项目 RAG分层检索.html" / "创建项目 RAG分层检索"
- "把 react-tips 项目上线"
- "发布 projects-draft 里的项目"
- "publish project deploy-notes"

The phrase must NOT trigger if:

- It mentions "项目" without a publish/create verb (e.g. "项目里有 bug"、"我想看看项目"、"删除项目 xxx" — the last is `delete-project`).
- It has a publish/create verb but no "项目" / "project" (e.g. "把 hello-world 草稿发出去"、"创建 xxx.html") — this is too generic and could be an article. Treat as ambiguous and ask the user to disambiguate before invoking either `create-article` or `create-project`.

Strip a trailing `.html` if the user included it; the slug is what matters. Space-separated filenames mean a batch — process each one in order, stopping at the first unfixable issue.

## When NOT to use

- **Editing an already-published project** → use the `Edit` tool on the `.html` file directly.
- **Deleting a project** → use the `delete-project` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `projects-draft/`. If the user wants to write a new draft, just create the file in `projects-draft/` and stop.
- **Renaming a project** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/projects.js`.

## Project context

- Drafts live at `projects-draft/<slug>.html` (project root, *not* under `src/`).
- Published projects live at `projects/<slug>.html` (project root).
- The registry is `src/data/projects.js`. It contains both the `import` block and the `projects` array; both must be updated.
- Metadata fields, per `CLAUDE.md` rule 11: `slug / name / description / techStack / githubUrl / demoUrl / cover / content`. `slug` is the only key the skill needs to identify a project — `content` is the import variable, not a match target.
- HTML is rendered by `src/lib/html.jsx`, which auto-detects the shape and dispatches to one of two paths: a **full HTML document** (anything whose trimmed, lowercased content starts with `<!doctype` or `<html>`) goes into an `<iframe srcDoc>` for a fully isolated viewport — the project's own `<html>` / `<head>` / `<body>` wrapping, inline `<style>` / `<script>`, custom fonts, CSS variables, and scroll/reveal/parallax behaviors all land in the DOM as the author wrote them. A **fragment** (anything else) goes through `dangerouslySetInnerHTML` and inherits the host page's Tailwind / font stack — this is the path the existing `projects/_sample.html` uses. Both shapes are intentional and supported; pick whichever fits the project. In either case, the author is fully responsible for what lands in the DOM (no sanitization), and the detail page (`/projects/:slug`) is intentionally exempt from the site's brand-color and typography rules so each project can keep its own visual identity. (The project list cards in `/projects` DO use `brand-*`; this rule covers the detail body only.)
- The iframe renderer (`src/lib/html.jsx`) injects `<base href="about:srcdoc">` into the document's `<head>` (or at the very start as a fallback) when the project HTML doesn't already declare one. This is what keeps `<a href="#anchor">` clicks inside the iframe — Chromium would otherwise inherit the host page's `baseURI` and navigate the host to a 404 path. **Side effect for authors:** every relative URL in the project body — `<img src="./cover.png">`, `<a href="docs/index.html">` — will resolve against `about:srcdoc` and *not* find files in the repo. If a project references local assets, use absolute paths or supply your own `<base>` tag in the project's `<head>`.
- The page title in the project detail view (`src/pages/ProjectDetail.jsx`) is pulled from the `name` metadata field, *not* from an `<h1>` in the body. That means the body's `<h1>` is a *section heading on the page*, not the page title. Picking the right `<h1>` still matters for the in-page hierarchy.
- `ProjectHeader.jsx` (used by `ProjectDetail.jsx`) renders `name`, `description`, `techStack`, `githubUrl`, and `demoUrl` — and conditionally hides the GitHub/Demo links if the URLs are empty. `ProjectCard.jsx` (used by `Projects.jsx`) renders the same fields but **always** renders the GitHub link without checking. If `githubUrl` is `null` or empty, the card still shows a broken link — surface that in the format check.
- Because HTML is injected raw and this skill does NOT run a styling pass, the author is fully responsible for the visual identity of the published project. There is no shared stylesheet enforcing the look — colors, fonts, and spacing come purely from the Tailwind classes (or inline styles / `<style>` blocks) the author wrote. Using `brand-*` tokens is **one valid approach** for projects that want to blend in with the rest of the site, but it is not required. If the author wants those tokens, `.claude/skills/brand-guidelines/SKILL.md` is the source of truth for what they are. The format check in step 2 surfaces structural issues (wrapper tags, heading hierarchy, broken images) — it does not police color or font choices.

## Workflow

Follow these steps in order. **Do not skip the format check or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.html` if present; the slug is the bare filename.
- Verify the file exists at `projects-draft/<slug>.html`. If any are missing, list them and stop.
- Verify `projects/<slug>.html` does **not** already exist. If it does, that project is already published — point the user to `delete-project` first.

Compute the camelCase import variable name. The convention in this project is filename-segments-joined-and-Capitalized (e.g. `hello-world` → `helloWorld`, `deploy-notes` → `deployNotes`). For filenames with non-ASCII characters (e.g. `RAG分层检索`), use a transliteration you can defend — or ask the user to pick one. Keep the variable name consistent in the import line and the metadata object.

### 2. Read each draft and run the format check

For each draft, read the full file and check the following. The check exists because the front-end renderer (`src/lib/html.jsx`) is a thin wrapper — full documents land inside an iframe via `srcDoc`, fragments go through `dangerouslySetInnerHTML`. Either way, anything wrong in the source lands in the DOM as-is, with no parser to catch typos and no shared stylesheet to paper over a missed class.

**(a) Document shape — either full document or fragment is fine**
- The detail renderer (`src/lib/html.jsx`) accepts **both** shapes:
  - **Full HTML document** (starts with `<!doctype` or `<html>`, case-insensitive, leading whitespace ignored): rendered inside an `<iframe srcDoc>`. The project can carry its own `<html>` / `<head>` / `<body>` wrapping, inline `<style>` / `<script>`, custom fonts, CSS variables, scroll/reveal behaviors. This is the shape the user explicitly asked for to preserve each project's visual identity.
  - **HTML fragment** (anything else): rendered via `dangerouslySetInnerHTML` and inherits the host page's Tailwind / font stack. Single-root (`<section>` / `<div>`) is the cleanest fragment shape; bare-root (no wrapper) is legal but harder to read — flag it.
- A full document MUST include any `<link rel="stylesheet">` it needs (e.g. Google Fonts for `Ma Shan Zheng`, `Noto Serif SC`, etc.) — the iframe does not inherit the host page's stylesheets. Fragments can rely on the host's font stack and don't need to bring their own.
- A full document's inline `<script>` runs in the iframe's own context. The iframe uses `sandbox="allow-scripts allow-popups allow-forms"`:
  - `allow-scripts` lets inline `<script>` execute (IntersectionObserver reveal, mouse parallax, `fetch`, etc. all work).
  - `allow-popups` lets `target="_blank"` links open in a new tab — without it, the browser silently drops them.
  - `allow-forms` lets `<form>` submissions work.
  - `allow-same-origin` is **deliberately not set**. Without it, the iframe is treated as a cross-origin context, which (a) makes `document.baseURI` independent of the host page (so project `<a href="#anchor">` clicks scroll inside the iframe instead of navigating the host to `…#anchor` and 404'ing) and (b) blocks same-origin `localStorage` — scripts that try to read/write it will throw. This trade-off is intentional. Fragments cannot run scripts.

**(b) Heading hygiene**
- There should be exactly one `<h1>` and it should appear near the top of the fragment. Multiple `<h1>`s compete with the page title bar in `ProjectHeader.jsx`; zero `<h1>`s leaves the in-page hierarchy starting at `<h2>` and makes the body feel disconnected from the `name` field.
- Headings should follow a strict order: `<h1>` → `<h2>` → `<h3>`, never skipping a level. An `<h4>` directly under `<h2>` looks wrong.

**(c) Image paths must be relative**
- Any `<img src="http…">` / `<img src="https…">` is a problem. GitHub Pages will load them fine, but they pull in a hard dependency on a third-party host and break the offline-rendering guarantee. Per `CLAUDE.md` rule 3, all images must use relative paths. If an image is missing from the repo, flag it but don't auto-fix.

**(d) Code blocks**
- Code is written as `<pre><code class="language-X">…</code></pre>`. The class is only for syntax highlighting; unlike fenced markdown, the renderer (`src/lib/html.jsx`) does not parse it. Make sure each `<pre>` has a `<code>` child and that the code child carries a `language-*` class so the visual style stays consistent.
- Inline code is `<code>…</code>`, not backticks. A stray backtick in a fragment is just text; no special handling.

**(e) Styling is preserved, not normalized (informational)**
- The project detail page (`/projects/:slug`) intentionally bypasses the site's brand-color and typography rules so each project can keep its own visual identity. The author's colors, fonts, and spacing in the HTML source are what land in the DOM — there is no stylesheet rewriting them, and there is no requirement to use `brand-*` tokens.
- Do **not** flag missing `brand-*` classes, raw hex colors, or non-Poppins fonts as issues. Those are valid choices.
- The one styling-related note that may still be worth raising: if the author's text colors look unreadable on the site's dark background (`#141413`), mention it as an informational note — not a blocker.

**(f) Filename ↔ slug ↔ import-variable consistency**
- The slug must equal the filename (sans `.html`). The import variable must be a valid JS identifier derived from the slug in a way the user can defend. If the slug has non-ASCII characters, surface this and ask the user to either accept the variable name or rename the file.

**(g) URL hygiene in the body**
- The body may mention GitHub/Demo URLs that the author intends to surface in metadata. If the body contains `https://github.com/...` or `https://...demo...`-style links, mention them in the plan so the user can confirm whether they should be moved to `githubUrl` / `demoUrl`. A link in the body that is *also* in the metadata is fine (the body gives context); a body link that the author forgot to register as metadata is a smell.

**(h) External links should use `target="_blank"`**
- A full document's iframe is at `about:srcdoc`. A plain `<a href="https://github.com/...">` (no `target="_blank"`) clicked inside the iframe will navigate the iframe to that external URL, replacing the project content with whatever loads (most external sites block framing via `X-Frame-Options` / `frame-ancestors` CSP, so the iframe often goes blank). With `target="_blank"`, the sandbox's `allow-popups` lets the browser open the link in a new tab and leaves the iframe intact. **Flag** any external URL link in a full document that doesn't use `target="_blank"` and ask the author to add it.

**How to behave when issues are found:** list every issue, file by file, in one block. Do **not** move any files yet. Tell the user which checks passed and which need attention, and let them decide:

- fix the draft themselves and re-run, or
- proceed anyway with a clear "I know, do it anyway" acknowledgment.

Per the user's preference, this skill does **not** auto-fix. It pauses.

### 3. Infer metadata

For each draft, propose a metadata block. Defaults:

- **`name`** — text content of the first `<h1>`, stripped of surrounding whitespace. This is the page title bar; pick the most descriptive `<h1>` if there are multiple.
- **`description`** — a short summary derived from the body. Because the body is HTML, there is no clean "first paragraph" to extract — instead, look for an obvious summary: the first `<p>` of reasonable length, or a short `<p>` inside the leading `<section>`. Truncate to roughly 60–80 Chinese characters or 100–120 English characters, ending at a sentence boundary when possible. If the body is purely structural (a list of links, a code block, etc.) and has no prose, ask the user to provide a description rather than guessing.
- **`techStack`** — array of short labels. Heuristics, in priority order:
  1. An explicit "技术栈" / "Tech Stack" heading in the body, followed by a list.
  2. Tech nouns near the top of the body (e.g. "用 React + Node 写的" → `['React', 'Node']`).
  3. Languages declared on code blocks via `class="language-X"` (e.g. `language-ts` → `'TypeScript'`).
  4. If nothing is salient, fall back to `[]` and flag it — the card will look bare.
- **`githubUrl`** — `https://github.com/...` URL. Heuristics, in priority order:
  1. Explicit "GitHub" / "仓库" heading or callout in the body.
  2. The first `https://github.com/...` link in the body.
  3. Fall back to `null`. Flag this: the card will render a broken link to `/` because `ProjectCard.jsx` doesn't guard the GitHub link.
- **`demoUrl`** — URL of a live demo. Heuristics, in priority order:
  1. Explicit "Demo" / "在线" / "预览" heading or callout in the body.
  2. The first `https://...` link in the body that is *not* a `github.com` URL.
  3. Fall back to `null`. `ProjectCard.jsx` already guards this with `project.demoUrl && (...)`, so `null` is safe.
- **`cover`** — `null`, matching the convention in existing projects.
- **`slug`** — the filename sans `.html`.
- **`content`** — the import variable (set during step 5).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves. Pay special attention to `techStack`, `githubUrl`, and `demoUrl` — these are the fields most likely to be wrong on the first pass, so flag every inference with the heuristic used.

### 4. Show the plan and confirm

Print a structured plan, one block per project:

```
即将发布 1 个项目：

1. 示例项目.html
   - 文件:  projects-draft/示例项目.html → projects/示例项目.html
   - 名称:  示例项目
   - slug:  示例项目
   - 描述:  这是一个示例项目，用来演示项目页与详情页的工作流。
   - 技术栈: []（未在正文中找到明确的"技术栈"段落或代码语言标签，请确认）
   - GitHub:  null（正文中未找到 GitHub 链接。ProjectCard 会渲染一个指向 / 的空链接，是否确认？）
   - Demo:    null
   - import: src/data/projects.js
       import shiLiXiangMu from '../../projects/示例项目.html?raw';
   - 数组:  src/data/projects.js
       { slug: '示例项目', name: '示例项目', description: '…', techStack: [], githubUrl: null, demoUrl: null, cover: null, content: shiLiXiangMu }

格式检查结果：
  ✓ 形态合规：完整 HTML 文档（将由 iframe 独立解析；项目内的 <style>/<script>/字体/CSS 变量原样生效）
  ✓ 标题层级合规（1 个 <h1>，无跳级）
  ✓ 图片路径全部为相对路径
  ✓ 代码块均有 <pre><code class="language-X"> 包裹
  — 样式保留：作者原色值/字体（详情页不强制 brand-*，由作者决定）
  ⚠ 文件名包含非 ASCII 字符，import 变量名 shiLiXiangMu 是否确认？

确认发布？（y/n）  如需修改 metadata，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to name/description/techStack/githubUrl/demoUrl, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 5. Execute

Process each project in order. For each:

1. `Bash mv projects-draft/<slug>.html projects/<slug>.html` to move the file.
2. `Edit` `src/data/projects.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style). The Vite `?raw` query also works for HTML, so the import path is `from '../../projects/<slug>.html?raw'`. If the file is currently `const projects = [];` with no import block yet, add the import line *above* the array.
3. `Edit` `src/data/projects.js` to add the metadata object at the end of the `projects` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be).

If a step fails mid-project, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 6. Verify

For each newly published project, run a quick grep to confirm all three touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/projects.js
ls projects/<slug>.html projects-draft/<slug>.html 2>&1
grep -rn "projects-draft" src/ 2>&1
```

Expected: one import line, one `slug:` reference, the file in `projects/`, no `projects-draft/<slug>.html` left, no leftover `projects-draft` references under `src/`.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 7. Report

Print one line per project confirming the move and the three touch points:

```
已发布 `示例项目`：
  - projects/示例项目.html
  - src/data/projects.js: import + 数组条目
  - 格式检查: 全部通过 / 已知 1 项警告已确认
```

If the user wants to preview, point them at the project's URL on the dev server (`/#/projects/<slug>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Draft has no `<h1>`** — block. The user should add an `<h1>` to anchor the in-page hierarchy; the `name` field alone isn't enough, and the `name` field is also hard to infer without an `<h1>` to read.
- **Draft has only an `<h1>` and no body** — block. There's no description to extract and no real content to publish.
- **Fragment is missing the root wrapper, or wraps the whole thing in `<html>`/`<body>`** — not a block anymore. Both full documents and fragments are valid (see format check (a)). A fragment without a root wrapper is still worth flagging for readability, but a `<!doctype>`/`<html>`/`<body>` document wrapper is exactly what the iframe renderer is designed for.
- **A techStack entry clashes with an existing project's entry** — that's fine. Labels are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **`githubUrl` resolves to `null`** — the user almost certainly wants *something* there. Don't proceed without an explicit confirmation in the plan, because `ProjectCard.jsx` will render a broken link.
- **User says "创建 projects-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.html` file in `projects-draft/`, in alphabetical order. If any single project fails the format check, pause the whole batch and ask.
- **User passes a path like `src/data/projects.js`** instead of a slug — ask for clarification; this skill operates on filenames in `projects-draft/`, not on registry paths.
