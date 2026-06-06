---
name: create-article
description: Use when the user wants to publish a draft article from articles-draft/ to the live blog. The user message **must contain explicit article-creation phrasing** such as "创建文章 xxx"、"发布文章 xxx"、"把 xxx 文章上线"、"publish article xxx" — not just "文章" alone (e.g. "文章里有错别字" is too generic). A bare "创建 xxx" with no article word is ambiguous vs `create-project`; ask. The skill reads the draft, infers the best-fitting category from the 6 fixed slugs in src/data/categories.js, and registers the file at articles/<category>/<slug>.md + matching import + metadata record with required `category` field. The frontend is data-driven, so no JSX edits are needed. Do NOT trigger for editing already-published articles, deleting articles (use delete-article), or writing a brand-new draft from scratch.
---

# create-article

## What it does

Publishes one or more draft articles end-to-end. Drafts live at `articles-draft/<slug>.md`. For each draft, the skill:

1. Reads the draft and runs a format check.
2. **Analyzes the content** to pick the best-fitting category from the 6 fixed slugs in `src/data/categories.js`. The user can override the pick.
3. Moves the file from `articles-draft/<slug>.md` to `articles/<category>/<slug>.md`.
4. Adds an `import` line in `src/data/articles.js` (path includes the `<category>` subdir).
5. Adds a metadata object to the `articles` array with the required `category: '<category>'` field.

The frontend (`src/pages/Articles.jsx`, `src/components/CategoryFilter.jsx`, `src/components/ArticleCard.jsx`) is fully data-driven — it reads from `src/data/articles.js` and `src/data/categories.js`. As long as the new article's `category` is one of the 6 fixed slugs, **no JSX edits are required**.

## The 6 fixed categories

`src/data/categories.js` declares exactly 6 slugs, in this order. Per `CLAUDE.md` rule 13, new slugs are forbidden — these are the only options.

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

- **Editing an already-published article** → use the `Edit` tool on the `.md` file directly.
- **Deleting an article** → use the `delete-article` skill.
- **Writing a brand-new draft from scratch** → this skill assumes the file already exists in `articles-draft/`. If the user wants to write a new draft, just create the file in `articles-draft/` and stop.
- **Renaming an article** → out of scope; use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Adding a brand-new category** → forbidden by `CLAUDE.md` rule 13. If the article genuinely doesn't fit the 6 fixed slugs, the user must either (a) reframe the article to fit an existing category, or (b) shelve it.

## Project context

- Drafts live at `articles-draft/<slug>.md` (project root, *not* under `src/`).
- Published articles live at `articles/<category>/<slug>.md` where `<category>` is one of 6 fixed slugs.
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be updated. The import path includes the subdir: `'../../articles/<category>/<slug>.md?raw'`.
- The metadata object **must** carry `category: '<category>'` — this is the new field the frontend reads to filter, badge, and title the article.
- The single source of truth for valid slugs is `categorySlugSet` in `src/data/categories.js`. Always validate against it.
- The frontend is data-driven: `src/pages/Articles.jsx` calls `listArticles({ category })` and `listCategories()`; `CategoryFilter` renders chips from the category list; `ArticleCard` shows the category badge. As long as the article is registered with a valid `category`, the UI auto-adapts. **No JSX edits are needed for a normal publish.**
- Markdown is rendered by `src/lib/markdown.jsx` using `react-markdown` + `remark-gfm` + `rehype-highlight`. The `prose-*` classes in that file define what headings, tables, blockquotes, and code look like on screen.
- The page title in the article detail view (`src/pages/ArticleDetail.jsx`) is pulled from the `title` metadata field, *not* from the markdown's H1. That means the markdown H1 is a *section heading on the page*, not the page title. Picking the right H1 still matters for the in-page hierarchy.
- The `brand-guidelines` skill is **not** needed here — the markdown is the source, and `markdown.jsx` already enforces visual style.

## Workflow

Follow these steps in order. **Do not skip the format check, the content analysis, or the confirmation step.**

### 1. Resolve targets

Parse the user message for filenames. Space-separated means a batch. For each filename:

- Strip a trailing `.md` if present; the slug is the bare filename.
- Verify the file exists at `articles-draft/<slug>.md`. If any are missing, list them and stop.
- Verify `articles/<category>/<slug>.md` does **not** already exist for *any* of the 6 categories. A simple `find articles/* -name '<slug>.md'` is the cleanest check — if the slug is in the live tree at all (regardless of subdir), the article is already published — point the user to `delete-article` first.

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

### 3. Infer the category from the content

This is the new step. For each draft, read the body text (not just the title) and pick the best-fitting category from the 6 fixed slugs.

**Inputs to look at**, in priority order:

