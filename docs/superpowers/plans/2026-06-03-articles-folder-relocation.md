# Articles Folder Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the article markdown files from `src/content/articles/` to a new `articles/` folder at the project root, update import paths, and document the article-authoring workflow in `CLAUDE.md`.

**Architecture:** Pure file-system relocation plus a 3-line import path update. Markdown files continue to be bundled at build time via Vite's `?raw` query suffix. No code logic changes, no new dependencies, no architectural shift.

**Tech Stack:** Vite (build), Vitest (test), React 18 (frontend), Git (version control with `git mv` to preserve file history).

---

## File Structure

Files touched by this plan:

- `articles/` (new folder at project root) — contains 3 markdown files
  - `articles/hello-world.md` (moved)
  - `articles/react-tips.md` (moved)
  - `articles/deploy-notes.md` (moved)
- `src/content/articles/` (deleted after files are moved out)
- `src/data/articles.js` (3 import paths updated)
- `CLAUDE.md` (1 new numbered constraint appended)
- `tests/articles.test.js` (no change; this is the regression-test safety net)

No new files. No new dependencies. No split of existing files.

---

## Task 1: Move 3 markdown files to `/articles/` using `git mv`

**Files:**
- Move: `src/content/articles/hello-world.md` → `articles/hello-world.md`
- Move: `src/content/articles/react-tips.md` → `articles/react-tips.md`
- Move: `src/content/articles/deploy-notes.md` → `articles/deploy-notes.md`
- Create: `articles/` (folder)

- [ ] **Step 1: Verify starting state**

Run:
```bash
ls src/content/articles/ && git status --short
```

Expected output: directory listing showing 3 `.md` files; `git status --short` shows no output (clean tree). If anything is dirty, commit or stash before continuing.

- [ ] **Step 2: Create the new `articles/` folder at project root**

Run:
```bash
mkdir -p articles
```

Expected: command exits 0. The folder is empty at this point.

- [ ] **Step 3: Move the 3 markdown files using `git mv`**

Run:
```bash
git mv src/content/articles/hello-world.md articles/hello-world.md
git mv src/content/articles/react-tips.md  articles/react-tips.md
git mv src/content/articles/deploy-notes.md articles/deploy-notes.md
```

Expected: each command exits 0. Using `git mv` (not `mv` + `git add`) preserves file history in git.

- [ ] **Step 4: Verify the move**

Run:
```bash
ls articles/ && echo "---" && ls src/content/articles/ 2>&1 || true
```

