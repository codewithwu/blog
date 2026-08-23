---
name: blog-content-publisher
description: "将本地 Markdown 或 HTML 文件整理后发布到本博客网站。当用户说「将/把 X.md 上传到网站/博客」「将/把 X.html 整理后发布到网站」「publish/upload this Markdown/HTML file to the blog/site」时务必使用本技能：它按项目规范把 Markdown 转为自包含 HTML、把 HTML 原样复制到 content/，再按统一 Entry 合同注册到 src/data/articles.js 或 src/data/projects.js，使内容出现在瀑布流首页和 /p/:slug 详情页。近似但不应触发的场景：仅阅读/总结文件、仅修改已发布内容、仅删除内容、仅部署或 push。"
---

# Blog Content Publisher

把作者给的本地 Markdown / HTML 文件，按本项目权威规范整理成可在博客展示的 Entry。**技能本身不实现上传 UI、不调外部 API、不新增解析依赖**——它把现有规范固化成一次可执行的发布流程。

## 权威来源（先读）

动手前必须按下面顺序读取，规范高于 SKILL.md 自身措辞：

1. `CLAUDE.md` — 项目通用约束、Entry 模型、详情页约定。
2. `.trellis/spec/content/ai-upload-flow.md` — 六步清单（必读的“怎么做”）。
3. `.trellis/spec/content/source-formats.md` — registry 字段合同与反模式。
4. `.trellis/spec/content/maintenance-workflows.md` — 安全骨架、确认与回滚。
5. `.trellis/spec/frontend/data-and-rendering.md` — Entry + iframe 渲染合同。
6. `.trellis/spec/frontend/testing-and-quality.md` — 验证命令与基线。

## 触发与意图路由

### 应该触发

- 「将/把 `<file>` 上传到网站 / 博客」
- 「把 `<file>` 整理后发布到博客」
- 「publish / upload this Markdown / HTML to the blog / site」
- 用户明确希望把一个 .md 或 .md 整理成可在 `/` 和 `/p/:slug` 看到的内容。

### 不应触发

- 仅阅读、总结、翻译、润色文件。
- 仅修改已发布内容的文字/样式（那是 inline edit，不是 publish）。
- 仅删除 Entry。
- 仅部署、仅 push。
- 意图模糊时先澄清，不要直接走发布流程。

## 工作流

按下面步骤执行，不要跳步。每一步产出都要在继续前先确认。

### 1. 解析输入

