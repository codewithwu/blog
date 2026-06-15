# 文章页签改用 HTML 渲染 — 设计文档

**日期**: 2026-06-15
**状态**: 已批准，待实现
**作用范围**: 文章详情页 (`/articles/:slug`)；让文章详情与项目详情 (`/projects/:slug`) 视觉与机制一致；列表页、其他页签不动

## 背景

文章详情目前用 markdown 渲染（`articles/<category>/<slug>.md` → `react-markdown` + `remark-gfm` + `rehype-highlight`，外层套 Tailwind `prose` 容器）。markdown 表达力受限，承载不了富布局：卡片网格、按钮、提示框、装饰性排版、字体切换等。

与此同时，项目详情页（`/projects/:slug`）已经统一改为 100vh iframe + `Html` 组件渲染 `.html` 文件，作者可写完整文档或 HTML 片段，`Html` 组件自动识别并打补丁（注入 `<base href="about:srcdoc">` 修锚点；`sandbox` 放行 `popups/forms`）。本次让文章详情走同一套机制，**完全照搬**项目详情页的呈现方式。

## 目标

- 文章详情页从 `.md` 文件 + `<Markdown>` 改为 `.html` 文件 + `<Html>`，与项目详情同源
- 文章详情页视效与项目详情页 1:1：100vh iframe + 悬浮「← 返回文章列表」按钮，`<Navbar />` 在该路由下隐藏，viewport 完全让给 iframe
- 文章卡片列表页（`Articles.jsx`）与项目卡片列表页（`Projects.jsx`）保持一致风格：仍用主站 brand-* 类，不再嵌入 iframe 视口
- 草稿发布流程（`create-article` 技能）同步切换到 `.html`
- 旧文章 `articles/notes/你好，世界.md` 删源文件 + 删数据

## 非目标

- 不改文章列表页（`Articles.jsx`、`ArticleCard.jsx`）
- 不改文章分类、6 固定分类
- 不改 `src/lib/html.jsx`（已具备完整文档 / HTML 片段兼容、锚点修复、`sandbox` 配置）
- 不改 `src/lib/articles.js`（`findArticleBySlug` / `listArticles` 行为不变，数组暂时为空）
- 不改路由结构
- 不改 `create-article` 技能以外的其他技能
- 不引入新依赖
- 不重构项目详情页

## 架构与数据流

```
URL /articles/:slug
  ↓
ArticleDetail.jsx
  ├── findArticleBySlug(slug) → src/lib/articles.js → src/data/articles.js
  └── <Html html={article.content} title={article.title} />   ← src/lib/html.jsx (复用)
        ├── 完整文档? → 原样塞 srcDoc
        ├── HTML 片段? → 包成最小文档 (doctype + html + head + body)
        └── 注入 <base href="about:srcdoc"> + sandbox="allow-scripts allow-popups allow-forms"
```

`<Html>` 组件零修改，沿用项目详情页用过的同一份实现。`<Markdown>` 组件及其依赖（`react-markdown` / `remark-gfm` / `rehype-highlight` / `@tailwindcss/typography`）随文章详情切走而一并清理。

**Navbar 显隐**：当前 `App.jsx` 只在 `/projects/:slug` 隐藏 Navbar。改为统一匹配 `/articles/:slug` 与 `/projects/:slug`：

```js
const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
const isArticleDetail = /^\/articles\/(?!category\/)[^/]+/.test(location.pathname);
const isFullBleedDetail = isProjectDetail || isArticleDetail;
```

注意 `/articles` 下还有一个 `/articles/category/:category` 路由(分类筛选页)，需要 `(?!category\/)` 排除掉，否则会把筛选页的 Navbar 也误隐藏。`/projects` 没有同类路由，正则保持原样。

