# Code Map · 仓库索引

> 个人技术博客与作品集（React 18 + Vite 5 + Tailwind，部署到 GitHub Pages）
> 在线地址：https://codewithwu.github.io/blog/
> 修改内容时优先看 **「§4 数据层（改这里就能改网站）」** 和 **「§6 常用任务速查」**

---

## 1. 技术栈一览

| 类别 | 选型 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | ^18.3.1 | 函数组件 + Hooks |
| 构建 | Vite | ^5.4.21 | 开发服务器 + 生产构建 |
| 路由 | react-router-dom | ^6.30.4 | `HashRouter`（GitHub Pages 兼容） |
| 样式 | Tailwind CSS | ^3.4.19 | 原子化 CSS + 自定义品牌色 |
| Markdown | react-markdown + remark-gfm + rehype-highlight | ^9 / ^4 / ^7 | 文章渲染、表格、高亮 |
| 标题 | react-helmet-async | ^2.0.5 | 页面标题（实际用 useEffect 兜底，Provider 保留供 meta 标签） |
| 图标 | lucide-react | ^0.400.0 | 全站统一图标 |
| 测试 | vitest + @testing-library/react | ^1.6 / ^14 | 单元测试 |
| 部署 | GitHub Actions | — | push main 自动部署到 Pages |

**关键约束**（来自 `CLAUDE.md`）：
- 路由必须用 `HashRouter`（GitHub Pages 项目页 `/blog/` 不支持服务端重定向）
- `vite.config.js` 中 `base: '/blog/'`，如改回根域部署需改为 `/`
- 所有图片资源用相对路径
- 所有代码带中文注释

---

## 2. 目录树（按功能分组）

