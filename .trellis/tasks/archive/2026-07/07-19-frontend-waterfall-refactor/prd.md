# 前端瀑布流重构 + 删减页签 + AI 上传流程

## Goal

把当前六 tab（文章 / 项目 / 技能 / 工具 / 关于）的传统导航式博客，重构为单一瀑布流首页：
- 删除 3 个非核心页签（技能 / 工具 / 关于）及其内容维护管线；
- 把文章与项目合并到同一瀑布流，靠 `type` + `category` + `tags` 区分视觉；
- 视觉风格从「卡片网格 + 强边框」改成「极简留白 + 微动效」；
- 新增「用户给一条命令，AI 自动整理 `m.md` 并写入站点」的 AI 内容维护流程，并文档化。

## Background

- 仓库是 React 18 + Vite 5 + Tailwind 3 SPA，部署到 GitHub Pages（`base: '/blog/'`，HashRouter）。
- 颜色 token 由 `tailwind.config.js` 定义（`brand.dark/surface/light/mid/gray/orange/blue/green`），字体由 `src/index.css` 注入 Poppins + Lora。
- 现有路由：`/`、`/articles`、`/articles/category/:category`、`/articles/:slug`、`/projects`、`/projects/:slug`、`/skills`、`/tools`、`/about`、`*`（证据：`src/App.jsx`）。
- 现有内容维护路径：
  - 文章：源 HTML 放 `articles/<category>/<slug>.html`，在 `src/data/articles.js` 用 `?raw` import 并写入 metadata 数组；
  - 项目：源 HTML 放 `projects/<slug>.html`，在 `src/data/projects.js` 用 `?raw` import 并写入 metadata 数组；
  - 技能 / 工具 / 关于：Markdown 源在 `content/{技能,工具,关于}.md`，由 `src/lib/content.js` 解析为页面数据。
- 详情页统一为 100vh iframe + srcDoc，由 `src/lib/html.jsx` 的 `Html` 组件渲染；列表卡不嵌 iframe（CLAUDE.md 规则 10e）。
- 当前 `npm test` 有 11 个产品测试失败（既有基线漂移，与本次重构无关，本任务不修复）。
- 当前 `.claude/skills/*` 全部处于已删除状态（未提交），CLAUDE.md 提到的 `brand-guidelines` 等 skill 暂时不可用；本任务的重构应直接基于 `tailwind.config.js` 的 brand token 与 `src/index.css` 的字体定义，不依赖这些 skill。

## Requirements

### R1. 删减三个页签

- 永久下线 `/skills`、`/tools`、`/about` 路由及对应页面组件。
- 删除 `src/pages/Skills.jsx`、`Tools.jsx`、`About.jsx`；删除 `src/data/skills.js`、`tools.js`；删除 `src/components/SkillBar.jsx`、`ToolCard.jsx`、`TimelineItem.jsx`（如确认无其他引用）。
- 删除 `content/技能.md`、`content/工具.md`、`content/关于.md` 三个源文件。
- 删除 `src/lib/content.js` 中的 `parseSkills` / `parseTools` / `parseAbout`，保留该文件为空导出或直接删除该文件。
- **数据迁移**：技能 / 工具 / 关于的历史内容不迁移；本次直接丢弃。若作者想保留信息，需在新文章 / 项目中重新表达。
- 旧路由必须 301 / 302 重定向到 `/`，避免外链失效。

### R2. 合并文章与项目为单一内容类型

- 引入统一数据结构 `Entry`：
  ```js
  {
    slug: string,           // 全局唯一
    title: string,          // 统一为 title（原 name 也写到这里）
    excerpt: string,        // 统一为 excerpt（原 description 也写到这里）
    date: string,           // ISO 日期；项目若无显式日期，回退到文件 mtime 或 '1970-01-01'，UI 隐藏此字段
    type: 'article' | 'project',
    category: string|null,  // 仅 type==='article' 时必填，且必须在 6 个固定 slug 内
    tags: string[],         // 项目原 techStack 合并到 tags；UI 同样渲染
    cover: string|null,     // 封面图相对路径；保留 null fallback
    links: { github?, demo? }|null,  // 仅项目使用
    content: string         // 已 ?raw 导入的 HTML
  }
  ```
