---
name: blog-content-deleter
description: "从本博客网站移除指定的文章或项目内容。当用户说「删除 X.html」「移除 X」「delete/remove the X entry/article/project」时务必使用本技能：它按项目规范定位三处同步点（content/ 源文件、src/data 的 ?raw import、metadata 记录），在实施删除前展示确认，并在删除后跑测试 / build 保证前后端一致。近似但不应触发的场景：仅查看/读取文件、仅修改内容或样式、仅发布新内容、仅部署或 push。"
---

# Blog Content Deleter

把一个已存在的 Entry 从博客中完整移除。**技能本身不新增 UI、不改 page/card 组件**——做的是 `blog-content-publisher` 的逆向操作：把三处同步点全部清干净，让 UI 自动不再渲染该内容。

## 权威来源（先读）

动手前必须按下面顺序读取，规范高于 SKILL.md 自身措辞：

1. `CLAUDE.md` — Entry 模型、三处同步点约定、详情页与首页如何消费 registry。
2. `.trellis/spec/content/maintenance-workflows.md` — 通用维护安全骨架、文章 / 项目删除细则、失败与部分状态处理。
3. `.trellis/spec/frontend/data-and-rendering.md` — Entry 与 iframe 渲染合同（确认删除后无需改 UI 文件）。
4. `.trellis/spec/frontend/testing-and-quality.md` — 验证命令与基线。

## 触发与意图路由

### 应该触发

- 「删除 `<slug>`」「删除 `<slug>.html」「删除 X 文章 / 项目」
- 「remove / delete the `<slug>` entry / article / project」
- 用户明确希望某个已存在的 Entry 从 `/` 和 `/p/:slug` 彻底消失。

### 不应触发

- 仅阅读、查看文件。
- 仅修改内容或样式（那是 inline edit）。
- 发布新内容。
- 意图模糊时先澄清，不要直接走删除流程。

## 工作流

按下面步骤执行，不要跳步。破坏性写入前必须得到用户确认。

### 1. 解析目标

从用户语句中提取候选 slug 或文件名（去掉 `.html` 后缀即 slug）。不要凭文件名猜 metadata，按第 2 步从 registry 反查。

### 2. 定位三处同步点（必须全部找到）

以 `slug` 为键在 **`src/data/articles.js` 与 `src/data/projects.js` 两者中都搜**，找到包含该 slug 的那一条：

- **import 行**：`import <变量名> from '../../content/<slug>.html?raw';`（复制整行文本与变量名）。
- **metadata 条目**：在同一 registry 数组中找到 `slug: '<slug>'` 的对象，复制完整对象（含 `type / category / date / title / links` 等）。

再核对文件系统：`content/<slug>.html` 是否存在。

**任何一处缺 / 矛盾**（例如 slug 只在 metadata 没有 import、或 import 变量与 `content` 字段对不上、或文件不在 `content/`），立即停止并报告"registry / 文件不一致"，不要猜测修复。

### 3. 一次确认（MUST, 任何删除之前）

把下面信息一次性展示给用户，确认后才能进入下一步：

| 待删除项 | 实际内容 |
|---|---|
| 类型 | `article` / `project` |
| slug | xxxxx |
| 源文件 | `content/<slug>.html` |
| registry 文件 | `src/data/articles.js` / `src/data/projects.js` |
| import 行 | 完整 import 文本 |
| import 变量 | `<变量名>` |
| metadata 条目 | 完整对象文本 |

#### 额外一致性检查

确认前三项：

- registry 文件里**没有其它地方**引用同一个 import 变量（避免删错其它条目的依赖）。
- 文件系统里**没有其它 slug** 复用同一 `content/<slug>.html`。
- 确认 `src/lib/entries.js`、`Home.jsx`、`EntryDetail.jsx`、`EntryCard.jsx`、`categories.js` 这些文件**不需要改**——UI 会自动不再渲染。

### 4. 执行删除（成套完成）

三条必须一起改，缺一不可：

- `rm content/<slug>.html` — 删除源文件。
- 在对应 registry 顶部**删掉**对应的 `?raw` import 行（精确按第 2 步复制的整行删除，不要按变量名猜测）。
- 在同 registry 数组里**删掉**对应的 metadata 对象（精确按第 2 步复制的对象删除；注意删除后剩余 JSON 的逗号仍然合法）。

**不要改** `Home.jsx` / `EntryDetail.jsx` / `EntryCard.jsx` / `entries.js` / `categories.js`。

### 5. 清理残留引用

删除后对三处关键词做全文搜索，确保无残留：

- slug：`<slug>`
- import 变量：`<变量名>`
- 源文件名：`<slug>.html`

搜索范围：`src/`、`content/`、`tests/`、`App.jsx`、`vite.config.js`。发现残留按同样流程补删。

**残留校验信号**：如果 `/p/<slug>` 仍能访问但显示「文章不存在或已被移除」+ `/p/<slug>`（`EntryDetail` 内嵌 404 视图，2026-08-23 P1-3 改造复用 NotFound 视觉），说明三处同步点没删干净——通常是只删了 metadata 但忘了删 import 行或 `content/<slug>.html`。按"定位三处同步点"流程重新核对并补删。

### 6. 自动验证

```bash
npm test        # 失败数不得超过任务前既有基线
npm run build   # 必须通过；三处同步点都清干净才能过 build
```

如实比较测试基线：不要归因既有失败给本任务。唯一能接受的结果是“无新增失败”。

## 失败与回滚

- 任一步骤失败 → **立即停止**，列出已删除 / 未删除的 touch points，不继续处理下一个目标。
- 不需要仓库级 reset。
- 误删后的精确回滚 = 用 git 恢复三处同步点：
  - `git checkout -- content/<slug>.html`
  - `git checkout -- src/data/<registry>.js`（同时恢复 import 行与 metadata）
- registry / 文件不一致属于需要用户决策的修复，不要在删除流程中猜测处理。

## 部分状态的安全骨架

保留 `maintenance-workflows.md` 的通用原则：

1. **解析目标**：已识别 slug / 文件名 / registry 来源。
2. **读取权威状态**：以 registry (articles.js / projects.js) 为起点反查 import 变量 / metadata / 文件路径；文件系统与 registry 都要核对。
3. **格式检查**：确认 import 变量名、slug、文件位置彼此匹配。
4. **完整预览**：列出三处同步点 + import 变量 + metadata，给用户确认。
5. **确认**：删除前必须用户明确同意；发现不一致停止。
6. **最小实施**：只动该 Entry 所属的三个 touch points。
7. **验证**：搜索残留 + test + build。
8. **如实报告**：已删 / 未删 / warning / 失败。

## 明确不做

- 不新增运行时解析依赖、不改 page/card 组件。
- 不复现已下线的技能 / 工具 / 关于、旧目录、旧 parser、旧页面。
- 不改 `package.json`、lockfile、部署 workflow、无关产品组件。
- 不自动 commit / push。
- 不删除独立 draft 文件（draft 是独立作者源，删除 live 内容不连带）。