1. **The H1** — usually the strongest single signal.
2. **The first 3 H2/H3 headings** — these typically enumerate the article's main topics.
3. **The first 2-3 paragraphs of body text** — the most informative prose.
4. **Repeated domain nouns** — e.g. "RAG" / "检索" / "embedding" → `ai`; "装饰器" / "asyncio" / "pip" → `python`; "Kubernetes" / "CI" / "部署" → `engineering`; "用户访谈" / "原型" / "信息架构" → `product`; "读书" / "反思" / first-person voice → `notes`; "清单" / "推荐" / "工具列表" → `resources`.

**Output:**

- One top-1 category. If confident, just say "推荐分类：`<slug>`（理由：…）".
- If two categories are both strong (e.g. an article about implementing RAG in Python is genuinely both `ai` and `python`), surface both with short reasoning and let the user pick. State the tiebreaker: "若作者是 AI 工程师写 RAG 架构选型 → `ai`；若作者是 Python 开发者记录库用法 → `python`"（按受众/作者意图区分）.
- If the article doesn't fit any of the 6 categories, **block**. The 6 slugs are fixed per `CLAUDE.md` rule 13 — the user must either reframe the article or shelve it. Do not silently pick the "least bad" one.

**Validation:** the chosen slug **must** be in `categorySlugSet` (read from `src/data/categories.js`). If the file's import block exposes a different set than the 6 slugs above, treat the file as out of date and use what `categories.js` declares.

**Respect the user:** if the user has already explicitly named a category in the request (e.g. "把 hello-world 放进 notes"), use that as the top-1 regardless of content analysis — the analysis is the default, not a mandate.

### 4. Infer the rest of the metadata

For each draft, propose the rest of the metadata block:

- **`title`** — content of the first H1. Strip a leading `#` and surrounding whitespace. This is the page title bar; pick the most descriptive H1 if there are multiple.
- **`excerpt`** — the first non-heading, non-empty paragraph, truncated to roughly 60–80 Chinese characters or 100–120 English characters, ending at a sentence boundary when possible. If the first paragraph is a list, a code block, or a table, skip it and use the first prose paragraph.
- **`date`** — today's date in `YYYY-MM-DD` form. Treat the article as "published now".
- **`tags`** — up to 3 short labels. Heuristics, in priority order:
  1. Explicit markers in the first few H2/H3 headings (e.g. a heading that names a topic).
  2. Domain nouns that appear repeatedly (e.g. "RAG", "检索").
  3. If nothing is salient, fall back to `['未分类']`.
- **`cover`** — `null`, matching the convention in existing articles.
- **`slug`** — the filename sans `.md`.
- **`category`** — from step 3. **Required, non-null.**
- **`content`** — the import variable (set during step 5).

The inferred metadata is a *proposal*, not a contract. Show all proposed values to the user in the plan and let them edit anything they want before the file moves.

### 5. Show the plan and confirm

Print a structured plan, one block per article:

