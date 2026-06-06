---
name: delete-article
description: Use when the user wants to delete or remove an article from this blog. Triggers on Chinese phrases that contain "文章" (article) such as "删除文章 xxx.md"、"把 xxx 这篇文章删掉"、"移除文章 xxx"、"xxx 文章下掉"、"不要 xxx.md 这篇文章了"，also matches English variants that contain "article" like "delete article xxx.md" or "remove the xxx article". The skill cleans up the markdown source under articles/<category>/<slug>.md (one of 6 fixed category subdirs declared in src/data/categories.js) and the registry entry in src/data/articles.js. Do NOT trigger for editing article content, creating new articles, deleting projects (use delete-project), or renaming files. If the user says "删除 xxx.md" without the word "文章" or "article", the request is ambiguous — ask before proceeding.
---

# delete-article

## What it does

Removes a blog article end-to-end so the file system and the React frontend stay consistent. Articles live in a 2-level layout — `articles/<category>/<slug>.md` — where `<category>` is one of 6 fixed slugs declared in `src/data/categories.js` (`ai` / `python` / `engineering` / `product` / `notes` / `resources`). The category for each article is recorded in its metadata as a `category` field, which is the single source of truth for the file's location.

Three places are touched:

1. The markdown source at `articles/<category>/<slug>.md` is deleted.
2. The matching `import` line in `src/data/articles.js` is removed.
3. The matching object in the `articles` array in the same file is removed.

`src/pages/Articles.jsx` and `src/components/ArticleCard.jsx` consume the array — no JSX edits are needed once the data is cleaned.

## When to use

Trigger this skill when the user's intent is to permanently remove an article. The phrase **must contain "文章"** (or "article" in English) so it never collides with `delete-project`. Match phrases such as:

- "删除文章 RAG分层检索.md" / "删除文章 RAG分层检索"
- "把 hello-world 这篇文章删掉"
- "移除文章 deploy-notes"
- "xxx 文章下掉"、"不要 xxx.md 这篇文章了"
- "delete article xxx.md" / "remove the xxx article"

Strip a trailing `.md` if the user included it; the slug is what matters. If the user provided a path like `articles/ai/foo.md`, extract the slug (the basename minus `.md`).

## When NOT to use

- **Editing content** of an article → use the `Edit` tool on the `.md` file directly.
- **Creating a new article** → follow the three-step rule in `CLAUDE.md` (file in `articles/<category>/` + import + metadata record with `category` field).
- **Deleting a project** → use the `delete-project` skill. If the user says "删除 xxx.md" *without* the word "文章" / "article", that is a project and the wrong skill will fire.
- **Renaming an article** → use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Bulk deletion** of several articles at once → out of scope; invoke this skill once per article.

## Project context

- Markdown sources live at `articles/<category>/<slug>.md` (project root, *not* under `src/`). The `<category>` segment is one of the 6 fixed slugs in `src/data/categories.js`.
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be cleaned. The import path includes the subdir: `'../../articles/<category>/<slug>.md?raw'`.
- The metadata object carries a required `category` field — this is how `src/lib/articles.js` resolves the file location. **Trust the metadata's `category` as the source of truth for the file's subdir.** Do not search the filesystem first.
- `src/pages/Articles.jsx` and `src/components/ArticleCard.jsx` consume the array; they need no edits.
- The `brand-guidelines` skill is **not** needed here — this task touches no UI.

## Workflow

Follow these steps in order. Do not skip the confirmation step.

### 1. Resolve the target

From the user message, extract the slug. If the user wrote `foo.md`, the slug is `foo`. If they wrote `articles/ai/foo.md`, take the basename and strip `.md`. Always confirm the user actually said "文章" / "article" somewhere in the message — if they didn't, this is the wrong skill and the user almost certainly meant a project.

### 2. Locate the three touch points

**Read `src/data/articles.js` first.** Don't probe the filesystem — the metadata is the source of truth.

1. Find the import line: search for `from '../../articles/.*<slug>\.md\?raw'` (or a literal substring match on the slug). The path inside that string tells you both the category subdir and the exact import variable name. Record all three: `category` (from path), `var` (import name), import-line location.

2. Find the metadata object: search for `slug: '<slug>'` (be careful — slug may contain non-ASCII characters or regex-special chars; use a literal substring search). Confirm the object has a `category` field. Confirm that the metadata's `category` matches the category segment from the import path. If they disagree, **abort and report** — the registry is already inconsistent and a blind delete would make it worse.

3. Verify the file actually exists at `articles/<category>/<slug>.md`. If the metadata's `category` is missing, search the filesystem under `articles/*/` for `<slug>.md` and use the found subdir as the category — but flag the missing `category` field to the user, since CLAUDE.md rule 13 requires it.

**Abort and report** if any one of the three is missing (no import, no metadata, no file). Tell the user exactly which touch point is missing; do not invent values.

### 3. Show the deletion plan and confirm

Print a short summary to the user listing exactly what will be removed:

```
即将删除文章 `<slug>`：
- 文件：articles/<category>/<slug>.md
- import：src/data/articles.js 第 N 行（import <var> from '../../articles/<category>/<slug>.md?raw'）
- metadata：第 M 行的 { slug: '<slug>', category: '<category>', ... }

确认删除？（y/n）
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user says no or hesitates, stop.

### 4. Execute

In this order:

1. `Edit` `src/data/articles.js` to remove the import line.
2. `Edit` `src/data/articles.js` to remove the metadata object. The existing array uses trailing commas on every entry, so removing any single object — including the last one — leaves the array syntactically valid; no extra comma cleanup is needed.
3. `Bash rm articles/<category>/<slug>.md` to delete the source file.

### 5. Verify

Run a quick grep to make sure nothing else references the slug, the import variable, or the filename:

```
grep -rn "<slug>\|<var>\|<slug>\.md" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

Also confirm the filesystem side is clean:

```
ls articles/<category>/<slug>.md 2>&1
ls articles/*/<slug>.md 2>&1
```

The first `ls` should report "No such file". The second `ls` should also be empty — if any other category still has a file with that slug, something is wrong.

If anything comes back, surface it to the user — do not silently fix unrelated references.

### 6. Report

Print a one-line confirmation: "已删除文章 `<slug>`：文件、import、metadata 三处清理完成。" If the grep found anything, mention it in the same message.

## Edge cases

- **File missing but registry has it** → abort. Ask the user whether they want to clean the registry only or stop.
- **Registry missing but file exists** → abort. The import will break the build; the user needs to decide.
- **Metadata's `category` differs from the import path's subdir** → abort. The registry is inconsistent; do not delete, the user must reconcile first.
- **Metadata has no `category` field** (legacy article) → search `articles/*/<slug>.md` to recover the subdir, run the deletion, and warn the user that the article was missing a required field.
- **Slug contains characters that don't fit camelCase** (e.g. numbers, hyphens, or non-ASCII) → the import variable name is whatever the file shows. Match that string literally; do not auto-derive.
- **User said "删除 xxx.md" with no "文章" in the message** → this is ambiguous. Ask once whether they meant an article or a project before proceeding; do not silently route to this skill.
- **User passes a path like `src/data/articles.js`** instead of a slug → ask for clarification; this skill operates on slugs, not file paths.
- **User passes a path like `articles/ai/foo.md`** → extract the slug (`foo`); the category segment is informational, but cross-check it against the metadata's `category` field — if they differ, abort and ask.
