---
name: create-article
description: Use when the user wants to publish a draft article from articles-draft/ to the live blog. The user message **must contain explicit article-creation phrasing** such as "创建文章 xxx"、"发布文章 xxx"、"把 xxx 文章上线"、"publish article xxx" — not just "文章" alone (e.g. "文章里有错别字" is too generic). A bare "创建 xxx" with no article word is ambiguous vs `create-project`; ask. The skill reads the draft, infers the best-fitting category from the 6 fixed slugs in src/data/categories.js, and registers the file at articles/<category>/<slug>.html + matching import + metadata record with required `category` field. The frontend renders the article inside a 100vh iframe via the `<Html>` component in src/lib/html.jsx, so no JSX edits are needed. Do NOT trigger for editing already-published articles, deleting articles (use delete-article), or writing a brand-new draft from scratch.
---

# create-article

## What it does

Publishes one or more draft articles end-to-end. Drafts live at `articles-draft/<slug>.html`. For each draft, the skill:

1. Reads the draft and runs a format check.
2. **Analyzes the content** to pick the best-fitting category from the 6 fixed slugs in `src/data/categories.js`. The user can override the pick.
3. Moves the file from `articles-draft/<slug>.html` to `articles/<category>/<slug>.html`.
4. Adds an `import` line in `src/data/articles.js` (path includes the `<category>` subdir).
5. Adds a metadata object to the `articles` array with the required `category: '<category>'` field.

The frontend (`src/pages/Articles.jsx`, `src/components/CategoryFilter.jsx`, `src/components/ArticleCard.jsx`) is fully data-driven — it reads from `src/data/articles.js` and `src/data/categories.js`. The article detail page (`src/pages/ArticleDetail.jsx`) renders the article's HTML inside a 100vh iframe via the `<Html>` component, which auto-wraps fragments in a minimal doctype/html/head/body and adds `<base href="about:srcdoc">` plus `sandbox="allow-scripts allow-popups allow-forms"`. As long as the new article's `category` is one of the 6 fixed slugs, **no JSX edits are required**.

## The 6 fixed categories

`src/data/categories.js` declares exactly 6 slugs, in this order. Per `CLAUDE.md` rule 12, new slugs are forbidden — these are the only options.

