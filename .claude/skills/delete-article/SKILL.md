---
name: delete-article
description: Use when the user wants to delete or remove an article from this blog. Triggers on Chinese phrases like "删除 xxx.md"、"把 xxx 删掉"、"移除文章 xxx"、"xxx 文章下掉"、"不要 xxx.md 了"，also matches English variants like "delete xxx.md" or "remove the xxx article". The skill cleans up the markdown source under /articles/ and the registry entry in src/data/articles.js. Do NOT trigger for editing article content, creating new articles, or renaming files.
---

# delete-article

## What it does

Removes a blog article end-to-end so the file system and the React frontend stay consistent:

1. Deletes `articles/<slug>.md` (the markdown source at project root).
2. Removes the matching `import` line in `src/data/articles.js`.
3. Removes the matching object from the `articles` array in the same file.
4. Verifies no leftover references in `src/`.

The article list page (`src/pages/Articles.jsx`) renders from `listArticles()` which reads the `articles` array — no JSX edits are needed once the data is cleaned.

## When to use

Trigger this skill when the user's intent is to permanently remove an article. Match phrases such as:

- "删除 hello-world.md" / "delete hello-world.md"
- "把 react-tips 这篇文章删掉"
- "移除 deploy-notes 文章"
- "xxx 文章下掉"、"不要 xxx.md 了"

Strip a trailing `.md` if the user included it; the slug is what matters.

## When NOT to use

- **Editing content** of an article → use the `Edit` tool on the `.md` file directly.
- **Creating a new article** → follow the three-step rule in `CLAUDE.md` (file + import + metadata record).
- **Renaming an article** → use `git mv` plus update the `slug` field and the import path in `src/data/articles.js`.
- **Bulk deletion** of several articles at once → out of scope; invoke this skill once per article.

## Project context

- Markdown sources live at `articles/<slug>.md` (project root, *not* under `src/`).
- The registry is `src/data/articles.js`. It contains both the `import` block and the `articles` array; both must be cleaned.
- `src/pages/Articles.jsx` and `src/components/ArticleCard.jsx` consume the array; they need no edits.
- The `brand-guidelines` skill is **not** needed here — this task touches no UI.

## Workflow

Follow these steps in order. Do not skip the confirmation step.

### 1. Resolve the target

From the user message, extract the slug. If the user wrote `foo.md`, the slug is `foo`. The expected import variable is the camelCase form (e.g. `react-tips` → `reactTips`).

### 2. Locate the three touch points

Search for all three; **abort and report** if any one of them is missing:

- `articles/<slug>.md` on disk (use `ls` or `Read`).
- The import line in `src/data/articles.js` matching `from '../../articles/<slug>.md?raw'`.
- The object in the `articles` array whose `slug` field equals `<slug>`.

If the import variable name in the file does not match the camelCase of the slug, also abort — it means the registry is already inconsistent and a plain delete could break the build.

### 3. Show the deletion plan and confirm

Print a short summary to the user listing exactly what will be removed:

```
即将删除文章 `<slug>`：
- 文件：articles/<slug>.md
- import：src/data/articles.js 第 N 行（import <var> from '../../articles/<slug>.md?raw'）
- metadata：第 M 行的 { slug: '<slug>', ... }

确认删除？（y/n）
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user says no or hesitates, stop.

### 4. Execute

In this order:

1. `Edit` `src/data/articles.js` to remove the import line.
2. `Edit` `src/data/articles.js` to remove the metadata object. The existing array uses trailing commas on every entry, so removing any single object — including the last one — leaves the array syntactically valid; no extra comma cleanup is needed.
3. `Bash rm articles/<slug>.md` to delete the source file.

### 5. Verify

Run a quick grep to make sure nothing else references the slug, the import variable, or the filename:

```
grep -rn "<slug>\|<var>\|<slug>\.md" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

If anything comes back, surface it to the user — do not silently fix unrelated references.

### 6. Report

Print a one-line confirmation: "已删除文章 `<slug>`：文件、import、metadata 三处清理完成。" If the grep found anything, mention it in the same message.

## Edge cases

- **File missing but registry has it** → abort. Ask the user whether they want to clean the registry only or stop.
- **Registry missing but file exists** → abort. The import will break the build; the user needs to decide.
- **Slug contains characters that don't fit camelCase** (e.g. numbers, hyphens only) → import variable is whatever the file shows; just match that string literally, do not auto-derive.
- **User passes a path like `src/data/articles.js`** instead of a slug → ask for clarification; this skill operates on slugs, not file paths.
