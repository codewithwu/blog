---
name: create-article
description: Use when the user wants to publish a draft article from articles-draft/ to the live blog. Triggers on Chinese phrases like "创建 xxx.md"、"发布 xxx"、"把 xxx 文章上线"、"把 xxx 草稿发出去"，also matches English variants like "create xxx.md" or "publish xxx article". Accepts space-separated filenames for batch publishes. Performs a pre-publish format check against the front-end rendering rules before any file moves, and pauses for user confirmation when issues are found. Do NOT trigger for editing already-published articles, deleting articles (use delete-article), or writing a brand-new draft from scratch.
---

# create-article

## What it does

Publishes one or more draft articles end-to-end. The drafts live at `articles-draft/<slug>.md`; after this skill runs, they have been moved to `articles/<slug>.md` and registered in the React frontend.

Per article, three places are touched (the same rule as `CLAUDE.md` rule 10):

1. The `.md` file moves from `articles-draft/` to `articles/`.
2. An `import` line is added in `src/data/articles.js`.
3. A metadata object is added to the `articles` array in the same file.

`src/pages/Articles.jsx` and `src/components/ArticleCard.jsx` consume the array directly — no JSX edits are needed once the data is registered.

## When to use

Trigger this skill when the user's intent is to take a finished draft and make it live on the blog. Match phrases such as:

- "创建 RAG分层检索.md" / "创建 RAG分层检索"
- "把 hello-world 草稿发出去"
- "发布 articles-draft 里的笔记"
- "publish deploy-notes"

Strip a trailing `.md` if the user included it; the slug is what matters. Space-separated filenames mean a batch — process each one in order, stopping at the first unfixable issue.

## When NOT to use

- **Editing an already-published article** → use the `Edit` tool on the `.md` file directly.
- **Deleting an article** → use the `delete-article` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `articles-draft/`. If the user wants to write a new draft, just create the file in `articles-draft/` and stop.
- **Renaming an article** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.

## Project context

- Drafts live at `articles-draft/<slug>.md` (project root, *not* under `src/`).
- Published articles live at `articles/<slug>.md` (project root).
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be updated.
- Markdown is rendered by `src/lib/markdown.jsx` using `react-markdown` + `remark-gfm` + `rehype-highlight`. The `prose-*` classes in that file define what headings, tables, blockquotes, and code look like on screen.
- The page title in the article detail view (`src/pages/ArticleDetail.jsx`) is pulled from the `title` metadata field, *not* from the markdown's H1. That means the markdown H1 is a *section heading on the page*, not the page title. Picking the right H1 still matters for the in-page hierarchy.
- The `brand-guidelines` skill is **not** needed here — the markdown is the source, and `markdown.jsx` already enforces visual style.

## Workflow

Follow these steps in order. **Do not skip the format check or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.md` if present; the slug is the bare filename.
- Verify the file exists at `articles-draft/<slug>.md`. If any are missing, list them and stop.
- Verify `articles/<slug>.md` does **not** already exist. If it does, that article is already published — point the user to `delete-article` first.

Compute the camelCase import variable name. The convention in this project is filename-segments-joined-and-Capitalized (e.g. `hello-world` → `helloWorld`, `deploy-notes` → `deployNotes`). For filenames with non-ASCII characters (e.g. `RAG分层检索`), use a transliteration you can defend — or ask the user to pick one. Keep the variable name consistent in the import line and the metadata object.

### 2. Read each draft and run the format check

For each draft, read the full file and check the following. The check exists because the front-end renderer (`src/lib/markdown.jsx`) and the article detail page (`src/pages/ArticleDetail.jsx`) impose a few constraints that aren't obvious from a quick glance at the markdown.

**(a) H1 hygiene**
- There should be exactly one H1 (`# …`) and it should be one of the first non-blank lines.
- Multiple H1s are confusing: the first H1 visually competes with the page title bar, and the other H1s are sized like section headings.
- Zero H1s is also a smell — the in-page hierarchy will skip a level.

**(b) Image paths must be relative**
- Any `![](http…)` or `![](https…)` is a problem. GitHub Pages will load these fine, but they pull in a hard dependency on a third-party host and break the offline-rendering guarantee. Per `CLAUDE.md` rule 3, all images must use relative paths. If an image is missing from the repo, flag it but don't auto-fix.

**(c) Code fences should declare a language**
- ```` ```js ```` highlights; ```` ``` ```` does not. If the draft has code without a language tag and the code is more than a couple of lines, flag it so the author can pick a language.

