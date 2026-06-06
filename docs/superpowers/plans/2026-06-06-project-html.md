# 项目页签改用 HTML 渲染 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把项目详情页的正文从 markdown 切换为 HTML 片段，HTML 内联 Tailwind 类名，遵循品牌组件目录。`react-markdown` 仍被文章页使用，不卸载。

**Architecture:** 保留 `?raw` 导入 + `content` 字段的数据流；用 `src/lib/html.jsx`（7 行 `dangerouslySetInnerHTML` 包装）替换 `Markdown` 组件；Tailwind 配置增加 `projects/**/*.html` 扫描路径，让 HTML 里的类名进入产物 CSS。

**Tech Stack:** React 18 + Vite + Tailwind 3 + Vitest + lucide-react（无新增依赖）

**Spec:** `docs/superpowers/specs/2026-06-06-project-html-design.md`

---

## 文件结构

| 文件 | 动作 | 职责 |
|---|---|---|
| `tailwind.config.js` | 改 | content 数组新增 `projects/**/*.html` 扫描 |
| `src/lib/html.jsx` | 新建 | dangerouslySetInnerHTML 包装组件 |
| `src/pages/ProjectDetail.jsx` | 改 | `Markdown` → `Html` 组件替换 |
| `src/data/projects.js` | 改 | import 从 `_sample.md?raw` 改为 `_sample.html?raw` |
| `tests/projects.test.js` | 改 | 断言从 `# 示例项目` 改为 HTML 内容特征串 |
| `projects/_sample.html` | 新建 | 演示品牌组件目录的示例 |
| `projects/_sample.md` | 删 | 由 `_sample.html` 取代 |

`src/lib/markdown.jsx` 和 `react-markdown` / `remark-gfm` / `rehype-highlight` 依赖保持不动（仍被文章页使用）。

---

## Task 1: 更新 Tailwind 扫描路径

**Files:**
- Modify: `tailwind.config.js:7`

- [ ] **Step 1: 修改 content 数组**

打开 `tailwind.config.js`，把第 7 行
```js
  content: ['./index.html', './src/**/*.{js,jsx}'],
```
改为
```js
  content: ['./index.html', './src/**/*.{js,jsx}', './projects/**/*.html'],
```

- [ ] **Step 2: 提交**

```bash
git add tailwind.config.js
git commit -m "build(tailwind): scan projects/**/*.html for class names"
```

---

## Task 2: 新建 Html 组件

**Files:**
- Create: `src/lib/html.jsx`

- [ ] **Step 1: 写组件文件**

新建 `src/lib/html.jsx`：
```jsx
// 渲染项目详情正文：纯 HTML 片段直接注入。
// 内容由作者控制（projects/<slug>.html），不做消毒。
export default function Html({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/lib/html.jsx
git commit -m "feat(html): add Html component for raw HTML fragment rendering"
```

---

## Task 3: 更新测试断言（TDD 红色阶段）

**Files:**
- Modify: `tests/projects.test.js:16`

- [ ] **Step 1: 改断言匹配新的 HTML 内容**

把 `tests/projects.test.js` 第 16 行
```js
    expect(project.content).toContain('# 示例项目');
```
改为
```js
    expect(project.content).toContain('项目概览');
```