- 合并数据注册：保留 `src/data/articles.js` 与 `src/data/projects.js` 两个文件，**不要合并为一个文件**（避免一次性大改动且尊重现有分文件惯例），但在 `src/lib/entries.js` 提供统一查询接口 `listEntries()` / `findEntryBySlug()`，页面只调用 lib 层。
- 统一排序：所有 entry 按 `date` 降序；项目无 date 时回退到 '1970-01-01'，自然沉底。

### R3. 瀑布流首页

- 路由：`/` 即瀑布流首页；删除 `/articles`、`/projects`、`/articles/category/:category` 路由（旧路由 302 → `/`）。
- 实现方式：**CSS columns 多列布局**（Tailwind `columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6`，子元素加 `break-inside-avoid`）。不引入 masonry 第三方库，避免依赖膨胀。
- 卡片统一为新组件 `EntryCard`：
  - 顶部 type 徽章：「📝 文章」/「🛠 项目」（emoji 或 lucide icon 都可，遵守 CLAUDE.md 规则 9 优先 lucide）；
  - 封面区：有 cover 渲染图，无 cover 用 `from-brand-orange/30 via-brand-blue/20 to-brand-green/30` 渐变占位（沿用现有 ProjectCard 兜底）；
  - 标题（h3，Poppins，hover 转 brand-orange）；
  - excerpt（最多 3 行截断，`line-clamp-3`）；
  - 底部条：左 type + date（项目隐藏），右 category chip（仅文章）+ tags；
  - 整卡可点击跳详情页（参考现有 ArticleCard 的 `useNavigate` 模式）。
- 顶部 hero 区（极简）：占满视口宽度，包含站名「极客熊猫」+ 一行动态 tagline + entry 总数；tagline 从一组候选中按时间/计数切换（趣味点）；该区**不卡内容滚动**，用户往下滚就是瀑布流。

### R4. 详情页统一入口

- 新路由：`/p/:slug`（合并后的统一详情），由统一的 `<EntryDetail />` 组件渲染。
- 保留 iframe 100vh + srcDoc（CLAUDE.md 规则 10d）；现有 `src/lib/html.jsx` 的 `Html` 组件无需改动。
- 顶部固定悬浮按钮「← 返回」，点击 `navigate(-1)` 或 `navigate('/')`（后者更可预测）。
- 旧 `/articles/:slug`、`/projects/:slug` 路由 302 → `/p/:slug`，外链不失效。

### R5. 极简留白 + 微动效视觉

- 调色板**不换**，继续用 `brand-*` token；只调整用法：
  - 卡片边框从 `border-brand-mid/20` 改为极弱 `border-brand-mid/10` 或干脆无边框，用浅分割线 / 阴影区分；
  - hover 从 `hover:-translate-y-1` 减弱为 `hover:-translate-y-0.5` + 极弱 `hover:shadow-md`；
  - 页面背景维持 `brand.dark`。
- 入场动画：使用 `IntersectionObserver`（新建 `src/hooks/useReveal.js`），首次进入视口时给卡片加 `opacity-0 → opacity-100` + `translate-y-2 → 0`，过渡 400ms ease-out；只触发一次。
- 顶部 hero tagline 用 CSS keyframe 做缓慢的字符切换（或淡入淡出 4–6s 一次）。
- 不引入新动画库（framer-motion 等），保持零运行时依赖增量。

### R6. AI 内容上传流程（命令驱动）

- 用户在终端运行类似 `claude "把 m.md 整理后上传到网站"` 的命令；Claude（也就是我）执行：
  1. 读取 `m.md`；
  2. 与作者一次确认：目标类型（文章 / 项目）、分类（若文章）、slug、标题、摘要、tags；
  3. 把 Markdown 整理为符合项目风格的自包含 HTML（包含内联 `<style>`，避免依赖主站 Tailwind 编译产物）；
  4. 写入 `articles/<category>/<slug>.html` 或 `projects/<slug>.html`；
  5. 在对应 `data/*.js` 增加 `?raw` import 与 metadata 记录；
  6. 提示用户 `npm test` / `npm run build` 自检。
