---
name: update-about
description: Use when the user wants to apply a pre-edited About draft file from `content-draft/` into the live About page. The user message must contain explicit update-about phrasing that combines an update verb with a file reference — Chinese "更新关于 xxx.md"、"更新关于 xxx"、"按 xxx.md 更新关于页"、"用 content-draft/xxx 更新关于页", or English "update about from xxx" / "apply about draft xxx". Do NOT trigger for inline ad-hoc edits like "把座右铭改成 XXX"、"在经历里加一段 2020 实习" (those are inline edits — just `Edit` `content/关于.md` directly), for editing Skills/Tools/Articles/Projects, for editing `content/关于.md` without a draft file, or when `content-draft/<name>.md` doesn't exist on disk. Mentioning "关于" alone (e.g. "看一下关于页") is NOT enough — the trigger needs a filename or a clear reference to the `content-draft/` folder.
---

# update-about

## What it does

Applies one About draft file (`content-draft/<name>.md`) onto the live About source (`content/关于.md`), then deletes the draft. The merge is **section-level replace**:

1. Reads the draft and runs a format check against the `parseAbout` parser.
2. Reads the current `content/关于.md`.
3. Computes a section-level merge:
   - Sections that appear in the draft (preamble / `## 联系方式` / `## 经历` / `## 座右铭` / …) → the draft's version **replaces** the live version for that section.
   - Sections only in the live file → kept untouched.
   - New `##` sections in the draft that the parser doesn't know about → flagged; require explicit confirmation + parser extension.
4. Shows a structured diff and waits for confirmation.
5. Rewrites `content/关于.md`, deletes `content-draft/<name>.md`.
6. Adapts the frontend (`src/lib/content.js` / `src/pages/About.jsx`) **only** when the draft introduces something the parser/page cannot render today (new contact icon, new top-level section, new hard-coded field).

The About page is data-driven: `src/pages/About.jsx` calls `parseAbout(import 关于.md)` and renders `tagline / intro / contacts / timeline / motto`. So in most cases this skill only touches the markdown and no JSX changes are needed. The exceptions are listed in step 5.

## When to use

Trigger **only** when the user message names a draft file in `content-draft/` (with or without the `.md` suffix). Match phrases such as:

- "更新关于 v2.md" / "更新关于 v2"
- "按 content-draft/v2.md 更新关于页"
- "用 content-draft/2026 更新关于"
- "apply about draft v2"
- "update about from content-draft/v2"

The phrase must NOT trigger if:

- The user gives inline content without a draft file (e.g. "把关于改成：\n后端工程师 / …") — just `Edit` `content/关于.md` directly.
- The user wants a single point edit ("把座右铭改成 XXX"、"GitHub 链接改成 …"、"加一段 2020 实习经历") — just `Edit` `content/关于.md` directly.
- The user wants to view, lint, or restyle the About page without changing the markdown — just read or `Edit` directly.
- The target file `content-draft/<name>.md` doesn't exist — block and tell the user to create it first.

This skill is **draft-only**. The distinguishing rule is **"is there a file in `content-draft/` referenced in the request?"**. If yes → run this skill. If no → use the `Edit` tool on `content/关于.md` directly.

## When NOT to use

- **Writing a brand-new draft from scratch** — this skill assumes `content-draft/<name>.md` already exists. To create a new draft, just write the file to `content-draft/<name>.md` and stop.
- **Editing Skills / Tools / Articles / Projects** — different content/data flow; not this skill's job (use `update-skills` for skills; for tools/articles/projects use their respective skills or `Edit` directly).
- **Pure visual changes to `About.jsx`** with no markdown involvement (e.g. "把头像换成圆角矩形") — `Edit` the JSX directly.
- **Renaming the hard-coded display name `极客熊猫` or the avatar text `极客`** — these are NOT in `content/关于.md` today. Surface and ask whether the user wants to (a) `Edit` `About.jsx` directly, or (b) move them into the markdown (a parser extension).

## Project context

