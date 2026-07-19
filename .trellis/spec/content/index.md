# Content 规范索引

本目录覆盖项目根目录的作者内容与已跟踪本地维护技能：

- `articles-draft/` 与 `articles/<category>/`
- `projects-draft/` 与 `projects/`
- `content-draft/` 与 `content/`
- 对应 `src/data/*` 注册和 `.claude/skills/*` 维护入口

## 规范列表

| 规范 | 何时阅读 |
|---|---|
| [Source Formats](./source-formats.md) | 新建或手工编辑文章、项目、技能、工具、关于内容时 |
| [Maintenance Workflows](./maintenance-workflows.md) | 发布/删除文章或项目、合并草稿、修改本地 skill 或处理 registry 不一致时 |

运行时如何消费这些内容由 [../frontend/data-and-rendering.md](../frontend/data-and-rendering.md) 负责；测试门槛见 [../frontend/testing-and-quality.md](../frontend/testing-and-quality.md)。

## Pre-Maintenance Checklist

1. 判断目标是草稿还是已发布内容；草稿目录不会自动出现在网站。
2. 读取对应源文件和 registry，不要根据文件名猜 metadata 或 import 变量。
3. 文章分类只允许 `src/data/categories.js` 中的六个固定 slug。
4. HTML 将在隔离 iframe 中运行，确认自带样式、相对图片和外链行为。
5. Markdown 页签严格受 `src/lib/content.js` parser 形状约束。
6. 发布、删除、覆盖或 merge 前展示准确变更并确认；普通小改直接改 live source。
7. 结束时检查源文件、raw import、metadata/parser 输出和 build。

## 单一来源速查

| 内容 | 单一来源 | 不应直接改 |
|---|---|---|
| 已发布文章正文 | `articles/<category>/<slug>.html` | detail page JSX |
| 文章分类名/顺序 | `src/data/categories.js` | card/filter/page 中硬编码中文名 |
| 已发布项目正文 | `projects/<slug>.html` | detail page JSX |
| 技能页内容 | `content/技能.md` | `src/data/skills.js` |
| 工具页内容 | `content/工具.md` | `src/data/tools.js` |
| 关于页内容 | `content/关于.md` | `src/pages/About.jsx` 中硬编码正文 |

`src/data/articles.js` 和 `src/data/projects.js` 是发布 registry，不是正文编辑器；源文件与 registry 必须保持一致。
