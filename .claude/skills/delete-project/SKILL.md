---
name: delete-project
description: Use when the user wants to delete or remove a project from this blog. Triggers on Chinese phrases that contain "项目" (project) such as "删除项目 xxx.md"、"把 xxx 项目删掉"、"移除项目 xxx"、"xxx 项目下掉"、"不要 xxx.md 项目了"，also matches English variants like "delete project xxx.md" or "remove the xxx project". The skill cleans up the markdown source under /projects/ and the registry entry in src/data/projects.js. Do NOT trigger for editing project content, creating new projects, deleting articles (use delete-article), or renaming files.
---

# delete-project

## What it does

Removes a blog project end-to-end so the file system and the React frontend stay consistent:

1. Deletes `projects/<slug>.md` (the markdown source at project root).
2. Removes the matching `import` line in `src/data/projects.js`.
3. Removes the matching object from the `projects` array in the same file.
4. Verifies no leftover references in `src/`.

The project list page (`src/pages/Projects.jsx`) and the project detail page (`src/pages/ProjectDetail.jsx`) both render through `listProjects()` / `findProjectBySlug()` in `src/lib/projects.js`, which read the `projects` array — no JSX edits are needed once the data is cleaned.

## When to use

Trigger this skill when the user's intent is to permanently remove a project. The phrase **must contain "项目"** (or "project" in English) so it never collides with `delete-article`. Match phrases such as:

- "删除项目 hello-world.md" / "删除项目 hello-world"
- "把 react-tips 这个项目删掉"
- "移除项目 deploy-notes"
- "xxx 项目下掉"、"不要 xxx.md 项目了"
- "delete project xxx.md" / "remove the xxx project"

Strip a trailing `.md` if the user included it; the slug is what matters.

## When NOT to use

- **Editing content** of a project → use the `Edit` tool on the `.md` file directly.
- **Creating a new project** → follow the three-step rule in `CLAUDE.md` (file + import + metadata record).
- **Deleting an article** → use the `delete-article` skill. If the user says "删除 xxx.md" *without* the word "项目", that is an article and the wrong skill will fire.
- **Renaming a project** → use `git mv` plus update the `slug` field and the import path in `src/data/projects.js`.
- **Bulk deletion** of several projects at once → out of scope; invoke this skill once per project.

## Project context

- Markdown sources live at `projects/<slug>.md` (project root, *not* under `src/`). Drafts that haven't been published live in `projects-draft/` and are not this skill's concern.
- The registry is `src/data/projects.js`. It contains both the `import` block and the `projects` array; both must be cleaned. The metadata fields, per `CLAUDE.md` rule 11, are `slug / name / description / techStack / githubUrl / demoUrl / cover / content`. The `slug` field is the only key the skill needs to identify a project — `content` is the import variable, not a match target.
- `src/pages/Projects.jsx`, `src/components/ProjectCard.jsx`, and `src/pages/ProjectDetail.jsx` consume the array via `src/lib/projects.js`; they need no edits.
- The `brand-guidelines` skill is **not** needed here — this task touches no UI.

## Workflow

Follow these steps in order. Do not skip the confirmation step.

### 1. Resolve the target

From the user message, extract the slug. If the user wrote `foo.md`, the slug is `foo`. The expected import variable is the camelCase form (e.g. `react-tips` → `reactTips`). Always confirm the user actually said "项目" / "project" somewhere in the message — if they didn't, this is the wrong skill and the user almost certainly meant an article.

### 2. Locate the three touch points

Search for all three; **abort and report** if any one of them is missing:

- `projects/<slug>.md` on disk (use `ls` or `Read`).
- The import line in `src/data/projects.js` matching `from '../../projects/<slug>.md?raw'`.
- The object in the `projects` array whose `slug` field equals `<slug>`.

If the import variable name in the file does not match the camelCase of the slug, also abort — it means the registry is already inconsistent and a plain delete could break the build.

### 3. Show the deletion plan and confirm

Print a short summary to the user listing exactly what will be removed:

```
即将删除项目 `<slug>`：
- 文件：projects/<slug>.md
- import：src/data/projects.js 第 N 行（import <var> from '../../projects/<slug>.md?raw'）
- metadata：第 M 行的 { slug: '<slug>', ... }

确认删除？（y/n）
```

Wait for explicit `y` / `yes` / "确认" / "好" before proceeding. If the user says no or hesitates, stop.

### 4. Execute

In this order:

1. `Edit` `src/data/projects.js` to remove the import line.
2. `Edit` `src/data/projects.js` to remove the metadata object. The existing array uses trailing commas on every entry, so removing any single object — including the last one — leaves the array syntactically valid; no extra comma cleanup is needed.
3. `Bash rm projects/<slug>.md` to delete the source file.

### 5. Verify

Run a quick grep to make sure nothing else references the slug, the import variable, or the filename:

```
grep -rn "<slug>\|<var>\|<slug>\.md" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

If anything comes back, surface it to the user — do not silently fix unrelated references. Pay special attention to any match in `src/components/ProjectCard.jsx` or `src/pages/ProjectDetail.jsx` — those are the consumers, and a leftover hard-coded reference would produce a broken link rather than a build error.

### 6. Report

Print a one-line confirmation: "已删除项目 `<slug>`：文件、import、metadata 三处清理完成。" If the grep found anything, mention it in the same message.

## Edge cases

- **User said "删除 xxx.md" with no "项目" in the message** → this is ambiguous. Ask once whether they meant an article or a project before proceeding; do not silently route to this skill.
- **File missing but registry has it** → abort. Ask the user whether they want to clean the registry only or stop.
- **Registry missing but file exists** → abort. The import will break the build; the user needs to decide.
- **Slug contains characters that don't fit camelCase** (e.g. numbers, hyphens only, CJK) → import variable is whatever the file shows; just match that string literally, do not auto-derive.
- **User passes a path like `src/data/projects.js`** instead of a slug → ask for clarification; this skill operates on slugs, not file paths.
- **File is in `projects-draft/` instead of `projects/`** → out of scope. Drafts that were never published have no registry entry to clean; just delete the file or move it back, do not invoke this skill.
