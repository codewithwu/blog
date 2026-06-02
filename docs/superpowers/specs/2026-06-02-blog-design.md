# 个人网站设计文档

**日期**：2026-06-02
**目标**：基于 `SPEC.md` 构建一个 React 个人网站，部署到 GitHub Pages

## 1. 背景与目标

用户希望在 `cooper.github.io`（用户名占位）上部署一个 5 页面的 React SPA，作为个人技术博客与作品集。要求：React 18 + Vite、HashRouter（GitHub Pages 限制）、Tailwind 样式、Anthropic 品牌风格、自动部署。

非目标：后端、数据库、用户登录、评论系统。

## 2. 架构

### 2.1 目录结构

```
blog/
├── public/                       # 静态资源（占位图、favicon）
├── src/
│   ├── main.jsx                  # 入口，挂载 <App/>
│   ├── App.jsx                   # HashRouter + 全局布局（Navbar + Outlet + Footer）
│   ├── index.css                 # Tailwind 指令 + 品牌色 CSS 变量 + @keyframes
│   ├── components/
│   │   ├── Navbar.jsx            # 顶部固定导航
│   │   ├── Footer.jsx            # 底部版权
│   │   ├── PageTransition.jsx    # 页面淡入淡出包裹器
│   │   ├── ProjectCard.jsx       # 项目卡片
│   │   ├── ArticleCard.jsx       # 文章卡片
│   │   ├── SkillBar.jsx          # 技能进度条
│   │   ├── ToolCard.jsx          # 工具卡片
│   │   └── TimelineItem.jsx      # 关于页时间轴
│   ├── pages/
│   │   ├── Home.jsx              # / 重定向到 /articles
│   │   ├── Articles.jsx          # /articles
│   │   ├── ArticleDetail.jsx     # /articles/:slug
│   │   ├── Projects.jsx          # /projects
│   │   ├── Skills.jsx            # /skills
│   │   ├── Tools.jsx             # /tools
│   │   ├── About.jsx             # /about
│   │   └── NotFound.jsx          # *
│   ├── data/
│   │   ├── articles.js
│   │   ├── projects.js
│   │   ├── skills.js
│   │   └── tools.js
│   ├── content/articles/         # 文章 Markdown 源文件
│   │   ├── hello-world.md
│   │   ├── react-tips.md
│   │   └── ... (3-5 篇)
│   ├── hooks/
│   │   └── usePageTitle.js       # 包装 react-helmet-async
│   └── lib/
│       └── markdown.js           # 统一 markdown 渲染配置
├── .github/workflows/deploy.yml
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── package.json
├── index.html
└── README.md
```

### 2.2 模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| `App.jsx` | 注册 HashRouter、5 个 Route、全局布局 | react-router-dom, Navbar, Footer, PageTransition |
| `pages/*` | 每个页面一个组件，从 `data/` 取数据并渲染 | 对应 components、react-markdown |
| `data/*` | 静态数据，导出 JS 数组/对象 | 无（纯数据） |
| `components/Navbar` | 顶部固定导航，根据路由高亮当前项 | NavLink from react-router-dom, lucide-react |
| `components/PageTransition` | 包裹 Outlet，给子页面加 `animate-fadeIn` | 无 |
| `lib/markdown.js` | 统一 `react-markdown` 配置（remark-gfm、rehype-highlight） | react-markdown 等 |
| `hooks/usePageTitle` | 接收标题字符串，调用 react-helmet-async | react-helmet-async |

## 3. 技术栈

| 类别 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 构建工具 | Vite | ^5 | 比 CRA 快，配置简单 |
| 框架 | React | ^18 | SPEC 要求 |
| 路由 | react-router-dom | ^6 | HashRouter（CLAUDE.md 强制） |
| 样式 | Tailwind CSS | ^3 | 决定用 Tailwind |
| Markdown | react-markdown | ^9 | SPEC 要求 |
| GFM | remark-gfm | ^4 | 表格/任务列表 |
| 代码高亮 | rehype-highlight | ^7 | 代码块高亮 |
| 标题 | react-helmet-async | ^2 | SPEC 要求 |
| 图标 | lucide-react | ^0.400 | 风格统一、tree-shakeable |
| 部署 | gh-pages + GitHub Actions | latest | SPEC 要求 |

## 4. 设计系统

