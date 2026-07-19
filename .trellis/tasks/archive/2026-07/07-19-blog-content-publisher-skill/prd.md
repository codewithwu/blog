# Create blog content publisher skill

## Goal

创建项目本地 Claude Code 技能 `blog-content-publisher`，让用户通过自然语言（如“将 `<文件.md|文件.html>` 上传到网站/博客”）触发统一的内容发布流程：Markdown → 自包含 HTML，HTML → 原样复制，落盘到 `content/<slug>.html`，并按项目 Entry 合同注册到 `src/data/articles.js` 或 `src/data/projects.js`，使内容出现在瀑布流首页和 `/p/:slug` 详情页。同时使用该技能端到端发布仓库根目录的两个真实测试文件。

## Requirements

### 技能触发与范围

1. 新增项目本地技能 `.claude/skills/blog-content-publisher/SKILL.md`，名称不与 Trellis 内置技能冲突。
2. `description` 必须覆盖真实触发表达：中文“将/把 X.md 上传到网站/博客”“将/把 X.html 整理后发布到网站”，英文“publish/upload this Markdown/HTML file to the blog/site”。
3. 明确近似但不应触发的场景：仅阅读/总结文件、修改已发布内容、仅删除内容、仅部署/push。
4. 技能以 `CLAUDE.md` 和 `.trellis/spec/content/*` 为权威来源，不复现已下线的旧目录、旧页面或旧 parser。

### 技能执行合同

1. 读取输入文件、当前 `src/data/articles.js`、`src/data/projects.js` 和分类定义；检查目标文件、slug、import 变量和跨 registry 冲突。
2. 任何写入前，一次性展示并确认所有目标的 metadata：`type/category/slug/title/excerpt/tags/date/links/cover`；不得根据文件名静默猜测必填字段。覆盖已有目标或发现 registry/文件不一致时停止并单独确认。
3. Markdown 输入：
   - 解析并移除 frontmatter，仅把正文转换为语义 HTML；保留标题、段落、代码、表格、引用、列表、强调和链接。
   - 使用技能自带模板生成响应式、自包含完整文档；直接使用品牌色与字体兜底，并为表格/引用/代码/链接提供样式。
   - 图片只保留/生成相对路径；外链使用 `target="_blank" rel="noreferrer"`。
4. HTML 输入：不解析重写、不格式化、不预注入 `<base>`；把源文件逐字节复制到 `content/<slug>.html`；运行时 `<base>` 由 `src/lib/html.jsx` 注入。
5. 对每条 Entry 成套完成三个同步点：`content/<slug>.html`、对应 registry 的 `?raw` import、完整 metadata 记录；不修改 Home / EntryDetail / EntryCard / entries / Html 的产品逻辑。
6. 批量发布先一次确认全部 metadata，再逐条实施；遇到首个无法安全解决的问题立即停止，报告已完成/未完成状态，不 hard reset、不覆盖无关改动。
7. 完成后运行 `npm test`、`npm run build`，如实比较基线；手工检查首页和 `/p/<slug>`；技能不得自动 commit 或 push。

### 评测与迭代

1. 使用 skill-creator 流程，在隔离输出中并行运行 with-skill 与 without-skill 基线，不污染产品代码。
2. 至少三个真实用例：两个测试文件各自的发布 + 一个不应走发布流程的负例。
3. 客观断言：Markdown 产物为完整 HTML、无可见 frontmatter、保留原结构；HTML 产物与源文件逐字节一致；registry import/metadata/slug/category 齐全且全局唯一；`npm run build` 成功；`npm test` 不新增失败；负例不创建内容或 registry 记录。
4. 生成 `grading.json`、聚合 benchmark、生成官方评审页面，据反馈迭代至通过。

### 端到端真实发布

1. 使用通过评测的技能正式发布两个测试文件，并保留根目录输入文件不删除。
2. `2026-06-10-agent-tool-all-at-once.md` 发布为 `article` / `category: 'ai'`，slug `agent-tool-all-at-once`。
3. `亲密关系曲线.html` 发布为 `article` / `category: 'notes'`，slug `intimate-relationship-curve`，内容与输入逐字节一致。

## Constraints

- 不新增运行时 Markdown 解析依赖；Markdown→HTML 由技能基于模板驱动转换。
- 不动 `package.json`、lockfile、部署 workflow、无关 JSX 组件。
- HTML 源文件保留作者自己写的样式/脚本/品牌色，不强行套用主站 brand-* 类（iframe 不继承主站 Tailwind）。
- 已知测试基线：`tests/html.test.jsx` 完整文档 `srcDoc` 绝对相等断言与 `<base>` 注入冲突，是既有失败；不得把它归因于本任务，也不得宣称测试全绿。
- 不 commit、不 push；部署到 GitHub Pages 属于后续需单独授权的外部操作。

## Acceptance Criteria

- [ ] `.claude/skills/blog-content-publisher/SKILL.md` 存在，frontmatter `name` 唯一、`description` 覆盖触发表达。
- [ ] 技能包含 Markdown→HTML 模板或参考，以及基于项目的评测定义。
- [ ] 用技能发布 `2026-06-10-agent-tool-all-at-once.md` → `content/agent-tool-all-at-once.html`，注册到 `src/data/articles.js`，`category: 'ai'`。
- [ ] 用技能发布 `亲密关系曲线.html` → `content/intimate-relationship-curve.html`，内容与输入逐字节一致，注册到 `src/data/articles.js`，`category: 'notes'`。
- [ ] `npx vitest run tests/registry.test.js` 通过；`npm test` 失败数不超过任务前实际基线；`npm run build` 成功。
- [ ] 评测 with-skill vs baseline 的客观断言与 benchmark 通过。
- [ ] 最终 diff 仅含技能源/eval、两个 `content/*.html`、`src/data/articles.js` 和 Trellis 任务产物。

## Notes

- 复杂任务，需要 `prd.md`、`design.md`、`implement.md` 齐备后再 `task.py start`。
- 评测 workspace 与产品代码隔离；仓库只保留技能源文件和 eval 定义。