- Draft location: `content-draft/<name>.md` (project root, *not* under `src/`).
- Source of truth (after merge): `content/关于.md`.
- Parser: `parseAbout` in `src/lib/content.js`. Returns `{ tagline, intro, contacts, timeline, motto }`.
- Page: `src/pages/About.jsx`. Maps the parsed fields onto a header card, a timeline list, and a motto block.
- Timeline node: `src/components/TimelineItem.jsx`. Props: `year / title / subtitle / desc`.
- Hard-coded in `About.jsx` (NOT in the markdown):
  - Display name `极客熊猫` (h1)
  - Avatar text `极客` (gradient circle)
  - `ICON_MAP = { Github, Mail }` from `lucide-react`
- Parser conventions:
  - Preamble (everything before the first `##`): first non-empty line → `tagline`; remaining lines joined → `intro`.
  - `## 联系方式` items: `- label: href`. Only `label === 'GitHub'` (icon `Github`) and `label === '邮箱'` (icon `Mail`) get mapped to a `lucide-react` icon today. Other labels render label-only (no icon).
  - `## 经历` items: `- **year** title @ subtitle\n  desc`. The year/title/subtitle line is **strict regex** (`/^-\s+\*\*(.+?)\*\*\s+(.+?)\s+@\s+(.+?)\s*$/`). A leading-whitespace non-`-` line that follows is captured as `desc`.
  - `## 座右铭` items: any non-empty lines, leading `>` stripped, joined by space.
  - Any other `## XXX` sections are **silently dropped** by the parser.

## Draft file shape

The draft uses the same syntax as `content/关于.md`:

```markdown
后端工程师 / Agent开发 / 终身学习者

喜欢写干净的代码，热爱开源。业余时间折腾个人项目、写博客、跑马拉松。

## 联系方式
- GitHub: https://github.com/codewithwu
- 邮箱: codewithwu@gmail.com

## 经历
- **2024 – 今** 高级前端工程师 @ 某科技公司
  负责内部 SaaS 平台架构与性能优化。
- **2021 – 2024** 前端工程师 @ 某创业公司
  从 0 到 1 搭建 B 端产品。

## 座右铭
> "Stay hungry, stay foolish."
```

Same parser, same rules:

