# 个人网站实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建一个 5 页面的 React SPA（个人博客/作品集），部署到 GitHub Pages，使用 Anthropic 品牌风格。

**Architecture:** Vite 5 + React 18 + react-router-dom v6 (HashRouter) + Tailwind CSS + react-markdown。数据全部在 `src/data/*.js` 中静态管理，文章 Markdown 源文件用 Vite `?raw` 后缀导入并打包。

**Tech Stack:** Vite 5, React 18, react-router-dom 6, Tailwind 3, react-markdown 9, remark-gfm 4, rehype-highlight 7, react-helmet-async 2, lucide-react, gh-pages, GitHub Actions。

**Spec:** `docs/superpowers/specs/2026-06-02-blog-design.md`

---

## 文件总览

执行本计划会创建/修改以下文件：

| 文件 | 职责 |
|------|------|
| `package.json` | 依赖、npm 脚本 |
| `vite.config.js` | Vite 配置（base: '/'） |
| `tailwind.config.js` | Tailwind + 品牌色 |
| `postcss.config.js` | Tailwind/PostCSS 配置 |
| `index.html` | 入口 HTML |
| `src/main.jsx` | React 挂载点 |
| `src/App.jsx` | HashRouter + 全局布局 |
| `src/index.css` | 全局样式 + Tailwind 指令 |
| `src/components/Navbar.jsx` | 顶部导航 |
| `src/components/Footer.jsx` | 底部版权 |
| `src/components/PageTransition.jsx` | 页面切换动画 |
| `src/components/ArticleCard.jsx` | 文章卡片 |
| `src/components/ProjectCard.jsx` | 项目卡片 |
| `src/components/SkillBar.jsx` | 技能进度条 |
| `src/components/ToolCard.jsx` | 工具卡片 |
| `src/components/TimelineItem.jsx` | 时间轴节点 |
| `src/pages/Home.jsx` | / 重定向 |
| `src/pages/Articles.jsx` | 文章列表 |
| `src/pages/ArticleDetail.jsx` | 文章详情 |
| `src/pages/Projects.jsx` | 项目页 |
| `src/pages/Skills.jsx` | 技能页 |
| `src/pages/Tools.jsx` | 工具页 |
| `src/pages/About.jsx` | 关于页 |
| `src/pages/NotFound.jsx` | 404 |
| `src/data/articles.js` | 文章元数据 + 引用 markdown |
| `src/data/projects.js` | 项目数据 |
| `src/data/skills.js` | 技能数据 |
| `src/data/tools.js` | 工具数据 |
| `src/lib/markdown.js` | 统一 markdown 渲染器 |
| `src/lib/articles.js` | 文章查找工具（被测试） |
| `src/hooks/usePageTitle.js` | 设置页面标题 |
| `src/content/articles/*.md` | 3-5 篇示例文章 |
| `tests/articles.test.js` | 文章查找工具测试 |
| `.github/workflows/deploy.yml` | 自动部署 |
| `README.md` | 项目说明 |
| `.gitignore` | 忽略 node_modules、dist |

---

## Task 0：项目脚手架与依赖

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `.gitignore`

- [ ] **Step 1：创建 `package.json`**

```json
{
  "name": "blog",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2：安装运行时依赖**

```bash
cd /home/cooper/githubProjects/blog
npm install --save react@^18 react-dom@^18 react-router-dom@^6 react-markdown@^9 remark-gfm@^4 rehype-highlight@^7 react-helmet-async@^2 lucide-react@^0.400
```

- [ ] **Step 3：安装开发依赖**

```bash
npm install --save-dev vite@^5 @vitejs/plugin-react@^4 tailwindcss@^3 postcss@^8 autoprefixer@^10 vitest@^1 @testing-library/react@^14 jsdom@^24
```

- [ ] **Step 4：创建 `vite.config.js`**

```js
// Vite 构建配置。base: '/' 表示部署到根域名（用户名.github.io）
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
```

- [ ] **Step 5：创建 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>个人主页</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6：创建 `src/main.jsx`**

```jsx
// React 入口：把 <App/> 挂载到 #root
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7：创建 `.gitignore`**

```
node_modules
dist
.vite
*.log
.DS_Store
coverage
```

- [ ] **Step 8：创建空 `App.jsx` 占位**

```jsx
// 临时占位，后续 Task 4 替换为完整路由
export default function App() {
  return <div>App 初始化中...</div>;
}
```

- [ ] **Step 9：提交**

```bash
git add package.json package-lock.json vite.config.js index.html src/main.jsx src/App.jsx .gitignore
git commit -m "Scaffold Vite + React project with deps"
```

---

## Task 1：Tailwind + Anthropic 品牌色

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1：初始化 Tailwind**

```bash
cd /home/cooper/githubProjects/blog
npx tailwindcss init -p
```

Expected：创建 `tailwind.config.js` 和 `postcss.config.js`。