- 流程文档化：新建 `.trellis/spec/content/ai-upload-flow.md`，把上面 6 步沉淀为可复用清单（**本任务的 deliverable，不只是 skill**）。
- 不做：不在前端加 UI 入口；不调用任何外部 API；不引入 AI 调用库。

### R7. 内容维护硬约束（继承自 CLAUDE.md，必须保留）

- 文章 6 个固定分类（`ai` / `python` / `engineering` / `product` / `notes` / `resources`）不变，定义在 `src/data/categories.js`，UI 显示名也由此处控制。
- 文章源文件必须 `articles/<category>/<slug>.html`，import 路径必须带子目录。
- 详情页是 100vh iframe；列表卡不嵌 iframe；iframe 内样式作者自己写。
- `brand-*` 类在 iframe 内不生效，作者需在 HTML 中自带 `<style>`。
- 仍遵守 CLAUDE.md 规则 1–9（路由三处同步、`.jsx` 后缀、`?raw` import、lucide-react 统一图标、`useEffect` 改 title、不用 react-router BrowserRouter 等）。

## Acceptance Criteria

- [ ] 访问 `/` 直接渲染瀑布流首页，无需跳转。
- [ ] `/articles`、`/projects`、`/articles/category/:cat`、`/skills`、`/tools`、`/about` 都被 302 重定向到 `/`。
- [ ] 详情路由统一为 `/p/:slug`；`/articles/:slug` 和 `/projects/:slug` 重定向到 `/p/:slug`。
- [ ] 详情页是 100vh iframe（`<iframe className="w-full h-screen border-0" srcDoc={...} sandbox="..." />`），全局 Navbar / Footer 隐藏，顶部仅一个固定「← 返回」按钮。
- [ ] 6 个固定文章分类仍然有效；UI 上展示对应中文 chip；新增文章仍可在 `articles/<category>/` 落盘。
- [ ] 瀑布流用 CSS columns 实现，移动 1 列 / 平板 2 列 / 桌面 3–4 列，子元素不被打断。
- [ ] `EntryCard` 视觉统一；type 徽章 + category chip + tags 区分内容来源；hover 微动效克制。
- [ ] 删除 `/skills`、`/tools`、`/about` 三个页面、`src/data/skills.js`、`tools.js`、`content/{技能,工具,关于}.md`、`parseSkills` / `parseTools` / `parseAbout`。
- [ ] 新建 `.trellis/spec/content/ai-upload-flow.md`，描述 6 步 AI 上传流程。
- [ ] `npm run build` 通过；既有测试套件调整后通过；既有 11 个失败测试不扩大（不修复，也不多挂）。
- [ ] CLAUDE.md 规则 1–9、10–12 在改动后仍全部成立。

## Out of Scope

- 引入 Tailwind 之外的 CSS 框架 / 动画库 / masonry 库。
- 改 brand 调色板或字体。
- 增加后端 / API / 第三方 AI 调用。
- 不修改既有 11 个失败的产品测试（基线漂移，另起任务）。
- 不在内容 / 数据中保留技能 / 工具 / 关于的历史信息。
- 不做暗 / 亮主题切换。
- 不改部署流程与 `vite.config.js` 的 `base`。

## Open Questions（实施前必须解决）

1. **项目的 date 字段**：UI 是否完全不显示项目的「日期」，还是显示「加入时间」由文件 mtime 推导？（默认方案：UI 隐藏，但仍写入 ISO 日期用于排序）。
2. **首页 hero tagline 的文案**：作者希望展示什么？默认方案：「一个极简博客 · {N} 篇内容」+ 一行动态附言（如「持续记录 AI 与工程心得」），按 entry 数增长触发附言微调。
3. **是否给项目也分配 category**：默认方案：**不分配**。项目没有分类概念，UI 不显示 category chip；筛选也只按文章 category（瀑布流首版不做筛选 UI，单纯全部展示）。