注意：
1. GitHub Pages 不支持 react-router 的 BrowserRouter，需要用 HashRouter 或配置 404.html 重定向
2. 部署时需要配置 base 路径（如果是二级路径）
3. 所有图片资源使用相对路径
4. 代码要有详细注释，方便我后续修改
5. 代码开发过程中需要使用 brand-guidelines 这个技能，保证整体风格的统一
6. 包含 JSX 的文件必须用 .jsx 后缀；Markdown / HTML 源文件用 ?raw 后缀导入
7. react-helmet-async@2 不导出 useHelmet 钩子，页面标题用 useEffect 改 document.title
8. 新增路由必须三处同步：App.jsx 的 <Route>、Navbar.jsx 的 links、对应 pages/*.jsx
9. 图标统一用 lucide-react，不要混用其他图标库
10. 文章与项目的源文件**统一使用 HTML**(不再使用 markdown)。新增文章/项目时,必须同时:
    - (a) 把 `.html` 文件放入 `articles/<category>/<slug>.html`(文章,`<category>` 必须是 6 个固定分类之一,见规则 12)或 `projects/<slug>.html`(项目)。**HTML 可以是完整文档**(含 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装、内联 `<style>` / `<script>`、自定义字体与 CSS 变量)**也可以是 HTML 片段**(单个根元素),`src/lib/html.jsx` 会自动把片段包成最小文档(只补 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装)。
    - (b) 在 `src/data/articles.js` 中加 `import ... from '../../articles/<category>/xxx.html?raw'`(路径必须带子目录),或在 `src/data/projects.js` 中加 `import ... from '../../projects/xxx.html?raw'`。
    - (c) 在 `articles` 或 `projects` 数组中加一条 metadata 记录:
        - 文章字段:slug / title / excerpt / date / tags / cover / **content** / **category**(必填,取自规则 12)
        - 项目字段:slug / name / description / techStack / githubUrl / demoUrl / cover / **content**
    - (d) **详情页(`/articles/:slug` 和 `/projects/:slug`)统一为 100vh 全屏 iframe**(`<iframe className="w-full h-screen border-0" srcDoc={...} sandbox="allow-scripts allow-popups allow-forms" />`),HTML 文档按作者原样渲染;这两个路由下全局 `<Navbar />` 隐藏,顶部仅保留一个固定定位的「← 返回」悬浮按钮,**不**再渲染任何标题/日期/标签/项目头。
    - (e) **列表页卡片(文章卡 / 项目卡)不嵌入 iframe**,仍用主站 `brand-*` 类,保持导航层风格统一。
    - (f) iframe 视口**不继承**主站 Tailwind 编译产物,作者在自己写的 HTML 内部若用了 `text-brand-light` 等 `brand-*` 类**不会生效**;作者需在 HTML 内部用内联 `<style>` 或 `<link rel="stylesheet">` 自补样式。`Html` 组件**不做事后消毒**,作者对自己写的内容负责。
11. 技能 / 工具 / 关于页签的源文件存放在项目根目录的 `content/` 文件夹下（`content/技能.md`、`content/工具.md`、`content/关于.md`），由 `src/lib/content.js` 解析后供页面消费。修改这三页签的内容必须直接编辑对应的 .md 文件，不要在 `src/data/skills.js`、`src/data/tools.js`、`src/pages/About.jsx` 里硬编码内容。技能等级只能是 `进阶` / `熟练` / `精通` 三档之一。
12. 文章的分类由一级子目录决定, 但 6 个分类是**固定的**——不允许自创新的 slug。新增文章必须放在以下 6 个文件夹之一, 并在 metadata 记录里写明对应 `category`:

    | slug | 中文显示名 | 范围 |
    |---|---|---|
    | `ai` | AI | AI 相关主题(模型原理、提示工程、RAG、智能体、AI 工具与产品、行业观察等) |
    | `python` | Python | Python 编程语言相关内容 |
    | `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得 |
    | `product` | 产品与设计 | 产品设计、UX、交互 |
    | `notes` | 随笔与思考 | 读书、生活、个人反思 |
    | `resources` | 资源整理 | 书单、工具推荐、学习路线 |

    每新增一篇文章, 必须同时: (a) 把 .html 文件放入 `articles/<category>/`(后缀已统一为 HTML,见规则 10); (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'` 字段 (其他字段见第 10 条;`category` 在这里是**必填**)。slug 仍须全局唯一, 与分类无关。中文显示名存放在 `src/data/categories.js`, 是 UI 上 chip 文字和页面标题的唯一来源, 改显示名要同步改 `categories.js` 而不是 articles.js。
