---
name: delete-article
description: Use when the user wants to delete or remove an article from this blog. Triggers on Chinese phrases that contain "文章" (article) such as "删除文章 xxx.html"、"把 xxx 这篇文章删掉"、"移除文章 xxx"、"xxx 文章下掉"、"不要 xxx.html 这篇文章了"，also matches English variants that contain "article" like "delete article xxx.html" or "remove the xxx article". The skill cleans up the HTML source under articles/<category>/<slug>.html (one of 6 fixed category subdirs declared in src/data/categories.js), the import line in src/data/articles.js, and the matching metadata object in the articles array. Do NOT trigger for editing article content, creating new articles, deleting projects (use delete-project), or renaming files. If the user says "删除 xxx.html" without the word "文章" or "article", the request is ambiguous — ask before proceeding. Drafts in articles-draft/ are .md and out of scope for this skill (they are not in the live tree).
---

# delete-article

## What it does

Removes a blog article end-to-end so the file system and the React frontend stay consistent. Per `CLAUDE.md` rule 10, article sources are HTML files in a 2-level layout — `articles/<category>/<slug>.html` — where `<category>` is one of 6 fixed slugs declared in `src/data/categories.js` (`ai` / `python` / `engineering` / `product` / `notes` / `resources`). The category for each article is recorded in its metadata as a `category` field.

Three places are touched — the file, the import, and the metadata record. All three must be cleaned or the build will break or the article will keep showing up in the UI:

1. The HTML source at `articles/<category>/<slug>.html` is deleted.
2. The matching `import` line in `src/data/articles.js` is removed.
3. The matching object in the `articles` array in `src/data/articles.js` is removed.

The frontend is data-driven — `src/pages/Articles.jsx`, `src/components/ArticleCard.jsx`, `src/pages/ArticleDetail.jsx`, and `src/lib/articles.js` all read from the registry array — so no JSX edits are needed once the data is clean.

## When to use

Trigger this skill when the user's intent is to permanently remove a published article. The phrase **must contain "文章"** (or "article" in English) so it never collides with `delete-project`. Match phrases such as:

- "删除文章 sirchmunk-init-log.html" / "删除文章 sirchmunk-init-log"
- "把 hello-world 这篇文章删掉"
- "移除文章 deploy-notes"
- "xxx 文章下掉"、"不要 xxx.html 这篇文章了"
- "delete article xxx.html" / "remove the xxx article"

Strip a trailing `.html` if the user included it; the slug is what matters. If the user provided a path like `articles/ai/foo.html`, extract the slug (the basename minus `.html`) and use the subdir as a cross-check.

## When NOT to use

- **Editing content** of an article → use the `Edit` tool on the `.html` file directly.
- **Creating a new article** → use the `create-article` skill (which converts `.md` drafts in `articles-draft/` to brand-styled HTML and registers them).
- **Deleting a project** → use the `delete-project` skill. If the user says "删除 xxx.html" *without* the word "文章" / "article", that is a project and the wrong skill will fire.
- **Renaming an article** → use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Deleting an unpublished draft** in `articles-draft/` → out of scope; drafts are `.md` and live in `articles-draft/`, not the live tree. The user can `rm` them directly.
- **Bulk deletion** of several articles at once → out of scope; invoke this skill once per article.

## Project context

- Article HTML sources live at `articles/<category>/<slug>.html` (project root, *not* under `src/`). The `<category>` segment is one of the 6 fixed slugs in `src/data/categories.js`.
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be cleaned. The import path includes the subdir and ends in `.html?raw`: `'../../articles/<category>/<slug>.html?raw'`.
- The metadata object carries a required `category` field — `src/lib/articles.js` uses this field to filter articles by category. The `category` field also identifies the on-disk subdir. **Trust the metadata's `category` as the source of truth for the file's subdir** — but cross-check it against the import path's subdir (they should agree). Do not probe the filesystem first.
- The frontend is data-driven: `src/pages/Articles.jsx`, `src/components/ArticleCard.jsx`, `src/pages/ArticleDetail.jsx`, and `src/lib/articles.js` all read from the registry array; they need no edits.
- The `brand-guidelines` skill is **not** needed here — this task touches no UI.

## Workflow

Follow these steps in order. Do not skip the confirmation step.

### 1. Resolve the target

From the user message, extract the slug. If the user wrote `foo.html`, the slug is `foo`. If they wrote `articles/ai/foo.html`, take the basename and strip `.html`. Always confirm the user actually said "文章" / "article" somewhere in the message — if they didn't, this is the wrong skill and the user almost certainly meant a project.

If the user said `xxx.md` instead of `xxx.html`, that's a sign they may be thinking of a draft. The live tree only contains `.html` per `CLAUDE.md` rule 10; flag this and ask whether they meant an article or a draft.

