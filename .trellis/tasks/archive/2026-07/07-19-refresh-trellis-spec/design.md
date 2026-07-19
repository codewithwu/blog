# Technical Design — 刷新 Trellis 项目规范

## 1. Design objective

把当前模板化、串入上游 Trellis CLI 规则的 `.trellis/spec/`，替换为面向本仓库两类真实维护边界的规范：

1. **Frontend application**：React/Vite SPA 的路由、组件、样式、数据读取、HTML 详情渲染与质量验证。
2. **Content maintenance**：文章、项目、技能、工具和关于内容的源文件格式、注册契约，以及已跟踪项目本地技能对这些契约的维护方式。

规范以中文编写，匹配仓库的 `CLAUDE.md`、README、源码注释和主要内容语言；路径、符号与命令保持原样。

## 2. Evidence and precedence model

当文档互相冲突时，按以下优先级决定规范内容：

1. `CLAUDE.md` 的强制规则。
2. 当前运行时源码与配置。
3. 当前测试体现的预期契约；若测试与源码/数据明显漂移，则标记为基线问题，不能反向把过时断言写成规范。
4. `README.md`、`code_map.md` 与历史设计文档。
5. `.claude/skills/*/SKILL.md` 中与当前源码一致的项目自动化约定。

这套优先级用于处理已发现的漂移：例如 `create-project/SKILL.md` 仍描述 fragment 走 `dangerouslySetInnerHTML` 和不存在的 `ProjectHeader.jsx`，而当前 `src/lib/html.jsx` 已明确让完整文档与 fragment 都进入 iframe；最终规范必须采用源码与 `CLAUDE.md` 的现行合同，并把“不要复制过时技能说明”列为反模式。

## 3. Target spec tree

```text
.trellis/spec/
├── index.md
├── frontend/
│   ├── index.md
│   ├── architecture-and-routing.md
│   ├── component-and-style-guidelines.md
│   ├── data-and-rendering.md
│   └── testing-and-quality.md
└── content/
    ├── index.md
    ├── source-formats.md
    └── maintenance-workflows.md
```

### 3.1 Files removed or replaced

- 删除模板主题：`directory-structure.md`、`component-guidelines.md`、`hook-guidelines.md`、`state-management.md`、`type-safety.md`、旧 `quality-guidelines.md`。
- 删除整个 `guides/`：其中 Python、TypeScript event log、Trellis CLI template sync、API/service/database 等规则不属于本仓库，且包含重复段落。
- 用四份聚焦文档重建 `frontend/`；用两份文档新增 `content/`；增加根索引。

独立的 hook、state、type-safety 文件不保留，原因是项目只有一个 `usePageTitle` hook、没有全局状态库/服务端状态、使用 JavaScript 而非 TypeScript。相关真实规则分别并入架构和质量规范，避免用空文件制造虚假边界。

## 4. Spec ownership boundaries

### 4.1 `frontend/architecture-and-routing.md`

负责：
- 单包 Vite SPA 启动链路与目录职责。
- `HashRouter`、`base: '/blog/'`、`AppShell` 和 route-level layout。
- 新路由三处同步规则、`.jsx`/`.js`/`?raw` 后缀规则。
- URL 状态、模块级静态数据和页面局部派生值的现有状态模型。
- `usePageTitle` 的 `useEffect` 合同。

主要证据：`src/main.jsx`、`src/App.jsx`、`src/components/Navbar.jsx`、`src/hooks/usePageTitle.js`、`vite.config.js`。

### 4.2 `frontend/component-and-style-guidelines.md`

负责：
- 函数组件、props 解构、页面组合与小组件职责。
- Tailwind `brand-*` token、Poppins/Lora、响应式 grid、hover/focus 状态。
- lucide-react 统一图标约束和动态图标 fallback。
- 当前可访问性模式：语义链接、`aria-current`、键盘 Enter、iframe title、外链属性。
- 注释密度与中文注释约定。

主要证据：`src/components/*.jsx`、`src/pages/*.jsx`、`src/index.css`、`tailwind.config.js`、`brand-guidelines/SKILL.md`。

### 4.3 `frontend/data-and-rendering.md`

