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
10. 文章源文件存放在项目根目录的 `articles/` 文件夹下;每新增一篇文章,必须同时:(a) 把 .md 文件放入 `articles/`;(b) 在 `src/data/articles.js` 中加一行 `import ... from '../../articles/xxx.md?raw'`;(c) 在 `articles` 数组中加一条 metadata 记录(字段:slug / title / excerpt / date / tags / cover)
11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .md 文件放入 `projects/`;(b) 在 `src/data/projects.js` 中加一行 `import ... from '../../projects/xxx.md?raw'`;(c) 在 `projects` 数组中加一条 metadata 记录(字段:slug / name / description / techStack / githubUrl / demoUrl / cover / content)