# Repository Analysis for Trellis Spec Refresh

## Scope decision

The refreshed specs cover the tracked product runtime, content sources, tests/configuration, and the eight tracked project-local `.claude/skills/`. Untracked Trellis agents, hooks, commands, and skills are excluded because they are pre-existing dirty workspace infrastructure rather than committed product conventions.

## Architecture findings

- Single-package React 18/Vite 5 SPA; no backend, database, workspace packages, server state, or TypeScript runtime.
- Startup: `src/main.jsx` mounts `App`; `src/App.jsx` owns `HashRouter`, route layout, detail-route Navbar hiding, and route declarations.
- `vite.config.js` fixes the GitHub Pages base at `/blog/`; `.github/workflows/deploy.yml` builds on Node 20 and publishes `dist/`.
- Pages compose imported static data and reusable components. No global state library exists; current state is URL params, component-local derived values, and module-level imported content.
- `src/hooks/usePageTitle.js` is the only custom hook and sets `document.title` with `useEffect` because react-helmet-async v2 has no `useHelmet` export.

## Runtime data flows

### Articles

`articles/<category>/<slug>.html` → `src/data/articles.js` `.html?raw` import + metadata → `src/lib/articles.js` sorting/filtering → list/detail pages.

- Metadata: slug, title, excerpt, date, tags, cover, content, category.
- Category slugs are exactly `ai`, `python`, `engineering`, `product`, `notes`, `resources`; `src/data/categories.js` owns slug, Chinese display name, and order.
- Slugs are globally unique across categories.
- Normal publish/delete changes source file, import, and metadata together.

### Projects

`projects/<slug>.html` → `src/data/projects.js` `.html?raw` import + metadata → `src/lib/projects.js` → list/detail pages.

- Metadata: slug, name, description, techStack, githubUrl, demoUrl, cover, content.
- Project order is registry array order; there is no date sort.

### Skills, tools, about

`content/*.md` → `?raw` import → pure parsers in `src/lib/content.js` → pages/components.

- Skills: `## category`, then `- name: level`; levels are fixed to 进阶/熟练/精通 and unknown values fall back to 进阶.
- Tools: `## category`, then `- name (LucideIcon): desc`; missing/unknown icons fall back to `Wrench` at render time.
- About: preamble gives tagline/intro; known sections are 联系方式, 经历, 座右铭 with strict parser shapes.
- Content edits belong in `content/*.md`, not wrapper data modules or `About.jsx`.

## HTML detail contract

- `src/lib/html.jsx` sends both full documents and fragments to one fullscreen iframe. Fragments are wrapped in a minimal document first.
- It injects `<base href="about:srcdoc">` unless a base already exists.
- Required iframe shape: `w-full h-screen border-0`, title prop, sandbox exactly `allow-scripts allow-popups allow-forms`; no `allow-same-origin`.
- Article and project detail pages render only a fixed floating return link plus `Html`; Navbar is hidden by `AppShell`.
- The iframe does not inherit the host Tailwind bundle. Authored HTML supplies its own styles. The trust model is repository-authored HTML, with no post-render sanitizer.
- Main-site list cards still use `brand-*` styling.

## Component/style findings

- Function components with destructured props and direct composition are the dominant style.
- Tailwind utility classes use centralized `brand` colors from `tailwind.config.js`; global typography is Poppins headings and Lora body from `src/index.css`.
- Lucide React is the only icon library.
- Existing accessibility patterns include semantic `Link`/`NavLink`, `aria-current`, keyboard Enter support on the article card, focus-visible rings, iframe titles, and `target="_blank" rel="noreferrer"` for external links.
- Code comments are detailed and predominantly Chinese, especially around non-obvious browser or data-contract behavior.

## Existing spec problems

- All six `frontend/` topic files are unfilled templates with `(To be filled by the team)` placeholders.
- `frontend/index.md` says to fill generic React/TypeScript topics and mandates English without project evidence.
- `guides/` contains unrelated Trellis upstream rules for Python Literals, TypeScript event logs/reducers, CLI templates, APIs/services/databases, remote probes, and versioned docs. Some sections are duplicated.
- Hook, state, and type-safety do not justify independent files in this JavaScript-only app; real rules should be folded into architecture/quality guidance.

## Tracked local skill findings

- README treats eight tracked local skills as core natural-language content maintenance entry points.
- Useful invariant: published article/project changes keep file, raw import, and metadata synchronized; draft merges validate parser shape, preview changes, confirm destructive actions, then verify/build.
- Skill docs are not all current. `create-project/SKILL.md` still claims fragments use `dangerouslySetInnerHTML` and references `ProjectHeader.jsx`, neither of which matches current source. Some delete wording still treats articles as Markdown. Specs must use source precedence and must not copy these stale details.

## Validation baseline before spec edits

- `npm run build`: succeeds; Vite warns that the main JS chunk is larger than 500 kB.
- `npm test`: 11 failures before spec edits. Stale assertions include empty article registry, `_sample` project fixtures, two contacts vs current three, old iframe srcDoc/sandbox expectations, and missing project fixtures.
- The spec task does not repair runtime tests. Final validation compares against this baseline and reports it honestly.

## Target spec tree

```text
.trellis/spec/
├── index.md
├── frontend/
│   ├── index.md
│   ├── architecture-and-routing.md
│   ├── component-and-style-guidelines.md
│   ├── data-and-rendering.md
│   └── testing-and-quality.md
└── content/
    ├── index.md
    ├── source-formats.md
    └── maintenance-workflows.md
```

The old template files and entire `guides/` directory should be removed after replacements and indexes are ready.
