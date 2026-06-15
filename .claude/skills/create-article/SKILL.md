---
name: create-article
description: Use when the user wants to publish a draft article from articles-draft/ to the live blog. The user message **must contain explicit article-creation phrasing** such as "创建文章 xxx"、"发布文章 xxx"、"把 xxx 文章上线"、"publish article xxx" — not just "文章" alone (e.g. "文章里有错别字" is too generic). A bare "创建 xxx" with no article word is ambiguous vs `create-project`; ask. The skill reads a `.md` draft, converts it into a brand-styled full HTML document using the inline template below, infers the best-fitting category from the 6 fixed slugs in src/data/categories.js, and registers the resulting HTML at articles/<category>/<slug>.html with a matching import + metadata record (required `category` field). The frontend renders articles inside a 100vh iframe via the `<Html>` component in src/lib/html.jsx, so no JSX edits are needed. Do NOT trigger for editing already-published articles, deleting articles (use delete-article), or writing a brand-new draft from scratch.
---

# create-article

## What it does

Publishes one or more draft articles end-to-end. Drafts live at `articles-draft/<slug>.md`. For each draft, the skill:

1. Reads the draft and runs a format check (against the `.md` source).
2. **Converts the markdown into a full brand-styled HTML document** using the fixed template in [The article HTML template](#the-article-html-template) below. The template uses Anthropic brand colors (dark `#141413`, light `#faf9f5`, orange `#d97757`) and the same Poppins/Lora typography as the main site's `src/index.css`. Markdown elements map deterministically to styled HTML — see [Markdown → HTML mapping](#markdown--html-mapping).
3. **Analyzes the content** to pick the best-fitting category from the 6 fixed slugs in `src/data/categories.js`. The user can override the pick.
4. Moves the resulting HTML from the in-memory conversion to `articles/<category>/<slug>.html` (the `.md` is left in `articles-draft/` per the project convention; only the `.html` is shipped).
5. Adds an `import` line in `src/data/articles.js` (path includes the `<category>` subdir, ends in `.html?raw`).
6. Adds a metadata object to the `articles` array with the required `category: '<category>'` field.

The frontend (`src/pages/Articles.jsx`, `src/components/CategoryFilter.jsx`, `src/components/ArticleCard.jsx`) is fully data-driven — it reads from `src/data/articles.js` and `src/data/categories.js`. The article detail page (`src/pages/ArticleDetail.jsx`) renders the article's HTML inside a 100vh iframe via the `<Html>` component, which adds `<base href="about:srcdoc">` plus `sandbox="allow-scripts allow-popups allow-forms"`. As long as the new article's `category` is one of the 6 fixed slugs, **no JSX edits are required**.

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

- "创建文章 RAG分层检索.md" / "创建文章 RAG分层检索"
- "把 hello-world 文章发出去"
- "发布 articles-draft 里的文章"
- "publish article deploy-notes"

The phrase must NOT trigger if:

- It mentions "文章" without a publish/create verb (e.g. "文章里有错别字"、"我想看看文章"、"删除文章 xxx" — the last is `delete-article`).
- It has a publish/create verb but no "文章" / "article" (e.g. "把 hello-world 草稿发出去"、"创建 xxx.md") — this is too generic and could be a project. Treat as ambiguous and ask the user to disambiguate before invoking either `create-article` or `create-project`.

Strip a trailing `.md` if the user included it; the slug is what matters. Space-separated filenames mean a batch — process each one in order, stopping at the first unfixable issue.

## When NOT to use

- **Editing an already-published article** → use the `Edit` tool on the `.html` file at `articles/<category>/<slug>.html` directly (or regenerate from the `.md` in `articles-draft/` and re-run this skill).
- **Deleting an article** → use the `delete-article` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `articles-draft/`. If the user wants to write a new draft, just create the file in `articles-draft/` and stop.
- **Renaming an article** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Adding a brand-new category** → forbidden by `CLAUDE.md` rule 12. If the article genuinely doesn't fit the 6 fixed slugs, the user must either (a) reframe the article to fit an existing category, or (b) shelve it.

## Project context

- Drafts live at `articles-draft/<slug>.md` (project root, *not* under `src/`).
- Published articles live at `articles/<category>/<slug>.html` where `<category>` is one of 6 fixed slugs. The `.md` is *not* moved into the live tree — only the converted `.html` is shipped. (The `.md` stays in `articles-draft/` for the author to edit and re-publish later.)
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be updated. The import path includes the subdir: `'../../articles/<category>/<slug>.html?raw'`.
- The metadata object **must** carry `category: '<category>'` — this is the new field the frontend reads to filter, badge, and title the article.
- The single source of truth for valid slugs is `categorySlugSet` in `src/data/categories.js`. Always validate against it.
- The frontend is data-driven: `src/pages/Articles.jsx` calls `listArticles({ category })` and `listCategories()`; `CategoryFilter` renders chips from the category list; `ArticleCard` shows the category badge. As long as the article is registered with a valid `category`, the UI auto-adapts. **No JSX edits are needed for a normal publish.**
- The article detail page (`src/pages/ArticleDetail.jsx`) renders the article's HTML inside a 100vh iframe using the `<Html>` component from `src/lib/html.jsx`. The conversion step in this skill produces a full HTML document, which `Html` passes through unchanged (it adds `<base href="about:srcdoc">` to the `<head>` and wraps with `sandbox="allow-scripts allow-popups allow-forms"`).
- The page title in the article detail view (`src/pages/ArticleDetail.jsx`) is pulled from the `title` metadata field via `document.title` (set by `useEffect`), *not* from any in-page heading. The `<title>` tag in the converted HTML drives the browser tab inside the iframe only.
- The `brand-guidelines` skill defines the colors and typography used by the conversion template below; the template hard-codes those values so the conversion is deterministic and doesn't require re-invoking the brand skill at run time.

### iframe rendering note (read this before authoring the `.md`)

The article HTML renders inside a 100vh iframe with `sandbox="allow-scripts allow-popups allow-forms"`. **Crucially, the main site's compiled Tailwind CSS does not apply inside the iframe viewport.** That's fine here because the conversion template below ships its own styles — but if the `.md` author writes inline HTML (which the conversion step preserves as-is), it must come with its own `<style>` or inline styles. Tailwind classes like `text-brand-light`, `bg-brand-dark`, `prose-*` will NOT apply inside the iframe.

The iframe sandbox is locked down: scripts run, popups and forms work, but `same-origin` is off, so anything requiring `localStorage`, cookies, or fetch to the parent site will fail. Plain HTML/CSS/JS for reading and display is fine.

## The article HTML template

The conversion step wraps the converted markdown content in this fixed template. **Use this template verbatim** — do not edit colors, fonts, or layout per article. The goal is predictable, on-brand styling across every article.

```html
<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{TITLE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Lora:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --bg:        #141413;
    --bg-soft:   #1f1e1c;
    --text:      #faf9f5;
    --text-mute: #b0aea5;
    --rule:      #3a3935;
    --orange:    #d97757;
    --blue:      #6a9bcc;
    --green:     #788c5d;
  }
  *,*::before,*::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Lora', Georgia, serif;
    font-size: 18px;
    line-height: 1.75;
    margin: 0;
    padding: 64px 24px 120px;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Poppins', Arial, sans-serif;
    color: var(--text);
    line-height: 1.3;
    margin: 2em 0 0.6em;
    font-weight: 600;
  }
  h1 {
    font-size: 2.4em;
    color: var(--orange);
    font-weight: 700;
    margin-top: 0.4em;
    letter-spacing: -0.01em;
  }
  h2 {
    font-size: 1.7em;
    border-bottom: 1px solid var(--rule);
    padding-bottom: 0.3em;
  }
  h3 { font-size: 1.35em; color: var(--orange); }
  h4 { font-size: 1.15em; }
  p { margin: 1em 0; }
  a {
    color: var(--orange);
    text-decoration: none;
    border-bottom: 1px solid var(--orange);
    transition: color .15s, border-color .15s;
  }
  a:hover { color: var(--text); border-bottom-color: var(--text); }
  code {
    font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
    background: var(--bg-soft);
    color: var(--text);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.88em;
  }
  pre {
    background: var(--bg-soft);
    padding: 18px 20px;
    border-radius: 8px;
    overflow-x: auto;
    border-left: 3px solid var(--orange);
    line-height: 1.55;
    margin: 1.4em 0;
  }
  pre code {
    background: none;
    padding: 0;
    font-size: 0.88em;
  }
  blockquote {
    border-left: 3px solid var(--orange);
    padding: 0.2em 0 0.2em 1.2em;
    margin: 1.5em 0;
    color: var(--text-mute);
    font-style: italic;
  }
  ul, ol { padding-left: 1.6em; margin: 1em 0; }
  li { margin: 0.35em 0; }
  img { max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 1.5em auto; }
  hr { border: 0; border-top: 1px solid var(--rule); margin: 2.5em 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.4em 0;
    font-size: 0.95em;
  }
  th, td {
    border: 1px solid var(--rule);
    padding: 8px 12px;
    text-align: left;
  }
  th { background: var(--bg-soft); font-family: 'Poppins', Arial, sans-serif; font-weight: 600; }
  ::selection { background: var(--orange); color: var(--bg); }
</style>
</head>
<body>
{CONTENT}
</body>
</html>
```

`{TITLE}` is the inferred article title (see step 4 for the priority order). `{CONTENT}` is the converted HTML body — the markdown's structure rendered through the mapping table below. Do **not** include `<h1>` from the markdown as a duplicate — the template's body is body-level, and a separate `<h1>` is fine (the conversion maps `#` to `<h1>`, which will sit at the top of the body and pair with the orange styling). The author can choose to omit the H1 from the markdown and rely on the metadata `title` field as the page title bar.

## Markdown → HTML mapping

When converting the `.md` to HTML, apply this mapping. The mapping covers standard CommonMark plus GitHub-flavored markdown (the project doesn't ship `react-markdown`/`remark-gfm`/etc. anymore — the conversion is hand-rolled by the agent).

| Markdown | HTML | Notes |
|---|---|---|
| `# Heading` | `<h1>Heading</h1>` | |
| `## Heading` | `<h2>Heading</h2>` | |
| `### Heading` | `<h3>Heading</h3>` | |
| `#### Heading` | `<h4>Heading</h4>` | |
| Plain paragraph | `<p>…</p>` | Wrap a single line or contiguous non-blank lines. |
| `**bold**` | `<strong>bold</strong>` | |
| `*italic*` / `_italic_` | `<em>italic</em>` | |
| `` `inline code` `` | `<code>inline code</code>` | |
| `[text](url)` | `<a href="url">text</a>` | Preserve `target="_blank"` if the author wrote it; otherwise no target. |
| `![alt](src)` | `<img src="src" alt="alt" />` | **Must be a relative path** per `CLAUDE.md` rule 3. |
| `- item` / `* item` | `<ul><li>item</li></ul>` | Group consecutive `-`/`*` lines into one `<ul>`. |
| `1. item` | `<ol><li>item</li></ol>` | Group consecutive numbered lines into one `<ol>`. |
| `> quote` | `<blockquote><p>quote</p></blockquote>` | A `>` paragraph becomes `<blockquote><p>...</p></blockquote>`. |
| ` ```lang ` … ` ``` ` | `<pre><code class="language-lang">…</code></pre>` | Preserve the language as a class for syntax-friendly display; the template doesn't ship a highlighter, so it's a visual hint only. |
| `---` | `<hr />` | |
| `\| col \| col \|` table | `<table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>` | Parse pipe tables. |
| Raw HTML in the `.md` | Pass through verbatim | Wrap in a `<div>` if it's a block-level element not already wrapped. |

**Out of scope** (degrade gracefully — render as plain text, do not crash):
- Footnotes (`[^1]` / `[^1]: …`)
- Math (`$…$` / `$$…$$`)
- Definition lists
- Task list checkboxes (`- [ ]` / `- [x]`) — keep the text, drop the checkbox; or pass through as raw HTML if the author wants a real checkbox

If a draft uses heavy out-of-scope markdown, flag it in the plan printout and ask the author whether to (a) proceed with degraded rendering, (b) let the author hand-author the article HTML directly (skipping this skill), or (c) wait for the draft to be simplified.

## Workflow

Follow these steps in order. **Do not skip the format check, the conversion, the content analysis, or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.md` if present; the slug is the bare filename.
- Verify the file exists at `articles-draft/<slug>.md`. If any are missing, list them and stop.
- Verify `articles/<category>/<slug>.html` does **not** already exist for *any* of the 6 categories. A simple `find articles/* -name '<slug>.html'` is the cleanest check — if the slug is in the live tree at all (regardless of subdir), the article is already published — point the user to `delete-article` first.

Compute the camelCase import variable name. The convention in this project is filename-segments-joined-and-Capitalized (e.g. `hello-world` → `helloWorld`, `deploy-notes` → `deployNotes`). For filenames with non-ASCII characters (e.g. `RAG分层检索`), use a transliteration you can defend — or ask the user to pick one. Keep the variable name consistent in the import line and the metadata object.

### 2. Read each draft and run the format check

For each draft, read the full file and check the following. The check exists because the conversion step assumes well-formed markdown and the front-end renderer imposes a few constraints that aren't obvious from a quick glance at the source.

**(a) H1 hygiene**

- There should be exactly one H1 (`# …`) and it should be one of the first non-blank lines.
- Multiple H1s are confusing: the first H1 visually competes with the page title, and the other H1s get sized like the orange H1 style — which is loud.
- Zero H1s is a smell — flag it. The author can either add an H1 or rely on the metadata `title` field as the page title and have the body start with an `<h2>`.

**(b) Image paths must be relative**

- Any `![](http…)` or `![](https…)` is a problem. GitHub Pages will load these fine, but they pull in a hard dependency on a third-party host and break the offline-rendering guarantee. Per `CLAUDE.md` rule 3, all images must use relative paths. If an image is missing from the repo, flag it but don't auto-fix.

**(c) Code fences should declare a language**

- ```` ```js ```` highlights; ```` ``` ```` does not. If the draft has code without a language tag and the code is more than a couple of lines, flag it so the author can pick a language.

**(d) No embedded raw HTML that will look out of place**

- Raw `<div>` / `<table>` / `<details>` etc. inside the markdown **will** be passed through (the conversion preserves raw HTML). The author is responsible for those looking right. The format check should warn about *large* raw HTML blocks (10+ lines) and recommend the author either (a) split into markdown primitives, (b) use raw HTML and accept the styling responsibility, or (c) hand-author the full article HTML and skip this skill.

**(e) Filename ↔ slug ↔ import-variable consistency**

- The slug must equal the filename (sans `.md`). The import variable must be a valid JS identifier derived from the slug in a way the user can defend. If the slug has non-ASCII characters, surface this and ask the user to either accept the variable name or rename the file.

**How to behave when issues are found:** list every issue, file by file, in one block. Do **not** convert any files yet. Tell the user which checks passed and which need attention, and let them decide:

- fix the draft themselves and re-run, or
- proceed anyway with a clear "I know, do it anyway" acknowledgment.

Per the user's preference, this skill does **not** auto-fix. It pauses.

### 3. Convert markdown to HTML using the template

For each draft:

1. Read the full `.md` content.
2. Apply the [Markdown → HTML mapping](#markdown--html-mapping) above to produce the body HTML. Walk the file top to bottom, tracking whether you're inside a code fence, a list, a blockquote, or a table. Group consecutive list items into a single `<ul>` / `<ol>`. Wrap multi-line content in `<p>`. The conversion is hand-rolled — there is no library; do it carefully and produce clean, indented HTML.
3. Choose the `{TITLE}` placeholder. The default order is: (a) the first `# H1` from the markdown, (b) the filename as a fallback if there is no H1. The author can override in the request.
4. Substitute `{TITLE}` and `{CONTENT}` into the [template](#the-article-html-template) above. The output is a complete `<!doctype html>` document.
5. Hold the resulting HTML in memory; do **not** write it to disk yet (the user still needs to confirm in step 5).

If the draft is large, this is the longest step. Don't rush it — wrong conversions (especially in code blocks and tables) are the most visible bugs.

### 4. Infer the category from the content

This step runs on the **`.md` source** (not the converted HTML — easier to read).

**Inputs to look at**, in priority order:

1. **The H1** — usually the strongest single signal.
2. **The first 3 H2/H3 headings** — these typically enumerate the article's main topics.
3. **The first 2-3 paragraphs of body text** — the most informative prose.
4. **Repeated domain nouns** — e.g. "RAG" / "检索" / "embedding" → `ai`; "装饰器" / "asyncio" / "pip" → `python`; "Kubernetes" / "CI" / "部署" → `engineering`; "用户访谈" / "原型" / "信息架构" → `product`; "读书" / "反思" / first-person voice → `notes`; "清单" / "推荐" / "工具列表" → `resources`.

**Output:**

- One top-1 category. If confident, just say "推荐分类：`<slug>`（理由：…）".
- If two categories are both strong (e.g. an article about implementing RAG in Python is genuinely both `ai` and `python`), surface both with short reasoning and let the user pick. State the tiebreaker: "若作者是 AI 工程师写 RAG 架构选型 → `ai`；若作者是 Python 开发者记录库用法 → `python`"（按受众/作者意图区分）.
- If the article doesn't fit any of the 6 categories, **block**. The 6 slugs are fixed per `CLAUDE.md` rule 12 — the user must either reframe the article or shelve it. Do not silently pick the "least bad" one.

**Validation:** the chosen slug **must** be in `categorySlugSet` (read from `src/data/categories.js`). If the file's import block exposes a different set than the 6 slugs above, treat the file as out of date and use what `categories.js` declares.

**Respect the user:** if the user has already explicitly named a category in the request (e.g. "把 hello-world 放进 notes"), use that as the top-1 regardless of content analysis — the analysis is the default, not a mandate.

### 5. Infer the rest of the metadata

For each draft, propose the rest of the metadata block:

- **`title`** — the first H1 of the `.md` (strip a leading `#` and surrounding whitespace). The same string is used for the `<title>` tag in the converted HTML. If there is no H1, fall back to the filename; flag in the plan printout.
- **`excerpt`** — the first non-heading, non-empty paragraph from the `.md`, truncated to roughly 60–80 Chinese characters or 100–120 English characters, ending at a sentence boundary when possible. If the first paragraph is a list, a code block, or a table, skip it and use the first prose paragraph.
- **`date`** — today's date in `YYYY-MM-DD` form. Treat the article as "published now".
- **`tags`** — up to 3 short labels. Heuristics, in priority order:
  1. Explicit markers in the first few H2/H3 headings (e.g. a heading that names a topic).
  2. Domain nouns that appear repeatedly (e.g. "RAG", "检索").
  3. If nothing is salient, fall back to `['未分类']`.
- **`cover`** — `null`, matching the convention in existing articles.
- **`slug`** — the filename sans `.md`.
- **`category`** — from step 4. **Required, non-null.**
- **`content`** — the import variable (set during step 7).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves.

### 6. Show the plan and confirm

Print a structured plan, one block per article:

```
即将发布 1 篇文章：

1. RAG分层检索.md
   - 内容分析:    标题/H1 "RAG分层检索" + 大量出现 "embedding"/"检索"/"chunk" → 强信号 ai
   - 分类:        ai（推荐）         ←来自 src/data/categories.js
   - 源文件:      articles-draft/RAG分层检索.md（保留不动）
   - 目标文件:    articles/ai/RAG分层检索.html（转换后写入）
   - 转换:        .md → HTML，使用 [The article HTML template] 里的固定模板
                   (doctype 完整文档 + 暗色主题 + Poppins/Lora + 品牌橙色 #d97757)
   - 标题:        RAG分层检索
   - slug:        RAG分层检索
   - 日期:        2026-06-15
   - 标签:        RAG, 检索
   - 摘要:        在RAG系统中，检索策略的设计直接影响最终生成效果…
   - import:      src/data/articles.js
                   import ragFcjkjs from '../../articles/ai/RAG分层检索.html?raw';
   - 数组:        src/data/articles.js
                   { slug: 'RAG分层检索', title: '…', excerpt: '…', date: '2026-06-15', tags: ['RAG','检索'], cover: null, content: ragFcjkjs, category: 'ai' }
   - 前端:        无 JSX 改动（category 'ai' 已在 src/data/categories.js 中声明；ArticleCard 徽章 / CategoryFilter chip / 列表页标题会自动出现；详情页由 src/pages/ArticleDetail.jsx 通过 <Html> 组件渲染 100vh iframe）

格式检查结果：
  ✓ H1 数量正确（1 个）
  ✓ 图片路径全部为相对路径
  ✓ 代码块均带语言标签
  ✓ 无大块原始 HTML
  ⚠ 文件名包含非 ASCII 字符，import 变量名 ragFcjkjs 是否确认？
  ✓ 分类 'ai' 存在于 categorySlugSet
  ✓ articles/ai/RAG分层检索.html 不存在，无冲突

确认发布？（y/n）  如需修改 metadata 或分类，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to title/excerpt/tags/category, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 7. Execute

Process each article in order. For each:

1. `Bash` `Write` the converted HTML (from step 3) to `articles/<category>/<slug>.html`. (If the subdir doesn't exist, `mkdir -p` first; Vite expects it, and the import path requires it.)
2. `Edit` `src/data/articles.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style). The path **must** include `<category>` and end in `.html?raw`.
3. `Edit` `src/data/articles.js` to add the metadata object at the end of the `articles` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be). The new object **must** include `category: '<category>'`.
4. **Do not touch the `.md` in `articles-draft/`.** It stays as the author's source of truth. To re-publish, edit the `.md` and re-run this skill.

If a step fails mid-article, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 8. Verify

For each newly published article, run a quick grep to confirm all touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/articles.js
ls articles/<category>/<slug>.html articles-draft/<slug>.md 2>&1
grep -rn "articles-draft" src/ 2>&1
```

Expected: one import line (with `<category>` in the path and ending in `.html?raw`), one `slug:` reference (with `category:` in the same object), the `.html` in `articles/<category>/`, the `.md` still in `articles-draft/`, no leftover `articles-draft` references under `src/`.

Then run a category integrity check: read `src/data/categories.js`, and confirm the chosen `<category>` is in `categorySlugSet`. If not, the new article's metadata has an invalid category — flag it immediately.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 9. Report

Print one line per article confirming the conversion, the move, and the registry updates:

```
已发布 `RAG分层检索`（分类：ai）：
  - 源:        articles-draft/RAG分层检索.md（保留）
  - 目标:      articles/ai/RAG分层检索.html（已写入，含品牌样式 + 暗色主题）
  - 注册:      src/data/articles.js: import + 数组条目（category: 'ai'）
  - 格式检查:  全部通过 / 已知 1 项警告已确认
  - 前端:      无 JSX 改动，CategoryFilter / ArticleCard / 列表页标题会通过 categories.js + listCategories() 自动显示；详情页由 <Html> 组件以 iframe 渲染转换后的 HTML
```

If the user wants to preview, point them at the article's URL on the dev server (`/#/articles/<slug>` and the category filter at `/#/articles/category/<category>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Draft has no H1** — flag, but proceed. Fall back to the filename as the title (and surface in the plan so the author can override). The page will still render; the orange `<h1>` block will simply be missing.
- **Draft has only an H1 and no body** — block. There's no excerpt to extract and no real content to publish.
- **Draft uses heavy out-of-scope markdown** (math, footnotes, complex tables with merged cells) — flag, and ask the author to (a) accept degraded rendering, (b) hand-author the HTML and skip this skill, or (c) simplify the draft.
- **Article fits two categories** (e.g. "Python 实现 RAG 检索") — surface both, ask the user to pick. Tiebreak by *audience/author intent*: an AI engineer writing about RAG architecture → `ai`; a Python developer writing a library tutorial → `python`. Document the tiebreak rule in the plan so the user can challenge it.
- **Article fits no category** (e.g. a travel essay) — block. The 6 slugs are fixed; the user must reframe the article to fit an existing category or shelve it. Do not invent a new slug, do not silently pick the "least bad" category.
- **A tag clashes with an existing article's tag** — that's fine. Tags are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **User said "创建 articles-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.md` file in `articles-draft/`, in alphabetical order. If any single article fails the format check, the conversion, or the category inference, pause the whole batch and ask.
- **User passes a path like `src/data/articles.js`** instead of a slug — ask for clarification; this skill operates on filenames in `articles-draft/`, not on registry paths.
- **User already named the category explicitly** (e.g. "把 hello-world 放进 notes") — respect that as the top-1 even if content analysis suggests a different one. Note both in the plan so the user can sanity-check.
- **Slug collides with an existing article in a *different* category** (e.g. existing `articles/ai/foo.html` and new draft also has slug `foo`) — slugs are globally unique per the spec. Block; the user must rename the new draft. (Two slugs in two subdirs would both end up in `articles` and the slug would be ambiguous on the article detail page.)
- **`articles/<category>/` subdir doesn't exist on disk yet** — call `mkdir -p articles/<category>` before writing the `.html`. The folder is gitignored only if it's truly empty after the move, otherwise it gets tracked like the existing `articles/ai/`.
- **Re-publishing an existing article** — the `.html` already exists; this skill should block (the slug is in the live tree, see step 1). To re-publish, either delete the old `.html` first (via `delete-article`) or have the author hand-edit the existing `.html` directly. Do not silently overwrite.
- **Author wants a non-default style** (e.g. light theme, custom accent color, a different font) — out of scope. The template is fixed. Tell the author to either (a) hand-author the article HTML and skip this skill, or (b) accept the default brand styling.
