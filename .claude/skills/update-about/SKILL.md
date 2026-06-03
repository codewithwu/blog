---
name: update-about
description: Use when the user wants to update `content/关于.md` with new content and have the frontend About page reflect it. The user message **must mention both an update verb and the about file** — Chinese phrases like "更新 content/关于.md"、"按 xxx 内容修改 content/关于.md"、"把 content/关于.md 改成 xxx"、"更新关于页面"、"修改关于页内容"、"在 content/关于.md 里加 xxx"，or English equivalents like "update content/关于.md"、"rewrite the about page"、"change the about content". Mentioning "关于" or "about" alone is NOT enough — must include a clear update/replace intent pointing at the file or the About page. The skill first rewrites `content/关于.md` per the user's instructions, then runs a format check against the `parseAbout` parser, and finally adapts the frontend (`src/lib/content.js`, `src/pages/About.jsx`, possibly `src/components/TimelineItem.jsx`) to render any new fields, sections, or contact types that the current code doesn't handle. Do NOT trigger for editing other pages (Skills/Tools/Articles/Projects) — those have their own content/data flow. Do NOT trigger for purely visual/styling changes to the About page that don't involve the markdown.
---

# update-about

## What it does

End-to-end workflow for changing the About page from the markdown side out:

1. Rewrite `content/关于.md` per the user's instructions.
2. Validate the new markdown against the `parseAbout` parser in `src/lib/content.js` — flag any structural issue.
3. Detect content that the current frontend cannot render (new contact types, new sections, new fields) and extend the parser + About page to handle it.
4. Build to confirm the page compiles and renders without errors.

The About page is *data-driven*: `src/pages/About.jsx` imports `content/关于.md?raw` and feeds it to `parseAbout`. So the markdown is the source of truth, and the only time you touch React code is when the markdown introduces something the parser/page doesn't already support.

## When to use

Trigger **only** when the user message contains a clear update/replace intent pointing at `content/关于.md` or the About page. Match phrases such as:

- "更新 content/关于.md，按以下内容：…"
- "把 content/关于.md 改成 …"
- "按这份内容更新关于页面：…"
- "在 content/关于.md 里加一个 Twitter 联系方式"
- "修改 content/关于.md，把经历部分换成 …"
- "rewrite content/关于.md with …"
- "update the about page to say …"

The phrase must NOT trigger if:

- The user just wants to *view* the About page — read the file, don't run this skill.
- The update targets Skills (`content/技能.md`), Tools (`content/工具.md`), Articles, or Projects — those have different data flows; ask the user to clarify or use the appropriate tool.
- The change is purely a styling tweak to `About.jsx` (e.g. "把头像放大" or "改一下座右铭的颜色") with no markdown change — just `Edit` the JSX file directly.

When the instruction is ambiguous between an "update this file" and a "rewrite this whole page" intent, prefer running this skill — the user can always say "no, just the markdown".

## When NOT to use

- **Viewing the about page** — just read `content/关于.md`.
- **Editing Skills / Tools / Articles / Projects** — different content/data flow; not this skill's job.
- **Pure visual changes to About.jsx** with no markdown involvement — use `Edit` on the JSX directly.
- **Adding a brand-new content section that requires extensive UI work** (e.g. a skill chart, an embedded timeline with images) — surface the scope, propose a design, and let the user confirm before extending the skill's reach.

## Project context

- Source of truth: `content/关于.md` (project root, *not* under `src/`).
- Parser: `src/lib/content.js`, function `parseAbout(md)`. Returns `{ tagline, intro, contacts, timeline, motto }`. The parser is a pure string handler — no frontmatter, no gray-matter; sections are delimited by `##` headings.
- Page: `src/pages/About.jsx`. It calls `parseAbout(aboutMd)` at module top level, then maps each field to a small block of JSX. The avatar (top-left circle with "极客" inside) and the H1 ("极客熊猫") are currently **hardcoded** in `About.jsx`, not parsed from the markdown.
- Timeline item: `src/components/TimelineItem.jsx`. Receives `{ year, title, subtitle, desc }` from the parser. Multi-line `desc` is rendered as a single `<p>` with embedded newlines.
- Brand color tokens live in `tailwind.config.js` (`brand-orange/blue/green/light/mid/surface`). Don't add new color tokens unless the user asks — reuse what exists.
- Icon library: `lucide-react` is the only icon source per `CLAUDE.md` rule 9. The `About.jsx` `ICON_MAP` currently only knows `Github` and `Mail`. Anything else needs to be added there.