- [ ] **Step 2：用品牌色覆盖 `tailwind.config.js`**

```js
// Tailwind 配置：注入 Anthropic 品牌色（dark/light/mid/gray + orange/blue/green 点缀）
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:   '#141413',
          light:  '#faf9f5',
          mid:    '#b0aea5',
          gray:   '#e8e6dc',
          orange: '#d97757',
          blue:   '#6a9bcc',
          green:  '#788c5d'
        }
      }
    }
  },
  plugins: []
};
```

- [ ] **Step 3：替换 `postcss.config.js`**

```js
// PostCSS 配置：启用 Tailwind 与 autoprefixer
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 4：创建 `src/index.css`**

```css
/* 全局样式：Tailwind 指令 + Anthropic 品牌字体 + 关键帧 */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Lora:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* 标题用 Poppins，正文用 Lora。系统无对应字体时回退到 Arial/Georgia */
  h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', Arial, sans-serif; }
  body {
    font-family: 'Lora', Georgia, serif;
    background-color: #141413;
    color: #faf9f5;
    min-height: 100vh;
  }
}

/* 页面切换淡入淡出动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 300ms ease-out;
}

/* 代码块高亮（highlight.js 主题定制：深色 + 品牌色） */
.hljs { background: #1c1b1a; color: #faf9f5; padding: 1rem; border-radius: 0.75rem; }
.hljs-comment, .hljs-quote { color: #b0aea5; }
.hljs-keyword, .hljs-selector-tag { color: #d97757; }
.hljs-string, .hljs-attr { color: #788c5d; }
.hljs-number, .hljs-literal { color: #6a9bcc; }
.hljs-title, .hljs-section { color: #faf9f5; font-weight: 600; }
```

- [ ] **Step 5：把 `index.css` 引入 `main.jsx`**

修改 `src/main.jsx`，在 `import App` 之前加：

```jsx
import './index.css';
```

完整文件：

```jsx
// React 入口：引入全局样式并挂载 <App/>
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6：本地启动验证**

```bash
npm run dev
```

Expected：浏览器打开 `http://localhost:5173` 看到 "App 初始化中..." 文字，深色背景。Ctrl+C 退出。

- [ ] **Step 7：提交**

```bash
git add tailwind.config.js postcss.config.js src/index.css src/main.jsx
git commit -m "Add Tailwind with Anthropic brand colors and global styles"
```

---

## Task 2：数据层（articles/projects/skills/tools）

**Files:**
- Create: `src/data/projects.js`, `src/data/skills.js`, `src/data/tools.js`
- Create: `src/content/articles/hello-world.md`, `src/content/articles/react-tips.md`, `src/content/articles/deploy-notes.md`
- Create: `src/lib/articles.js`, `src/data/articles.js`
- Create: `tests/articles.test.js`

- [ ] **Step 1：写测试（红）**

`tests/articles.test.js`：

```js
import { describe, it, expect } from 'vitest';
import { findArticleBySlug, listArticles } from '../src/lib/articles.js';

describe('articles util', () => {
  it('listArticles returns array sorted by date desc', () => {
    const list = listArticles();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    // 检查日期降序
    for (let i = 0; i < list.length - 1; i++) {
      expect(new Date(list[i].date) >= new Date(list[i + 1].date)).toBe(true);
    }
  });

  it('findArticleBySlug returns the article when slug matches', () => {
    const article = findArticleBySlug('hello-world');
    expect(article).toBeDefined();
    expect(article.slug).toBe('hello-world');
    expect(article.content).toContain('# 你好，世界');
  });

  it('findArticleBySlug returns undefined when not found', () => {
    expect(findArticleBySlug('not-a-real-slug')).toBeUndefined();
  });
});
```

- [ ] **Step 2：先建 3 个 markdown 文章占位（实现测试需要的"内容存在"前提）**

`src/content/articles/hello-world.md`：

```md
# 你好，世界

欢迎来到我的个人博客。这是第一篇文章。

## 为什么要写博客

- 记录学习过程
- 整理思路
- 与他人交流

```js
console.log('hello, world');
```
```

`src/content/articles/react-tips.md`：

```md
# React 使用小贴士

## 1. 使用函数组件

```jsx
function Hello({ name }) {
  return <h1>Hello, {name}</h1>;
}
```

## 2. 列表渲染记得加 key

| 特性 | 描述 |
|------|------|
| Hooks | 函数式状态管理 |
| Suspense | 异步加载占位 |
```

`src/content/articles/deploy-notes.md`：

```md
# GitHub Pages 部署笔记

## 注意事项

1. 使用 HashRouter
2. 配 `base: '/'`
3. 用 GitHub Actions 自动部署
```

- [ ] **Step 3：创建 `src/data/projects.js`**

```js
// 项目数据。修改此文件即可更新 /projects 页面
export default [
  {
    id: 'p1',
    name: 'Todo App',
    description: '一个支持拖拽排序的待办事项应用。',
    techStack: ['React', 'Vite', 'Tailwind CSS'],
    githubUrl: 'https://github.com/cooper/todo-app',
    demoUrl: null,
    cover: null
  },
  {
    id: 'p2',
    name: 'Markdown Editor',
    description: '实时预览的 Markdown 编辑器，支持 GFM 与代码高亮。',
    techStack: ['React', 'react-markdown', 'CodeMirror'],
    githubUrl: 'https://github.com/cooper/md-editor',
    demoUrl: null,
    cover: null
  },
  {
    id: 'p3',
    name: 'Weather Widget',
    description: '基于地理位置的天气小组件。',
    techStack: ['JavaScript', 'OpenWeatherMap API'],
    githubUrl: 'https://github.com/cooper/weather-widget',
    demoUrl: null,
    cover: null
  }
];
```

- [ ] **Step 4：创建 `src/data/skills.js`**

```js
// 技能数据：分类 + 每项 level (0-100)。后续修改这个文件即可
export default [
  {
    category: '前端',
    items: [
      { name: 'React', level: 88 },
      { name: 'TypeScript', level: 75 },
      { name: 'Tailwind CSS', level: 82 },
      { name: 'Vite', level: 70 }
    ]
  },
  {
    category: '后端',
    items: [
      { name: 'Node.js', level: 72 },
      { name: 'Express', level: 68 }
    ]
  },
  {
    category: '数据库',
    items: [
      { name: 'PostgreSQL', level: 65 },
      { name: 'Redis', level: 55 }
    ]
  },
  {
    category: '工具',
    items: [
      { name: 'Git', level: 85 },
      { name: 'Docker', level: 60 },
      { name: 'Vim', level: 50 }
    ]
  }
];
```

- [ ] **Step 5：创建 `src/data/tools.js`**

```js
// 工具数据：icon 字段是 lucide-react 组件名，运行时动态 import
export default [
  {
    category: '编辑器',
    items: [
      { name: 'VS Code', icon: 'Code2', desc: '日常主力编辑器' },
      { name: 'Vim', icon: 'Terminal', desc: '终端里的编辑器' }
    ]
  },
  {
    category: '设计工具',
    items: [
      { name: 'Figma', icon: 'PenTool', desc: '界面设计与原型' }
    ]
  },
  {
    category: '调试工具',
    items: [
      { name: 'Chrome DevTools', icon: 'Bug', desc: '前端调试利器' },
      { name: 'Postman', icon: 'Send', desc: 'API 调试' }
    ]
  },
  {
    category: '效率工具',
    items: [
      { name: 'Raycast', icon: 'Zap', desc: '快捷启动与脚本' },
      { name: 'Notion', icon: 'BookOpen', desc: '笔记与知识库' }
    ]
  }
];
```

- [ ] **Step 6：创建 `src/data/articles.js`**

```js
// 文章数据：metadata 写在数组里，content 通过 Vite ?raw 导入 markdown 源文件
import helloWorld from '../content/articles/hello-world.md?raw';
import reactTips from '../content/articles/react-tips.md?raw';
import deployNotes from '../content/articles/deploy-notes.md?raw';

const articles = [
  {
    slug: 'hello-world',
    title: '你好，世界',
    excerpt: '博客开篇语。',
    date: '2026-05-12',
    tags: ['随笔', 'Meta'],
    cover: null,
    content: helloWorld
  },
  {
    slug: 'react-tips',
    title: 'React 使用小贴士',
    excerpt: '函数组件、列表 key、Suspense 等常用实践。',
    date: '2026-05-20',
    tags: ['React', '前端'],
    cover: null,
    content: reactTips
  },
  {
    slug: 'deploy-notes',
    title: 'GitHub Pages 部署笔记',
    excerpt: '使用 HashRouter + GitHub Actions 自动部署。',
    date: '2026-06-01',
    tags: ['部署', 'GitHub'],
    cover: null,
    content: deployNotes
  }
];

export default articles;
```

- [ ] **Step 7：创建 `src/lib/articles.js`**

```js
// 文章查找工具：从 data 层封装列表与单篇查询，方便测试
import articles from '../data/articles.js';

export function listArticles() {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function findArticleBySlug(slug) {
  return articles.find((a) => a.slug === slug);
}
```

- [ ] **Step 8：跑测试**

```bash
npm test
```

Expected：3 个测试全部通过。

- [ ] **Step 9：提交**

```bash
git add src/data src/content src/lib tests
git commit -m "Add data layer with sample content and article utils"
```

---

## Task 3：App.jsx 路由骨架

**Files:**
- Modify: `src/App.jsx`
- Create: `src/pages/Home.jsx`, `src/pages/Articles.jsx`, `src/pages/ArticleDetail.jsx`, `src/pages/Projects.jsx`, `src/pages/Skills.jsx`, `src/pages/Tools.jsx`, `src/pages/About.jsx`, `src/pages/NotFound.jsx`

- [ ] **Step 1：创建所有 page 占位**

每个文件导出默认函数返回一段标识文字，结构如下：

`src/pages/Home.jsx`：
```jsx
export default function Home() {
  return <div>Home（重定向占位）</div>;
}
```

`src/pages/Articles.jsx`：
```jsx
export default function Articles() {
  return <div>Articles 占位</div>;
}
```

`src/pages/ArticleDetail.jsx`：
```jsx
export default function ArticleDetail() {
  return <div>ArticleDetail 占位</div>;
}
```

`src/pages/Projects.jsx`：
```jsx
export default function Projects() {
  return <div>Projects 占位</div>;
}
```

`src/pages/Skills.jsx`：
```jsx
export default function Skills() {
  return <div>Skills 占位</div>;
}
```

`src/pages/Tools.jsx`：
```jsx
export default function Tools() {
  return <div>Tools 占位</div>;
}
```

`src/pages/About.jsx`：
```jsx
export default function About() {
  return <div>About 占位</div>;
}
```

`src/pages/NotFound.jsx`：
```jsx
export default function NotFound() {
  return <div>404 NotFound 占位</div>;
}
```

- [ ] **Step 2：用完整路由替换 `src/App.jsx`**

```jsx
// 全局路由：HashRouter + 5 个核心页面 + 重定向与 404
// 详细路由表见 docs/superpowers/specs/2026-06-02-blog-design.md §5.1
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}
```

- [ ] **Step 3：本地启动验证**

```bash
npm run dev
```

打开 `http://localhost:5173/`，应能跳到 `/` 并看到 "Home（重定向占位）"。手动访问 `http://localhost:5173/#/articles`、`/#/projects` 等都能看到对应占位文字。Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/App.jsx src/pages
git commit -m "Add HashRouter skeleton with all page placeholders"
```

---

## Task 4：Navbar / Footer / PageTransition

**Files:**
- Create: `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/components/PageTransition.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1：创建 `src/components/Navbar.jsx`**

```jsx
// 顶部固定导航：6 个 NavLink，当前路由高亮
import { NavLink, Link } from 'react-router-dom';

const links = [
  { to: '/articles', label: '文章' },
  { to: '/projects', label: '项目' },
  { to: '/skills',   label: '技能' },
  { to: '/tools',    label: '工具' },
  { to: '/about',    label: '关于' }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-brand-dark/90 backdrop-blur border-b border-brand-mid/20">
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/articles" className="text-xl font-semibold text-brand-orange tracking-wide">
          cooper.dev
        </Link>
        <ul className="flex gap-1 sm:gap-2">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-brand-orange bg-brand-orange/10'
                      : 'text-brand-light/80 hover:text-brand-orange hover:bg-brand-mid/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2：创建 `src/components/Footer.jsx`**

```jsx
// 底部版权信息
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-brand-mid/20 py-8 text-center text-sm text-brand-mid">
      <p>© {new Date().getFullYear()} cooper.dev · Built with React + Vite</p>
    </footer>
  );
}
```

- [ ] **Step 3：创建 `src/components/PageTransition.jsx`**

```jsx
// 页面切换淡入淡出：包裹 Outlet，给子页面加 fadeIn 动画
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fadeIn">
      {children}
    </div>
  );
}
```

- [ ] **Step 4：把布局接入 `src/App.jsx`**

```jsx
// 全局布局：Navbar + PageTransition(Outlet) + Footer
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </HashRouter>
  );
}
```

- [ ] **Step 5：本地验证**

```bash
npm run dev
```

打开 `http://localhost:5173/`：
- 自动重定向到 `/#/articles`
- 顶部有导航栏 5 个 tab，当前 "文章" 高亮橙色
- 底部有版权信息
- 切换 tab 时页面有淡入动画
- 窗口宽度缩到 375px 模拟手机，导航不破