```
blog/
├── index.html                      # HTML 入口（挂载 #root）
├── package.json                    # 依赖与脚本（dev / build / preview / test）
├── package-lock.json
├── vite.config.js                  # Vite 配置：base='/blog/'、react 插件、vitest 配置
├── tailwind.config.js              # 注入 brand.* 品牌色 + 注册 typography 插件
├── postcss.config.js               # Tailwind + autoprefixer
├── .gitignore                      # 忽略 node_modules / dist / .env 等
├── .github/
│   └── workflows/
│       └── deploy.yml              # push main → build → 部署到 GitHub Pages
├── public/
│   └── favicon.svg                 # 站点图标
├── articles/                       # 已发布文章的 Markdown 源文件（项目根目录；Vite ?raw 打包进 JS）
│   ├── ai/                         # 分类子目录（6 个固定 slug 之一，来源：src/data/categories.js）
│   │   ├── RAG分层检索.md
│   │   └── ...（共 7 篇）
│   └── notes/
│       └── 你好，世界.md
├── articles-draft/                 # 文章草稿（未发布，不出现在网站上；通过 create-article 技能发到 articles/<category>/）
├── projects/                       # 已发布项目的 Markdown 源文件（项目根目录；Vite ?raw 打包进 JS）
│   └── _sample.md
├── projects-draft/                 # 项目草稿（未发布，不出现在网站上；通过 create-project 技能发到 projects/）
├── content/                       # Skills/Tools/About 三个页签的 Markdown 源文件
│   ├── 技能.md
│   ├── 工具.md
│   └── 关于.md
├── src/
│   ├── main.jsx                    # React 入口，挂载 <App/>（外层 HelmetProvider）
│   ├── App.jsx                     # 顶层布局：HashRouter + Navbar + Routes + Footer
│   ├── index.css                   # 全局样式：字体、@keyframes、hljs 主题
│   │
│   ├── components/                 # 复用组件
│   │   ├── Navbar.jsx              # 顶部固定导航（5 个 NavLink）
│   │   ├── Footer.jsx              # 底部版权
│   │   ├── PageTransition.jsx      # 页面切换淡入淡出包裹器
│   │   ├── ArticleCard.jsx         # 文章列表卡片
│   │   ├── CategoryFilter.jsx      # 文章分类筛选 chip 栏（"全部" + 各分类）
│   │   ├── ProjectCard.jsx         # 项目卡片（含 GitHub/Demo 链接）
│   │   ├── SkillBar.jsx            # 技能条目（技能名 + 等级徽章，level ∈ 进阶/熟练/精通）
│   │   ├── ToolCard.jsx            # 工具卡片（动态 lucide 图标）
│   │   └── TimelineItem.jsx        # 关于页时间轴节点
│   │
│   ├── pages/                      # 路由页面（每个文件 = 一个路由）
│   │   ├── Home.jsx                # /  → 重定向到 /articles
│   │   ├── Articles.jsx            # /articles  列表
│   │   ├── ArticleDetail.jsx       # /articles/:slug  详情
│   │   ├── Projects.jsx            # /projects
│   │   ├── Skills.jsx              # /skills
│   │   ├── Tools.jsx               # /tools
│   │   ├── About.jsx               # /about
│   │   └── NotFound.jsx            # *  404
│   │
│   ├── data/                       # 静态数据（纯 JS 数组/对象，**改这里就能改网站**）
│   │   ├── articles.js             # 文章元数据 + ?raw 引入 markdown（metadata 必填 category 字段）
│   │   ├── categories.js           # 文章分类元数据（**6 个固定 slug + 中文显示名 + 展示顺序；新增 slug 被禁止**）
│   │   ├── projects.js             # 项目列表
│   │   ├── skills.js               # 技能（按 category 分组 + level 进阶/熟练/精通；数据源 content/技能.md）
│   │   └── tools.js                # 工具（icon 字段为 lucide 组件名字符串；数据源 content/工具.md）
│   │
│   ├── lib/
│   │   ├── articles.js             # 文章查询工具：listArticles({category}) / findArticleBySlug / listCategories（只返回有文章的分类，按 categories.js 顺序排，附 count）
│   │   ├── content.js              # 解析 content/*.md：parseSkills / parseTools / parseAbout
│   │   └── markdown.jsx            # 统一 Markdown 渲染组件（GFM + 代码高亮 + prose 样式）
│   │
│   └── hooks/
│       └── usePageTitle.js         # 设置 document.title，自动追加 "· 极客熊猫"
│
├── tests/
│   └── articles.test.js            # vitest 单元测试（articles 工具函数）
│
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-06-02-blog-design.md   # 完整设计文档
│       └── plans/
│           └── 2026-06-02-blog-implementation.md   # 实施计划
│
├── .claude/
│   ├── settings.local.json         # Claude 权限配置（允许 npm run *）
│   └── skills/
│       ├── brand-guidelines/
│       │   ├── SKILL.md            # Anthropic 品牌规范
│       │   └── LICENSE.txt
│       ├── create-article/         # 发布草稿：articles-draft/ → articles/ + 注册到 data/articles.js
│       │   └── SKILL.md
│       ├── create-project/         # 发布草稿：projects-draft/ → projects/ + 注册到 data/projects.js
│       │   └── SKILL.md
│       ├── delete-article/         # 删除文章：清理 articles/*.md + data/articles.js 注册项
│       │   └── SKILL.md
│       └── delete-project/         # 删除项目：清理 projects/*.md + data/projects.js 注册项
│           └── SKILL.md
│
├── SPEC.md                         # 原始需求规格
├── CLAUDE.md                       # Claude 工作约束
├── README.md                       # 项目说明（在线地址、技术栈、修改指南）
├── LICENSE                         # MIT
└── code_map.md                     # ← 本文件
```

---

## 3. 入口与启动链路

**冷启动到首屏**：

```
浏览器
  └─ index.html  (#root + <script type="module" src="/src/main.jsx">)
       └─ src/main.jsx
            └─ ReactDOM.createRoot → <HelmetProvider><App/></HelmetProvider>
                 └─ src/App.jsx
                      └─ <HashRouter>
                           ├─ <Navbar/>           ← src/components/Navbar.jsx
                           ├─ <main> <PageTransition>
                           │   └─ <Routes>        ← 匹配路径渲染对应 pages/*
                           └─ <Footer/>           ← src/components/Footer.jsx
```

