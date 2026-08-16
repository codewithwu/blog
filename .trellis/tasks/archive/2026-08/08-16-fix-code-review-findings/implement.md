# 执行计划:统一处理代码审查发现的问题

## 顺序与依赖

```
[1] CLAUDE.md 规则 6        ← 根因(其他文件的「真相之源」)
[2] claude-code-taming-guide.html  ← 引用 [1] 的新色板
[3] src/index.css 注释
[4] src/components/Hero.jsx
[5] src/pages/EntryDetail.jsx
[6] 验证:测试 + 构建 + 浏览器目视
[7] 提交
```

[1] 必须最先(其他都依赖它的契约);[2]~[5] 之间无依赖,可顺序执行或并行;但因为都是一个 PR,**顺序单 commit 更清晰**。

## 步骤清单

### Step 1 — 修 CLAUDE.md(根因)

- [ ] 读 `CLAUDE.md` 当前规则 6 段
- [ ] 用 design.md §6 的内容替换整段
- [ ] 验证:逐字比对 `tailwind.config.js` 的 `brand.*` 名字与 hex,以及 `src/index.css` 的字体名,无遗漏

### Step 2 — 改 claude-code-taming-guide.html

- [ ] 读整个 HTML,定位所有硬编码 hex 与 CSS 变量声明
- [ ] 替换顶部 `@import`(Poppin/Lora → Fraunces/Plex/JetBrains)
- [ ] 替换顶部 `<style>` 的 `:root` 变量映射(按 design.md §1 表)
- [ ] 全文搜旧色值(`#141413` / `#1c1b1a` / `#d97757` / `#6a9bcc` / `#788c5d` / `#faf9f5` / `#b0aea5`),必须 0 命中
- [ ] 不动 HTML 正文结构与文字;只动样式

### Step 3 — src/index.css 加注释

- [ ] 在 `body { ... }` 上方插入 design.md §5 的注释块
- [ ] 不改实现

### Step 4 — Hero.jsx 删空串分支

- [ ] 改 `pickTagline(count)`:删除 `if (count <= 3) return '';` 这一行
- [ ] 注释中说明理由(避免后人加回去)

### Step 5 — EntryDetail.jsx 调换顺序

- [ ] 把 `usePageTitle(entry?.title || '未找到内容')` 移到 `if (!entry) return <Navigate ...>` 之后
- [ ] 改为 `usePageTitle(entry.title)`(因为已 early-return 保证 entry 存在)

### Step 6 — 验证

- [ ] `npm run test` → 全绿
- [ ] `npm run build` → 无错误
- [ ] `npm run dev` → 浏览器目视检查:
  - [ ] 首页 Hero tagline 在 count=2 时显示「持续记录 AI 与工程心得」
  - [ ] `/p/claude-code-taming-guide` 视觉为冷色紫蓝调,无突兀橙色;字体为 Fraunces/Plex
  - [ ] `/p/不存在slug` 标题栏不闪烁「未找到内容」,直接到首页标题

### Step 7 — 提交

- [ ] `git status` 确认 5 个文件改动
- [ ] `git diff --stat` 改动量符合预期
- [ ] `git add -A && git commit -m "..."`(commit message 见下方建议)
- [ ] `git log -1 --stat` 复核

## 验证命令(可直接跑)

```bash
# 测试
npm run test

# 构建
npm run build

# 启动 dev(另开 terminal)
npm run dev
# 然后浏览器打开:
#   http://localhost:5173/                  → Hero tagline 应有文案
#   http://localhost:5173/p/claude-code-taming-guide
#   http://localhost:5173/p/garbage-slug   → 标题栏不闪烁

# 静态检查文章是否还有旧色
grep -E '#141413|#1c1b1a|#d97757|#6a9bcc|#788c5d|#faf9f5|#b0aea5' content/claude-code-taming-guide.html
# 期望:无输出
```

## 提交建议

```
fix(content+brand): align CLAUDE.md, article, and src to cold palette

- Update CLAUDE.md rule 6 to match current tailwind.config.js (cold
  "deep sea + aurora purple" palette) and src/index.css (Fraunces /
  Plex Sans / JetBrains Mono).
- Rebrand content/claude-code-taming-guide.html from stale warm palette
  to cold palette: swap CSS variables, replace @import fonts, no
  structural change.
- Fix Hero.jsx regression: pickTagline returned '' for count <= 3,
  making the tagline disappear after the new article was published
  (count went 1 → 2). Drop the empty-string branch.
- Fix EntryDetail.jsx title flicker: move usePageTitle after the early
  return so invalid slugs don't briefly set document.title to
  "未找到内容".
- Add comment to src/index.css body hardcoded colors explaining FOUC
  rationale (deliberate exception to the brand single-source rule).

Addresses code-review findings #1, #2, #3, #6, #7, #8.
(Excludes #4 hardcoded LAST_UPDATED and #5 normalize() defensive
contract — both intentional design decisions.)
```

## 审查门(Review Gates)

- [ ] PRD 中所有 AC 命中
- [ ] grep 检查 0 命中旧色
- [ ] 浏览器目视 3 个 URL 全过
- [ ] 测试 + 构建 全绿

## 回滚点

- 任一步骤失败 → 单文件 `git checkout HEAD -- <file>` 回到改前
- 文章改色失衡 → `git checkout c7d2d07 -- content/claude-code-taming-guide.html` 回滚到原始暖色版本
- 整体回滚 → `git reset --hard HEAD~1`(本次 commit 尚未 push 时)