```
即将发布 1 篇文章：

1. RAG分层检索.md
   - 内容分析:  标题/H1 "RAG分层检索" + 大量出现 "embedding"/"检索"/"chunk" → 强信号 ai
   - 分类:      ai（推荐）         ←来自 src/data/categories.js
   - 文件:      articles-draft/RAG分层检索.md → articles/ai/RAG分层检索.md
   - 标题:      RAG分层检索
   - slug:      RAG分层检索
   - 日期:      2026-06-03
   - 标签:      RAG, 检索
   - 摘要:      在RAG系统中，检索策略的设计直接影响最终生成效果…
   - import:    src/data/articles.js
                 import ragFcjkjs from '../../articles/ai/RAG分层检索.md?raw';
   - 数组:      src/data/articles.js
                 { slug: 'RAG分层检索', title: '…', excerpt: '…', date: '2026-06-03', tags: ['RAG','检索'], cover: null, content: ragFcjkjs, category: 'ai' }
   - 前端:      无 JSX 改动（category 'ai' 已在 src/data/categories.js 中声明；ArticleCard 徽章 / CategoryFilter chip / 列表页标题会自动出现）

格式检查结果：
  ✓ H1 数量正确（1 个）
  ✓ 图片路径全部为相对路径
  ✓ 代码块均带语言标签
  ✓ 无原始 HTML
  ⚠ 文件名包含非 ASCII 字符，import 变量名 ragFcjkjs 是否确认？
  ✓ 分类 'ai' 存在于 categorySlugSet
  ✓ articles/ai/RAG分层检索.md 不存在，无冲突

确认发布？（y/n）  如需修改 metadata 或分类，请直接说明。
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user replies with edits to title/excerpt/tags/category, apply them mentally and re-print the affected block before the next prompt. If the user says no or hesitates, stop.

### 6. Execute

Process each article in order. For each:

1. `Bash mv articles-draft/<slug>.md articles/<category>/<slug>.md` to move the file into the category subdir. (If the subdir doesn't exist, `mkdir -p` first; Vite expects it, and the import path requires it.)
2. `Edit` `src/data/articles.js` to add the import line at the end of the existing import block (the file currently has each import on its own line; match that style). The path **must** include `<category>`.
3. `Edit` `src/data/articles.js` to add the metadata object at the end of the `articles` array. The existing entries use trailing commas on every object including the last, so adding a new object is safe — just make sure the *previous last* entry's trailing comma is preserved (it should already be). The new object **must** include `category: '<category>'`.

If a step fails mid-article, stop and report the partial state. Do not silently retry, and do not roll back — let the user see exactly what landed.

### 7. Verify

For each newly published article, run a quick grep to confirm all three touch points are wired up and nothing else references the draft folder:

```
grep -n "<slug>" src/data/articles.js
ls articles/<category>/<slug>.md articles-draft/<slug>.md 2>&1
grep -rn "articles-draft" src/ 2>&1
```

Expected: one import line (with `<category>` in the path), one `slug:` reference (with `category:` in the same object), the file in `articles/<category>/`, no `articles-draft/<slug>.md` left, no leftover `articles-draft` references under `src/`.

Then run a category integrity check: read `src/data/categories.js`, and confirm the chosen `<category>` is in `categorySlugSet`. If not, the new article's metadata has an invalid category — flag it immediately.

If `npm run build` is fast, run it; if it's slow, skip it and tell the user to run it themselves. A build that succeeds is the strongest evidence the registry is consistent.

### 8. Report

Print one line per article confirming the move and the three touch points:

```
已发布 `RAG分层检索`（分类：ai）：
  - articles/ai/RAG分层检索.md
  - src/data/articles.js: import + 数组条目（category: 'ai'）
  - 格式检查: 全部通过 / 已知 1 项警告已确认
  - 前端: 无 JSX 改动，CategoryFilter / ArticleCard / 列表页标题会通过 categories.js + listCategories() 自动显示
```

If the user wants to preview, point them at the article's URL on the dev server (`/#/articles/<slug>` and the category filter at `/#/articles/category/<category>`). Remind them to run `npm run dev` if it isn't already running.

## Edge cases

- **Filename has spaces** — reject; URLs can't represent them cleanly. Ask the user to rename the file.
- **Filename has non-ASCII characters** — accept but surface as a format-check warning. The slug and import variable will inherit the unusual characters (or the user's chosen transliteration). HashRouter percent-encodes the URL segment, so the link still works.
- **Draft has no H1** — block. The user should add an H1 to anchor the in-page hierarchy; the title field alone isn't enough.
- **Draft has only an H1 and no body** — block. There's no excerpt to extract and no real content to publish.
- **Article fits two categories** (e.g. "Python 实现 RAG 检索") — surface both, ask the user to pick. Tiebreak by *audience/author intent*: an AI engineer writing about RAG architecture → `ai`; a Python developer writing a library tutorial → `python`. Document the tiebreak rule in the plan so the user can challenge it.
- **Article fits no category** (e.g. a travel essay) — block. The 6 slugs are fixed; the user must reframe the article to fit an existing category or shelve it. Do not invent a new slug, do not silently pick the "least bad" category.
- **A tag clashes with an existing article's tag** — that's fine. Tags are just labels; collisions are normal.
- **Import variable would shadow a built-in or existing import** — flag it. E.g. don't name an import `React` or anything that matches an existing import in the file.
- **User said "创建 articles-draft 里的全部"** — this is the "publish everything in the folder" variant. Run the workflow for every `.md` file in `articles-draft/`, in alphabetical order. If any single article fails the format check or the category inference, pause the whole batch and ask.
- **User passes a path like `src/data/articles.js`** instead of a slug — ask for clarification; this skill operates on filenames in `articles-draft/`, not on registry paths.
- **User already named the category explicitly** (e.g. "把 hello-world 放进 notes") — respect that as the top-1 even if content analysis suggests a different one. Note both in the plan so the user can sanity-check.
- **Slug collides with an existing article in a *different* category** (e.g. existing `articles/ai/foo.md` and new draft also has slug `foo`) — slugs are globally unique per the spec. Block; the user must rename the new draft. (Two slugs in two subdirs would both end up in `articles` and the slug would be ambiguous on the article detail page.)
- **`articles/<category>/` subdir doesn't exist on disk yet** — call `mkdir -p articles/<category>` before the `mv`. The folder is gitignored only if it's truly empty after the move, otherwise it gets tracked like the existing `articles/ai/`.