| Line shape | Behavior |
| --- | --- |
| Top of file (before first `##`) | first non-empty line → tagline; rest → intro |
| `## 联系方式` then `- label: href` | adds a contact (icon only for `GitHub` / `邮箱`) |
| `## 经历` then `- **year** title @ subtitle` | adds a timeline entry; next indented non-`-` line → `desc` |
| `## 座右铭` then `> quote` | sets motto (leading `>` stripped) |
| `## XXX` (parser doesn't know) | silently dropped — flag in format check |
| `### / #` heading | ignored |

A draft can be a **partial update** (only the sections you want to touch) or a **full bio rewrite** (every section). The merge algorithm treats both the same way — sections not mentioned in the draft are preserved verbatim. Sections mentioned in the draft are **replaced wholesale** (not item-merged), because About sections are coherent units (a tagline isn't "merged with" another tagline; a refreshed `## 联系方式` shouldn't keep stale links).

If the user wants to **append** to `## 经历` without retyping the older entries, they need to either:
- copy the existing entries into the draft and add the new one, OR
- say "在草稿基础上保留现有经历" explicitly — surface this option in the diff preview.

## Workflow

Follow these steps in order. **Do not skip the format check, the diff preview, or the confirmation.**

### 1. Resolve target

Parse the user message for the draft filename. Strip a trailing `.md` if present; the bare name is the draft identifier.

- Verify `content-draft/<name>.md` exists. If not, `ls content-draft/` and tell the user what's available.
- Reject filenames with spaces, path separators, or `..`. These shouldn't reach the merge phase.

Only one draft per invocation. If the user passes multiple names, ask which one to apply first; don't batch (merge order would matter and is hard to reason about).

### 2. Format-check and normalize the draft

Read `content-draft/<name>.md` and check:

**(a) Sections the parser knows about.**

Allowed `##` headings: `联系方式` / `经历` / `座右铭`. List every other `## XXX` heading found — these will be **silently dropped by the parser** unless the parser is extended (see step 5).

**(b) Preamble shape.**
- First non-empty line is the `tagline` — should be short (one line, like a strap-line). Flag if it's a paragraph.
- All remaining preamble lines join into `intro` (multi-line allowed; joined with newlines).
- A draft with no preamble at all means "no tagline / intro change"? No — it means the page will render with empty tagline/intro. Flag if this looks unintentional.

**(c) Contacts shape (`## 联系方式`).**
- Every line should be `- label: href`. Lines without `:` are dropped silently — flag them.
- Labels other than `GitHub` and `邮箱` will render without an icon today. List every offender and ask whether to (a) accept icon-less rendering, or (b) extend `ICON_MAP` in step 5.
- Hrefs starting with `http(s)://` will open in a new tab (`target=_blank`); others (`mailto:`, internal anchors) won't. Flag if a contact looks like it expects external behavior but lacks a protocol.

**(d) Timeline shape (`## 经历`).**
- Every entry header line must match `/^-\s+\*\*(year)\*\*\s+(title)\s+@\s+(subtitle)\s*$/`. List every `- ` line under `## 经历` that doesn't match — the parser will skip them silently.
- Common breakers: missing `**` around the year, missing ` @ ` (must be space-`@`-space), description line not indented (parser requires leading whitespace), or description placed on the same line as the header.
- Years like `2024 – 今` use an en-dash `–`; this is fine, just don't normalize it to `-`.

**(e) Motto shape (`## 座右铭`).**
- Leading `>` is stripped by the parser; missing `>` still works (lines are joined by space). Flag multi-line mottos so the user knows they'll be space-joined.

**(f) Whitespace / encoding.**
- Trim trailing whitespace on each line.
- Normalize line endings to `\n` (no CRLF).
- File must be UTF-8.

If issues are found, list them all and pause. Do **not** auto-fix. Let the user fix the draft and re-run, or acknowledge the trade-offs and proceed.

### 3. Read current state and compute the merge

Read `content/关于.md` and segment it the same way the parser does:

- `preamble` (everything before the first `##`)
- `## 联系方式` block
- `## 经历` block
- `## 座右铭` block
- Any unknown `## XXX` block (rare; preserved verbatim — the parser ignores it but we don't touch it)

For each section that appears in the draft, the draft's text replaces the live text. For sections in the live file but not in the draft, the live text is preserved as-is.

Track per-section deltas for the diff preview:

- **preamble** — show old vs new `tagline`, and old vs new `intro` (truncate long intros to ~80 chars).
- **`## 联系方式`** — list added contacts (in draft, not in live), removed contacts (in live, not in draft), and changed contacts (same label, different href).
- **`## 经历`** — list added entries (by `year` key), removed entries, and changed entries (same year, different title/subtitle/desc). If the draft has *fewer* entries than the live file, treat the missing ones as **removed** and surface them prominently — this is the most likely "I forgot to include these" mistake.
- **`## 座右铭`** — show old vs new motto.
- **unknown `##` sections in draft** — flag separately; require parser extension (step 5) before applying.

### 4. Show the merge plan and confirm

Print a structured diff. Group by section; skip sections with no change.

```
即将应用 content-draft/v2.md → content/关于.md（section-level replace）：

preamble:
  tagline:  "后端工程师 / 终身学习者"
        →  "后端工程师 / Agent开发 / Vibe Coding / 终身学习者"
  intro:    (无改动)

## 联系方式:
  + Twitter: https://x.com/cooper          (新增，⚠ 无 icon 映射，详见步骤 5)
  ~ GitHub:  …/codewithwu → …/cooperwu     (修改)
  - 邮箱:    codewithwu@gmail.com           (删除，⚠ 草稿未包含)

## 经历:
  + **2024 – 今** 高级前端工程师 @ 某科技公司   (新增)
  - **2017 – 2021** 计算机科学学士 @ 某大学    (删除，⚠ 草稿未包含)
  (其余 2 段不变)

## 座右铭:
  ~ "Stay hungry, stay foolish."
   → "Stay curious."

保留分区（草稿未涉及，原样保留）：（无）

合并后会删除 content-draft/v2.md。

格式检查：
  ✓ 4 段经历，全部命中 - **year** title @ subtitle 模板
  ⚠ 草稿删掉了 1 个联系方式（邮箱）、1 段经历（学历），确认是有意为之？
  ⚠ 新增了 Twitter 联系方式，但 ICON_MAP 不识别 — 将渲染为无 icon
      要为 Twitter 加 icon，需要扩展 src/lib/content.js + src/pages/About.jsx（见步骤 5）

前端代码：
  ✓ 无需改动（如不为 Twitter 加 icon）
  ✗ 若要为 Twitter 加 icon → 需要 2 处 Edit（见下方"步骤 5"）

确认合并？(y/n)  如需修改可直接说"保留邮箱"或"经历不要删学历"。
```

Wait for explicit `y` / `yes` / "确认" / "好". If the user objects to a deletion ("保留邮箱"、"经历加回学历"), apply the edit (treat the live entry as carried over) and re-print the affected block.

### 5. Determine frontend adaptations (rare)

In almost every case, the answer here is "no JSX/parser changes needed". Flag any of the following and confirm separately before touching code:

| Trigger | Required code change |
| --- | --- |
| Draft adds a contact label other than `GitHub` / `邮箱` and user wants an icon | (1) Pick a `lucide-react` icon; (2) In `src/lib/content.js` `parseAbout`, add a branch like `else if (label === 'Twitter') icon = 'Twitter';`; (3) In `src/pages/About.jsx`, import the icon and add it to `ICON_MAP`. |
| Draft introduces a new `##` section (e.g. `## 兴趣` / `## 项目` / `## 教育背景`) | (1) Extend `parseAbout` to capture the new section into the returned object; (2) Extend `About.jsx` to render it. Confirm both the data shape (list? paragraph? key-value?) and the visual treatment (which Tailwind block) before implementing. |
| Draft wants to change the hard-coded display name `极客熊猫` or avatar text `极客` (e.g. user has put `# 张三` at the top of the draft) | Decide: (a) keep them hard-coded and `Edit` `About.jsx` directly (simple, no markdown change); or (b) move them into the markdown by extending `parseAbout` to read a `# name` heading (or a frontmatter block) and the avatar from a convention. Option (b) is heavier — confirm with the user first. |
| Timeline `desc` uses multi-paragraph or markdown formatting (e.g. bullet sub-items, bold inline) | Today `TimelineItem` renders `desc` as a single `<p>` and the parser joins desc lines with `\n`. If the user wants real rendering, switch to a markdown renderer (e.g. `react-markdown`). Heavy lift — flag and confirm. |
| Draft uses a different contact href shape (e.g. label-only, no href) | Parser drops lines without `:`. If the user wants label-only entries (e.g. "微信: 联系我"), either tell them to use `- 微信: 联系我` and accept it as plain text, or extend the parser to allow an optional href. |

If none of the above apply, skip step 5's frontend work entirely.

### 6. Execute

In order:

1. `Write` the merged content to `content/关于.md`. The output preserves:
   - The original section order (preamble first, then `## 联系方式` → `## 经历` → `## 座右铭`, then any unknown sections).
   - The text of sections not mentioned in the draft (verbatim, including blank lines).
   - For replaced sections, the draft's text is inserted directly (post-normalization from step 2).
2. `Bash rm content-draft/<name>.md` to remove the draft.
3. If frontend code edits were confirmed in step 5, `Edit` `src/lib/content.js` / `src/pages/About.jsx` (and `src/components/TimelineItem.jsx` if timeline rendering changes) accordingly.

If any step fails, stop and report the partial state. Do not retry silently. Do not roll back.

### 7. Verify

```
grep -n "^##\\|^-\\|^>" content/关于.md
ls content-draft/<name>.md 2>&1
ls content-draft/
```

Expected:
- `content/关于.md` shows the new sections/items.
- `content-draft/<name>.md` is gone.
- `content-draft/` is empty (or contains other unrelated drafts, plus `.gitkeep`).

If frontend code was edited, also:

```
grep -n "ICON_MAP\\|parseAbout" src/pages/About.jsx src/lib/content.js
```

Run `npm run build` if it's fast; otherwise skip and tell the user to verify via `npm run dev → http://localhost:5173/#/about`.

### 8. Report

Print a one-block summary:

```
已应用 content-draft/v2.md → content/关于.md：
  - preamble：tagline 更新（"后端工程师 / Agent开发 / Vibe Coding / 终身学习者"）
  - 联系方式：+ Twitter，~ GitHub 链接，- 邮箱（按用户确认删除）
  - 经历：+ 1 段（2024 高级前端），保留旧的 2 段
  - 座右铭：更新为 "Stay curious."

草稿：已删除 content-draft/v2.md
前端代码：无改动（Twitter 无 icon，渲染为纯文本链接）
预览：npm run dev → http://localhost:5173/#/about
```

## Edge cases

- **Draft is empty or whitespace-only** — block. There's nothing to merge.
- **Draft has only a preamble (no `##` sections)** — valid; only the preamble (tagline + intro) is replaced. Confirm with the user that this is intentional (no contacts / timeline / motto change).
- **Draft mentions a `##` section but with zero items** (e.g. `## 联系方式` immediately followed by `## 经历`) — treat as "replace with empty". This effectively wipes the section. Surface prominently and confirm — most likely the user forgot to fill it.
- **Draft has a typo in a known section heading** (e.g. `## 联系` instead of `## 联系方式`) — the parser treats it as an unknown section, so its contents are dropped. Catch this in step 2 with a similarity check against the 3 known headings and suggest the fix.
- **Live file has a `## XXX` section the parser doesn't know about** (left over from an earlier edit) — preserve verbatim during merge. Mention it in step 4 so the user knows it's still there.
- **Draft's timeline order differs from live's** — the draft's order wins (sections are replaced wholesale). Mention "顺序：按草稿" in the diff so the user isn't surprised.
- **Draft has a contact label that differs from live only by case or whitespace** (e.g. `Github` vs `GitHub`) — parser uses exact-match for icon mapping, so `Github` → no icon. Flag as a likely typo.
- **User wants to remove a section entirely** (e.g. drop `## 座右铭`) — this skill does NOT delete by omission. To remove a section, the user must `Edit` `content/关于.md` directly. State this in the plan.
- **User passes a filename with spaces or path separators** — reject. The draft must be a single file at the top of `content-draft/`.
- **User passes a path like `content/关于.md`** instead of a draft filename — clarify. This skill operates on files in `content-draft/`, not on the live file.
- **`content-draft/` doesn't exist** — `mkdir -p content-draft` and tell the user the folder was empty (their file isn't there). Don't proceed with a merge.
- **Draft includes a `# title` heading (e.g. `# 张三`)** — the parser ignores it. If the user clearly intended this to be the display name, surface the trade-off (hard-code in `About.jsx` vs. extend the parser — see step 5).

## Quick reference: the three "what changed" cases

| Draft shape | Markdown only? | Parser change? | Page/component change? |
| --- | --- | --- | --- |
| Refresh tagline / intro / contact href / timeline entry / motto | ✓ | — | — |
| New contact label (e.g. Twitter) with no icon needed | ✓ | — | — |
| New contact label with an icon | ✓ | + `parseAbout` icon branch | + `ICON_MAP` entry, + import |
| New `##` section (e.g. `## 兴趣`) | ✓ | + parse new section into the result object | + render block in `About.jsx` |
| Change the hard-coded display name / avatar | depends — confirm option (a) or (b) | option (b) only | option (a) only / option (b) both |
