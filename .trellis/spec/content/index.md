# Content 规范索引

本目录覆盖项目根目录的作者内容与发布 registry：

- `content/`（已发布，扁平结构；文章与项目共目录，不分子目录）
- 对应 `src/data/*` 注册入口

> 瀑布流重构（2026-07）后：技能 / 工具 / 关于三个页签及其 `content/*.md` 源、`src/lib/content.js`
> parser 已**永久下线**；文章与项目合并为统一 Entry，运行时统一由 `src/lib/entries.js` 消费。
> `articles-draft/`、`projects-draft/` 等本地草稿目录已清空，作者源统一经 [AI Upload Flow](./ai-upload-flow.md) 写入 `content/<slug>.html`。

## 规范列表

| 规范 | 何时阅读 |
|---|---|
| [AI Upload Flow](./ai-upload-flow.md) | 执行「把某个 .md 整理后上传到网站」这类命令驱动的内容发布时 |
| [Source Formats](./source-formats.md) | 新建或手工编辑文章、项目内容时（技能/工具/关于章节已作废） |
| [Maintenance Workflows](./maintenance-workflows.md) | 发布/删除文章或项目、合并草稿或处理 registry 不一致时 |

运行时如何消费这些内容由 [../frontend/data-and-rendering.md](../frontend/data-and-rendering.md) 负责；测试门槛见 [../frontend/testing-and-quality.md](../frontend/testing-and-quality.md)。

## Pre-Maintenance Checklist

1. 定位作者源的实际路径（当前无 `articles-draft/` / `projects-draft/` 草稿目录，作者源位于任意本地路径或临时刻片上）。
2. 读取对应源文件和 registry，不要根据文件名猜 metadata 或 import 变量。
3. 文章分类只允许 `src/data/categories.js` 中的六个固定 slug。
4. HTML 将在隔离 iframe 中运行，确认自带样式、相对图片和外链行为；`brand-*` 类在 iframe 内不生效。
5. 文章与项目的 metadata 形状见 `ai-upload-flow.md` 第 5 步（含 `type` / `category` / `links` 字段）。
6. 发布、删除、覆盖或 merge 前展示准确变更并确认；普通小改直接改 live source。
7. 结束时检查源文件、raw import、metadata、`entries.js` 消费结果和 build。

## 单一来源速查

| 内容 | 单一来源 | 不应直接改 |
|---|---|---|
| 已发布文章正文 | `content/<slug>.html`（分类仅在 metadata，不映射目录） | detail page JSX |
| 文章分类名/顺序 | `src/data/categories.js` | card/page 中硬编码中文名 |
| 已发布项目正文 | `content/<slug>.html` | detail page JSX |
| 文章发布 registry | `src/data/articles.js` | — |
| 项目发布 registry | `src/data/projects.js` | — |
| 统一内容查询 | `src/lib/entries.js`（`listEntries` / `findEntryBySlug` / `entryCount`） | 页面直接 import data |

`src/data/articles.js` 和 `src/data/projects.js` 是发布 registry，不是正文编辑器；源文件与 registry 必须保持一致。
