# AI 内容上传流程（命令驱动）

> 面向未来执行「把 `m.md` 整理后上传到网站」这类命令的 Claude agent。
> 本文是**可复用操作清单**，不是前端功能——站点不提供任何上传 UI，也不调用任何外部 / AI API。

## 触发方式

作者在终端运行类似命令：

```bash
claude "把 m.md 整理后上传到网站"
```

Claude 收到后按下面 6 步执行。**不要**跳过第 2 步的一次确认。

## 六步清单

### 1. 读取并解析源文件

- 用 Read 读取 `m.md`（或作者指定的源文件）。
- 解析：可能存在的 frontmatter、一级标题（候选 title）、首段（候选 excerpt）、正文段落 / 代码块 / 图片。
- 不要凭文件名猜 metadata。

### 2. 与作者一次确认（必须）

一次性列出并请作者确认 / 修正以下字段：

| 字段 | 说明 |
|---|---|
| `type` | `article` 或 `project` |
| `category` | 仅文章需要，必须是 6 个固定 slug 之一（见下表） |
| `slug` | 全局唯一（文章与项目共享命名空间），kebab-case，纯 ASCII |
| `title` | 标题 |
| `excerpt` | 摘要（1–2 句，用于瀑布流卡片） |
| `tags` | 字符串数组（项目的技术栈也放这里） |
| `date` | 文章用 ISO 日期（`YYYY-MM-DD`）；项目通常留 `1970-01-01`（UI 隐藏，仅排序用） |
| `links` | 仅项目：`{ github, demo }`，无则对应字段填 `null` |
| `cover` | 封面相对路径，无则 `null` |

**6 个固定分类**（中文显示名唯一来源是 `src/data/categories.js`，勿在别处硬编码）：

| slug | 中文显示名 |
|---|---|
| `ai` | AI |
| `python` | Python |
| `engineering` | 软件工程与开发实践 |
| `product` | 产品与设计 |
| `notes` | 随笔与思考 |
| `resources` | 资源整理 |

### 3. 把 Markdown 整理为自包含 HTML

详情页在**隔离 iframe** 中渲染（`src/lib/html.jsx`），iframe 内**不继承**主站 Tailwind 编译产物：

- `brand-*` 类在 iframe 内**不生效**——必须用内联 `<style>` 或 `<link rel="stylesheet">` 自补样式。
- 颜色 / 字体建议对齐 brand token 手写值：背景 `#141413`、正文 `#faf9f5`、辅助 `#b0aea5`、点缀橙 `#d97757` / 蓝 `#6a9bcc` / 绿 `#788c5d`；标题字体 Poppins、正文 Lora（可 `@import` Google Fonts）。
- 图片用相对路径（CLAUDE.md 规则 3）。
- 外链 `target="_blank"` 需要 sandbox 的 `allow-popups`（`Html` 已开启）；锚点跳转依赖注入的 `<base href="about:srcdoc">`（`Html` 自动处理）。

可以写**完整文档**或**HTML 片段**（单根元素）；片段会被 `Html` 自动包成最小文档。

最小骨架模板：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root { --bg:#141413; --fg:#faf9f5; --mid:#b0aea5; --accent:#d97757; }
    body { margin:0; background:var(--bg); color:var(--fg);
           font-family:'Lora',Georgia,serif; line-height:1.7;
           max-width:720px; padding:48px 24px; margin:0 auto; }
    h1,h2,h3 { font-family:'Poppins',Arial,sans-serif; }
    a { color:var(--accent); }
    code,pre { background:#1c1b1a; border-radius:6px; }
    pre { padding:16px; overflow:auto; }
  </style>
</head>
<body>
  <h1><!-- title --></h1>
  <!-- 正文 -->
</body>
</html>
```

### 4. 落盘

- 文章：`articles/<category>/<slug>.html`（**必须**带分类子目录）。
- 项目：`projects/<slug>.html`。

### 5. 在对应 registry 加 `?raw` import + metadata

- 文章 → `src/data/articles.js`：
  ```js
  import xxx from '../../articles/<category>/<slug>.html?raw'; // 路径必须带子目录
  // 数组里加一条：
  { slug, title, excerpt, date, type: 'article', category: '<category>',
    tags: [...], cover: null, links: null, content: xxx }
  ```
- 项目 → `src/data/projects.js`：
  ```js
  import xxx from '../../projects/<slug>.html?raw';
  { slug, title, excerpt, date: '1970-01-01', type: 'project', category: null,
    tags: [...], cover: null, links: { github: '...', demo: null }, content: xxx }
  ```
- 运行时统一由 `src/lib/entries.js` 的 `listEntries()` / `findEntryBySlug()` 消费，页面无需改动，新内容会自动出现在瀑布流首页并可从 `/p/<slug>` 打开。

### 6. 自检

```bash
npm test        # 失败数不得超过既有基线
npm run build   # 必须成功；raw import / metadata 成套才能过
```

- 手工抽检：`/`（瀑布流出现新卡片）、`/p/<slug>`（全屏 iframe + 返回按钮）。

## 失败重做与回滚

- import 变量名冲突 / 路径写错 → build 会报错，按报错修正后重跑。
- 分类非法 → `tests/registry.test.js` 会失败，改回 6 个固定 slug 之一。
- 想整体撤销本次上传 → `git revert <commit>` 或手工删除：源 HTML 文件 + registry 的 import 行 + metadata 记录（三者成套删除）。

## 明确不做

- 不在前端加任何上传 / 编辑 UI。
- 不调用任何外部 API 或引入 AI 调用库。
- 不迁移已下线的技能 / 工具 / 关于历史内容（这些页签已永久删除）。