这是新的特征串：示例 HTML 会有 `<h2 ...>项目概览</h2>`。

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test
```

Expected: FAIL — `tests/projects.test.js` 的第二个 it 报错 "expected ... to contain '项目概览'"。当前 `project.content` 还是 `.md` 文本。

- [ ] **Step 3: 暂不提交（待 Task 4 完成后一起提交）**

---

## Task 4: 创建示例 `_sample.html`（TDD 绿色阶段）

**Files:**
- Create: `projects/_sample.html`

- [ ] **Step 1: 写示例文件**

新建 `projects/_sample.html`，用品牌组件目录写一段覆盖至少 8 个模式：

```html
<section class="space-y-6 text-brand-light/90 leading-relaxed">
  <h2 class="text-2xl font-[Poppins] font-bold text-brand-light mt-8 mb-3">项目概览</h2>
  <p>
    这是一个<strong class="text-brand-orange">示例项目</strong>，
    用来演示项目详情页如何用
    <code class="text-brand-orange bg-brand-surface px-1.5 py-0.5 rounded text-sm">HTML</code>
    片段展示富内容。
  </p>

  <h3 class="text-xl font-[Poppins] font-semibold text-brand-light mt-6 mb-2">核心特性</h3>
  <div class="grid sm:grid-cols-2 gap-4 my-4">
    <div class="bg-brand-surface border border-brand-mid/20 rounded-xl p-5">
      <h4 class="text-brand-blue font-[Poppins] font-semibold mb-1">纯 HTML 片段</h4>
      <p class="text-sm">不写 <code class="text-brand-orange bg-brand-surface px-1.5 rounded text-xs">html/head/body</code>，直接复用全站 Tailwind 类。</p>
    </div>
    <div class="bg-brand-surface border border-brand-mid/20 rounded-xl p-5">
      <h4 class="text-brand-blue font-[Poppins] font-semibold mb-1">品牌色一致</h4>
      <p class="text-sm">所有色值走 <code class="text-brand-orange bg-brand-surface px-1.5 rounded text-xs">brand-*</code> token，零硬编码。</p>
    </div>
  </div>

  <h3 class="text-xl font-[Poppins] font-semibold text-brand-light mt-6 mb-2">代码示例</h3>
  <pre class="block bg-brand-surface border border-brand-mid/20 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono text-brand-light/90"><code>import Html from '../lib/html.jsx';

&lt;Html html={project.content} /&gt;</code></pre>

  <blockquote class="border-l-4 border-brand-orange bg-brand-surface/60 pl-4 py-2 my-4 text-brand-light/80 italic">
    这个示例项目可随时删除——只需同时移除
    <code class="text-brand-orange bg-brand-surface px-1.5 rounded text-sm">data/projects.js</code>
    里对应条目。
  </blockquote>

  <div class="bg-brand-blue/10 border border-brand-blue/30 rounded-lg p-4 my-4">
    <p>💡 <strong class="text-brand-blue">提示</strong>：HTML 源文件存放在
    <code class="text-brand-orange bg-brand-surface px-1.5 rounded text-sm">projects/</code>
    目录，<code class="text-brand-orange bg-brand-surface px-1.5 rounded text-sm">?raw</code> 导入后由
    <code class="text-brand-orange bg-brand-surface px-1.5 rounded text-sm">Html</code> 组件渲染。</p>
  </div>
</section>
```

- [ ] **Step 2: 提交 Task 3 + Task 4**

```bash
git add tests/projects.test.js projects/_sample.html
git commit -m "test+feat(projects): add _sample.html, update content assertion"
```

---

## Task 5: 更新 data 导入路径

**Files:**
- Modify: `src/data/projects.js:3`

- [ ] **Step 1: 改 import 路径**

把 `src/data/projects.js` 第 3 行
```js
import _sample from '../../projects/_sample.md?raw';
```
改为
```js
import _sample from '../../projects/_sample.html?raw';
```

- [ ] **Step 2: 跑测试验证**

```bash
npm test
```

Expected: PASS — `tests/projects.test.js` 三个 it 全部通过。注意：此时 `.md` 文件还在，所以 `findProjectBySlug('_sample')` 仍能加载 `.html`（两个文件并存不冲突，data 层只引用了 `.html`）。

- [ ] **Step 3: 提交**

```bash
git add src/data/projects.js
git commit -m "refactor(projects): import _sample.html instead of _sample.md"
```

---

## Task 6: 替换 ProjectDetail 中的渲染组件

**Files:**
- Modify: `src/pages/ProjectDetail.jsx:5,25`

- [ ] **Step 1: 替换 import**

把 `src/pages/ProjectDetail.jsx` 第 5 行
```jsx
import Markdown from '../lib/markdown.jsx';
```
改为
```jsx
import Html from '../lib/html.jsx';
```

- [ ] **Step 2: 替换组件调用**

把同文件第 25 行
```jsx
      <Markdown>{project.content}</Markdown>