### 2. Locate the three touch points

**Read `src/data/articles.js` first.** Don't probe the filesystem — the registry is the source of truth.

1. Find the import line: search for a string of the form `'../../articles/<category>/<slug>.html?raw'`. The path inside that string tells you both the category subdir and the exact import variable name. Record all three: `category` (from path), `var` (import name), import-line location.

2. Find the metadata object: search for `slug: '<slug>'` (be careful — slug may contain non-ASCII characters or regex-special chars; use a literal substring search). Confirm the object has a `category` field. Confirm that the metadata's `category` matches the category segment from the import path. If they disagree, **abort and report** — the registry is already inconsistent and a blind delete would make it worse.

3. Verify the file actually exists at `articles/<category>/<slug>.html`. If the metadata's `category` is missing, search the filesystem under `articles/*/` for `<slug>.html` and use the found subdir as the category — but flag the missing `category` field to the user, since `CLAUDE.md` rule 10 requires it.

**Abort and report** if any one of the three is missing (no import, no metadata, no file). Tell the user exactly which touch point is missing; do not invent values.

### 3. Show the deletion plan and confirm

Print a short summary to the user listing exactly what will be removed:

```
即将删除文章 `<slug>`（分类：<category>）：
- 文件：articles/<category>/<slug>.html
- import：src/data/articles.js 第 N 行（import <var> from '../../articles/<category>/<slug>.html?raw'）
- metadata：第 M 行的 { slug: '<slug>', category: '<category>', ... }

确认删除？（y/n）
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user says no or hesitates, stop.

### 4. Execute

In this order:

1. `Edit` `src/data/articles.js` to remove the import line.
2. `Edit` `src/data/articles.js` to remove the metadata object. The array uses trailing commas on every entry, so removing any single object — including the last one — leaves the array syntactically valid; no extra comma cleanup is needed.
3. `Bash rm articles/<category>/<slug>.html` to delete the source file.

If the deletion leaves `articles/<category>/` empty, the empty subdir is fine — git does not track empty directories, but `git status` will simply not show anything new. Do not `rmdir` it speculatively.

### 5. Verify

Run a quick grep to make sure nothing else references the slug, the import variable, or the filename:

```
grep -rn "<slug>\|<var>\|<slug>\.html" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

Also confirm the filesystem side is clean:

```
ls articles/<category>/<slug>.html 2>&1
ls articles/*/<slug>.html 2>&1
```

The first `ls` should report "No such file". The second `ls` should also be empty — if any other category still has a file with that slug, something is wrong.

If `npm run build` is fast, run it; otherwise skip and tell the user to verify. A build that succeeds is the strongest evidence the registry is consistent.

If anything comes back, surface it to the user — do not silently fix unrelated references.

### 6. Report

Print a one-line confirmation:

```
已删除文章 `<slug>`（分类：<category>）：
  - 文件 articles/<category>/<slug>.html 已删除
  - src/data/articles.js 已清理（import + metadata）
  - 前端无 JSX 改动（Articles.jsx / ArticleCard.jsx / ArticleDetail.jsx / src/lib/articles.js 均从注册表读取）
```

If the grep or build surfaced anything, mention it in the same message.

## Edge cases

- **File missing but registry has it** → abort. Ask the user whether they want to clean the registry only or stop.
- **Registry missing but file exists** → abort. The import will break the build; the user needs to decide.
- **Metadata's `category` differs from the import path's subdir** → abort. The registry is inconsistent; do not delete, the user must reconcile first.
- **Metadata has no `category` field** (legacy article) → search `articles/*/<slug>.html` to recover the subdir, run the deletion, and warn the user that the article was missing a required field.
- **Slug contains characters that don't fit camelCase** (e.g. numbers, hyphens, or non-ASCII) → the import variable name is whatever the file shows. Match that string literally; do not auto-derive.
- **User said "删除 xxx.html" with no "文章" in the message** → this is ambiguous. Ask once whether they meant an article or a project before proceeding; do not silently route to this skill.
- **User said "删除 xxx.md" with no "文章" in the message** → articles in the live tree are `.html`, not `.md`. Either the user is referring to a draft in `articles-draft/` (out of scope) or they misspoke. Ask once to clarify.
- **User passes a path like `src/data/articles.js`** instead of a slug → ask for clarification; this skill operates on slugs, not file paths.
- **User passes a path like `articles/ai/foo.html`** → extract the slug (`foo`); the category segment is informational, but cross-check it against the metadata's `category` field — if they differ, abort and ask.
- **Article has a draft mirror in `articles-draft/<slug>.md`** → out of scope for this skill. The `.md` stays where it is. To remove both the published article and the draft, run this skill for the article, then `rm` the draft manually.
