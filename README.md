# cooper.dev

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
src/
├── components/      # 复用组件（Navbar, Footer, Card, ...）
├── pages/           # 路由页面
├── data/            # 静态数据（articles, projects, skills, tools）
├── content/         # Markdown 源文件
├── hooks/           # 自定义 Hook
└── lib/             # 工具函数
```

## 修改内容

更新网站内容只需要修改 `src/data/*.js` 和 `src/content/articles/*.md`：

- **加一篇文章**：在 `src/content/articles/` 新建 `.md` 文件，然后在 `src/data/articles.js` 注册
- **加一个项目**：在 `src/data/projects.js` 数组里加一项
- **改技能 / 工具**：编辑 `src/data/skills.js` 或 `src/data/tools.js`

## 部署到 GitHub Pages

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**
2. 推 `main` 分支即触发自动部署
3. 等待 workflow 跑完，访问 `https://codewithwu.github.io/blog/`

> 注意：本项目使用 HashRouter，URL 形如 `/blog/#/articles`。这是因为 GitHub Pages 项目页（`/blog/`）无法做服务端路由重定向。如需美化 URL，可改用 BrowserRouter + 404.html 重定向方案。

## 许可

MIT
