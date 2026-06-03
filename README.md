# 极客熊猫

个人技术博客与作品集。React 18 + Vite 5 + Tailwind CSS，使用 Anthropic 品牌风格。

## 在线访问

https://codewithwu.github.io/blog/

## 技术栈

- **框架**：React 18（函数组件 + Hooks）
- **构建**：Vite 5
- **路由**：react-router-dom v6（HashRouter，兼容 GitHub Pages）
- **样式**：Tailwind CSS 3 + 自定义品牌色
- **Markdown**：react-markdown + remark-gfm + rehype-highlight
- **标题**：react-helmet-async
- **图标**：lucide-react
- **部署**：GitHub Actions

## 本地开发

```bash
# Node 20+ 推荐
npm install
npm run dev          # http://localhost:5173
```

## 构建与本地预览

```bash
npm run build        # 产物输出到 dist/
npm run preview      # 本地预览构建产物
```

## 目录结构

```
articles/          # 已发布文章的 Markdown 源文件（项目根目录；Vite ?raw 打包进 JS）
articles-draft/    # 文章草稿（未发布，通过 create-article 技能发到 articles/）
projects/          # 已发布项目的 Markdown 源文件（项目根目录；Vite ?raw 打包进 JS）
projects-draft/    # 项目草稿（未发布，通过 create-project 技能发到 projects/）
.claude/skills/    # 自定义技能（create-article / create-project / delete-article / delete-project / brand-guidelines）
src/
├── components/      # 复用组件（Navbar, Footer, Card, ...）
├── pages/           # 路由页面
├── data/            # 静态数据（articles, projects, skills, tools）
├── hooks/           # 自定义 Hook
└── lib/             # 工具函数
```

## 修改内容

更新网站内容只需要修改 `src/data/*.js` 和项目根目录的 `articles/*.md`：

- **加一篇文章（推荐）**：把 `.md` 放进 `articles-draft/<slug>.md` → 对 Claude 说「创建文章 xxx」或「把 xxx 文章发出去」触发 create-article 技能
- **加一篇文章（手动）**：在项目根目录的 `articles/` 新建 `.md` 文件（参考现有格式）→ 在 `src/data/articles.js` 顶部 `import` 一下（用 `?raw` 后缀）→ 在 `articles` 数组里加一条 metadata 记录
- **加一个项目（推荐）**：把 `.md` 放进 `projects-draft/<slug>.md` → 对 Claude 说「创建项目 xxx」或「把 xxx 项目发出去」触发 create-project 技能
- **加一个项目（手动）**：在 `src/data/projects.js` 数组里加一项
- **删除文章 / 项目**：分别对 Claude 说「删除文章 xxx.md」或「删除项目 xxx.md」触发 delete-article / delete-project 技能
- **改技能 / 工具**：编辑 `src/data/skills.js` 或 `src/data/tools.js`

## 部署到 GitHub Pages

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**
2. 推 `main` 分支即触发自动部署
3. 等待 workflow 跑完，访问 `https://codewithwu.github.io/blog/`

> 注意：本项目使用 HashRouter，URL 形如 `/blog/#/articles`。这是因为 GitHub Pages 项目页（`/blog/`）无法做服务端路由重定向。如需美化 URL，可改用 BrowserRouter + 404.html 重定向方案。

## 许可

MIT