**典型页面（如 /articles）**：

```
Articles.jsx
  ├─ usePageTitle(categoryMeta ? `${categoryMeta.name} · 文章` : '文章')   ← src/hooks/usePageTitle.js
  ├─ listCategories()                       ← src/lib/articles.js
  │     └─ import categories from categories.js   ← src/data/categories.js（中文显示名 + 固定顺序）
  ├─ listArticles({ category })             ← src/lib/articles.js
  │     └─ import data from articles.js     ← src/data/articles.js（metadata 含 category 字段）
  ├─ <CategoryFilter/>                      ← src/components/CategoryFilter.jsx（"全部" + 各分类 chip，附 count）
  └─ <ArticleCard/> × N                     ← src/components/ArticleCard.jsx
```

**文章详情页**：

```
ArticleDetail.jsx
  ├─ useParams() → slug
  ├─ findArticleBySlug(slug)                ← src/lib/articles.js
  │     └─ 在 data/articles.js 中查找
  │           └─ content 字段是 .md ?raw 字符串
  └─ <Markdown>{article.content}</Markdown>  ← src/lib/markdown.jsx
        └─ react-markdown + remark-gfm + rehype-highlight
```

---

## 4. 数据层（改这里就能改网站）

| 文件 | 形状 | 怎么加新条目 |
|------|------|--------------|
| `src/data/articles.js` | `[{ slug, title, excerpt, date, tags, cover, content, category }]` | 1) 在 `articles/<category>/<slug>.md` 新建 `.md`（`<category>` 必须是 `categories.js` 声明的 6 个 slug 之一）；2) 顶部 `import xxx from '../../articles/<category>/<slug>.md?raw'`；3) 把 `content: xxx` 填进去；4) metadata 必填 `category: '<category>'` |
| `src/data/categories.js` | `[{ slug, name }]` + `categorySlugSet` | **6 个分类固定**（`ai` / `python` / `engineering` / `product` / `notes` / `resources`），**不允许新增 slug**。改中文显示名 / 调展示顺序都改这一处（`ArticleCard` 徽章、`CategoryFilter` chip、`Articles` 页面标题都从这里取名）。`categorySlugSet` 供测试断言。 |
| `src/data/projects.js` | `[{ slug, name, description, techStack, githubUrl, demoUrl, cover, content }]` | 1) 把 `.md` 放进项目根目录的 `projects/`；2) 在数组顶部 `import xxx from '../../projects/xxx.md?raw'` 并 push 一项；3) 把 `content: xxx` 填进去 |
| `src/data/skills.js` | `[{ category, items: [{ name, level }] }]`（level ∈ 进阶/熟练/精通） | 1) 编辑 `content/技能.md`（源文件）；2) `src/data/skills.js` 自动通过 `parseSkills` 解析；3) 不要在 `skills.js` 内直接写数据数组 |
| `src/data/tools.js`  | `[{ category, items: [{ name, icon, desc }] }]` | 1) 编辑 `content/工具.md`；2) `src/data/tools.js` 自动通过 `parseTools` 解析 |

---

## 5. 路由表

| 路径 | 组件 | 文件 |
|------|------|------|
| `/` | `<Navigate to="/articles" replace />` | `src/App.jsx` |
| `/articles` | `Articles` | `src/pages/Articles.jsx` |
| `/articles/category/:category` | `Articles`（按 `category` slug 过滤；不存在的 slug 走空状态「该分类下还没有文章」+ 返回「查看全部文章」链接；页面标题用 `categories.js` 的中文名） | `src/pages/Articles.jsx` |
| `/articles/:slug` | `ArticleDetail` | `src/pages/ArticleDetail.jsx` |
| `/projects` | `Projects` | `src/pages/Projects.jsx` |
| `/projects/:slug` | `ProjectDetail` | `src/pages/ProjectDetail.jsx` |
| `/skills` | `Skills` | `src/pages/Skills.jsx` |
| `/tools` | `Tools` | `src/pages/Tools.jsx` |
| `/about` | `About` | `src/pages/About.jsx` |
| `*` | `NotFound` | `src/pages/NotFound.jsx` |