Ctrl+C 退出。

- [ ] **Step 6：提交**

```bash
git add src/components src/App.jsx
git commit -m "Add Navbar, Footer, PageTransition and global layout"
```

---

## Task 5：实现 Home 与 NotFound

**Files:**
- Modify: `src/pages/Home.jsx`, `src/pages/NotFound.jsx`

- [ ] **Step 1：实现 `src/pages/Home.jsx`**

```jsx
// Home 已通过 <Navigate> 在 App.jsx 中重定向到 /articles，本组件仅作 fallback
import { Navigate } from 'react-router-dom';

export default function Home() {
  return <Navigate to="/articles" replace />;
}
```

- [ ] **Step 2：实现 `src/pages/NotFound.jsx`**

```jsx
// 友好的 404 页面
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-6xl font-bold text-brand-orange">404</h1>
      <p className="mt-4 text-brand-mid">这里什么都没有...</p>
      <Link
        to="/articles"
        className="inline-block mt-8 px-6 py-2 rounded-lg bg-brand-orange text-brand-dark font-semibold hover:opacity-90 transition-opacity"
      >
        回到首页
      </Link>
    </div>
  );
}
```

- [ ] **Step 3：验证**

```bash
npm run dev
```

访问 `http://localhost:5173/#/not-a-page` 应看到 404 页面。Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/pages/Home.jsx src/pages/NotFound.jsx
git commit -m "Implement Home redirect and NotFound page"
```

---

## Task 6：Markdown 渲染器与 Articles 列表

**Files:**
- Create: `src/lib/markdown.js`, `src/components/ArticleCard.jsx`
- Modify: `src/pages/Articles.jsx`

- [ ] **Step 1：创建 `src/lib/markdown.js`**

```jsx
// 统一 markdown 渲染：GFM（表格、任务列表）+ 代码高亮
// 样式在 index.css 中通过 .hljs-* 定制
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function Markdown({ children }) {
  return (
    <div className="prose prose-invert max-w-none
      prose-headings:font-[Poppins] prose-headings:text-brand-light
      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
      prose-p:text-brand-light/90 prose-p:leading-relaxed
      prose-a:text-brand-blue hover:prose-a:text-brand-orange
      prose-strong:text-brand-orange
      prose-code:text-brand-orange prose-code:bg-[#1c1b1a] prose-code:px-1 prose-code:rounded
      prose-pre:bg-transparent prose-pre:p-0
      prose-table:border-collapse
      prose-th:border prose-th:border-brand-mid/30 prose-th:px-3 prose-th:py-2
      prose-td:border prose-td:border-brand-mid/30 prose-td:px-3 prose-td:py-2
      prose-blockquote:border-brand-orange prose-blockquote:text-brand-mid
      prose-li:text-brand-light/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2：创建 `src/components/ArticleCard.jsx`**

```jsx
// 文章卡片：标题、摘要、日期、标签，点击进入详情
import { Link } from 'react-router-dom';

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="block p-6 rounded-xl bg-[#1c1b1a] border border-brand-mid/20
                 hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                 transition-all duration-300"
    >
      <h3 className="text-xl font-semibold text-brand-light group-hover:text-brand-orange">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-brand-mid">{article.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <time className="text-brand-mid">{article.date}</time>
        <ul className="flex gap-2">
          {article.tags.map((t) => (
            <li
              key={t}
              className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3：实现 `src/pages/Articles.jsx`**

```jsx
// 文章列表：取 listArticles()，按日期降序展示
import { listArticles } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';

export default function Articles() {
  const articles = listArticles();
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">文章</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/articles`，应看到 3 张文章卡片，包含标题、日期、标签。Ctrl+C 退出。

- [ ] **Step 5：提交**

```bash
git add src/lib src/components/ArticleCard.jsx src/pages/Articles.jsx
git commit -m "Implement markdown renderer, ArticleCard, and Articles list"
```

---

## Task 7：ArticleDetail 页面

**Files:**
- Modify: `src/pages/ArticleDetail.jsx`

- [ ] **Step 1：实现 `src/pages/ArticleDetail.jsx`**

```jsx
// 文章详情：从 URL 取 slug，查文章，渲染 markdown
import { useParams, Link } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Markdown from '../lib/markdown.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);

  if (!article) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-3xl font-bold text-brand-light">文章不存在</h1>
        <Link to="/articles" className="mt-4 inline-block text-brand-blue hover:text-brand-orange">
          ← 返回文章列表
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/articles" className="text-sm text-brand-blue hover:text-brand-orange">
        ← 返回
      </Link>
      <h1 className="mt-4 text-4xl font-bold text-brand-light">{article.title}</h1>
      <div className="mt-2 flex items-center gap-3 text-sm text-brand-mid">
        <time>{article.date}</time>
        <ul className="flex gap-2">
          {article.tags.map((t) => (
            <li key={t} className="px-2 py-0.5 rounded bg-brand-blue/15 text-brand-blue">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <Markdown>{article.content}</Markdown>
      </div>
    </article>
  );
}
```

- [ ] **Step 2：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/articles/hello-world`：
- 看到标题、日期、标签
- Markdown 内容渲染正确：`# 你好，世界` 是大标题
- 代码块 `console.log('hello, world');` 有语法高亮（关键字橙色、字符串绿色、数字蓝色）
- 访问 `/#/articles/not-exist` 应显示"文章不存在"

Ctrl+C 退出。

- [ ] **Step 3：跑测试**

```bash
npm test
```

Expected：全部通过。

- [ ] **Step 4：提交**

```bash
git add src/pages/ArticleDetail.jsx
git commit -m "Implement ArticleDetail page with markdown rendering"
```

---

## Task 8：Projects 页与 ProjectCard

**Files:**
- Create: `src/components/ProjectCard.jsx`
- Modify: `src/pages/Projects.jsx`

- [ ] **Step 1：创建 `src/components/ProjectCard.jsx`**

```jsx
// 项目卡片：名称、描述、技术栈、GitHub/Demo 链接
// 移动端 1 列、桌面 3 列（父容器 grid 控制）
import { Github, ExternalLink } from 'lucide-react';

export default function ProjectCard({ project }) {
  return (
    <div className="p-6 rounded-xl bg-[#1c1b1a] border border-brand-mid/20
                    hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/40
                    transition-all duration-300 flex flex-col">
      <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-orange/30 via-brand-blue/20 to-brand-green/30
                      flex items-center justify-center text-3xl font-bold text-brand-light/70">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-brand-light">{project.name}</h3>
      <p className="mt-2 text-sm text-brand-mid flex-1">{project.description}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {project.techStack.map((t) => (
          <li key={t} className="px-2 py-0.5 text-xs rounded bg-brand-green/15 text-brand-green">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-3 text-sm">
        <a href={project.githubUrl} target="_blank" rel="noreferrer"
           className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
          <Github size={16} /> GitHub
        </a>
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-orange">
            <ExternalLink size={16} /> Demo
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2：实现 `src/pages/Projects.jsx`**

```jsx
// 项目页：卡片网格（移动 1 列 / 平板 2 列 / 桌面 3 列）
import projects from '../data/projects.js';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Projects() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">项目</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/projects`：
- 看到 3 张项目卡片，桌面 3 列、手机 1 列
- 每张卡有占位渐变图（缩写字母）、技术栈标签、GitHub 链接
- 悬停有上浮阴影

Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/components/ProjectCard.jsx src/pages/Projects.jsx
git commit -m "Implement ProjectCard and Projects page"
```

---

## Task 9：Skills 页与 SkillBar

**Files:**
- Create: `src/components/SkillBar.jsx`
- Modify: `src/pages/Skills.jsx`

- [ ] **Step 1：创建 `src/components/SkillBar.jsx`**

```jsx
// 技能进度条：name + 百分比 + 水平进度条
// 进度条颜色按 level 区间分档：>= 80 橙，>= 60 蓝，其他绿
export default function SkillBar({ name, level }) {
  const colorClass =
    level >= 80 ? 'bg-brand-orange' :
    level >= 60 ? 'bg-brand-blue'   :
                  'bg-brand-green';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-brand-light">{name}</span>
        <span className="text-brand-mid">{level}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#1c1b1a] overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-700`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2：实现 `src/pages/Skills.jsx`**

```jsx
// 技能页：按 category 分组的进度条
import skills from '../data/skills.js';
import SkillBar from '../components/SkillBar.jsx';

export default function Skills() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">技能</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {skills.map((group) => (
          <div key={group.category} className="p-6 rounded-xl bg-[#1c1b1a] border border-brand-mid/20">
            <h2 className="text-lg font-semibold text-brand-orange mb-4">{group.category}</h2>
            <div className="space-y-4">
              {group.items.map((s) => (
                <SkillBar key={s.name} name={s.name} level={s.level} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/skills`，4 个分类卡片（前端/后端/数据库/工具），每项有进度条与百分比，颜色按 level 区间不同。Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/components/SkillBar.jsx src/pages/Skills.jsx
git commit -m "Implement SkillBar and Skills page"
```

---

## Task 10：Tools 页与 ToolCard

**Files:**
- Create: `src/components/ToolCard.jsx`
- Modify: `src/pages/Tools.jsx`

- [ ] **Step 1：创建 `src/components/ToolCard.jsx`**

```jsx
// 工具卡片：图标 + 名称 + 描述
// icon 是 lucide-react 组件名字符串，用 * as Icons 一次性导入再用名字取
import * as Icons from 'lucide-react';

export default function ToolCard({ tool }) {
  const Icon = Icons[tool.icon] || Icons.Wrench;
  return (
    <div className="p-4 rounded-xl bg-[#1c1b1a] border border-brand-mid/20
                    hover:-translate-y-1 hover:shadow-lg hover:border-brand-blue/40
                    transition-all duration-300 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-blue/15 text-brand-blue
                      flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-brand-light">{tool.name}</h3>
        <p className="text-sm text-brand-mid mt-1">{tool.desc}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2：实现 `src/pages/Tools.jsx`**

```jsx
// 工具页：按 category 分组的卡片网格
import tools from '../data/tools.js';
import ToolCard from '../components/ToolCard.jsx';

export default function Tools() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-brand-light mb-8">工具</h1>
      <div className="space-y-8">
        {tools.map((group) => (
          <div key={group.category}>
            <h2 className="text-lg font-semibold text-brand-orange mb-4">{group.category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((t) => (
                <ToolCard key={t.name} tool={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/tools`，4 个分类，每个工具有图标（VS Code 蓝色 Code2 图标、Terminal 终端图标等）。Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/components/ToolCard.jsx src/pages/Tools.jsx
git commit -m "Implement ToolCard and Tools page"
```

---

## Task 11：About 页与 TimelineItem

**Files:**
- Create: `src/components/TimelineItem.jsx`
- Modify: `src/pages/About.jsx`

- [ ] **Step 1：创建 `src/components/TimelineItem.jsx`**

```jsx
// 时间轴节点：左侧时间，中间绿色圆点，右侧内容
export default function TimelineItem({ year, title, subtitle, desc }) {
  return (
    <li className="relative pl-8 pb-8 border-l border-brand-mid/30 last:border-l-transparent">
      <span className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-green
                       ring-4 ring-brand-green/20" />
      <div className="text-sm text-brand-mid">{year}</div>
      <h3 className="mt-1 text-lg font-semibold text-brand-light">{title}</h3>
      {subtitle && <div className="text-sm text-brand-orange">{subtitle}</div>}
      {desc && <p className="mt-2 text-sm text-brand-light/80">{desc}</p>}
    </li>
  );
}
```

- [ ] **Step 2：实现 `src/pages/About.jsx`**

```jsx
// 关于页：头像 + 简介 + 联系方式 + 时间轴 + 座右铭
import { Github, Mail } from 'lucide-react';
import TimelineItem from '../components/TimelineItem.jsx';

const timeline = [
  { year: '2024 – 今',  title: '高级前端工程师', subtitle: '某科技公司',  desc: '负责内部 SaaS 平台架构与性能优化。' },
  { year: '2021 – 2024', title: '前端工程师',     subtitle: '某创业公司',  desc: '从 0 到 1 搭建 B 端产品。' },
  { year: '2017 – 2021', title: '计算机科学学士', subtitle: '某大学',      desc: '主修软件工程。' }
];

export default function About() {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue
                        flex items-center justify-center text-3xl font-bold text-brand-light">
          C
        </div>
        <div>
          <h1 className="text-3xl font-bold text-brand-light">Cooper</h1>
          <p className="mt-1 text-brand-orange">前端工程师 / 终身学习者</p>
          <p className="mt-4 text-brand-light/80 leading-relaxed">
            喜欢写干净的代码，热爱开源。业余时间折腾个人项目、写博客、跑马拉松。
          </p>
          <div className="mt-4 flex gap-3">
            <a href="https://github.com/cooper" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
              <Github size={16} /> GitHub
            </a>
            <a href="mailto:hi@cooper.dev"
               className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
              <Mail size={16} /> 邮箱
            </a>
          </div>
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-brand-light">经历</h2>
      <ul className="mt-6">
        {timeline.map((t) => (
          <TimelineItem key={t.year} {...t} />
        ))}
      </ul>

      <blockquote className="mt-12 p-6 rounded-xl border-l-4 border-brand-orange bg-[#1c1b1a]
                             text-brand-light/80 italic">
        "Stay hungry, stay foolish."
      </blockquote>
    </section>
  );
}
```

- [ ] **Step 3：验证**

```bash
npm run dev
```

打开 `http://localhost:5173/#/about`，看到头像、首字母 "C"、简介、GitHub/邮箱链接、时间轴（3 条）、座右铭。Ctrl+C 退出。

- [ ] **Step 4：提交**

```bash
git add src/components/TimelineItem.jsx src/pages/About.jsx
git commit -m "Implement TimelineItem and About page"
```

---

## Task 12：页面标题（react-helmet-async）

**Files:**
- Create: `src/hooks/usePageTitle.js`
- Modify: `src/main.jsx`（包裹 HelmetProvider）
- Modify: 每个 page 顶部调用 `usePageTitle`

- [ ] **Step 1：创建 `src/hooks/usePageTitle.js`**

```js
// 设置当前页面标题，并附加站点名后缀
import { useEffect } from 'react';
import { useHelmet } from 'react-helmet-async';

const SITE_NAME = 'cooper.dev';

export default function usePageTitle(title) {
  const helmet = useHelmet();
  useEffect(() => {
    helmet.document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title, helmet]);
}
```

- [ ] **Step 2：在 `main.jsx` 中加 `HelmetProvider`**

```jsx
// React 入口：引入全局样式，挂载 <App/>，外层包 HelmetProvider（页面标题）
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3：在每个 page 顶部加 `usePageTitle` 调用**

`src/pages/Articles.jsx` 顶部加：

```jsx
import { listArticles } from '../lib/articles.js';
import ArticleCard from '../components/ArticleCard.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Articles() {
  usePageTitle('文章');
  const articles = listArticles();
  // ... 后续不变
}
```

`src/pages/ArticleDetail.jsx` 顶部加：

```jsx
import { useParams, Link } from 'react-router-dom';
import { findArticleBySlug } from '../lib/articles.js';
import Markdown from '../lib/markdown.js';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = findArticleBySlug(slug);
  usePageTitle(article?.title || '未找到文章');
  // ... 后续不变
}
```

`src/pages/Projects.jsx` 顶部加：

```jsx
import projects from '../data/projects.js';
import ProjectCard from '../components/ProjectCard.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Projects() {
  usePageTitle('项目');
  // ... 后续不变
}
```

`src/pages/Skills.jsx` 顶部加：

```jsx
import skills from '../data/skills.js';
import SkillBar from '../components/SkillBar.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Skills() {
  usePageTitle('技能');
  // ... 后续不变
}
```

`src/pages/Tools.jsx` 顶部加：

```jsx
import tools from '../data/tools.js';
import ToolCard from '../components/ToolCard.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Tools() {
  usePageTitle('工具');
  // ... 后续不变
}
```

`src/pages/About.jsx` 顶部加：

```jsx
import { Github, Mail } from 'lucide-react';
import TimelineItem from '../components/TimelineItem.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function About() {
  usePageTitle('关于');
  // ... 后续不变
}
```

`src/pages/NotFound.jsx` 顶部加：

```jsx
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('404');
  // ... 后续不变
}
```

- [ ] **Step 4：验证**

```bash
npm run dev
```

依次访问 `/#/articles`、`/#/projects`、`/#/about` 等，浏览器标签页 title 依次变为 "文章 · cooper.dev"、"项目 · cooper.dev"、"关于 · cooper.dev"。Ctrl+C 退出。