## `parseAbout` reference (what the parser currently supports)

The parser is the contract. If the markdown doesn't conform, the data simply won't show up.

| Markdown shape | Parsed field | Notes |
| --- | --- | --- |
| First non-empty line of the file (before any `##`) | `tagline` | Single line. |
| Remaining preamble lines | `intro` | Joined with newlines. |
| `## 联系方式` + `- Label: href` lines | `contacts[]` | `Label` of `GitHub` → icon `Github`; `邮箱` → icon `Mail`; anything else → `icon: null` (renders without an icon). |
| `## 经历` + `- **year** title @ subtitle` lines, optionally followed by indented lines | `timeline[]` | `year`, `title`, `subtitle`, `desc` (string). |
| `## 座右铭` + `> quote` lines | `motto` | Quote marker stripped, lines joined. |
| Anything else | ignored | Won't show up on the page. |

The avatar (the circle on the left of the header) and the H1 name are *not* in the parser — they're hardcoded in `About.jsx`. If the user wants these to be markdown-driven, that's a parser + JSX extension; surface the change explicitly before doing it.

## Workflow

Follow these steps in order. **Do not skip the format check or the frontend adaptation step.**

### 1. Read the current state

- Read `content/关于.md` to see the current content.
- Read `src/lib/content.js` (`parseAbout` only) and `src/pages/About.jsx` to confirm what the current code supports.
- Read `src/components/TimelineItem.jsx` if the timeline shape might change.

The user often says "把 X 改成 Y" — you need to know what X currently is before rewriting.

### 2. Compose the new markdown

Apply the user's instructions. Rules:

- Preserve the section structure (`## 联系方式`, `## 经历`, `## 座右铭`) when the user is only changing part of the page. When the user provides a complete replacement, honor their structure even if it diverges from the existing one — but make a note when the new structure requires parser/page changes (step 4).
- Keep the timeline line format `- **year** title @ subtitle` exactly. Regex is `^-\s+\*\*(.+?)\*\*\s+(.+?)\s+@\s+(.+?)\s*$` — any deviation (e.g. `**year**` without space before title, no `@`) silently drops the entry. The parser is strict; tell the user if their natural phrasing won't parse.
- For contacts, the format is `- Label: href`. A `Label` of `GitHub` or `邮箱` gets an icon; anything else renders as plain text with an external-link behavior. If the user wants an icon for a new label (e.g. `Twitter`, `LinkedIn`, `微信`, `B站`), step 4 covers it.
- For the motto, use `> …` lines under `## 座右铭`. The parser strips the leading `>`.
- Don't introduce frontmatter, code fences, or HTML — `parseAbout` is plain text only.

### 3. Run the format check

After writing the new `content/关于.md`, re-read it and check:

**(a) Sections that the parser knows about are still well-formed.**
- Preamble has at least one non-empty line if the user wants a tagline; otherwise it's fine to be empty.
- `## 联系方式` lines are `- Label: href`. No code fences or blank lines between `-` and content.
- `## 经历` lines match the timeline regex. Multi-line `desc` lines are indented (start with whitespace) and are not themselves `- …` bullets.
- `## 座右铭` lines start with `>` (or are blank).

**(b) Sections the parser doesn't know about are flagged.**
- Any `## Foo` other than `联系方式` / `经历` / `座右铭` will be silently ignored. List it for the user and ask whether to (i) extend the parser + page to render it, or (ii) drop it.