| slug | 中文显示名 | 范围（用于推断） |
|---|---|---|
| `ai` | AI | 模型原理、提示工程、RAG、智能体、AI 工具与产品、行业观察等 |
| `python` | Python | Python 编程语言相关内容 |
| `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得、DevOps、可观测性等 |
| `product` | 产品与设计 | 产品设计、UX、交互、需求分析 |
| `notes` | 随笔与思考 | 读书、生活、个人反思、博客开篇语 |
| `resources` | 资源整理 | 书单、工具推荐、学习路线、清单类 |

The skill validates the chosen category against `categorySlugSet` exported from `src/data/categories.js` — never against a hardcoded list, so if `categories.js` ever changes, the skill follows it.

## When to use

Trigger this skill **only** when the user message contains explicit article-creation phrasing that combines a publish/create verb with the word "文章" (or "article" in English) — for example "创建文章" / "发布文章" / "把 xxx 文章上线" / "publish article xxx". Match phrases such as:

- "创建文章 RAG分层检索.html" / "创建文章 RAG分层检索"
- "把 hello-world 文章发出去"
- "发布 articles-draft 里的文章"
- "publish article deploy-notes"

The phrase must NOT trigger if:

- It mentions "文章" without a publish/create verb (e.g. "文章里有错别字"、"我想看看文章"、"删除文章 xxx" — the last is `delete-article`).
- It has a publish/create verb but no "文章" / "article" (e.g. "把 hello-world 草稿发出去"、"创建 xxx.html") — this is too generic and could be a project. Treat as ambiguous and ask the user to disambiguate before invoking either `create-article` or `create-project`.

Strip a trailing `.html` if the user included it; the slug is what matters. Space-separated filenames mean a batch — process each one in order, stopping at the first unfixable issue.

## When NOT to use

- **Editing an already-published article** → use the `Edit` tool on the `.html` file directly.
- **Deleting an article** → use the `delete-article` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `articles-draft/`. If the user wants to write a new draft, just create the file in `articles-draft/` and stop.
- **Renaming an article** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Adding a brand-new category** → forbidden by `CLAUDE.md` rule 12. If the article genuinely doesn't fit the 6 fixed slugs, the user must either (a) reframe the article to fit an existing category, or (b) shelve it.

## Project context

- Drafts live at `articles-draft/<slug>.html` (project root, *not* under `src/`).
- Published articles live at `articles/<category>/<slug>.html` where `<category>` is one of 6 fixed slugs.
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be updated. The import path includes the subdir: `'../../articles/<category>/<slug>.html?raw'`.
- The metadata object **must** carry `category: '<category>'` — this is the new field the frontend reads to filter, badge, and title the article.
- The single source of truth for valid slugs is `categorySlugSet` in `src/data/categories.js`. Always validate against it.
- The frontend is data-driven: `src/pages/Articles.jsx` calls `listArticles({ category })` and `listCategories()`; `CategoryFilter` renders chips from the category list; `ArticleCard` shows the category badge. As long as the article is registered with a valid `category`, the UI auto-adapts. **No JSX edits are needed for a normal publish.**
- The article detail page (`src/pages/ArticleDetail.jsx`) renders the article's HTML inside a 100vh iframe using the `<Html>` component from `src/lib/html.jsx`. That component accepts either a full HTML document (with `<!doctype>` / `<html>` / `<head>` / `<body>` wrappers) or a single-root-element HTML fragment, and auto-wraps fragments into a minimal document before injecting `<base href="about:srcdoc">` and `sandbox="allow-scripts allow-popups allow-forms"`.
- The page title in the article detail view (`src/pages/ArticleDetail.jsx`) is pulled from the `title` metadata field via `document.title` (set by `useEffect`), *not* from any in-page heading. The HTML the author writes inside the iframe is rendered as-is by the browser.
- The `brand-guidelines` skill is **not** needed here — the article HTML is the author's own document, and iframe rendering means the main site's Tailwind output does not apply inside it (see the iframe-rendering note below).

### iframe rendering note (read this before authoring)

The article HTML renders inside a 100vh iframe with `sandbox="allow-scripts allow-popups allow-forms"`. **Crucially, the main site's compiled Tailwind CSS does not apply inside the iframe viewport.** That means any class names the author writes in the article HTML — including `text-brand-light`, `bg-brand-dark`, `prose-*`, etc. — will be ignored. The author must include their own styles directly inside the article HTML via one of:

- Inline `<style>` block inside the article's `<head>` (for a full document) or at the top of the fragment.
- `<link rel="stylesheet" href="...">` pointing at a stylesheet bundled with the article (use a relative path).
- Inline `style="..."` attributes on individual elements.

**Reference example:** `projects/articles.html` is a good model — it ships its own styles and lives happily inside the iframe. When in doubt, mirror its structure: a full `<!doctype html>` document, a `<head>` with `<meta charset>` and inline `<style>`, and a `<body>` containing the article content.

The iframe sandbox is locked down: scripts run, popups and forms work, but `same-origin` is off, so anything requiring `localStorage`, cookies, or fetch to the parent site will fail. Plain HTML/CSS/JS for reading and display is fine.

## Workflow

Follow these steps in order. **Do not skip the format check, the content analysis, or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.html` if present; the slug is the bare filename.
- Verify the file exists at `articles-draft/<slug>.html`. If any are missing, list them and stop.
- Verify `articles/<category>/<slug>.html` does **not** already exist for *any* of the 6 categories. A simple `find articles/* -name '<slug>.html'` is the cleanest check — if the slug is in the live tree at all (regardless of subdir), the article is already published — point the user to `delete-article` first.