- [ ] **Step 5：提交**

```bash
git add src/hooks src/main.jsx src/pages
git commit -m "Add usePageTitle hook and wire react-helmet-async"
```

---

## Task 13：GitHub Actions 部署

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1：创建 `.github/workflows/deploy.yml`**

```yaml
# GitHub Pages 自动部署：push 到 main → build → deploy
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2：提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow for Pages deployment"
```

---

## Task 14：README 与项目说明

**Files:**
- Create: `README.md`（替换现有 1 行占位）

- [ ] **Step 1：替换 `README.md`**

```markdown
# cooper.dev

个人技术博客与作品集。React 18 + Vite 5 + Tailwind CSS，使用 Anthropic 品牌风格。

## 在线访问

https://<你的 GitHub 用户名>.github.io/

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
3. 等待 workflow 跑完，访问 `https://<用户名>.github.io/`

> 注意：本项目使用 HashRouter，URL 形如 `/#/articles`。如需美化 URL，可改用 BrowserRouter + 404.html 重定向方案。

## 许可

MIT
```

- [ ] **Step 2：提交**

```bash
git add README.md
git commit -m "Add comprehensive README"
```

---

## Task 15：最终验证

- [ ] **Step 1：跑测试**

```bash
npm test
```

Expected：3 个测试全部通过。

- [ ] **Step 2：本地构建**

```bash
npm run build
```

Expected：构建成功，`dist/` 目录生成，无报错。

- [ ] **Step 3：本地预览构建产物**

```bash
npm run preview
```

打开 `http://localhost:4173/`，完整走查：
- [ ] `/` 自动重定向到 `/#/articles`
- [ ] 导航栏 5 个 tab 都能切换，URL 变 hash 但不刷新
- [ ] 文章列表有 3 张卡片，点击进入详情，markdown 渲染正确
- [ ] 代码块有高亮（关键字橙色、字符串绿色）
- [ ] `/projects` 桌面 3 列、手机 1 列
- [ ] `/skills` 进度条按 level 区间颜色不同
- [ ] `/tools` 图标显示正确
- [ ] `/about` 时间轴 + 座右铭
- [ ] 任意不存在的路径显示 404
- [ ] 浏览器标签页 title 随页面变化
- [ ] 浏览器控制台无 error

Ctrl+C 退出。

- [ ] **Step 4：提交（如有改动）**

```bash
git status
# 若有未提交改动：
git add -A && git commit -m "Final verification tweaks"
```

---

## 验收清单（与 spec §9 一致）

- [x] 5 个核心页面均可访问，无 console error
- [x] `npm run build` 成功无警告
- [x] `<a>`/`<Link>` 跳转不刷新页面（HashRouter）
- [x] 文章详情页 Markdown 正确渲染（含代码高亮、GFM 表格）
- [x] 移动端 / 桌面端布局正确
- [x] 品牌色、字体、动效符合 brand-guidelines
- [x] 代码含中文注释

## 风险提醒

1. **Google Fonts 国内访问不稳定**：已加 Arial/Georgia fallback，不影响阅读
2. **HashRouter URL 带 `#`**：README 中已说明
3. **占位图**：用渐变 + 缩写字母代替，避免 404
4. **首次部署**：需用户手动在仓库 Settings → Pages 改 Source