**(c) Contact labels without a known icon.**
- A label other than `GitHub` / `邮箱` parses to `icon: null` and renders as plain text. If the user expects an icon (because they wrote "Twitter" or "微信" and want the bird/WeChat glyph), step 4 covers it.

**(d) Hardcoded fields that the user might assume are markdown-driven.**
- The avatar text (`极客`) and the H1 (`极客熊猫`) are hardcoded in `About.jsx`. If the user's new content implies a different name, surface this — do not silently mismatch the markdown and the H1.

Print a brief check report:

```
格式检查：
  ✓ tagline / intro 完整
  ✓ 联系方式：3 条（GitHub / 邮箱 / Twitter，Twitter 无图标）
  ✓ 经历：2 条，正则匹配
  ✓ 座右铭：1 条
  ⚠ 新增 ## 教育 章节，当前解析器不支持
  ⚠ 头像文字 "极客" 和 H1 "极客熊猫" 仍是硬编码，未与新内容对齐
```

### 4. Adapt the frontend (only when needed)

Walk through the list of format-check warnings and decide which to address. For each one, propose a minimal change:

**(a) New contact type needing an icon.**
- Pick a matching `lucide-react` icon (e.g. `Twitter` → `Twitter`, `LinkedIn` → `Linkedin`, `B站` / `Bilibili` → there isn't a direct icon; fall back to `Link` or `Globe`; `微信` / `WeChat` → `MessageCircle`).
- Add it to the import line in `src/pages/About.jsx` and to the `ICON_MAP`. Update the label-to-icon map in `parseAbout` (`src/lib/content.js`) so the parser outputs the right icon name string.
- Verify the icon exists in `lucide-react@0.400.0` by checking `node_modules/lucide-react/dist/lucide-react.d.ts` or by trying it; if uncertain, fall back to a generic icon like `Link`.

**(b) New `## section` that should render.**
- Extend `parseAbout` in `src/lib/content.js` to parse the new section. Match the existing style: pure string handling, no deps.
- Add a render block in `src/pages/About.jsx`. Reuse the existing `brand-*` color tokens and Tailwind spacing rhythm (`mt-12` between major sections, `p-6 rounded-xl` cards, etc.). Do not introduce new colors.
- If the section needs a brand-new component (e.g. a list with icons), put it under `src/components/` and import it in `About.jsx`. Keep the component small and prop-driven.

**(c) Avatar / H1 alignment.**
- The simplest fix is to add `avatar` and `name` fields to the `parseAbout` output (e.g. by reading a frontmatter-like header at the top of the file, or by promoting a specific line). The H1 and avatar would then read from the parser. If the user is OK with that, do it; otherwise just update the hardcoded strings in `About.jsx` to match.

**(d) Tagline missing because the user deleted the preamble.**
- If `tagline` is empty after the rewrite, just don't render the `<p>` (the page already conditionally renders). No code change needed.

**Don't add features the user didn't ask for.** If the user only changed the motto, do not refactor the avatar. If they added one new contact type, do not redesign the contacts block.

### 5. Confirm before changing frontend code

Frontend changes are visible. Show the user what you plan to change and wait for `y` / "好" / "确认" before editing `src/lib/content.js` or `src/pages/About.jsx`. Markdown changes can be made immediately; frontend changes need sign-off.

```
即将修改的前端代码：

1. src/lib/content.js — parseAbout 中联系方式的 label→icon 映射
   添加：Twitter → Twitter、LinkedIn → Linkedin

2. src/pages/About.jsx — ICON_MAP
   import { Github, Mail, Twitter, Linkedin } from 'lucide-react';
   const ICON_MAP = { Github, Mail, Twitter, Linkedin };

确认？
```

If the user says no or wants a different icon, adjust and re-confirm.

### 6. Apply the changes

In order:

1. `Edit` `content/关于.md` with the new content.
2. `Edit` `src/lib/content.js` if the parser needs extending.
3. `Edit` `src/pages/About.jsx` if rendering or icon mapping needs extending.
4. `Edit` `src/components/TimelineItem.jsx` only if the timeline shape changed in a way the existing component can't handle.

### 7. Verify

- Read the edited files back to confirm the changes landed correctly.
- Run `npm run build` (or `npx vite build`) to confirm the page compiles. If the build is slow, skip it and tell the user to run it themselves, but always at least sanity-check with `grep` for the new sections/icons:

```
grep -n "Twitter\|Linkedin" src/pages/About.jsx
grep -n "'Twitter'" src/lib/content.js
ls -la content/关于.md
```

- Expected: the markdown file's `date -r` timestamp is fresh, the new icon imports are present, the icon-map entries are present, no leftover references to dropped sections.

### 8. Report

Print a one-block summary:

```
已更新 content/关于.md：
  - 联系方式：+ Twitter (icon: Twitter), + LinkedIn (icon: Linkedin)
  - 经历：调整 2 条 desc 文案
  - 座右铭：替换为新内容

前端代码调整：
  - src/lib/content.js: parseAbout 增加 Twitter/LinkedIn 的 icon 映射
  - src/pages/About.jsx:  ICON_MAP 新增 Twitter/Linkedin，import 同步

构建：已运行 `npm run build`，通过 / 跳过
预览：npm run dev → http://localhost:5173/#/about
```

## Edge cases

- **User wants to add a profile image** — there's no `cover`/`avatar` field today. Surface this as a frontend change: add a small frontmatter-style header to the markdown (e.g. `<!-- avatar: path/to/img.png -->`) or a separate `## Avatar` section, extend `parseAbout`, and render it in `About.jsx`. Confirm before doing it.
- **User wants the avatar/name to be markdown-driven** — same approach as a profile image; recommend the frontmatter-style header line at the very top of `content/关于.md` so the parser picks it up.
- **User adds a contact with a non-URL value** (e.g. `微信: codewithwu`) — the parser will set `href` to whatever they wrote; the `<a>` tag will navigate to that string. Flag this and suggest a `tel:` / `weixin://` scheme or a `mailto:`-style href.
- **User pastes a long bio that overflows the avatar header** — the existing layout uses `flex-col sm:flex-row`, so the bio will wrap under the avatar on mobile and beside it on desktop. No change needed unless the user complains.
- **User deletes a section entirely** (e.g. removes `## 座右铭`) — the page already conditionally renders, so the block just disappears. No code change.
- **User adds a new section like `## 教育背景` that maps to the existing timeline UI** — the parser can be told to accept `教育背景` as an alias for `经历` if the entries follow the same `- **year** title @ subtitle` shape. Or, if the section's *visual* treatment is different (no year emphasis, etc.), build a small dedicated component. Confirm the intent.
- **Two contacts share the same label** (e.g. two `GitHub` links) — the parser will produce two entries; React keys will collide on `label`. The existing code uses `label` as the `key`. Either de-dupe by adding a unique suffix or switch the key to `href` (or a counter). Flag and confirm.
- **User uses `##` headings inside a section that already has `>` blocks** — the parser's section splitter re-buckets on any `## `, so an H3 inside a section is fine but a stray `## Foo` will start a new section. The format check in step 3 catches this.

## Quick reference: the four "what changed" cases

| User's instruction | Markdown only? | Parser change? | Page change? | Typical extra step |
| --- | --- | --- | --- | --- |
| Edit tagline / intro / motto text | ✓ | — | — | None |
| Add a `GitHub` / `邮箱` contact | ✓ | — | — | None |
| Add a new contact type that should have an icon | ✓ | + icon mapping | + import + ICON_MAP | Confirm icon choice |
| Add a new `## section` (e.g. 教育) | ✓ | + parse block | + render block | Decide which existing component to reuse, or build new |
| Make avatar / H1 markdown-driven | ✓ | + frontmatter parsing | + bind to parser output | Decide on the frontmatter syntax |
| Pure visual change to About.jsx | — | — | ✓ | Just edit the JSX (don't run this skill) |