Compute the camelCase import variable name. The convention in this project is filename-segments-joined-and-Capitalized (e.g. `hello-world` → `helloWorld`, `deploy-notes` → `deployNotes`). For filenames with non-ASCII characters (e.g. `RAG分层检索`), use a transliteration you can defend — or ask the user to pick one. Keep the variable name consistent in the import line and the metadata object.

### 2. Read each draft and run the format check

For each draft, read the full file and check the following. The check exists because the front-end renderer (`<Html>` from `src/lib/html.jsx`) and the iframe rendering model impose a few constraints that aren't obvious from a quick glance at the HTML.

**(a) HTML well-formedness sanity**

- The file must be non-empty.
- The file should look like HTML. Accept either form:
  - A **full document**: starts (after optional whitespace/BOM) with `<!doctype` or `<html`.
  - An **HTML fragment**: has a single recognizable root element (`<article>`, `<div>`, `<main>`, `<section>`, etc.) near the top.
- Do **not** attempt a full HTML parse — a structural sniff is enough. Flag obvious smells: completely empty file, starts with random prose before any tag, contains a stray `</body>` with no opening tag, etc.
- Call out in the plan which form the file takes. The `<Html>` component handles both, but the choice affects whether the author supplies `<head>` styles (full document) or inlines them at the top of the fragment.

**(b) Image paths must be relative**

- Any `<img src="http…">` or `<img src="https…">` is a problem. GitHub Pages will load these fine, but they pull in a hard dependency on a third-party host and break the offline-rendering guarantee. Per `CLAUDE.md` rule 3, all images must use relative paths. If an image is missing from the repo, flag it but don't auto-fix.

**(c) Filename ↔ slug ↔ import-variable consistency**

- The slug must equal the filename (sans `.html`). The import variable must be a valid JS identifier derived from the slug in a way the user can defend. If the slug has non-ASCII characters, surface this and ask the user to either accept the variable name or rename the file.

**How to behave when issues are found:** list every issue, file by file, in one block. Do **not** move any files yet. Tell the user which checks passed and which need attention, and let them decide:

- fix the draft themselves and re-run, or
- proceed anyway with a clear "I know, do it anyway" acknowledgment.

Per the user's preference, this skill does **not** auto-fix. It pauses.

### 3. Infer the category from the content

This is the new step. For each draft, read the body text and pick the best-fitting category from the 6 fixed slugs.

**Inputs to look at**, in priority order:

1. **The first heading / `<title>` content** — usually the strongest single signal.
2. **The first 3 `<h2>` / `<h3>` headings** — these typically enumerate the article's main topics.
3. **The first 2-3 paragraphs of body text** (strip tags with a regex if needed) — the most informative prose.
4. **Repeated domain nouns** — e.g. "RAG" / "检索" / "embedding" → `ai`; "装饰器" / "asyncio" / "pip" → `python`; "Kubernetes" / "CI" / "部署" → `engineering`; "用户访谈" / "原型" / "信息架构" → `product`; "读书" / "反思" / first-person voice → `notes`; "清单" / "推荐" / "工具列表" → `resources`.

**Output:**

- One top-1 category. If confident, just say "推荐分类：`<slug>`（理由：…）".
- If two categories are both strong (e.g. an article about implementing RAG in Python is genuinely both `ai` and `python`), surface both with short reasoning and let the user pick. State the tiebreaker: "若作者是 AI 工程师写 RAG 架构选型 → `ai`；若作者是 Python 开发者记录库用法 → `python`"（按受众/作者意图区分）.
- If the article doesn't fit any of the 6 categories, **block**. The 6 slugs are fixed per `CLAUDE.md` rule 12 — the user must either reframe the article or shelve it. Do not silently pick the "least bad" one.

**Validation:** the chosen slug **must** be in `categorySlugSet` (read from `src/data/categories.js`). If the file's import block exposes a different set than the 6 slugs above, treat the file as out of date and use what `categories.js` declares.

**Respect the user:** if the user has already explicitly named a category in the request (e.g. "把 hello-world 放进 notes"), use that as the top-1 regardless of content analysis — the analysis is the default, not a mandate.

### 4. Infer the rest of the metadata

