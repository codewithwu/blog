# 项目详情页全屏重设计 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/projects/:slug` 详情页简化为「悬浮返回按钮 + 100vh iframe」,移除 ProjectHeader,详情页路由下隐藏 Navbar,`Html` 组件统一为单一 iframe 路径(HTML 片段也包成最小文档)。

**Architecture:** 在 `src/lib/html.jsx` 把双路径(`dangerouslySetInnerHTML` / iframe)合并为单 iframe 路径;在 `src/App.jsx` 用 `useLocation` 做路由级 Navbar 显隐;`ProjectDetail.jsx` 改为只渲染悬浮 Link + `<Html>`,不再 import `ProjectHeader`。`ProjectHeader.jsx` 文件删除,`CLAUDE.md` 规则 11 同步更新。

**Tech Stack:** React 18 + Vite + Tailwind 3 + Vitest + @testing-library/react(无新增依赖)

**Spec:** `docs/superpowers/specs/2026-06-06-project-detail-fullscreen-redesign-design.md`

---

## 文件结构

| 文件 | 动作 | 职责 |
|---|---|---|
| `src/lib/html.jsx` | 改 | 双路径合并:统一输出 `<iframe srcDoc>`,完整文档直接用,片段包成最小 HTML 文档 |
| `src/pages/ProjectDetail.jsx` | 改 | 移除 ProjectHeader;改用「悬浮返回按钮 + Html」;无 `mt-6` 之类的内部留白 |
| `src/components/ProjectHeader.jsx` | 删 | 不再被引用 |
| `src/App.jsx` | 改 | `useLocation` 检测 `/projects/:slug`,跳过 Navbar;`main` 在该路由下不加 `max-w-5xl` |
| `CLAUDE.md` | 改 | 规则 11 描述改为「iframe 100vh 全屏,作者自负责样式」 |
| `tests/html.test.js` | 新建 | `Html` 组件单测:验证完整文档与片段都走 iframe、片段含最小文档包装 |
| `tests/project-detail.test.js` | 新建 | 验证 `/projects/_sample` 路由下 Navbar 不渲染、详情页含 iframe + 返回链接 |

---

## Task 1: 给 `Html` 组件加测试(TDD 红色阶段)

**Files:**
- Create: `tests/html.test.js`

- [ ] **Step 1: 写测试文件**

新建 `tests/html.test.js`:

```js
// Html 组件单测：完整文档与 HTML 片段都走 iframe srcDoc
// 片段会被包成最小文档 <!doctype html><html>...<body>...</body></html>
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Html from '../src/lib/html.jsx';

describe('Html component', () => {
  it('renders an iframe for a full HTML document', () => {
    const doc = '<!doctype html><html><body><p>hello</p></body></html>';
    const { container } = render(<Html html={doc} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute('srcDoc')).toBe(doc);
  });

  it('wraps an HTML fragment in a minimal document for srcDoc', () => {
    const fragment = '<section><p>片段内容</p></section>';
    const { container } = render(<Html html={fragment} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcDoc');
    expect(srcDoc).toContain('<!doctype html>');
    expect(srcDoc).toContain('<body>');
    expect(srcDoc).toContain('片段内容');
  });

  it('applies fullscreen classes to the iframe', () => {
    const { container } = render(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/w-full/);
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.className).toMatch(/border-0/);
  });

  it('uses a sandbox that allows scripts and same-origin', () => {
    const { container } = render(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test -- tests/html.test.js
```

Expected: FAIL — 4 个 it 全部失败。当前 `Html` 组件对片段走 `dangerouslySetInnerHTML`(没 iframe),完整文档虽然走 iframe 但类名是 `min-h-[80vh]`(不是 `h-screen`)。

- [ ] **Step 3: 暂不提交(待 Task 2 完成后一起提交)**

---

## Task 2: 重构 `Html` 组件为统一 iframe 路径(TDD 绿色阶段)

**Files:**
- Modify: `src/lib/html.jsx` (重写整个文件)

- [ ] **Step 1: 重写组件**

用以下内容完全覆盖 `src/lib/html.jsx`:

```jsx
// 渲染项目详情正文：统一走 iframe srcDoc。
// - 完整 HTML 文档（首部为 <!doctype> 或 <html>）：直接塞进 srcDoc
// - HTML 片段：包成最小文档（<!doctype html><html><head><meta ...><meta ...></head><body>...</body></html>），
//   这样片段也走独立视口，不再继承宿主页面的 Tailwind/字体栈
// 两种形态视觉一致：iframe 严格 100vh、无边框、占满 viewport。
// 作者对自己写的 HTML 负责，组件不做清洗。
export default function Html({ html }) {
  const head = (html || '').trim().toLowerCase();
  const isFullDocument = head.startsWith('<!doctype') || head.startsWith('<html');

  const srcDoc = isFullDocument
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html || ''}</body></html>`;

  return (
    <iframe
      srcDoc={srcDoc}
      title="Project detail"
      className="w-full h-screen border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
```

- [ ] **Step 2: 运行测试确认通过**

```bash
npm test -- tests/html.test.js
```

Expected: PASS — 4 个 it 全部通过。

- [ ] **Step 3: 跑全套测试确认未破坏现有项目测试**

```bash
npm test
```

Expected: `tests/projects.test.js` 三个 it 仍通过(它只断言 `findProjectBySlug` 返回值,跟 `Html` 无关)。

- [ ] **Step 4: 提交**

```bash
git add tests/html.test.js src/lib/html.jsx
git commit -m "refactor(html): unify iframe path; wrap fragments as minimal doc"
```

---

## Task 3: 改 `ProjectDetail.jsx` 移除 ProjectHeader,加悬浮返回按钮

**Files:**
- Modify: `src/pages/ProjectDetail.jsx` (重写整个文件)

- [ ] **Step 1: 重写组件**

用以下内容完全覆盖 `src/pages/ProjectDetail.jsx`:

```jsx
// 项目详情：URL :slug → 查项目，渲染悬浮「返回项目列表」按钮 + 100vh iframe。
// Navbar 在 App.jsx 的路由级逻辑下隐藏，详情页 viewport 完全让给 iframe。
// 找不到 slug 时 <Navigate replace /> 跳回 /projects。
import { useParams, Link, Navigate } from 'react-router-dom';
import { findProjectBySlug } from '../lib/projects.js';
import Html from '../lib/html.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = findProjectBySlug(slug);
  usePageTitle(project?.name || '未找到项目');

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <>
      <Link
        to="/projects"
        className="fixed top-4 left-4 z-50 inline-flex items-center
                   px-3 py-1.5 rounded-md text-sm
                   bg-brand-dark/70 text-brand-light
                   border border-brand-mid/30
                   backdrop-blur-sm
                   hover:bg-brand-dark/90 hover:border-brand-orange/60
                   transition-colors"
      >
        ← 返回项目列表
      </Link>
      <Html html={project.content} />
    </>
  );
}
```

- [ ] **Step 2: 跑构建确认无 TypeScript/JSX 报错**

```bash
npm run build
```

Expected: 成功,无报错。

- [ ] **Step 3: 跑测试确认现有项目测试仍通过**

```bash
npm test
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/pages/ProjectDetail.jsx
git commit -m "refactor(project-detail): drop ProjectHeader, add floating back button"
```

---

## Task 4: 删除 `ProjectHeader.jsx`

**Files:**
- Delete: `src/components/ProjectHeader.jsx`

- [ ] **Step 1: 删除文件**

```bash
rm src/components/ProjectHeader.jsx
```

- [ ] **Step 2: 跑构建确认无悬空 import**

```bash
npm run build
```

Expected: 成功,无 `ProjectHeader` 相关报错(Vite 会报「找不到模块」)。

- [ ] **Step 3: 跑测试确认无影响**

```bash
npm test
```

Expected: PASS。

- [ ] **Step 4: 全仓搜一次确认没有别的引用**

```bash
grep -rn "ProjectHeader" src/ tests/ 2>/dev/null || echo "no references"
```

Expected: 打印 `no references`。

- [ ] **Step 5: 提交**

```bash
git add -u src/components/ProjectHeader.jsx
git commit -m "chore(project-detail): remove obsolete ProjectHeader component"
```

---

## Task 5: 改 `App.jsx` 在 `/projects/:slug` 路由下隐藏 Navbar

**Files:**
- Modify: `src/App.jsx` (重写整个文件)

- [ ] **Step 1: 重写 App**

用以下内容完全覆盖 `src/App.jsx`:

```jsx
// 全局布局：路由级 Navbar 显隐。
// 当 pathname 匹配 /projects/<slug> 时（详情页），跳过 <Navbar /> 并去掉 <main> 的
// max-w-5xl / padding 约束，把 viewport 完全让给 100vh iframe。
// 其余路由继续走 Navbar + <main> + <Footer />。
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Articles from './pages/Articles.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Skills from './pages/Skills.jsx';
import Tools from './pages/Tools.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PageTransition from './components/PageTransition.jsx';

