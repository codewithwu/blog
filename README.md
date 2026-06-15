# 极客熊猫

> 个人技术博客与作品集模板。**零数据库、零后端、零登录后台**——用一句中文跟 Claude 说话，就能写文章、发项目、改主页。
> React 18 + Vite 5 + Tailwind CSS，使用 Anthropic 品牌风格，免费部署到 GitHub Pages。

在线 demo：https://codewithwu.github.io/blog/

---

## 为什么用它

- **没有数据库**：所有内容（文章、项目、技能、工具、关于）都是 Markdown / HTML 源文件，构建时 Vite 用 `?raw` 直接打包进 JS bundle。运行时不查任何后端。
- **没有后台**：管理 = 改文件。仓库自带 8 个 Claude Code 技能，跟 Claude 说一句中文就能完成增删改。
- **没有部署成本**：push 到 `main` 自动走 GitHub Actions 构建并发布到 Pages，免费。
- **可一键复制**：fork 仓库 → 改 `vite.config.js` 的 `base` → 改 `content/关于.md` → push，就是你自己的博客。

---

## 自然语言增删改查

跟仓库根目录里的 Claude Code 对话即可（需要先安装 [Claude Code](https://docs.anthropic.com/claude/docs/claude-code)）：

| 想做的事 | 跟 Claude 说 | 背后发生了什么 |
|----------|------------|----------------|
| 发布新文章 | 「创建文章 RAG分层检索」 | create-article：草稿 `articles-draft/<slug>.md` → 品牌样式 `articles/<category>/<slug>.html`，同步注册到 `src/data/articles.js` |
| 删除文章 | 「删除文章 RAG分层检索.html」 | delete-article：清理 `.html` 和 data 注册 |
| 发布新项目 | 「创建项目 claude-task-monitor」 | create-project：草稿 `projects-draft/<slug>.html` → `projects/`，同步注册到 `src/data/projects.js` |
| 删除项目 | 「删除项目 claude-task-monitor.html」 | delete-project：清理 `.html` 和 data 注册 |
| 更新技能页 | 「更新技能 v2.md」 | update-skills：智能合并 `content-draft/v2.md` → `content/技能.md` |
| 更新工具页 | 「更新工具 v2.md」 | update-tools：分类追加合并 |
| 更新关于页 | 「更新关于 v2.md」 | update-about：分段替换合并 |

工作流：把草稿放进 `*-draft/` 目录 → 用自然语言告诉 Claude → Claude 校验格式、合并差异、同步 data 注册、删除草稿。**整个过程没有数据库迁移，没有 SQL，没有后台登录**。

不想用 Claude 也可以，所有内容都是文件，编辑器直接改即可（见下方「手动维护」）。

---

## 快速开始

```bash
# Node 20+
git clone https://github.com/codewithwu/blog.git
cd blog
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # 产物输出到 dist/
npm run preview      # 本地预览构建产物
npm run test         # vitest 单元测试
```

---

## 技术栈

- **框架**：React 18（函数组件 + Hooks）
- **构建**：Vite 5（`.md` / `.html` 用 `?raw` 后缀打包）
- **路由**：react-router-dom v6（HashRouter，兼容 GitHub Pages）
- **样式**：Tailwind CSS 3 + 自定义品牌色（Anthropic 风格）
- **文章 / 项目 HTML**：iframe `srcDoc` + sandbox（作者可自由发挥样式；`create-article` 技能发布的文章自带品牌样式表）
- **图标**：lucide-react
- **测试**：vitest + @testing-library/react
- **部署**：GitHub Actions → GitHub Pages

---

## 目录结构

```
articles/<category>/   # 已发布文章的 HTML 源文件（按 6 个固定分类分目录：ai / python / engineering / product / notes / resources）
articles-draft/        # 文章草稿（通过 create-article 技能发布）
projects/              # 已发布项目的 HTML 源文件（完整文档或片段均可）
projects-draft/        # 项目草稿（通过 create-project 技能发布）
content/               # 技能 / 工具 / 关于三个页签的 Markdown 源文件
content-draft/         # 上述三个页签的草稿（通过 update-* 技能合并）
.claude/skills/        # 8 个仓库本地 Claude 技能（create-* / delete-* / update-* / brand-guidelines）
src/
├── components/        # 复用组件（Navbar, Card, ...）
├── pages/             # 路由页面
├── data/              # 静态数据（articles, projects, categories, skills, tools）
├── hooks/             # 自定义 Hook
└── lib/               # 工具函数（articles, projects, content, html）
```

> 完整代码地图见 [`code_map.md`](./code_map.md)。

---

## 手动维护内容

不想用 Claude 也可以——所有内容都是文件：

- **加文章**：新建 `articles/<category>/<slug>.html`（`<category>` 必须是 `src/data/categories.js` 声明的 6 个固定 slug 之一；完整 HTML 文档或片段都可以——`src/lib/html.jsx` 会自动包成完整文档）→ 在 `src/data/articles.js` 顶部 `import xxx from '../../articles/<category>/<slug>.html?raw'` → 在数组里加一条 metadata 记录（必填 `category` 字段）
- **加项目**：新建 `projects/<slug>.html`（完整 HTML 文档或片段都可以）→ 在 `src/data/projects.js` 顶部 `import xxx from '../../projects/<slug>.html?raw'` → 加一条 metadata 记录
- **改技能 / 工具 / 关于**：直接编辑 `content/技能.md` / `content/工具.md` / `content/关于.md`（不要改 `src/data/*.js`，它们只是 `parseSkills` / `parseTools` 的运行时调用）

---

## 部署到 GitHub Pages

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**
2. push `main` 分支即触发自动部署
3. 等待 workflow 跑完，访问 `https://<user>.github.io/<repo>/`

> URL 形如 `/blog/#/articles`，因为 GitHub Pages 项目页无法做服务端路由重定向，所以使用 HashRouter。如需美化 URL，可改用 BrowserRouter + `404.html` 重定向方案。

---

## 拿来搭自己的博客

1. Fork 或 clone 本仓库
2. 改 `vite.config.js` 的 `base` 为 `/<your-repo>/`（部署到 `user.github.io/<your-repo>/`）或 `/`（部署到根域）
3. 改 `content/关于.md` 写你自己的简介
4. 清空 `articles/<category>/` 和 `projects/` 里的示例内容（也可对 Claude 说「删除文章 xxx」/「删除项目 xxx」批量清理）
5. 把你的第一篇文章草稿放进 `articles-draft/`，跟 Claude 说「创建文章 xxx」即可上线

---

## 许可

MIT
