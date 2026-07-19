# Verification Report — Trellis Spec Refresh

Date: 2026-07-19

## Scope verified

- Final `.trellis/spec/` tree has 9 Markdown files: one root index, five frontend files (including index), and three content files (including index).
- Removed six unfilled frontend template files and all three unrelated `guides/` files.
- Product code, content sources, package/configuration files, and tests were not modified by this task.

## Structural checks

Passed:

- All spec files are non-empty and have no empty headings.
- No template boilerplate markers remain.
- No unrelated upstream Trellis CLI/Python/event-log/API-service-database guidance remains.
- Every relative Markdown link resolves.
- `frontend/index.md` and `content/index.md` list exactly the final files in their directories.
- Root index routes readers to both real ownership boundaries.

## Consistency checks

Passed:

- HashRouter and `/blog/` base rules match `src/App.jsx` and `vite.config.js`.
- Project list's direct registry consumption and detail query path are described separately.
- Article/project fragments and full documents are both documented as iframe `srcDoc` inputs.
- iframe contract is consistently `allow-scripts allow-popups allow-forms`, without `allow-same-origin`.
- Fixed article categories, content metadata fields, raw-import suffixes, and three skill levels match current source and `CLAUDE.md`.
- Tracked local skill workflows are covered, while known stale skill descriptions are explicitly rejected in favor of current source.

## Project commands

### `npm run build`

Passed. Vite built 1551 modules and emitted `dist/`. The pre-existing warning remains: the main JavaScript chunk is larger than 500 kB.

### `npm test`

Failed with the same 11 failures observed before spec edits; no new failure class appeared:

- `tests/articles.test.js`: 4 stale assertions still assume an empty article registry.
- `tests/content.test.js`: 1 stale assertion expects 2 contacts while current content parses 3.
- `tests/projects.test.js`: 1 stale `_sample` project fixture.
- `tests/html.test.jsx`: 1 stale equality assertion ignores injected `<base href="about:srcdoc">`.
- `tests/project-detail.test.jsx`: 4 stale `_sample`/sandbox assumptions.

`tests/article-detail.test.jsx` passes. Product tests were intentionally not repaired because the approved task scope is spec-only.

## Phase 3.3 spec-update judgment

No additional spec edit was needed after the verification pass:

- Direct project-registry consumption is already captured in `frontend/data-and-rendering.md`.
- The 11-failure baseline is captured in `frontend/testing-and-quality.md`.
- Tracked local-skill drift is captured in `content/maintenance-workflows.md`.
- Fragment wrapping, base injection, sandbox, trust, and style isolation are captured in `frontend/data-and-rendering.md` and `content/source-formats.md`.
- Category-route exclusion and full-bleed detail layout are captured in `frontend/architecture-and-routing.md`.

Adding another guide would duplicate these executable contracts, so the final tree remains unchanged.

## Acceptance criteria result

All specification-specific acceptance criteria pass. The repository-wide test command is not green due to the documented pre-existing 11 failures; this is reported as an unresolved baseline issue, not hidden or attributed to the spec changes.
