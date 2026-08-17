# blog-content-publisher 模板与品牌色板同步

## Goal

修复 `.claude/skills/blog-content-publisher/references/markdown-template.html` 中残留的 **2026-07 已经删除的旧暖色板**（`brand-orange` `#d97757` / `brand-green` `#788c5d`）和**旧字体**（Lora / Poppins），同步到主站升级后的「深海 + 紫极光」基线。同时给 SKILL.md 补一小段 a11y / OG meta 提示，让 publisher 知道 `entry.title` / `entry.excerpt` 的多重作用（卡片 + iframe title + OG 分享卡）。

## Background

`08-17 /simplify` review 后扫到 `markdown-template.html` 是唯一残留旧色板的文件：

```
$ grep -rE "brand-orange|brand-green|brand-gray|d97757|788c5d" src/ content/ .claude/skills/
.claude/skills/blog-content-publisher/references/markdown-template.html:13:      --accent:     #d97757;   /* brand.orange */
.claude/skills/blog-content-publisher/references/markdown-template.html:15:      --accent-grn: #788c5d;   /* brand.green */
```

模板当前仍使用：
- `--accent: #d97757`（brand.orange，已删除）
- `--accent-grn: #788c5d`（brand.green，已删除）
- `--bg: #141413`（旧暖色背景）
- `--fg: #faf9f5`（旧暖白）
- 字体 `Lora`（正文衬线）+ `Poppins`（标题 sans）

主站当前是（CLAUDE.md 规则 6 + `.trellis/spec/frontend/component-and-style-guidelines.md`）：
- 品牌色：brand-dark `#0a0e1f` / brand-surface `#14193a` / brand-light `#f8fatalc`（实际 `#f8fafc`）/ brand-mid `#94a3b8` / brand-primary `#5b8def` / brand-accent `#a78bfa` / brand-glow `#4cc9f0`
- 字体：Fraunces（标题/显示，serif italic + opsz）+ IBM Plex Sans（正文）+ JetBrains Mono（数字/标签）
- hover 守卫：`[@media(hover:hover)]:hover:*`（防 iOS Safari 触屏残留）

模板如果不更新，下一篇用 publisher 发布的新文章会自带旧色板 + 旧字体 + 无 hover 守卫，与主站脱节。spec 警告过的「色板变更审计清单」第 4 项（审计已发布 / 模板文件）正踩中此问题。

## Requirements

### 必做：更新 `markdown-template.html`

**色板（CSS variables）**：
- `--bg` `#141413` → `#0a0e1f`（brand-dark）
- `--surface` `#1c1b1a` → `#14193a`（brand-surface）
- `--fg` `#faf9f5` → `#f8fafc`（brand-light）
- `--mid` `#b0aea5` → `#94a3b8`（brand-mid）
- `--accent` `#d97757` → `#a78bfa`（brand-accent 紫极光）
- `--accent-alt` `#6a9bcc` → `#5b8def`（brand-primary 电光蓝）
- `--accent-grn` `#788c5d` → `#4cc9f0`（brand-glow 电光青蓝）
- 删除 `tbody tr:hover`（未守卫）或改为 `[@media(hover:hover)] &:hover` 守卫
- 注释里所有 `brand.orange / brand.green` 字样同步更新为新 token 名

**字体（与主站保持一致）**：
- 正文：`'Lora', Georgia, ...` → `'IBM Plex Sans', system-ui, ...`
- 标题 h1-h4：`'Poppins', ...` → `'Fraunces', Georgia, ...`
- 等宽：`'JetBrains Mono'` 保持不变（已经是主站 mono）
- 字体加载走 `@import url(...)`（与 `src/index.css` 同款 URL）：Fraunces（ital, opsz, wght 轴）+ IBM Plex Sans（wght 轴）

**hover 守卫**：
- `tbody tr:hover { background: var(--surface); }` → 改为 `[@media(hover:hover)] &:hover { ... }` 或类似守卫写法
- 其他 `:hover` 状态同理（链接 `a:hover` 等）
- `transition` 加 `prefers-reduced-motion: reduce` 复位（与主站规范一致）

### 可选：更新 SKILL.md

在「明确不做」或「工作流」段加 1–2 行提示（不破坏现有结构）：
- `entry.title` 的多重作用：卡片标题 + iframe `title` 属性（屏幕阅读器朗读）+ OG 分享卡标题。截断 / 表情符号会影响所有这三处，建议保持简短描述性。
- `entry.excerpt` 是卡片摘要 + OG `description` 字段。HTML 内作者写的 meta description 会被运行时 Helmet 覆盖。
- 这两条放 SKILL.md 的「工作流 → 2. 一次确认」附近，让 publisher 在 metadata 确认环节知道字段影响范围。

### 不做

- 不改 `CLAUDE.md`（已经准确）
- 不改 `tailwind.config.js`（已经准确）
- 不改 `src/index.css`（已经准确）
- 不改已发布的 `content/*.html`（各自独立任务，按 spec 警告的审计清单第 4 项，已知 follow-up）
- 不改 `references/` 之外的文件
- 不改 evals（evals 测试 publisher 流程正确性，不验模板色板）

## Acceptance Criteria

- [ ] `markdown-template.html` 不再包含 `#d97757`、`#788c5d`、`brand-orange`、`brand-green`、`brand-gray`、`Lora`、`Poppins` 任意之一（`grep -rE "#d97757|#788c5d|brand-orange|brand-green|brand-gray|Lora|Poppins" .claude/skills/blog-content-publisher/references/` 返回 0 命中）
- [ ] 模板的 CSS variables 与 `tailwind.config.js` 的 brand-* token 全部对齐（色值 byte-for-byte 匹配）
- [ ] 模板的字体 @import URL 与 `src/index.css` 顶部同款（含 ital/opsz/wght 轴）
- [ ] 模板的所有 `:hover` 都加了 `[@media(hover:hover)]` 守卫
- [ ] 模板新增 `prefers-reduced-motion: reduce` 复位块（与主站规范一致）
- [ ] SKILL.md 增加 1–2 行关于 `entry.title` 多重作用 / `entry.excerpt` OG description 的提示
- [ ] 全文详细中文注释保持（CLAUDE.md 规则 4）

## Out of Scope

- 修复已发布 `content/*.html` 的旧色板（独立任务，spec 警告的审计清单第 4 项；当前 1 篇文章 1 个项目是当时手动发布的，下一次内容变更时再统一审计）
- 改 evals（评估 publisher 流程正确性，不验模板视觉）
- 重新生成 `public/og-default.png`（OG 图已经是新色板，不需要改）
- 改 `blog-content-deleter` 技能（合同完全没变）

## Technical Notes

- 模板是 Markdown → HTML 转化的骨架，puppeteer/lighthouse 跑不到的纯文件 diff 检查，靠 grep + 人工确认
- 模板里 `--accent / --accent-alt / --accent-grn` 三个 var 名沿用旧命名（结构上：`accent = 紫`, `accent-alt = 蓝`, `accent-grn = 青`），不强行改成 `--primary / --accent / --glow`（避免破坏模板的结构性可读性）；注释里写清楚对应 brand token
- 字体 @import URL 完整内容可参考 `src/index.css` 顶部已有导入

## Risks

- **极低风险**：模板改动只影响**未来发布的新内容**，不影响已发布的 1 篇 article + 1 个 project
- **可回滚**：纯文件改动，`git revert` 即可
- **不影响 evals**：evals 测试流程正确性（registry 三处同步点、build/test 通过），不验证模板视觉