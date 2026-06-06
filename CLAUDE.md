注意：
1. GitHub Pages 不支持 react-router 的 BrowserRouter，需要用 HashRouter 或配置 404.html 重定向
2. 部署时需要配置 base 路径（如果是二级路径）
3. 所有图片资源使用相对路径
4. 代码要有详细注释，方便我后续修改
5. 代码开发过程中需要使用 brand-guidelines 这个技能，保证整体风格的统一
6. 包含 JSX 的文件必须用 .jsx 后缀；Markdown 源文件用 ?raw 后缀导入
7. react-helmet-async@2 不导出 useHelmet 钩子，页面标题用 useEffect 改 document.title
8. 新增路由必须三处同步：App.jsx 的 <Route>、Navbar.jsx 的 links、对应 pages/*.jsx
9. 图标统一用 lucide-react，不要混用其他图标库
10. 文章源文件存放在项目根目录的 `articles/` 下的分类子目录里;每新增一篇文章,必须同时:(a) 把 .md 文件放入 `articles/<category>/`（`<category>` 必须是 6 个固定分类之一,见规则 13）;(b) 在 `src/data/articles.js` 中加一行 `import ... from '../../articles/<category>/xxx.md?raw'`（路径必须带子目录）;(c) 在 `articles` 数组中加一条 metadata 记录(字段:slug / title / excerpt / date / tags / cover / category (必填, 取值见规则 13))
11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .md 文件放入 `projects/`;(b) 在 `src/data/projects.js` 中加一行 `import ... from '../../projects/xxx.md?raw'`;(c) 在 `projects` 数组中加一条 metadata 记录(字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content)
12. 技能 / 工具 / 关于页签的源文件存放在项目根目录的 `content/` 文件夹下（`content/技能.md`、`content/工具.md`、`content/关于.md`），由 `src/lib/content.js` 解析后供页面消费。修改这三页签的内容必须直接编辑对应的 .md 文件，不要在 `src/data/skills.js`、`src/data/tools.js`、`src/pages/About.jsx` 里硬编码内容。技能等级只能是 `进阶` / `熟练` / `精通` 三档之一。
13. 文章的分类由一级子目录决定, 但 6 个分类是**固定的**——不允许自创新的 slug。新增文章必须放在以下 6 个文件夹之一, 并在 metadata 记录里写明对应 `category`:

    | slug | 中文显示名 | 范围 |
    |---|---|---|
    | `ai` | AI | AI 相关主题(模型原理、提示工程、RAG、智能体、AI 工具与产品、行业观察等) |
    | `python` | Python | Python 编程语言相关内容 |
    | `engineering` | 软件工程与开发实践 | 架构、部署、编程语言心得 |
    | `product` | 产品与设计 | 产品设计、UX、交互 |
    | `notes` | 随笔与思考 | 读书、生活、个人反思 |
    | `resources` | 资源整理 | 书单、工具推荐、学习路线 |

    每新增一篇文章, 必须同时: (a) 把 .md 文件放入 `articles/<category>/`; (b) 在 `src/data/articles.js` 的 import 路径里写明子目录; (c) 在该文章的 metadata 记录里加 `category: '<category>'` 字段 (其他字段见第 10 条;`category` 在这里是**必填**)。slug 仍须全局唯一, 与分类无关。中文显示名存放在 `src/data/categories.js`, 是 UI 上 chip 文字和页面标题的唯一来源, 改显示名要同步改 `categories.js` 而不是 articles.js。