负责：
- `source → ?raw import/data registry → lib query/parser → page/component` 数据流。
- 文章/项目 metadata 形状、排序/查找行为、固定分类单一来源。
- `content/*.md` 解析边界。
- `Html` 统一 iframe 详情合同、fragment 包装、base 注入、sandbox、信任模型和样式隔离。
- 列表卡与详情 iframe 的视觉边界。

主要证据：`src/data/*`、`src/lib/*`、`src/pages/*Detail.jsx`、`CLAUDE.md` 规则 10-12。

### 4.4 `frontend/testing-and-quality.md`

负责：
- Vitest/jsdom/@testing-library 的本地测试模式。
- 查询/解析器纯函数测试、详情页 MemoryRouter 测试、iframe 属性断言。
- `npm test` 与 `npm run build` 验证门槛。
- 已知基线漂移必须如实报告；不能因为本任务只改规范而宣称测试全绿。
- 改动类型到验证范围的映射。

主要证据：`package.json`、`vite.config.js`、`tests/*`、`.github/workflows/deploy.yml`。

### 4.5 `content/source-formats.md`

负责：
- `articles/<category>/<slug>.html`、`projects/<slug>.html`、`content/*.md` 的格式契约。
- 文章六类固定 slug、全局唯一 slug、metadata 与路径一致性。
- 技能/工具/关于 Markdown parser 可接受的精确形状。
- 图片相对路径、iframe 内自带样式、技能等级三档。

主要证据：`CLAUDE.md`、实际内容文件、`src/lib/content.js`、`src/data/*`。

### 4.6 `content/maintenance-workflows.md`

负责：
- 正常发布/删除需同步“源文件 + raw import + metadata”；内容页只改源 Markdown。
- 草稿区与发布区边界。
- 已跟踪 8 个项目本地 skill 的职责矩阵、预检查、确认、实施、验证原则。
- 自动化文档更新时必须对照当前源码，避免技能说明漂移。
- 破坏性操作必须先确认；正常数据驱动内容变更不应修改 JSX。

主要证据：已跟踪 `.claude/skills/*/SKILL.md`、`README.md`、`CLAUDE.md`、数据注册文件。

## 5. Cross-document contracts

为避免重复和矛盾：

- `frontend/data-and-rendering.md` 拥有**运行时如何消费数据**；`content/source-formats.md` 拥有**作者应提供什么格式**；`content/maintenance-workflows.md` 拥有**如何安全改变这些输入**。
- `frontend/component-and-style-guidelines.md` 拥有主站品牌层；`content/source-formats.md` 只说明 iframe 不继承主站 CSS，作者 HTML 必须自带样式。
- `frontend/testing-and-quality.md` 拥有通用验证；内容文档只列内容专属完整性检查并链接质量规范。
- `CLAUDE.md` 的强制规则以摘要和路径引用呈现，不整段复制，避免未来双重维护。

## 6. Compatibility and migration

- 规范文件路径会变化，因此根、frontend、content 三个 `index.md` 必须成为唯一导航入口，并只指向实际存在文件。
- 当前 `.trellis/spec/` 是未提交工作区的一部分；实施前后用精确路径限制写入，不操作其他 `.trellis/` 文件。
- 删除旧 `guides/` 不影响运行时或构建；它们只包含指导文档。
- 不修复本次发现的产品测试和本地技能漂移；规范会记录“源码优先”和已知基线，后续应另建任务修复。

## 7. Trade-offs

- **选择少量聚焦文件而非按模板逐一填充**：减少重复，符合小型单包项目；代价是 hook/state/type 不再有独立入口，但真实规则仍在架构/质量文档中可查。
- **纳入 tracked local skills，但排除 untracked Trellis infrastructure**：覆盖项目核心自然语言维护能力，同时避免把当前用户未提交的工作流安装细节误写成产品规范。
- **记录当前失败测试，而不修复**：保持本任务边界和结果诚实；代价是最终测试仍会红，需要后续独立修复。

## 8. Rollback

规范没有运行时副作用。若重塑结果不符合预期，回滚方式是恢复 `.trellis/spec/` 在本任务开始时的 10 个文件；不得用仓库级 hard reset，以免损坏用户现有未提交改动。实施过程中每个目录独立完成并在进入下一目录前检查索引，减少半成品范围。