- Read 用户给的源文件。
- 不要凭文件名猜 metadata。按内容推断：frontmatter、H1（候选 title）、首段（候选 excerpt）、正文结构、是否自带完整 HTML 文档结构。
- 检测输入类型：
  - **Markdown**：正文以 `#`、`>`、`-`、```` ``` ````、`|` 等 Markdown 记号为主。
  - **HTML**：源文件是 `<!DOCTYPE html>` / `<html>` 起头的完整文档，或 HTML 片段。

### 2. 一次确认（MUST, 任何写入之前）

把下面表格一次性展示给用户，确认 / 修正后，才能进入下一步。

#### 单条 / 多条批量都一次确认

| 字段 | 说明 |
|---|---|
| `type` | `article` 还是 `project` |
| `category` | 仅文章必填，必须是 `ai / python / engineering / product / notes / resources` 之一；项目恒 `null` |
| `slug` | 全局唯一（文章与项目共享命名空间）；kebab-case、纯 ASCII |
| `title` | 标题 |
| `excerpt` | 1–2 句，用于瀑布流卡片 |
| `tags` | 字符串数组（项目技术栈也放这里） |
| `date` | 文章 ISO `YYYY-MM-DD`；项目无显式日期用 `1970-01-01` |
| `links` | 仅项目：`{ github, demo }`，无则对应字段填 `null` |
| `cover` | 封面相对路径，无则 `null` |

#### 字段的多重作用（影响确认环节的判断）

`title` 和 `excerpt` 不只是瀑布流卡片用，详情页运行时还会再消费一次：

- **`entry.title`** 同时是：(a) 卡片标题 / (b) `<iframe title={entry.title}>`（屏幕阅读器朗读 iframe 内容用）/ (c) `og:title` / `twitter:title`（分享卡标题）。截断 / 纯表情符号 / 仅"未命名"会影响这三处，建议保持简短描述性（中文 30 字内最佳）。
- **`entry.excerpt`** 同时是：(a) 卡片摘要 / (b) `og:description` / `twitter:description`（分享卡描述）。HTML 内作者自带的 `<meta name="description">` 会被运行时 Helmet 覆盖（见 `.trellis/spec/frontend/data-and-rendering.md` §OG / Twitter Card meta 注入）。
- 当前所有 entry `cover: null` → OG 图统一走单品牌图 `public/og-default.png`；未来某 entry 有 `cover` 时再考虑 per-entry OG 图。

#### 必须先做的一致性检查

在展示确认表之前必须先做：

- 检查目标 slug 是否已经存在于 `src/data/articles.js` **或** `src/data/projects.js`，确保全局唯一。
- 检查 `content/<slug>.html` 在文件系统中是否已存在。
- 检查项目中是否已有同 import 变量名。
- 任一冲突 → 停下来与用户确认，**不要**自动覆盖或改名。

#### 批量发布

- 一次确认**所有**目标的 metadata，再逐条切入第 3–5 步。
- 遇到第一个无法安全解决的问题就停止，列出 completed / incomplete，不 hard reset。

### 3. 生成 / 复制内容产物

#### A. Markdown → 自包含 HTML

- 解析并**移除** frontmatter，仅把正文转成语义 HTML。
- 保留：标题层级、段落、行内/块级代码、表格、引用、列表、强调、链接。
- 用 `references/markdown-template.html` 作为完整文档骨架，把生成的正文替换到 `<!-- 正文 -->` 位置。
- 外链使用 `target="_blank" rel="noreferrer"`。
- 图片只保留 / 生成本项目相对路径。
- 产出文件是**完整 HTML 文档**（带 `<!doctype html>`），细节走 iframe。

#### B. HTML → 原样复制

- 不解析重写、不格式化、不重新序列化、不预注入 `<base>`。
- 用 `cp` 把源文件复制成 `content/<slug>.html`。
- 用 `cmp -s` 校验目标与输入逐字节一致。
- 说明：运行时 `<base>` 由现有 `src/lib/html.jsx` 注入，落盘文件必须保持作者原始内容。

### 4. 落盘与 registry

每条 Entry 必须**成套**完成下面三个同步点，缺一不可：

- 写 `content/<slug>.html`（扁平；分类只在 metadata）。
- 在对应 registry 顶部加 `?raw`  import：`import xxx from '../../content/<slug>.html?raw';`（变量名是有效且不冲突的 JavaScript 标识符）。
- 在同 registry 数组里加一条完整 metadata，必填字段齐全。
  - 文章 → `src/data/articles.js`：`{ slug, title, excerpt, date, type: 'article', category: '<6 个固定 slug 之一>', tags, cover, links: null, content: xxx }`
  - 项目 → `src/data/projects.js`：`{ slug, title, excerpt, date: '1970-01-01', type: 'project', category: null, tags, cover, links: { github, demo }, content: xxx }`

**不要**改 `Home.jsx`、`EntryDetail.jsx`、`EntryCard.jsx`、`entries.js`、`html.jsx`、`categories.js`；UI 会自动消费新 registry。

### 5. 自动验证

每条 / 批发布都必须跑：

```bash
npm test        # 失败数不得超过任务前既有基线
npm run build   # 必须通过；raw import / metadata 成套才能过
```

如实比较测试基线：不要归因既有失败给本任务，也不要宣称全绿。唯一能接受的结果是“无新增失败”。

### 6. 手工抽检（可用 run/verify 能力）

- `/`：新卡片出现；分类 / 日期 / 摘要 / 标签 / 排序正确。
- `/p/<slug>`：全屏 iframe + 悬浮返回按钮；无可见 frontmatter；Markdown 结构完整。
- **内嵌 404 自检**：如果 `/p/<slug>` 显示「文章不存在或已被移除」+ `/p/<slug>` 字样（`EntryDetail` 内嵌 404 视图，2026-08-23 P1-3 改造复用 NotFound 视觉），说明三处同步点坏了：
  - registry 里的 `slug` 与 `content/<slug>.html` 文件名不一致；
  - 或 `content/<slug>.html` 缺失（registry 有 metadata 但文件没落盘）；
  - 或 metadata 的 `?raw` import 变量名打错。
  修复路径：核对 articles.js / projects.js 的 `slug` ↔ `content/<slug>.html` ↔ import 变量三者一致后重跑 build。
- HTML 直出版：作者原 CSS/SVG/脚本/动画保留；桌面 + 移动可读。

## 失败与回滚

- import 变量冲突 / 路径写错 → 按 build 报错修正。
- 分类非法 → `tests/registry.test.js` 失败，改回 6 个固定 slug 之一。
- 任一失败后：停止、报告 completed/incomplete、不自动 hard reset。
- 本次新增内容的精确回滚 = 删除其 `content/<slug>.html` + registry `?raw` import + metadata 记录。不用仓库级 reset。
- HTML 已存在 / 来源变化 → 重新确认再覆盖。

## 明确不做

- 不新增运行时 Markdown 解析依赖，Markdown→HTML 由技能基于 `references/markdown-template.html` 驱动。
- 不复现已下线的技能 / 工具 / 关于、旧目录、旧 parser、旧页面。
- 不改 `package.json`、lockfile、部署 workflow、无关产品组件。
- 不自动 commit / push。
