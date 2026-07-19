## 注意：

### 1. 通用约束

1. GitHub Pages 不支持 react-router 的 BrowserRouter（项目页 `/blog/` 无法做服务端重定向），需要用 HashRouter 或配置 404.html 重定向
2. 部署时需要配置 base 路径：`vite.config.js` 当前 `base: '/blog/'`；如改回根域部署需改为 `/`
3. 所有图片资源使用相对路径
4. 代码要有详细中文注释，方便后续修改
5. 包含 JSX 的文件必须用 `.jsx` 后缀；Markdown / HTML 源文件用 `?raw` 后缀导入
6. react-helmet-async@2 不导出 useHelmet 钩子，页面标题统一通过 `src/hooks/usePageTitle.js`（内部用 `useEffect` 改 `document.title`）
7. 图标统一用 lucide-react，不要混用其他图标库（emoji / FontAwesome 等）

### 2. 内容模型（Entry 统一抽象）

文章与项目合并为同一类型 **Entry**，统一通过 `src/lib/entries.js` 查询（`listEntries` / `findEntryBySlug` / `entryCount`）。UI 层不直接 import `src/data/*.js`，统一走 `entries.js`。

Entry 字段形状：

```
{ slug, title, excerpt, date, type, category, tags, cover, links, content }
```

- `slug`：全局唯一（跨文章 / 项目不可重复）
- `type`：`'article'` | `'project'`
- `category`：文章必填（取自规则 5 的 6 个固定 slug 之一）；项目恒为 `null`
- `date`：文章必填（`YYYY-MM-DD`）；项目无显式日期时填 `'1970-01-01'`（排序时自然沉底，UI 不展示）
- `links`：项目用 `{ github, demo }`；文章通常 `null`
- `content`：`?raw` 导入的 HTML 字符串（完整文档或片段均可，见规则 3）

数据来源（保留分文件惯例，减小 diff）：

- 文章 → `src/data/articles.js`（数组，每项 metadata 必填 `category`）
- 项目 → `src/data/projects.js`（数组，`category: null`）
- 分类元数据 → `src/data/categories.js`（6 个固定 slug + 中文显示名 + 展示顺序）

### 3. 新增文章 / 项目

新增 Entry 必须**同时完成下列三步**：

(a) **源文件位置**：
- 全部统一：`.html` 放入 `content/<slug>.html`（`slug` 全局唯一，文章与项目共目录，不分子目录）

HTML **可以是完整文档**（含 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装、内联 `<style>` / `<script>`、自定义字体与 CSS 变量），**也可以是 HTML 片段**（单个根元素）。`src/lib/html.jsx` 的 `Html` 组件会自动把片段包成最小文档。

(b) **`?raw` 导入**：在 `src/data/articles.js` 或 `src/data/projects.js` 顶部加：

```js
import xxx from '../../content/<slug>.html?raw';
```

(c) **metadata 记录**：在对应数组 push 一条：

- 文章：`{ slug, title, excerpt, date, type: 'article', tags, cover, links, content, category }`
- 项目：`{ slug, title, excerpt, date, type: 'project', tags, cover, links, content, category: null }`

### 4. 路由与详情页

**当前生效路由**（见 `src/App.jsx`）：

| 路径 | 组件 | 说明 |
|---|---|---|
| `/` | `Home` | 瀑布流首页（CSS columns，无分类筛选） |
| `/p/:slug` | `EntryDetail` | 统一详情页（100vh iframe + 悬浮返回按钮） |
| `*` | `NotFound` | 404 fallback |

**详情页统一约定**：

- 路由 `/p/:slug` → `src/pages/EntryDetail.jsx`，**文章与项目共用同一组件**
- **正文统一为 100vh 全屏 iframe**：`<iframe className="w-full h-screen border-0" srcDoc={...} sandbox="allow-scripts allow-popups allow-forms" />`，HTML 文档按作者原样渲染
- 顶部仅一个固定定位的「← 返回」悬浮按钮（点击 `navigate('/')`），**无 Navbar、无 Footer、无标题/日期/标签/项目头**——这些元信息由作者自己在 HTML 内部写
- iframe 视口**不继承**主站 Tailwind 编译产物，作者在自己写的 HTML 内部若用了 `text-brand-light` 等 `brand-*` 类**不会生效**；需在 HTML 内部用内联 `<style>` 或 `<link rel="stylesheet">` 自补样式
- `Html` 组件**不做事后消毒**，作者对自己写的内容负责

**列表页（瀑布流首页 `/`）**：

- 数据源：`listEntries()`（按 `date` 降序合并 articles + projects；项目 `date: '1970-01-01'` 自然沉底）
- 卡片：`src/components/EntryCard.jsx`（走主站 `brand-*` 类，保持导航层风格统一；**不嵌入 iframe**）
- **无分类筛选 chip**——分类信息仅作为 metadata，不影响 UI 排序；目录层扁平放在 `content/` 不再分组

**旧路由 302 跳转**（`App.jsx` 用 `<Navigate replace />` 实现，保留外链可用）：

- `/articles`、`/articles/category/:category`、`/projects`、`/skills`、`/tools`、`/about` → `/`
- `/articles/:slug`、`/projects/:slug` → `/p/:slug`

### 5. 文章分类（6 个固定 slug）

| slug | 中文显示名 | 范围 |
|---|---|---|
| `ai` | AI | AI 相关主题（模型原理、提示工程、RAG、智能体、AI 工具与产品、行业观察等） |
| `python` | Python | Python 编程语言相关内容 |
| `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得 |
| `product` | 产品与设计 | 产品设计、UX、交互 |
| `notes` | 随笔与思考 | 读书、生活、个人反思 |
| `resources` | 资源整理 | 书单、工具推荐、学习路线 |

约束：

- **6 个 slug 是固定的**——不允许新增
- 每新增一篇文章：(a) 把 `.html` 放入 `content/<slug>.html`（见规则 3）；(b) `import` 路径用 `../../content/<slug>.html?raw`；(c) metadata 必填 `category: '<category>'` 字段（缺这个字段列表页 / 详情页都不正常）
- 中文显示名 / 展示顺序的单一来源是 `src/data/categories.js`；改显示名 / 调顺序 = 改这一处（不是 `articles.js`）

### 6. 品牌约定

- 品牌色通过 `tailwind.config.js` 的 `theme.extend.colors.brand` 集中定义：`dark` `#141413` / `surface` `#1c1b1a` / `light` `#faf9f5` / `mid` `#b0aea5` / `gray` `#e8e6dc` / `orange` `#d97757` / `blue` `#6a9bcc` / `green` `#788c5d`
- 改品牌色：改 `tailwind.config.js`；同时检查 `src/index.css` 里 `.hljs-*` 硬编码颜色
- 字体：`src/index.css` 顶部 `@import` 引入 Google Fonts（已配 `Arial` / `Georgia` 兜底，国内访问不稳不阻塞渲染）；标题字体 Poppins、正文字体 Lora

### 7. 测试与本地启动

- 单元测试：`npm run test`（vitest，测试文件在 `tests/`）
- 本地启动：`npm run dev`（http://localhost:5173）
- 构建：`npm run build`（产物 `dist/`，已在 `.gitignore`）
- 部署：push 到 `main` 自动 GitHub Actions