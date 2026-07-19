# Design: blog-content-publisher skill

## Context

本仓库已是 Trellis 管理的 React/Vite 博客，具备统一 Entry 数据模型、`content/<slug>.html` 内容目录、`?raw` registry 导入和 iframe 详情页。但没有可由自然语言自动触发的“上传内容”技能。本设计的目标是在**不新增运行时依赖、不改动现有产品组件**的前提下，把 `.trellis/spec/content/ai-upload-flow.md` 等规范固化成一个可触发、可评测的项目本地技能，并用仓库根目录的两个真实文件完成端到端验证。

## Non-Goals

- 不为站点增加任何上传/编辑 UI。
- 不调用外部 API 或 AI 服务做内容转换。
- 不迁移已下线的技能/工具/关于历史内容或 parser。
- 不为 `package.json` 增加 Markdown 解析依赖。
- 不自动 commit / push。

## Data Flow

### Markdown 流

```text
<source>.md
  │  读取并解析 frontmatter / H1 / 正文结构
  ▼
移除 frontmatter → 保留正文语义
  │  技能按模板把 Markdown 元素转成 HTML 标记
  ▼
放入 references/markdown-template.html
  │  输出自包含完整文档（含 viewport、品牌色、字体、
  │  h1/h2/h3/p/pre/table/blockquote/a 样式）
  ▼
content/<slug>.html
  │  Vite ?raw import
  ▼
src/data/articles.js [?raw import + metadata]
  │  entries.js listEntries / findEntryBySlug
  ▼
/ 瀑布流首页卡片    /p/<slug> iframe 详情页
```

### HTML 流

```text
<source>.html
  │  不解析、不重写、不预注入 <base>
  │  逐字节复制
  ▼
content/<slug>.html
  │  cmp -s 校验逐字节一致
  │  Vite ?raw import
  ▼
src/data/{articles,projects}.js [?raw import + metadata]
  │  与 Markdown 流相同的下游
  ▼
/ + /p/<slug>
```

## Skill Architecture

```
.claude/skills/blog-content-publisher/
├── SKILL.md                       # frontmatter + 触发/执行说明
├── references/
│   └── markdown-template.html     # 品牌色 + 响应式 + 常用元素样式
└── evals/
    └── evals.json                 # 真实用例 + 负例
```

### 关键设计点

1. **触发**：`description` 同时覆盖中英触发表达，并显式排除近似负例（仅阅读、仅编辑、仅删除、仅部署）。
2. **权威来源先行**：技能先读 `CLAUDE.md` + `.trellis/spec/content/{ai-upload-flow,source-formats,maintenance-workflows}.md` 再动手。
3. **一次确认**：所有目标的 metadata 在同一轮确认；任何不一致停止，不自动修复。
4. **原子一致性**：每条 Entry（HTML + import + metadata）成套创建/回滚。
5. **HTML 原样复制**：`cp` + `cmp -s` 校验，不防注入 `<base>`（运行时由 `src/lib/html.jsx` 负责）。
6. **Markdown 模板化**：品牌色（`#141413`/`#faf9f5`/`#b0aea5`/`#d97757`）、Poppins/Lora 字体兜底、`max-width:720px` 响应式主体、表格/引用/代码/link 样式；iframe 不继承主站 Tailwind，因此模板自带样式。
7. **批量策略**：先一次确认全部 metadata，再逐条实施；遇首个不可安全解决的问题立即停止，报告 completed/incomplete，不 hard reset。

## Contracts / APIs / State

- `Entry` 字段：`slug,title,excerpt,date,type,category,tags,cover,links,content`。
- 文章：`type:'article'`、`category` 为 `categories.js` 6 个固定 slug 之一、`links:null`。
- 项目：`type:'project'`、`category:null`、`links:{github,demo}`。
- `content/<slug>.html` 扁平存放；分类只记 metadata；slug 跨 articles/projects 全局唯一、kebab-case ASCII。
- `Html` 在 iframe `srcDoc` 中注入 `<base href="about:srcdoc">`（锚点到父页导致 React Router 404 的已知修复）；sandbox 固定 `allow-scripts allow-popups allow-forms`，不含 `allow-same-origin`。
- 产品逻辑不动：Home / EntryDetail / EntryCard / entries.js / Html / categories.js。

## Tradeoffs / Compatibility

- **技能驱动 Markdown 转换 vs 运行时解析**：项目当前无 Markdown 解析依赖，也不应为发布流程新增。技能基于模板做一次性转换最轻，符合“内容由作者/技能负责浏览器可读 HTML”的现有合同。
- **模板统一品牌 vs 作者自定义风格**：Markdown 是“作者仅给正文”的输入，套用品牌模板是合理默认；HTML 输入本就由作者控制视觉，技能必须原样保留。
- **评测隔离 vs 真实隔离**：with-skill 与 baseline 输出进 sibling workspace，仅在真实发布阶段写入仓库，避免把实验产物混入产品 diff。

## Verification

- 自动：官方 skill 快速校验；评测断言与 benchmark；`registry.test.js`；`npm test` 不新增失败；`npm run build`；`cmp -s` HTML 校验。
- 真实页面（项目 run/verify 能力）：`/` 卡片分类/日期/摘要/标签/排序正确；`/p/agent-tool-all-at-once` 完整 Markdown 结构且无 frontmatter；`/p/intimate-relationship-curve` 保留 CSS/SVG/动画/tooltip；桌面/移动可读，Google Fonts 不可用时兜底。

## Rollback Shape

- **单条发布回滚**：精确移除该 Entry 的 `content/<slug>.html`、对应 registry 的 `?raw` import、metadata 记录；不仓库级 reset。
- **覆盖保护**：`content/<slug>.html` 已存在或来源变化时，必须重新确认再覆盖。
- **失败部分状态**：停止 → 报告 completed/incomplete → 精确回退本次已知改动 → 不再继续批处理。