**(d) No raw HTML blocks**
- `react-markdown` allows HTML by default, but the page CSS targets prose elements. Raw `<div>`/`<table>`/etc. will render with no styling and will look out of place. Flag for review.

**(e) Filename ↔ slug ↔ import-variable consistency**
- The slug must equal the filename (sans `.md`). The import variable must be a valid JS identifier derived from the slug in a way the user can defend. If the slug has non-ASCII characters, surface this and ask the user to either accept the variable name or rename the file.

**How to behave when issues are found:** list every issue, file by file, in one block. Do **not** move any files yet. Tell the user which checks passed and which need attention, and let them decide:

- fix the draft themselves and re-run, or
- proceed anyway with a clear "I know, do it anyway" acknowledgment.

Per the user's preference, this skill does **not** auto-fix. It pauses.

### 3. Infer metadata

For each draft, propose a metadata block. Defaults:

- **`title`** — content of the first H1. Strip a leading `#` and surrounding whitespace. This is the page title bar; pick the most descriptive H1 if there are multiple.
- **`excerpt`** — the first non-heading, non-empty paragraph, truncated to roughly 60–80 Chinese characters or 100–120 English characters, ending at a sentence boundary when possible. If the first paragraph is a list, a code block, or a table, skip it and use the first prose paragraph.
- **`date`** — today's date in `YYYY-MM-DD` form. Treat the article as "published now".
- **`tags`** — up to 3 short labels. Heuristics, in priority order:
  1. Explicit markers in the first few H2/H3 headings (e.g. a heading that names a topic).
  2. Domain nouns that appear repeatedly (e.g. "RAG", "检索").
  3. If nothing is salient, fall back to `['未分类']`.
- **`cover`** — `null`, matching the convention in existing articles.
- **`slug`** — the filename sans `.md`.
- **`content`** — the import variable (set during step 4).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves.

### 4. Show the plan and confirm

Print a structured plan, one block per article:

```
即将发布 1 篇文章：

1. RAG分层检索.md
   - 文件:  articles-draft/RAG分层检索.md → articles/RAG分层检索.md
   - 标题:  RAG分层检索学习笔记（详细版）
   - slug:  RAG分层检索
   - 日期:  2026-06-03
   - 标签:  RAG, 检索
   - 摘要:  在RAG系统中，检索策略的设计直接影响最终生成效果…
   - import: src/data/articles.js
       import ragFcjkjs from '../../articles/RAG分层检索.md?raw';
   - 数组:  src/data/articles.js
       { slug: 'RAG分层检索', title: '…', excerpt: '…', date: '2026-06-03', tags: ['RAG','检索'], cover: null, content: ragFcjkjs }

格式检查结果：
  ✓ H1 数量正确（1 个）
  ✓ 图片路径全部为相对路径
  ✓ 代码块均带语言标签
  ✓ 无原始 HTML
  ⚠ 文件名包含非 ASCII 字符，import 变量名 ragFcjkjs 是否确认？

确认发布？（y/n）  如需修改 metadata，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to title/excerpt/tags, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 5. Execute

Process each article in order. For each:

1. `Bash mv articles-draft/<slug>.md articles/<slug>.md` to move the file.
2. `Edit` `src/data/articles.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style).
3. `Edit` `src/data/articles.js` to add the metadata object at the end of the `articles` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be).

If a step fails mid-article, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 6. Verify

For each newly published article, run a quick grep to confirm all three touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/articles.js
ls articles/<slug>.md articles-draft/<slug>.md 2>&1
grep -rn "articles-draft" src/ 2>&1
```

Expected: one import line, one `slug:` reference, the file in `articles/`, no `articles-draft/<slug>.md` left, no leftover `articles-draft` references under `src/`.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 7. Report

Print one line per article confirming the move and the three touch points:

```
已发布 `RAG分层检索`：
  - articles/RAG分层检索.md
  - src/data/articles.js: import + 数组条目
  - 格式检查: 全部通过 / 已知 1 项警告已确认
```

If the user wants to preview, point them at the article's URL on the dev server (`/#/articles/<slug>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Draft has no H1** — block. The user should add an H1 to anchor the in-page hierarchy; the title field alone isn't enough.
- **Draft has only an H1 and no body** — block. There's no excerpt to extract and no real content to publish.
- **A tag clashes with an existing article's tag** — that's fine. Tags are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **User says "创建 articles-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.md` file in `articles-draft/`, in alphabetical order. If any single article fails the format check, pause the whole batch and ask.
- **User passes a path like `src/data/articles.js`** instead of a slug — ask for clarification; this skill operates on filenames in `articles-draft/`, not on registry paths.