Expected: `articles/` lists `hello-world.md`, `react-tips.md`, `deploy-notes.md`. `src/content/articles/` either prints "No such file or directory" (best case) or shows nothing (if folder still exists but is empty — we'll clean that up in Task 4).

- [ ] **Step 5: Run existing tests to confirm they now fail (this is the expected intermediate state)**

Run:
```bash
npm test
```

Expected: tests FAIL. The `findArticleBySlug('hello-world')` test should fail because `src/data/articles.js` still imports from the old path, so the `?raw` import cannot resolve, which causes the data module to fail to load. This failure is **expected** and is the signal that the refactor is mid-flight.

- [ ] **Step 6: Commit the file moves**

Run:
```bash
git add articles/ src/content/articles/
git status
```

Verify with `git status` that the 3 files are staged as renames (git should detect them as renames automatically, shown as `R` in the status output, with `articles/<filename>` as the new path).

Then:
```bash
git commit -m "Move article markdown files to /articles/ at project root"
```

---

## Task 2: Update `src/data/articles.js` import paths

**Files:**
- Modify: `src/data/articles.js:2-4` (3 import statements)

- [ ] **Step 1: Read the current file**

Run:
```bash
cat src/data/articles.js
```

Expected: 3 import lines at the top pointing to `'../content/articles/X.md?raw'`, followed by the `articles = [...]` array and `export default articles;`.

- [ ] **Step 2: Update the 3 import paths**

Edit `src/data/articles.js`. Replace the 3 import lines at the top of the file:

```js
// Replace these 3 lines:
import helloWorld from '../content/articles/hello-world.md?raw';
import reactTips  from '../content/articles/react-tips.md?raw';
import deployNotes from '../content/articles/deploy-notes.md?raw';

// With these 3 lines (note: two levels up, then into articles/):
import helloWorld from '../../articles/hello-world.md?raw';
import reactTips  from '../../articles/react-tips.md?raw';
import deployNotes from '../../articles/deploy-notes.md?raw';
```

Do NOT change anything else in this file — the `articles = [...]` array and the `export default articles;` line stay exactly as they are.

- [ ] **Step 3: Run existing tests to confirm they now pass**

Run:
```bash
npm test
```

Expected: all 3 tests in `tests/articles.test.js` PASS:
- `listArticles returns array sorted by date desc`
- `findArticleBySlug returns the article when slug matches`
- `findArticleBySlug returns undefined when not found`

- [ ] **Step 4: Run a production build to confirm Vite resolves the new `?raw` paths**

Run:
```bash
npm run build
```

Expected: build completes with no errors and emits a `dist/` folder. The build output may print chunk names like `assets/hello-world-*.md` or similar — this is normal and confirms the markdown is being bundled.

- [ ] **Step 5: Commit the import-path update**

Run:
```bash
git add src/data/articles.js
git commit -m "Point article imports at /articles/ at project root"
```

---

## Task 3: Add the new constraint to `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (append a 10th numbered item)

- [ ] **Step 1: Read the current `CLAUDE.md` to confirm exact format**

Run:
```bash
cat CLAUDE.md
```

Expected: 9 numbered items, each on its own line, prefixed with `N. ` and starting with Chinese text.

- [ ] **Step 2: Append item 10**

Append this single line at the end of `CLAUDE.md` (after item 9, with a trailing newline):

```
10. 文章源文件存放在项目根目录的 `articles/` 文件夹下;每新增一篇文章,必须同时:(a) 把 .md 文件放入 `articles/`;(b) 在 `src/data/articles.js` 中加一行 `import ... from '../../articles/xxx.md?raw'`;(c) 在 `articles` 数组中加一条 metadata 记录(字段:slug / title / excerpt / date / tags / cover)
```

The file should now have exactly 10 numbered items, numbered 1 through 10, no trailing blank line.

- [ ] **Step 3: Verify the file**

Run:
```bash
cat CLAUDE.md
```

Expected: 10 numbered items, item 10 matches the text from Step 2 verbatim.

- [ ] **Step 4: Commit**

Run:
```bash
git add CLAUDE.md
git commit -m "Document article-authoring workflow in CLAUDE.md"
```

---

## Task 4: Remove the now-empty `src/content/articles/` folder

**Files:**
- Delete: `src/content/articles/` (folder)

- [ ] **Step 1: Verify the folder is empty**

Run:
```bash
ls -la src/content/articles/
```

Expected: either "No such file or directory" (if `git mv` already cleaned it up), or an empty directory listing (`.` and `..` only). If there are any files left, STOP — something is wrong, investigate before deleting.

- [ ] **Step 2: Remove the folder with `git rm`**

If the folder still exists (empty):

```bash
git rm -r src/content/articles/
```

If the folder no longer exists, skip this command and proceed to Step 3.

- [ ] **Step 3: Verify removal**

Run:
```bash
ls src/content/articles/ 2>&1; git status --short
```

Expected: `ls` prints "No such file or directory"; `git status --short` shows no output (clean tree).

- [ ] **Step 4: If a removal happened in Step 2, commit it; otherwise skip**

If you ran `git rm` in Step 2:
```bash
git commit -m "Remove now-empty src/content/articles/ folder"
```

If you skipped Step 2 (folder was already gone), there's nothing to commit — proceed to Task 5.

---

## Task 5: Final end-to-end verification

**Files:** none (read-only checks)

- [ ] **Step 1: Confirm the final on-disk layout**

Run:
```bash
ls articles/ && echo "---" && ls src/content/ 2>&1 || true
```

Expected:
- `articles/` lists 3 markdown files: `deploy-notes.md`, `hello-world.md`, `react-tips.md`
- `src/content/` either prints "No such file or directory" or contains only folders other than `articles/`

- [ ] **Step 2: Run unit tests**

Run:
```bash
npm test
```

Expected: all 3 tests PASS. No warnings, no errors.

- [ ] **Step 3: Run a production build**

Run:
```bash
npm run build
```

Expected: build completes with no errors. `dist/` is refreshed.

- [ ] **Step 4: Confirm article content is present in the built bundle**

Run:
```bash
grep -r "你好，世界" dist/assets/ | head -1
```

Expected: at least one match. The article body text should appear in the built JS bundle, confirming that the `?raw` import from the new path resolved correctly at build time.

- [ ] **Step 5: Review the commit log**

Run:
```bash
git log --oneline -5
```

Expected: the 4 (or 3, if Task 4 Step 2 was skipped) new commits from this plan appear at the top, in order:
1. `Move article markdown files to /articles/ at project root`
2. `Point article imports at /articles/ at project root`
3. `Document article-authoring workflow in CLAUDE.md`
4. `Remove now-empty src/content/articles/ folder` (if applicable)

- [ ] **Step 6: Manual smoke test (optional but recommended)**

Run:
```bash
npm run dev
```

In a browser, visit `http://localhost:5173/blog/#/articles` and confirm the 3 article cards render. Click each card and confirm the detail page renders the markdown body. Press `Ctrl+C` in the terminal to stop the dev server.

---

## Self-Review

**Spec coverage:**
- ✅ "Background / Goals / Non-Goals" → covered by preamble
- ✅ "File-Level Changes" (new / modified / deleted) → covered by Task 1, Task 2, Task 3, Task 4
- ✅ "Code Diff Sketch" → covered by Task 2 Step 2
- ✅ "New Constraint in CLAUDE.md" → covered by Task 3 Step 2 (verbatim)
- ✅ "Verification" (5 numbered items in spec) → covered by Task 5 Steps 1–5
- ✅ "Risks" (path typo, lost file history) → mitigated by Task 1 Step 3 (use `git mv`) and Task 2 Step 4 (build catches path typos)

**Placeholder scan:** No "TBD", "TODO", "implement later", or vague instructions. Every step has either exact commands or exact text to add.

**Type / name consistency:** The only identifier introduced is the new folder `articles/`; the import path syntax `'?raw'` is preserved verbatim from the original. No new functions, types, or method names.
