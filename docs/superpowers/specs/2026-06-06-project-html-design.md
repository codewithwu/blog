# 项目页签改用 HTML 渲染 — 设计文档

**日期**: 2026-06-06
**状态**: 已批准，待实现
**作用范围**: 项目详情页 (`/projects/:slug`)；不影响文章页、列表页、其他页签

## 背景

项目详情页目前用 markdown 渲染项目正文（`projects/<slug>.md` → `react-markdown`）。markdown 表达力受限，无法承载富布局（卡片网格、按钮、提示框等）。本次改用 HTML 片段渲染，并按品牌指南统一视觉规范。

## 目标

- 项目正文从 `.md` 改为 `.html` 片段
- 复用全站 Tailwind + 品牌色 token，零硬编码色值
- 文章页继续使用 markdown，行为不变

## 非目标

- 不动文章页（`src/lib/markdown.jsx` 保留）
- 不改 `react-markdown` 等依赖（仍被文章页使用）
- 不改项目卡片列表页 (`Projects.jsx`)
- 不改路由结构

## 架构与数据流

```
projects/<slug>.html
  ↓ ?raw 导入
src/data/projects.js  (content 字段)
  ↓
ProjectDetail.jsx
  ↓
src/lib/html.jsx → <div dangerouslySetInnerHTML={{ __html }} />
```

`Markdown` 组件被替换为 `Html` 组件；HTML 字符串原样注入。**不**做 HTML 转义/清理：项目内容由作者本地控制，不接受外部输入。

## 文件改动

| 文件 | 动作 | 说明 |
|---|---|---|
| `tailwind.config.js` | 改 | `content` 数组新增 `'./projects/**/*.html'` |
| `src/lib/html.jsx` | 新建 | 7 行的 dangerouslySetInnerHTML 包装组件 |
| `src/pages/ProjectDetail.jsx` | 改 | `import Markdown` → `import Html`；`<Markdown>` → `<Html html={project.content} />` |
| `src/data/projects.js` | 改 | `import` 路径从 `projects/_sample.md?raw` 改为 `projects/_sample.html?raw` |
| `projects/_sample.md` | 删 | — |
| `projects/_sample.html` | 新建 | 用品牌组件目录演示设计系统 |

## 品牌组件目录（设计系统）

HTML 文件统一从以下 14 个模式中选择，禁止自创颜色/字体。所有色值走 `brand-*` token。

| 模式 | 用途 | Tailwind 类名 |
|---|---|---|
| Section 容器 | 章节整体 | `space-y-6 text-brand-light/90 leading-relaxed` |
| H2 标题 | 章节标题 | `text-2xl font-[Poppins] font-bold text-brand-light mt-8 mb-3` |
| H3 标题 | 子章节 | `text-xl font-[Poppins] font-semibold text-brand-light mt-6 mb-2` |
| 正文段落 | 描述文字 | `text-brand-light/90 leading-relaxed` |
| 强调链接 | 行内链接 | `text-brand-blue hover:text-brand-orange underline-offset-2 hover:underline` |
| 行内 code | 行内代码 | `text-brand-orange bg-brand-surface px-1.5 py-0.5 rounded text-sm` |
| 代码块 | 多行代码 | `block bg-brand-surface border border-brand-mid/20 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono text-brand-light/90` |
| 特性卡片 | 单卡 | `bg-brand-surface border border-brand-mid/20 rounded-xl p-5` |
| 卡片网格 | 多卡并排 | `grid sm:grid-cols-2 gap-4 my-4` |
| 引用块 | 重点强调 | `border-l-4 border-brand-orange bg-brand-surface/60 pl-4 py-2 my-4 text-brand-light/80 italic` |
| 信息提示 | 提示框 | `bg-brand-blue/10 border border-brand-blue/30 rounded-lg p-4 my-4 text-brand-light/90` |
| 按钮 CTA | 行动按钮 | `inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-brand-light hover:bg-brand-orange/90 transition` |
| 项目截图 | 配图 | `rounded-xl border border-brand-mid/20 my-4` |
| 图片标题 | figcaption | `text-sm text-brand-mid text-center mt-2` |

颜色完全来自 `tailwind.config.js` 已定义的 `brand-dark/surface/light/mid/gray/orange/blue/green`（Anthropic 品牌色）。字体走 `Poppins`（标题）+ 默认 sans（正文，与 Lora 系字体回退链一致）。

## HTML 文件形态约束

- 不写 `<html>` / `<head>` / `<body>`
- 文件根元素用 `<section class="space-y-6 ...">` 包裹，便于统一间距
- 不在 HTML 里嵌入 `<style>` 块（所有样式走 Tailwind 类）
- 内部图片用相对路径（与现有项目静态资源约定一致）

## 错误处理

- `findProjectBySlug` 未命中：保持现状 `<Navigate to="/projects" replace />`（不改）
- `?raw` 导入失败：Vite 构建期即报错（与现状行为一致）
- `dangerouslySetInnerHTML` 注入：内容由作者控制，不做清洗（信任内部输入）

## 测试

- 启动 `npm run dev` 打开 `/projects/_sample`
- 视觉检查项：所有 14 个模式在示例中至少出现 8 个
- 移动端（< 640px）单列、桌面端（≥ 640px）卡片网格 2 列
- 切换暗色品牌元素：橙色 CTA、蓝色提示框、绿色徽章（沿用 ProjectHeader 现有用法）
- 回归：`/articles/:slug` 文章页 markdown 渲染照常工作

## 验证清单

- [ ] `npm run build` 成功，`projects/**/*.html` 中的类名进入产物 CSS
- [ ] `/_sample` 页可见，无控制台错误
- [ ] 文章页（任一）md 渲染不变
- [ ] 品牌色检查：无硬编码 `#xxxxxx` 在 HTML/JSX 中
- [ ] 代码块、行内 code、引用、提示框 4 个高亮模式视觉对位

## 实施记录

- 2026-06-06: 完成 Task 1–8
- [x] `npm run build` 成功（已确认）
- [x] `npm test` 全部通过（已确认）
- [x] `/projects/_sample` 视觉检查通过（已确认）
- [x] 文章页 markdown 渲染未受影响（已确认）