For each draft, propose the rest of the metadata block:

- **`title`** — there is no longer an H1 to read from. Use this priority order:
  1. **Ask the user.** The cleanest behavior in the HTML world is to ask the author to specify the title in the request. Surface this in the plan printout.
  2. For a **full document** that contains a `<title>` tag, take the `<title>` content (strip whitespace). This is the closest analog to the old "first H1" rule.
  3. For an **HTML fragment**, or as a fallback when the author hasn't specified, use the filename (`<slug>`) as the title.
  Whatever you pick, show it in the plan and let the user override before the file moves.
- **`excerpt`** — extracting prose from arbitrary HTML is fragile. Use this priority order:
  1. **Ask the user to provide `excerpt` in the request.** This is the recommended path — one short sentence (60–80 Chinese chars / 100–120 English chars) is what the card needs.
  2. **Best-effort guess:** run a lightweight regex against the file to grab the first `<p>…</p>` element's text content (strip inner tags, collapse whitespace), truncate to ~80 chars at a sentence boundary when possible. If the first `<p>` is missing, empty, or contains only links/media, skip it and try the next `<p>`.
  3. As a final fallback, use the title as the excerpt.
  Mark any guess as a guess in the plan printout so the author can correct it before the file moves. Do **not** try to skip headings, lists, or tables automatically — the regex is too easy to get wrong on real HTML.
- **`date`** — today's date in `YYYY-MM-DD` form. Treat the article as "published now".
- **`tags`** — up to 3 short labels. Heuristics, in priority order:
  1. Explicit markers in the first few `<h2>`/`<h3>` headings (e.g. a heading that names a topic).
  2. Domain nouns that appear repeatedly (e.g. "RAG", "检索").
  3. If nothing is salient, fall back to `['未分类']`.
- **`cover`** — `null`, matching the convention in existing articles.
- **`slug`** — the filename sans `.html`.
- **`category`** — from step 3. **Required, non-null.**
- **`content`** — the import variable (set during step 5).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves.

### 5. Show the plan and confirm

Print a structured plan, one block per article:

```
即将发布 1 篇文章：

1. RAG分层检索.html
   - 内容分析:  标题/内容 包含大量 "embedding"/"检索"/"chunk" → 强信号 ai
   - 分类:      ai（推荐）         ←来自 src/data/categories.js
   - 文件:      articles-draft/RAG分层检索.html → articles/ai/RAG分层检索.html
   - 形态:      完整 HTML 文档（含 <!doctype> / <html> / <head>，作者已自带样式）
   - 标题:      RAG分层检索
   - slug:      RAG分层检索
   - 日期:      2026-06-15
   - 标签:      RAG, 检索
   - 摘要:      在RAG系统中，检索策略的设计直接影响最终生成效果…
   - import:    src/data/articles.js
                 import ragFcjkjs from '../../articles/ai/RAG分层检索.html?raw';
   - 数组:      src/data/articles.js
                 { slug: 'RAG分层检索', title: '…', excerpt: '…', date: '2026-06-15', tags: ['RAG','检索'], cover: null, content: ragFcjkjs, category: 'ai' }
   - 前端:      无 JSX 改动（category 'ai' 已在 src/data/categories.js 中声明；ArticleCard 徽章 / CategoryFilter chip / 列表页标题会自动出现；详情页由 src/pages/ArticleDetail.jsx 通过 <Html> 组件渲染 100vh iframe）

格式检查结果：
  ✓ HTML 结构正常（完整文档）
  ✓ 图片路径全部为相对路径
  ⚠ 文件名包含非 ASCII 字符，import 变量名 ragFcjkjs 是否确认？
  ✓ 分类 'ai' 存在于 categorySlugSet
  ✓ articles/ai/RAG分层检索.html 不存在，无冲突
  ℹ 摘要为根据首个 <p> 推断的 best-effort 值，建议作者审阅

确认发布？（y/n）  如需修改 metadata 或分类，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to title/excerpt/tags/category, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 6. Execute

Process each article in order. For each:

1. `Bash mv articles-draft/<slug>.html articles/<category>/<slug>.html` to move the file into the category subdir. (If the subdir doesn't exist, `mkdir -p` first; Vite expects it, and the import path requires it.)
2. `Edit` `src/data/articles.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style). The path **must** include `<category>` and end in `.html?raw`.
3. `Edit` `src/data/articles.js` to add the metadata object at the end of the `articles` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be). The new object **must** include `category: '<category>'`.

