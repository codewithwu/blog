# Design: Relocate Articles Markdown Folder to Project Root

**Date:** 2026-06-03
**Status:** Approved (pending user review of written spec)
**Scope:** Move markdown source files from `src/content/articles/` to a new `articles/` folder at the project root, and update import paths accordingly.

## Background

The blog currently stores its article markdown files inside `src/content/articles/`. The user wants to relocate this folder to the project root (`/articles/`) so that article content lives separately from application code. This makes it easier to find and edit articles, and keeps the `src/` tree focused on code.

## Goals

- Article markdown files live at the project root in an `articles/` folder
- The frontend articles page continues to work without any change in user-visible behavior
- Future-article workflow is documented as a hard rule in `CLAUDE.md`

## Non-Goals

- No change to the article-list UI, article-detail UI, or routing
- No change to article metadata structure (title/excerpt/date/tags/cover)
- No introduction of frontmatter, dynamic glob imports, or any other architectural change
- No change to the build pipeline beyond import-path updates

## File-Level Changes

### New
- `articles/` (folder at project root)
- `articles/hello-world.md` (moved from `src/content/articles/hello-world.md`)
- `articles/react-tips.md` (moved from `src/content/articles/react-tips.md`)
- `articles/deploy-notes.md` (moved from `src/content/articles/deploy-notes.md`)

### Modified
- `src/data/articles.js` — three import paths updated from `'../content/articles/X.md?raw'` to `'../../articles/X.md?raw'`. The `articles` metadata array is unchanged.
- `CLAUDE.md` — append a 10th constraint describing the article-authoring workflow (see "New Constraint" below).

### Deleted
- `src/content/articles/` (empty after the three files are moved out)

## Code Diff Sketch

`src/data/articles.js` (top of file):

```js
// before
import helloWorld from '../content/articles/hello-world.md?raw';
import reactTips  from '../content/articles/react-tips.md?raw';
import deployNotes from '../content/articles/deploy-notes.md?raw';

// after
import helloWorld from '../../articles/hello-world.md?raw';
import reactTips  from '../../articles/react-tips.md?raw';
import deployNotes from '../../articles/deploy-notes.md?raw';
```

The `articles = [ ... ]` array and `export default articles;` remain untouched.

## New Constraint in CLAUDE.md

Append as item 10 to the existing numbered list:

> 10. 文章源文件存放在项目根目录的 `articles/` 文件夹下;每新增一篇文章,必须同时:(a) 把 .md 文件放入 `articles/`;(b) 在 `src/data/articles.js` 中加一行 `import ... from '../../articles/xxx.md?raw'`;(c) 在 `articles` 数组中加一条 metadata 记录(slug/title/excerpt/date/tags)

## Verification

After implementation, run these checks in order:

1. **Layout check** — `articles/hello-world.md`, `articles/react-tips.md`, `articles/deploy-notes.md` all exist; `src/content/articles/` does not exist.
2. **Build** — `npm run build` completes with no errors and emits `dist/`.
3. **Dev server** — `npm run dev` starts cleanly; visiting the dev URL redirects `/` → `/#/articles` and renders the list page.
4. **List page** — `/articles` renders exactly three article cards (titles: 你好，世界 / React 使用小贴士 / GitHub Pages 部署笔记).
5. **Detail pages** — clicking each card opens `/articles/:slug` and the markdown body, including code fences, renders correctly.

## Risks

- **Path typo** — the new import paths go up two levels (`../../`) because `src/data/articles.js` is two directories deep. A typo would cause a build-time resolution error; the build check above catches this.
- **Lost file** — `git mv` is used (not a delete + create) so file history is preserved. If the move is done with two separate steps, history may be lost.

## Out of Scope (Future Work)

If the user later wants the article-authoring workflow to be a single-step drop-file-in-folder operation, the natural follow-up is:

- Introduce frontmatter in the markdown files (e.g. `title:`, `date:`, `tags:`)
- Switch `src/data/articles.js` to `import.meta.glob('/articles/*.md', { query: '?raw', eager: true })`
- Add a `gray-matter` dependency to parse frontmatter

This is a separate, larger change and is explicitly not part of this design.
