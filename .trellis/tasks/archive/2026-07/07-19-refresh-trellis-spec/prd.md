# 刷新 Trellis 项目规范

## Goal

以当前仓库的真实架构、内容工作流和重复代码模式为依据，完整刷新 `.trellis/spec/`，让后续开发者和代理能直接按项目既有约定实施与验证改动，而不是依赖通用 React 模板。

## Background

- 项目是单包、纯前端的 React 18 + Vite 5 + Tailwind CSS 3 博客与作品集，使用 HashRouter 适配 GitHub Pages；证据：`package.json`、`README.md`、`CLAUDE.md`。
- 运行时没有后端或数据库。文章和项目以 HTML 源文件维护并通过 `?raw` 注册，技能、工具和关于页以 `content/*.md` 维护；证据：`README.md:9-14`、`README.md:91-98`、`CLAUDE.md` 规则 10-12。
- 当前 `.trellis/spec/` 的 `frontend/` 六份规范仍是完整模板，占位语句为 `(To be filled by the team)`；`guides/` 则混入了与本仓库无关的 Trellis CLI、Python、事件日志和多平台模板规则，不能作为本项目规范保留。
- 真实运行时边界已由源码确认：`src/App.jsx` 负责 HashRouter、路由与全屏详情布局；`src/pages/` 组合页面；`src/components/` 提供展示组件；`src/lib/` 负责内容解析、查询和 iframe 文档包装；`src/data/` 负责静态注册；根目录 `articles/`、`projects/`、`content/` 是内容源。
- 仓库已将 8 个项目本地 `.claude/skills/` 作为自然语言内容维护入口写入 `README.md:18-34`，但当前新增的 Trellis agents/hooks/skills 属于未提交工作区内容，不是本次规范证据。
- 当前验证基线并非全绿：`npm run build` 成功但有大 chunk 警告；`npm test` 有 11 个失败，主要来自测试 fixture/断言落后于当前文章、项目、联系方式和 iframe 行为。本任务只记录真实基线，不修复这些产品测试。
- 规范刷新只针对开发指导文档，不应修改产品运行时代码或内容数据。

## Requirements

### R1. Repository-backed architecture analysis

- 检查现有 `.trellis/spec/`、包清单、构建与部署配置、顶层文档、代表性源码、测试和内容源文件。
- 识别真实的层次边界、数据流、路由约束、组件惯例、内容注册流程和验证方式。
- 重要规则必须引用真实文件路径、符号或重复模式，不能仅凭框架惯例推断。

### R2. Reshape the spec tree around real ownership boundaries

- 保留、合并、重命名、新增或删除规范文件时，以当前单包前端项目的真实查找需求为准。
- 删除不适用的模板主题、空章节和重复规则。
- `index.md` 必须与最终文件集合和职责边界一致。

### R3. Write actionable project-specific guidance

- 每个相关规范应说明适用场景、本项目采用的模式、证据文件、常见反模式及可靠的验证方式。
- 覆盖日常改动最关键的约束：React/路由与页面结构、组件和样式、静态数据与内容源、HTML iframe 详情页、文件与导入约定、测试/构建质量门槛。
- 仅在确有跨层模式时保留跨层指南，避免复制 `CLAUDE.md` 或 README 的整段内容。

### R4. Cover tracked project-local content automation

- 把已跟踪的 8 个 `.claude/skills/` 视为项目正式维护入口，记录文章、项目和三个 Markdown 页签的发布、删除、合并及品牌约束。
- 规范聚焦跨文件同步契约、输入/输出边界和验证要求，不复制各 `SKILL.md` 的逐步提示词。
- 排除当前未跟踪的 Trellis agents、hooks、commands 与 skills，它们属于工作流基础设施和用户现有未提交改动。

### R5. Preserve scope and safety

- 不修改 `src/`、`articles/`、`projects/`、`content/` 等产品源码或内容。
- 不把宿主平台专属的代理名称或命令写成通用编码规范；仅在仓库已正式标准化 `.claude/skills/` 的内容维护边界内记录项目事实。
- 不覆盖或回退用户已有的未提交改动；当前工作区在任务开始前已是 dirty 状态。

## Acceptance Criteria

- [ ] `.trellis/spec/` 描述当前仓库实际架构，不再是通用 React/TypeScript 模板。
- [ ] 每个重要规则均有源码、测试、配置或项目文档证据。
- [ ] 所有适用层次都有可执行的开发指导、反模式和验证方法。
- [ ] 已跟踪项目本地技能的跨文件维护契约有正式规范，且内容以当前源码为准、不沿用过时技能描述。
- [ ] 不适用的模板文件和章节已删除；没有空标题、`TBD`、`TODO: fill`、`To be filled` 或 placeholder 文本。
- [ ] 每个 `index.md` 只链接最终存在的规范文件，文件名与职责说明一致。
- [ ] 规范之间对路由、内容源、HTML 渲染、样式、文件后缀和验证命令的描述互相一致，并与 `CLAUDE.md` 一致。
- [ ] 通过占位内容扫描、内部链接/索引检查以及项目已有测试和构建命令验证结果。
- [ ] 最终变更仅限 `.trellis/spec/` 与当前 Trellis 任务的规划/检查记录，不改产品运行时代码或内容。

## Out of Scope

- 重构 React 应用、内容数据或项目技能实现。
- 新增功能、文章、项目、页面或路由。
- 修改部署流程、依赖版本或品牌视觉设计。
- 为不存在的后端、数据库、CLI 或多包工作区编写规范。