export default function App() {
  const location = useLocation();
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);

  return (
    <HashRouter>
      {!isProjectDetail && <Navbar />}
      <main className={isProjectDetail ? '' : 'max-w-5xl mx-auto px-6 py-8'}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/articles" replace />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/category/:category" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
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

- [ ] **Step 2: 跑构建**

```bash
npm run build
```

Expected: 成功。

- [ ] **Step 3: 跑测试**

```bash
npm test
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/App.jsx
git commit -m "feat(app): hide Navbar and main padding on /projects/:slug"
```

---

## Task 6: 更新 `CLAUDE.md` 规则 11

**Files:**
- Modify: `CLAUDE.md` (规则 11 那一段)

- [ ] **Step 1: 读 CLAUDE.md 当前规则 11**

打开 `CLAUDE.md`,定位到第 11 条规则,原文是:

```
11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .html 文件放入 `projects/`(**可以是一个完整 HTML 文档**——含 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装、内联 `<style>` / `<script>`、自定义字体与 CSS 变量,由 `src/lib/html.jsx` 的 iframe + srcDoc 路径独立解析;**也可以是一个 HTML 片段**——单个根元素,由宿主页面的 Tailwind / 字体栈继承样式,由 dangerouslySetInnerHTML 路径注入;**项目详情页(`/projects/:slug` 的正文)按原样呈现作者写的 HTML**——色值/字体/排版/动效/脚本都由源文件决定,无需套用全站 `brand-*` 品牌色规范,目的是保留每个项目自己的视觉风格);...
```

- [ ] **Step 2: 替换为新版本**

用以下内容替换规则 11 中**项目详情渲染描述**部分(从「(a) 把 .html 文件放入 ...」之后、「`(b) 在 src/data/projects.js 中加一行 import ...`」之前):

```
11. 项目源文件存放在项目根目录的 `projects/` 文件夹下;每新增一个项目,必须同时:(a) 把 .html 文件放入 `projects/`(**可以是一个完整 HTML 文档**——含 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装、内联 `<style>` / `<script>`、自定义字体与 CSS 变量;**也可以是一个 HTML 片段**——单个根元素,`src/lib/html.jsx` 会自动包成最小文档(只补 `<!doctype>` / `<html>` / `<head>` / `<body>` 包装))。**项目详情页(`/projects/:slug`)统一为 100vh 全屏 iframe**(`<iframe className="w-full h-screen border-0" srcDoc={...} sandbox="allow-scripts allow-same-origin" />`),项目 HTML 文档按作者原样渲染;该路由下全局 `<Navbar />` 隐藏,详情页顶部仅保留一个固定定位的「← 返回项目列表」悬浮按钮,**不**再渲染 `ProjectHeader`(项目名/描述/技术栈/链接)。`Html` 组件**不做事后消毒**,作者对自己写的内容负责;项目 HTML 内部若用了 `text-brand-light` 等 brand-* 类,在独立 iframe 视口里**不会生效**(Tailwind 类没引入),作者需在 HTML 内部自己补全样式;...
```

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs(guidelines): update rule 11 to reflect fullscreen iframe detail page"
```

---

## Task 7: 端到端浏览器验证

**Files:** 无(仅验证)

- [ ] **Step 1: 启动 dev server(后台运行)**

```bash
npm run dev
```

在工具调用层面使用 `run_in_background: true`,让 dev server 在后台运行。

- [ ] **Step 2: 访问项目列表页**

打开 `http://localhost:5173/projects`(端口以 Vite 输出为准),确认:
- Navbar(极客熊猫 / 文章 / 项目 / 技能 / 工具 / 关于)正常显示
- 卡片网格不变
- 卡片仍可点击

- [ ] **Step 3: 访问 `showcase` 详情页**

打开 `http://localhost:5173/projects/showcase`,逐项核对:
- [ ] Navbar **不显示**
- [ ] `<main>` 容器没有 max-w-5xl 居中约束(iframe 从屏幕左到右、从顶到底占满)
- [ ] iframe 高度 = 100vh
- [ ] 左上角悬浮「← 返回项目列表」按钮可见(半透明背景)
- [ ] 点击按钮跳回 `/projects`,Navbar 恢复
- [ ] showcase.html 内部的墨韵设计、自定义字体、视差/reveal 动效按源文件呈现
- [ ] 浏览器 DevTools Console 无 React/Hydration 报错

- [ ] **Step 4: 访问 `_sample` 详情页**

打开 `http://localhost:5173/projects/_sample`,逐项核对:
- [ ] Navbar 不显示
- [ ] iframe 100vh 全屏
- [ ] 悬浮返回按钮可见、可点
- [ ] 接受:_sample.html 内部使用的 `text-brand-light` / `text-brand-orange` 等 brand 类在独立 iframe 中**不生效**(无 Tailwind),视觉上文字会无色/无样式 — 这是预期行为(spec 写明)

- [ ] **Step 5: 验证未找到 slug**

打开 `http://localhost:5173/projects/non-existent`,确认跳回 `/projects`。

- [ ] **Step 6: 验证路由切换**

- 起点 `/articles`:Navbar 正常
- 切到 `/articles/<某 slug>`:Navbar 正常
- 切到 `/projects/showcase`:Navbar **消失**
- 切回 `/projects`:Navbar 恢复
- 浏览器前进/后退按钮:Navbar 显隐同步切换

- [ ] **Step 7: 验证文章页未受影响**

打开 `/articles` 任一文章,确认 markdown 渲染、行内 code、代码高亮、字体回退等行为不变。

- [ ] **Step 8: 停止 dev server**

```bash
pkill -f "vite" || true
```

---

## Task 8: 追加实施记录到 spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-06-project-detail-fullscreen-redesign-design.md`

- [ ] **Step 1: 在文末追加实施记录**

把 spec 文件末尾(`## 文档同步` 小节之前)追加:

```markdown
## 实施记录

- 2026-06-06: 完成 Task 1–8
- [ ] `npm run build` 成功(已确认)
- [ ] `npm test` 全部通过(已确认)
- [ ] `/projects/showcase` 100vh iframe + 悬浮返回按钮 + Navbar 隐藏(已确认)
- [ ] `/projects/_sample` 走片段包装路径(已确认)
- [ ] 路由切换 Navbar 显隐同步(已确认)
- [ ] 文章页 markdown 渲染未受影响(已确认)
```

把每条 `[ ]` 改为 `[x]` 留作实施时的现场记录。

- [ ] **Step 2: 提交**

```bash
git add docs/superpowers/specs/2026-06-06-project-detail-fullscreen-redesign-design.md
git commit -m "docs(spec): record implementation verification for fullscreen project detail"
```

---

## 完成标准

- [ ] 8 个 Task 全部完成
- [ ] 8 个 commit 已落到 main 分支
- [ ] `npm test` 全部通过(含新增的 `tests/html.test.js` 4 个 it)
- [ ] `npm run build` 成功
- [ ] `/projects/showcase` 100vh iframe + 悬浮返回按钮 + Navbar 隐藏
- [ ] `/projects/_sample` 走片段包装路径
- [ ] 路由切换 Navbar 显隐正确
- [ ] 文章页 markdown 渲染未受影响
- [ ] `CLAUDE.md` 规则 11 已更新
- [ ] spec 文档的「实施记录」小节已勾选
- [ ] `src/components/ProjectHeader.jsx` 文件已删除
- [ ] 全仓 `grep ProjectHeader` 无引用残留