### 4.1 配色（Tailwind 配置）

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        dark:   '#141413',  // 主背景
        light:  '#faf9f5',  // 文字色
        mid:    '#b0aea5',  // 次要
        gray:   '#e8e6dc',  // 浅背景
        orange: '#d97757',  // 主点缀
        blue:   '#6a9bcc',  // 副点缀
        green:  '#788c5d'   // 第三点缀
      }
    }
  }
}
```

### 4.2 字体

`index.css` 顶部：

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Lora:wght@400;500;600&display=swap');

@layer base {
  h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', Arial, sans-serif; }
  body { font-family: 'Lora', Georgia, serif; background: #141413; color: #faf9f5; }
}
```

### 4.3 视觉节奏

- 圆角：`rounded-xl`（12px），按钮 `rounded-lg`
- 间距：`gap-4 / 6 / 8`，`p-6 / 8`
- 卡片：`bg-[#1c1b1a] border border-brand-mid/20 rounded-xl p-6`
- 悬停：`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`
- 强调色循环：主操作 = orange，链接 = blue，状态/时间轴 = green
- 页面切换：每个页面根节点加 `animate-[fadeIn_300ms_ease-out]`

### 4.4 关键动画

```css
/* index.css */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

## 5. 路由与数据契约

### 5.1 路由表

| 路径 | 组件 |
|------|------|
| `/` | 重定向到 `/articles` |
| `/articles` | `Articles` |
| `/articles/:slug` | `ArticleDetail` |
| `/projects` | `Projects` |
| `/skills` | `Skills` |
| `/tools` | `Tools` |
| `/about` | `About` |
| `*` | `NotFound` |

### 5.2 数据形状

```js
// articles.js
{
  slug: 'hello-world',
  title: '你好，世界',
  excerpt: '开篇语',
  date: '2026-05-12',
  tags: ['随笔', 'Meta'],
  cover: null,
  contentFile: '/src/content/articles/hello-world.md'
}

// projects.js
{
  id: 'p1',
  name: 'My Project',
  description: '一句话简介',
  techStack: ['React', 'Node.js'],
  githubUrl: 'https://github.com/...',
  demoUrl: null,
  cover: '/projects/p1.png'
}

// skills.js
{
  category: '前端',
  items: [
    { name: 'React', level: 90 }
  ]
}

// tools.js
{
  category: '编辑器',
  items: [
    { name: 'VS Code', icon: 'Code2', desc: '...' }
  ]
}
```

### 5.3 Markdown 加载

使用 Vite 的 `?raw` 后缀导入：

```js
import helloWorld from '../content/articles/hello-world.md?raw';
```

`articles.js` 改为直接 inline 引用：

```js
import helloWorld from '../content/articles/hello-world.md?raw';
export default [
  { slug: 'hello-world', content: helloWorld, ... }
];
```

## 6. 部署

### 6.1 Vite 配置

```js
// vite.config.js
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { outDir: 'dist' }
});
```

### 6.2 npm 脚本

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "gh-pages -d dist"
}
```

### 6.3 GitHub Actions

文件 `.github/workflows/deploy.yml`：
- 触发：push 到 main
- Node 20 → npm ci → npm run build → upload artifact → deploy-pages
- 权限：pages: write, id-token: write

### 6.4 部署前置操作（用户需手动）

1. 仓库 Settings → Pages → Source 选 "GitHub Actions"
2. 等待首次 workflow 跑完

## 7. 实施步骤（高层）

1. 初始化 Vite + React 项目，安装依赖
2. 集成 Tailwind + 品牌色配置
3. 搭建路由骨架（App.jsx + 各 page 占位）
4. 实现 Navbar / Footer / PageTransition
5. 填充 4 个数据文件
6. 实现 5 个页面（Articles 列表 + 详情优先，Projects / Skills / Tools / About 依次）
7. 集成 react-helmet-async
8. 撰写 README.md
9. 编写 GitHub Actions 部署文件
10. 本地 `npm run build` 验证，截图自查

## 8. 风险与边界

- **国内访问 Google Fonts 不稳定**：fallback 到 Arial/Georgia
- **GitHub Pages 强制 HashRouter**：所有路由将以 `/#/path` 形式呈现，文档中需要提醒
- **占位图缺失**：用渐变色 + emoji 作为占位，避免 404
- **首次部署需用户手动改 Pages 设置**：README 中标注

## 9. 验收标准

- 本地 `npm run dev` 启动，5 个页面均可访问，无 console error
- `npm run build` 成功无警告
- 所有 `<a>` 跳转不刷新页面
- 文章详情页 Markdown 正确渲染（含代码高亮、GFM 表格）
- 移动端（375px）/ 桌面端（1280px）布局正确
- 在品牌色、字体、动效上符合 brand-guidelines
- 代码包含中文注释，便于用户后续修改