> **URL 实际形式**：`https://codewithwu.github.io/blog/#/articles`（HashRouter 特征）

---

## 6. 常用任务速查

| 我想…… | 看 / 改哪里 |
|--------|--------------|
| **加一篇文章（推荐）** | 1) 把 `.md` 放进 `articles-draft/<slug>.md`；2) 对 Claude 说「创建文章 xxx」或「把 xxx 文章发出去」触发 create-article 技能（技能会负责挑选 6 个固定分类之一） |
| **加一篇文章（手动）** | 1) 在 `articles/<category>/<slug>.md` 新建 .md（`<category>` 必须是 `categories.js` 声明的 6 个 slug 之一）<br>2) 在 `src/data/articles.js` 顶部 `import xxx from '../../articles/<category>/<slug>.md?raw'` 并 push 一项<br>3) metadata 必填 `category: '<category>'` 字段（缺这个字段列表页和详情页都不正常） |
| **改文章分类中文显示名 / 顺序** | `src/data/categories.js` 的 `categories` 数组（**单一来源**；`ArticleCard` 徽章、`CategoryFilter` chip、`Articles` 页面标题都从这里取名） |
| **删除文章** | 对 Claude 说「删除文章 xxx.md」触发 delete-article 技能（同时清理 `articles/<category>/<slug>.md` 与 `data/articles.js` 注册） |
| **加一个项目（推荐）** | 1) 把 `.md` 放进 `projects-draft/<slug>.md`；2) 对 Claude 说「创建项目 xxx」或「把 xxx 项目发出去」触发 create-project 技能 |
| **加一个项目（手动）** | 1) 新建 `projects/<slug>.md`（项目根目录）<br>2) 在 `src/data/projects.js` 顶部 `import xxx from '../../projects/<slug>.md?raw'` 并 push 一项 |
| **删除项目** | 对 Claude 说「删除项目 xxx.md」触发 delete-project 技能（同时清理 .md 与 data 注册） |
| **改技能 / 工具 / 关于内容** | 编辑 `content/技能.md`、`content/工具.md`、`content/关于.md`（不要改 src/data/*.js 或 About.jsx） |
| **改导航顺序/标签** | `src/components/Navbar.jsx` 顶部的 `links` 数组 |
| **改网站标题后缀** | `src/hooks/usePageTitle.js` 中的 `SITE_NAME` 常量 |
| **改品牌色** | `tailwind.config.js` 的 `theme.extend.colors.brand`，同时检查 `src/index.css` 里的 `.hljs-*` 硬编码颜色 |
| **改字体** | `src/index.css` 顶部的 `@import` + `@layer base` |
| **改页面切换动画** | `src/index.css` 中 `@keyframes fadeIn` + `.animate-fadeIn` |
| **改 favicon** | 替换 `public/favicon.svg` |
| **改部署目标** | `vite.config.js` 的 `base`（项目页 `/blog/`、根域 `/`） |
| **看品牌规范** | `.claude/skills/brand-guidelines/SKILL.md` |
| **看完整设计文档** | `docs/superpowers/specs/2026-06-02-blog-design.md` |
| **跑测试** | `npm run test`（vitest，测试文件在 `tests/`） |
| **本地启动** | `npm run dev`（http://localhost:5173） |
| **构建** | `npm run build`（产物 `dist/`） |
| **触发部署** | push 到 `main`（自动 GitHub Actions） |

---

## 7. 关键文件「为什么这样写」

- **`src/App.jsx` 用了 `HashRouter` 而不是 `BrowserRouter`**：GitHub Pages 项目页（`/blog/`）无法做服务端重定向，HashRouter 是 CLAUDE.md 强制的方案。
- **`src/lib/markdown.jsx` 用 `.jsx` 后缀**：文件里写 JSX 表达式（如 `<div className="prose ...">`），esbuild 对 `.js` 文件拒绝 JSX 语法。
- **`src/data/articles.js` 用 `?raw` 后缀**：把 markdown 源文件直接以字符串形式打包进 JS bundle，避免 fetch + 异步加载。
- **`src/hooks/usePageTitle.js` 用 `useEffect` 而非 `Helmet`**：`react-helmet-async@2.0.5` 不导出 `useHelmet` 钩子，直接操作 `document.title` 行为等价；`HelmetProvider` 仍保留在 `main.jsx` 供后续 meta/OG 标签使用。
- **`src/data/categories.js` 是文章分类的「单一来源」**：6 个固定 slug + 中文显示名 + 展示顺序三件事都集中在这里。`ArticleCard` 徽章、`CategoryFilter` chip、`Articles` 页面标题都从这里取显示名；改中文名 / 调顺序 = 改这一处。CLAUDE.md 规则 13 明确禁止新增 slug，所以这个数组是「加新分类」和「改老分类」的唯一入口。
- **`src/lib/articles.js` 的 `listCategories()` 只返回有文章的分类**：扫描所有文章算出每分类 `count`，按 `categories.js` 的声明顺序输出，空分类自动隐藏。这样新分类还没文章时，UI 上不会出现空 chip；`ArticleCard` 拿不到 slug 对应显示名时回退到 slug 字符串本身。
- **`src/components/ToolCard.jsx` 用 `import * as Icons` + 按名字取组件**：`data/tools.js` 里只存字符串名（解耦数据与组件引用），找不到时回退到 `Wrench` 防崩。
- **`src/components/SkillBar.jsx` 用等级徽章而非进度条**：level 是 `进阶/熟练/精通` 三档字符串，对应 brand-guidelines 的主/副/第三点缀（橙/蓝/绿），未知等级回退 进阶。
- **`src/lib/content.js` 解析 `content/*.md`**：纯字符串处理，不引入 gray-matter。三个解析函数（parseSkills / parseTools / parseAbout）各自有 vitest 单测，集成测试还 import 真实的 .md 文件验证条目数契约。

---

## 8. 配色 / 字体速查

```js
// tailwind.config.js → theme.extend.colors.brand
dark:   '#141413'   // 主背景
surface:'#1c1b1a'   // 卡片/引用底色
light:  '#faf9f5'   // 主文字
mid:    '#b0aea5'   // 次要文字 / 边框
gray:   '#e8e6dc'   // 浅背景
orange: '#d97757'   // 主点缀（高亮、强调、按钮）
blue:   '#6a9bcc'   // 副点缀（链接、标签）
green:  '#788c5d'   // 第三点缀（时间轴、状态）
```

```
标题字体：Poppins  →  Arial        （fallback）
正文字体：Lora     →  Georgia      （fallback）
```

---

## 9. 已知坑 / 注意事项

1. **国内访问 Google Fonts 不稳**：字体已配 `Arial`/`Georgia` 兜底，不会阻塞渲染。
2. **HashRouter 让 URL 带 `#`**：如需美化，改用 `BrowserRouter` + `404.html` 重定向（详见 `docs/superpowers/specs/2026-06-02-blog-design.md` §6）。
3. **占位图缺失**：项目卡片用渐变 + 名称首字母占位，不会 404。
4. **首次部署需手动**：仓库 Settings → Pages → Source 选 `GitHub Actions`。
5. **新增路由要在三处同步**：`App.jsx` 的 `<Route>`、`Navbar.jsx` 的 `links` 数组、对应 page 文件。
6. **新增数据文件要在两处同步**：`src/data/*.js` 新建文件 + 引入到对应 page 组件。
7. **`articles-draft/` 是草稿区**：`articles/<category>/` 里的文件才会被 React 渲染；草稿留在 `articles-draft/` 直到调用 create-article 技能。`<category>` 必须是 `src/data/categories.js` 声明的 6 个 slug 之一（`ai` / `python` / `engineering` / `product` / `notes` / `resources`），**不允许新增**；slug 自身仍是全局唯一、与分类无关，可以是中文（如 `RAG分层检索`）。
8. **`projects-draft/` 是草稿区**：`projects/` 里的文件才会被 React 渲染；草稿留在 `projects-draft/` 直到调用 create-project 技能。
