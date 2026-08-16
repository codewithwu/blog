# 统一处理代码审查发现的问题

## Goal

修复 `/code-review @src/` 暴露的 8 个 finding,统一品牌资产(色板 / 字体)的「代码 ↔ 文档 ↔ 内容」三方一致性;消除两条用户可感知的回归(详情页标题闪烁、Hero tagline 消失);并把已发布文章从过时暖色板改版到当前冷色板,保持站内视觉统一。

## Scope

**In scope:**
- 修根因:更新 `CLAUDE.md` 规则 6 的品牌色板与字体段(对齐 `tailwind.config.js` 与 `src/index.css`)
- 修衍生:将 `content/claude-code-taming-guide.html` 的 7 处暖色 hex + CSS 变量映射到冷色板
- 修独立 bug:`Hero.jsx` tagline 回归 + `EntryDetail.jsx` 标题闪烁
- 加意图注释:`src/index.css` body 硬编码颜色处说明「防止 FOUC 的有意为之」
- 跑 `npm run test` + `npm run build` 保证无回归

**Out of scope:**
- 主站其他组件的色板重构(冷色板已落地,不动)
- Hero 动画 / Aurora 等视觉效果(已为冷色调设计,不动)
- 其他已发布文章的色板检查(只有这一篇用了过时色板,其他通过 `listEntries` 检查后再确认)
- 把 `LAST_UPDATED` 改成自动派生(是有意设计,不动)
- 改 `entries.js` 的 `normalize()` 防御范围(title/excerpt/content/slug/type 是必填字段,不动)

## Requirements

### R1. CLAUDE.md 品牌契约同步
- **R1.1** 规则 6 中色板段从暖色(`#141413` / `#1c1b1a` / `#faf9f5` / `#b0aea5` / `#e8e6dc` / `#d97757` / `#6a9bcc` / `#788c5d`)改为当前冷色(`brand.dark #0a0e1f` / `brand.surface #14193a` / `brand['surface-2'] #1e2348` / `brand.border #2a3158` / `brand.primary #5b8def` / `brand.accent #a78bfa` / `brand.glow #4cc9f0` / `brand.light #f8fafc` / `brand.mid #94a3b8` / `brand.dim #64748b`)
- **R1.2** 字体段从 Poppins/Lora 改为 Fraunces / IBM Plex Sans / JetBrains Mono(对齐 `src/index.css` 的 `@import`)
- **R1.3** 保留规则 6「单一来源 = tailwind.config.js」的强制;新增一句「内容作者在 iframe 内若需用 brand-* 类,必须自补样式或 link 引入,见规则 4」

### R2. claude-code-taming-guide.html 改版到冷色
- **R2.1** 顶部 `<style>` 的 CSS 变量映射:见「设计」段的映射表
- **R2.2** 顶部 `@import` 替换字体:Poppins/Lora → Fraunces + IBM Plex Sans + JetBrains Mono(并附 fallback:Georgia / system-ui / ui-monospace)
- **R2.3** 不动 HTML 正文结构与文字;只动 CSS 变量、字体引入、内联 style 颜色
- **R2.4** 若有硬编码 hex(非通过 CSS 变量)→ 替换为新冷色对应值

### R3. Hero.jsx tagline 回归修复
- **R3.1** `pickTagline(count)` 在 count=2 时不再返回空串(当前因 `<= 3` 分支撞上空字符串导致文案消失)
- **R3.2** 选项 a:`pickTagline(2)` 返回 fallback 文案(简短,如「持续记录中」)
- **R3.3** 选项 b:去掉 `<= 3` 空串分支,让 1~3 篇也展示「持续记录 AI 与工程心得」
- **R3.4** 选定方案并在 PRD 设计段写明

### R4. EntryDetail.jsx 标题闪烁修复
- **R4.1** 渲染顺序调整:`usePageTitle` 必须在 `if (!entry) return <Navigate />` 之后调用,确保无效 slug 不会先把 document.title 改成「未找到内容」
- **R4.2** 行为契约:无效 slug 时,document.title 直接被 Home 的 `usePageTitle` 接管,不出现中间态

### R5. src/index.css 硬编码颜色加意图注释
- **R5.1** body 的 `background-color: #0a0e1f` 与 `color: #f8fafc` 上方加注释,说明这是为了防止 Tailwind 编译前 body 无样式闪烁(FOUC)的有意保留;值与 `brand.dark` / `brand.light` 一致
- **R5.2** 不改实现(改成 `@apply bg-brand-dark text-brand-light` 需测 FOUC,且收益小)

## Acceptance Criteria

- [ ] AC-1 `CLAUDE.md` 规则 6 中所有色值与字体名与 `tailwind.config.js` + `src/index.css` 完全一致(逐字比对)
- [ ] AC-2 `claude-code-taming-guide.html` 顶部 `<style>` 内不再出现 `#141413` / `#1c1b1a` / `#d97757` / `#6a9bcc` / `#788c5d` / `#faf9f5` / `#b0aea5` 任一旧色值
- [ ] AC-3 文章 `@import` 引入 Fraunces / IBM Plex Sans / JetBrains Mono,移除 Poppins / Lora
- [ ] AC-4 浏览器打开 `http://localhost:5173/p/claude-code-taming-guide` 时,文章视觉与首页一致(冷色 + 紫蓝主调),无突兀橙色
- [ ] AC-5 Hero tagline 在 entryCount=2 时显示文案(非空白)
- [ ] AC-6 访问 `http://localhost:5173/p/不存在的slug` 时,浏览器标签栏标题不出现「未找到内容」字样,直接从首页标题过渡
- [ ] AC-7 `src/index.css` body 硬编码颜色上方有解释 FOUC 意图的注释
- [ ] AC-8 `npm run test` 全绿
- [ ] AC-9 `npm run build` 成功(无 TS/lint/打包错误)
- [ ] AC-10 跑 `listEntries()` 确认仅 `claude-code-taming-guide.html` 一篇文章有色板问题(若有其他,扩 scope)
- [ ] AC-11 提交后 `git log -1 --stat` 显示本次改动覆盖 CLAUDE.md / index.css / Hero.jsx / EntryDetail.jsx / claude-code-taming-guide.html 五个文件

## Open Questions

无(文章改色方案已与用户确认)

## Notes

- 这是 PRD-only 之外的复杂任务,需要 `design.md`(色板映射表、字体替换细节、文件改动的边界)与 `implement.md`(执行顺序、验证命令、回滚点)
- 全部 5 个文件的修改相互独立(除了 CLAUDE.md 是其他文件的「真相之源」),可在同一个 PR 内顺序执行
- 不动 `entries.js` 的 normalize() 防御范围 — 现有契约是 title/excerpt/content/slug/type 必填,category/tags/cover/links 可选,这是正确边界
- 不动 `LAST_UPDATED` 硬编码 — 注释已说明「避免 hydration mismatch 与时区问题」,是有意设计