## 文件改动清单

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/pages/ArticleDetail.jsx` | 改 | 删除 `<Markdown>` 引用、删除标题/日期/标签区段、删除「文章不存在」分支（改用 `<Navigate to="/articles" replace />`，与 `ProjectDetail` 对齐）；整页变 `<悬浮返回链接> + <Html html={article.content} title={article.title} />` |
| `src/App.jsx` | 改 | 新增 `isArticleDetail = /^\/articles\/(?!category\/)[^/]+/.test(pathname)`；`isProjectDetail` 保留原正则；合并为 `isFullBleedDetail = isProjectDetail \|\| isArticleDetail`；对应变量名/JSX 条件同步更新 |
| `src/data/articles.js` | 改 | 删除 `import helloWorld from '../../articles/notes/你好，世界.md?raw'` 行；`articles` 数组清空（等新 HTML 文章发布时再填） |
| `src/lib/articles.js` | 不动 | — |
| `src/lib/markdown.jsx` | 删 | 唯一调用方是 `ArticleDetail.jsx` |
| `src/lib/html.jsx` | 不动 | 复用 |
| `src/index.css` | 改 | 删除 `hljs-*` 相关样式（`markdown.jsx` 删除后无引用方） |
| `package.json` | 改 | 删除 `react-markdown`、`remark-gfm`、`rehype-highlight`、`@tailwindcss/typography` 四个依赖 |
| `articles/notes/你好，世界.md` | 删 | 旧文章源文件 |
| `articles/notes/` | 保留空目录 | 后续 HTML 文章归位 |
| `articles/ai/`、`articles/engineering/` | 保留空目录 | 同上 |
| `articles-draft/` | 不动 | 后续 `create-article` 技能会迁入 `.html` 文件 |
| `CLAUDE.md` 第 10、11 条 | 改 | 统一规则：articles / projects 都是 `.html` 文件、`?raw` 导入、由 `Html` 组件以 100vh iframe 渲染；列表卡片仍用主站 brand-* 类 |
| `create-article` 技能 | 改 | 触发条件、草稿路径、文件后缀、发布流程从 `.md` 改为 `.html`；在提示里写明「可写完整 HTML 文档或 HTML 片段，`Html` 组件会自动包成最小文档」、「iframe 内部 Tailwind 类不生效，作者需自补样式」 |
| `tests/articles.test.js` | 改 | 期望在空数组下 `listArticles()` 返 `[]`、`findArticleBySlug('hello-world')` 返 `undefined` |
| `tests/article-detail.test.jsx` | 新建 | 3 个 case：slug 存在渲染 iframe + 返回链接、slug 不存在触发 `<Navigate to="/articles" replace />`、title 通过 `usePageTitle` 设置 |
| `tests/html.test.jsx`、`tests/project-detail.test.jsx` | 不动 | 复用 `Html` 组件的测试已覆盖核心行为 |
| `tests/content.test.js`、`tests/projects.test.js` | 不动 | 与本任务无关 |
| `vite.config.js`、`tailwind.config.js`、`.github/workflows/*` | 不动 | `?raw` 已支持，部署流程不变 |

## 关键决策

| 决策 | 选择 | 备选 |
|---|---|---|
| 文章详情视觉 | **完全照搬项目详情**：100vh iframe + 悬浮返回链接 + 隐藏 Navbar | (B) 顶部保留 brand-* 标题/日期/标签条 + iframe；(C) 弃 iframe 改 `dangerouslySetInnerHTML` 内联 |
| 文件格式 | **`.html`**（完整文档或片段，`Html` 组件识别） | `.md` 内容手写 HTML（后缀不准）、其他 |
| 旧文章 `你好，世界.md` | **删除源文件 + 删除数据**（与 `96ee4b3` 清理风格一致） | 转 HTML 重新发布、双格式共存 |
| `create-article` 技能 | **同步切换**到 `.html` 流程 | 只改线上、草稿维持 `.md` |
| `Markdown` 组件 / markdown 依赖 | **整组删除** | 保留为「备用」 |
| `hljs-*` 样式 | **删除**（无引用方） | 保留为「备用」 |
| 列表页（`Articles.jsx`） | **保持现状** | 同步切换成「卡片点击进 iframe」—— 当前已经是这样 |

## 数据形态（以一篇为例）

```js
// src/data/articles.js
import myArticle from '../../articles/engineering/foo.html?raw';

const articles = [
  {
    slug: 'foo',
    title: '...',
    excerpt: '...',
    date: '2026-06-15',
    tags: ['...'],
    cover: null,
    content: myArticle,
    category: 'engineering'
  }
];
export default articles;
```

`content` 字段名保持（与 `projects.js` 字段对齐）。`Html` 组件对 `content` 一视同仁。

## 边界情况

| 情况 | 行为 |
|---|---|
| `/articles/:slug` 但 slug 不存在 | `<Navigate to="/articles" replace />`（与 `ProjectDetail` 一致） |
| 文章 HTML 是片段（无 `<!doctype>`） | `Html` 组件自动包成最小文档 |
| 文章 HTML 是完整文档（含 `<!doctype>`） | 走 `isFullDocument` 分支，原样塞 srcDoc |
| 文章 HTML 里有 `<a href="#x">` 锚点 | 注入 `<base href="about:srcdoc">` 修锚点 |
| 文章 HTML 里有 `target="_blank"` | `sandbox="allow-scripts allow-popups allow-forms"` 放行 |
| `articles` 数组为空 | `Articles.jsx` 列表页保持现有空态（不修改） |
| 文章详情页的 `document.title` | `usePageTitle(article?.title)` 仍生效 |
| iframe 内部用了 `text-brand-light` 等 Tailwind 类 | **不会生效**（iframe 不继承主站 Tailwind），作者需在 HTML 里自补样式 —— 需在 `create-article` 技能里写明 |

## 错误处理

- slug 找不到：`<Navigate to="/articles" replace />`（行为与项目详情一致，不显示 404）
- 文章 HTML 解析失败：浏览器原生错误（与项目详情一致，不做事后消毒，由作者负责）

## 测试策略

- `tests/article-detail.test.jsx`（新增）：3 个 case
  - slug 存在：渲染 iframe（`srcDoc` 含文章 HTML）+ 悬浮「← 返回文章列表」链接
  - slug 不存在：触发 `<Navigate to="/articles" replace />`
  - title 经 `usePageTitle` 设置到 `document.title`
- `tests/articles.test.js`（更新）：期望在空数组下 `listArticles()` 返 `[]`、`findArticleBySlug('hello-world')` 返 `undefined`
- `tests/html.test.jsx`、`tests/project-detail.test.jsx`（不动）：`Html` 行为与项目详情关键路径已有覆盖
- 不写 e2e（项目只用 Vitest，无 Playwright）

## 风险

- `react-markdown` / `remark-gfm` / `rehype-highlight` / `@tailwindcss/typography` 删除后若有遗漏引用，`vite build` 会失败 —— 用 `grep -rn "react-markdown\|tailwindcss/typography\|hljs-" src/` 兜底检查
- `index.css` 里 `hljs-*` 样式：删之前 grep 确认仅 `markdown.jsx` 引用
- `tailwind.config.js` 不需要新增 `articles/**/*.html` 到 `content` 数组（文章 HTML 在 `srcDoc` iframe 中，不经 Tailwind 编译期扫描；与项目规则一致）
- `App.jsx` 路由级 Navbar 显隐改一处时，回归验证 `/projects/:slug` 行为不变

## 完成判定

- `npm run build` 通过
- `npm test` 全绿
- `npm run dev` 启动后：
  - `/#/articles` 显示空态（列表正常）
  - `/#/articles/不存在的slug` 自动跳回 `/#/articles`
  - 新发布一篇 HTML 文章后,`/#/articles/<slug>` 正确渲染为全屏 iframe、悬浮「← 返回文章列表」按钮可见、Navbar 隐藏、`document.title` 为文章标题

## 实现计划

进入 `writing-plans` 技能生成详细实施计划（按文件分步骤、每步配测试）。