```
改为
```jsx
      <Html html={project.content} />
```

- [ ] **Step 3: 跑测试 + 跑构建（无 .md 引用了）**

```bash
npm test
npm run build
```

Expected:
- `npm test`: PASS（三个 it 全过）
- `npm run build`: 成功，无报错。检查产物中是否含 `projects/_sample.html` 中用到的类（如 `text-brand-orange` `font-\[Poppins\]` 等）。这些类应已通过 Task 1 的 content 数组更新进入 Tailwind 扫描范围。

- [ ] **Step 4: 提交**

```bash
git add src/pages/ProjectDetail.jsx
git commit -m "refactor(project-detail): render project body with Html instead of Markdown"
```

---

## Task 7: 删除旧 `_sample.md`

**Files:**
- Delete: `projects/_sample.md`

- [ ] **Step 1: 删除文件**

```bash
rm projects/_sample.md
```

- [ ] **Step 2: 跑测试确认无影响**

```bash
npm test
```

Expected: PASS。`_sample.html` 已经替代它，data 层只引用 `.html`。

- [ ] **Step 3: 提交**

```bash
git add -u projects/_sample.md
git commit -m "chore(projects): remove obsolete _sample.md"
```

---

## Task 8: 端到端验证

**Files:** 无（仅验证）

- [ ] **Step 1: 启动 dev server（后台运行）**

```bash
npm run dev
```

在工具调用层面使用 `run_in_background: true`，让 dev server 在后台运行；本步完成后用后续步骤验证页面渲染。

- [ ] **Step 2: 访问项目列表页**

打开 `http://localhost:5173/projects`（端口以 Vite 输出为准），确认 `_sample` 卡片仍正常显示，标题/描述/技术栈徽章无变化。

- [ ] **Step 3: 访问项目详情页**

打开 `http://localhost:5173/projects/_sample`，逐项核对：
- [ ] 14 个品牌组件目录中**至少 8 个**在该页可见（建议覆盖：Section 容器 / H2 / H3 / 段落 / 行内 code / 卡片网格 / 单卡 / 代码块 / 引用块 / 信息提示）
- [ ] 所有色值走 `brand-*` token，无硬编码 `#xxxxxx`
- [ ] 移动端（< 640px）卡片网格坍缩为单列
- [ ] 控制台无 React/Hydration 警告

- [ ] **Step 4: 回归文章页**

打开 `http://localhost:5173/articles` 任一文章，验证 markdown 渲染、代码高亮照常工作（应不受影响，因为 `src/lib/markdown.jsx` 没动）。

- [ ] **Step 5: 停止 dev server**

```bash
# 找到 vite 进程并 kill
pkill -f "vite" || true
```

---

## Task 9: 提交最终验证记录

**Files:** 无（仅文档）

- [ ] **Step 1: 追加验证记录到 spec**

打开 `docs/superpowers/specs/2026-06-06-project-html-design.md`，在文末"验证清单"小节后追加：

```markdown
## 实施记录

- 2026-06-06: 完成 Task 1–8
- [ ] `npm run build` 成功（已确认）
- [ ] `npm test` 全部通过（已确认）
- [ ] `/projects/_sample` 视觉检查通过（已确认）
- [ ] 文章页 markdown 渲染未受影响（已确认）
```

把每条 `[ ]` 改为 `[x]` 留作实施时的现场记录。

- [ ] **Step 2: 提交**

```bash
git add docs/superpowers/specs/2026-06-06-project-html-design.md
git commit -m "docs(spec): record implementation verification for project HTML switch"
```

---

## 完成标准

- [ ] 9 个 Task 全部完成
- [ ] 9 个 commit 已落到 main 分支
- [ ] `npm test` 三个 it 全过
- [ ] `npm run build` 成功
- [ ] `/projects/_sample` 视觉覆盖至少 8 个品牌组件
- [ ] `/articles/<slug>` markdown 渲染未受影响
- [ ] spec 文档的"实施记录"小节已勾选
