# Architecture and Routing

## 适用范围

新增或修改路由、页面、布局、Hook、目录、文件后缀、Vite 部署路径时遵循本规范。

## 运行时结构

冷启动链路固定为：

```text
index.html
  → src/main.jsx
    → <HelmetProvider><App /></HelmetProvider>
      → src/App.jsx <HashRouter>
        → AppShell
          → Navbar（非详情路由）
          → main / PageTransition / Routes
          → Footer
```

证据：`src/main.jsx`、`src/App.jsx`。

### 目录职责

| 路径 | 职责 | 不应放入 |
|---|---|---|
| `src/pages/*.jsx` | 一个路由页面的组合、URL 参数和页面级空状态 | 可跨页面复用的卡片/parser |
| `src/components/*.jsx` | 可复用展示或交互单元 | registry 查询、内容文件解析 |
| `src/data/*.js` | 静态 metadata、分类声明、`?raw` 内容注册 | 页面 JSX、重复 parser |
| `src/lib/*.js(x)` | 纯查询、排序、parser、HTML 文档包装 | 路由布局和硬编码页面内容 |
| `src/hooks/*.js` | 可复用 React Hook | 普通纯函数 |
| `articles/`、`projects/`、`content/` | 作者内容源 | React 组件 |

项目规模很小，不按 feature 再建深层目录。新增文件应放进以上现有职责，而不是为单个函数创建抽象层。

## Router 与 GitHub Pages

- 必须使用 `HashRouter`。GitHub Pages 项目页没有服务端 fallback，`BrowserRouter` 会让深链刷新 404。证据：`src/App.jsx:3`、`README.md:101-107`。
- `vite.config.js` 的 `base: '/blog/'` 对应 `https://codewithwu.github.io/blog/`。只有部署目标改变时才调整它，不能为了本地路径问题随意改成 `/`。
- 应用内跳转使用 `Link`、`NavLink`、`Navigate` 或 `useNavigate`，不要用普通 `<a href="/route">` 触发整页刷新。

### 当前路由表

路由集中在 `src/App.jsx`：

- `/` → replace 到 `/articles`
- `/articles` 与 `/articles/category/:category` → `Articles`
- `/articles/:slug` → `ArticleDetail`
- `/projects` 与 `/projects/:slug`
- `/skills`、`/tools`、`/about`
- `*` → `NotFound`

当前声明顺序把文章分类路由放在 slug 详情路由之前，便于阅读。更关键的是 `AppShell` 的详情判断必须显式排除 `/articles/category/...`：

```js
const isArticleDetail = /^\/articles\/(?!category\/)[^/]+/.test(location.pathname);
```

若改变文章路由形状，要同时检查这个正则，否则分类页可能被误当作全屏详情页。

## 新增路由的同步合同

新增顶级导航页面必须同步三处：

1. `src/App.jsx` 增加 `<Route>` 与 page import。
2. `src/components/Navbar.jsx` 的 `links` 数组增加入口。
3. 新建对应 `src/pages/<Name>.jsx`。

同时为页面调用 `usePageTitle`，并按路由行为增加测试。隐藏页面或参数化子路由如果不应出现在 Navbar，应在设计中明确说明，而不是机械添加导航项。

## 全屏详情布局

`/articles/:slug` 与 `/projects/:slug` 是 full-bleed 路由：

- `AppShell` 不渲染 Navbar。
- `<main>` 不使用 `max-w-5xl mx-auto px-6 py-8` 容器。
- 详情 page 只组合固定左上返回链接与 `Html` iframe。
- slug 不存在时用 `<Navigate replace>` 回到对应列表。

若新增另一种全屏详情路由，应扩展同一个 `isFullBleedDetail` 判定，而不是在页面里用负 margin 绕过主布局。

## 状态模型

项目没有 Redux、Context store、React Query 或服务端状态：

- 路由选择属于 URL 状态：`useParams` 读取 category/slug。
- 文章、项目和个人内容是构建时导入的模块级静态数据。
- 过滤、排序、空状态等是页面渲染时的派生值。
- 简单导航交互直接使用 React Router；不要把当前 route 复制进 `useState`。

只有出现多个无路由关系的页面必须共同编辑同一运行时状态时，才评估全局状态方案；不能因通用 React 惯例预先引入。

## 页面标题 Hook

所有路由页面使用 `src/hooks/usePageTitle.js`。该 Hook 通过 `useEffect` 写 `document.title` 并追加“极客熊猫”。`react-helmet-async@2` 不导出 `useHelmet`，不要引入不存在的 Hook；`HelmetProvider` 保留给未来 meta/OG 标签。

详情页在查找完成后传入 metadata 标题，找不到时传入“未找到…”文本，再执行 redirect。Hook 必须保持无条件调用，不能放到 `if (!item)` 之后。

## 文件与导入约定

- 含 JSX 的文件使用 `.jsx`；纯 JavaScript 使用 `.js`。
- 本地 import 显式写 `.js`/`.jsx` 后缀，匹配现有 ESM 风格。
- HTML/Markdown 作为字符串导入时使用 `?raw`，例如 `../../content/技能.md?raw`。
- 图片路径使用相对路径；`public/` 静态资源也要考虑 Vite `base`。
- 组件文件和导出使用 PascalCase；Hook 以 `use` 开头；数据/lib 文件使用小写职责名。

## 注释规则

仓库要求详细注释，重点解释“为什么”：

- GitHub Pages/HashRouter 限制。
- iframe baseURI、sandbox 和样式隔离。
- parser 会忽略或回退的输入。
- 多文件必须同步的 registry 合同。

不要给显然的 `map` 或简单 className 逐行写注释；保持与 `src/App.jsx`、`src/lib/html.jsx`、`src/lib/content.js` 相同的密度。

## 反模式

- 用 `BrowserRouter` 替换 `HashRouter` 却不提供 GitHub Pages 404 fallback。
- 新增 page 但漏掉 Route 或 Navbar 同步。
- 在 full-bleed detail 内重新渲染全局标题栏、metadata header 或 Navbar。
- 为静态内容引入 fetch、缓存层或全局 store。
- 在 `.js` 文件中写 JSX，或漏掉 raw import 的 `?raw`。
- 在组件中直接修改 `document.title`，绕开 `usePageTitle`。

## 验证

```bash
npm test
npm run build
```

路由改动还应使用 `MemoryRouter`/`Routes` 覆盖有效参数和找不到参数的 redirect；详情布局改动需检查 Navbar 显隐、主容器和 iframe 全屏合同。