If a step fails mid-article, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 7. Verify

For each newly published article, run a quick grep to confirm all three touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/articles.js
ls articles/<category>/<slug>.html articles-draft/<slug>.html 2>&1
grep -rn "articles-draft" src/ 2>&1
```

Expected: one import line (with `<category>` in the path and ending in `.html?raw`), one `slug:` reference (with `category:` in the same object), the file in `articles/<category>/`, no `articles-draft/<slug>.html` left, no leftover `articles-draft` references under `src/`.

Then run a category integrity check: read `src/data/categories.js`, and confirm the chosen `<category>` is in `categorySlugSet`. If not, the new article's metadata has an invalid category — flag it immediately.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 8. Report

Print one line per article confirming the move and the three touch points:

```
已发布 `RAG分层检索`（分类：ai）：
  - articles/ai/RAG分层检索.html
  - src/data/articles.js: import + 数组条目（category: 'ai'）
  - 格式检查: 全部通过 / 已知 1 项警告已确认
  - 前端: 无 JSX 改动，CategoryFilter / ArticleCard / 列表页标题会通过 categories.js + listCategories() 自动显示；详情页由 <Html> 组件以 iframe 渲染作者原始 HTML
```

If the user wants to preview, point them at the article's URL on the dev server (`/#/articles/<slug>` and the category filter at `/#/articles/category/<category>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Article HTML is empty / unparseable** — block. The author needs to ship real content.
- **Article HTML uses main-site Tailwind classes (`text-brand-light`, `bg-brand-dark`, `prose-*`)** — flag this in the format check. Those classes will NOT apply inside the iframe. The author must inline their own styles or link a stylesheet inside the article HTML. This is the single most common mistake in the HTML world; surface it loudly.
- **Article HTML uses external scripts / fetches the parent site** — flag this. The iframe sandbox is locked down (`allow-scripts allow-popups allow-forms`, no `allow-same-origin`), so anything requiring cookies / localStorage / cross-origin fetch will fail.
- **Article fits two categories** (e.g. "Python 实现 RAG 检索") — surface both, ask the user to pick. Tiebreak by *audience/author intent*: an AI engineer writing about RAG architecture → `ai`; a Python developer writing a library tutorial → `python`. Document the tiebreak rule in the plan so the user can challenge it.
- **Article fits no category** (e.g. a travel essay) — block. The 6 slugs are fixed; the user must reframe the article to fit an existing category or shelve it. Do not invent a new slug, do not silently pick the "least bad" category.
- **A tag clashes with an existing article's tag** — that's fine. Tags are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **User said "创建 articles-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.html` file in `articles-draft/`, in alphabetical order. If any single article fails the format check or the category inference, pause the whole batch and ask.
- **User passes a path like `src/data/articles.js`** instead of a slug — ask for clarification; this skill operates on filenames in `articles-draft/`, not on registry paths.
- **User already named the category explicitly** (e.g. "把 hello-world 放进 notes") — respect that as the top-1 even if content analysis suggests a different one. Note both in the plan so the user can sanity-check.
- **Slug collides with an existing article in a *different* category** (e.g. existing `articles/ai/foo.html` and new draft also has slug `foo`) — slugs are globally unique per the spec. Block; the user must rename the new draft. (Two slugs in two subdirs would both end up in `articles` and the slug would be ambiguous on the article detail page.)
- **`articles/<category>/` subdir doesn't exist on disk yet** — call `mkdir -p articles/<category>` before the `mv`. The folder is gitignored only if it's truly empty after the move, otherwise it gets tracked like the existing `articles/ai/`.
