# Maintenance Workflows

## 适用范围

发布或删除文章/项目、把 `content-draft/` 合并到 live 内容、修改项目本地 `.claude/skills/`、修复源文件与 registry 不一致时遵循本规范。

本仓库把八个已跟踪本地 skill 作为正式维护入口：

| Skill | 负责边界 |
|---|---|
| `brand-guidelines` | 主站和 create-article 模板使用的品牌色/字体 |
| `create-article` | Markdown 草稿 → 品牌 HTML + 文章 registry |
| `delete-article` | 删除文章 HTML + import + metadata |
| `create-project` | HTML 草稿 → live HTML + 项目 registry |
| `delete-project` | 删除项目 HTML + import + metadata |
| `update-skills` | 合并技能草稿到 `content/技能.md` |
| `update-tools` | 合并工具草稿到 `content/工具.md` |
| `update-about` | 按 section 合并关于草稿到 `content/关于.md` |

这些 skill 是项目约定，但 `SKILL.md` 仍可能滞后。运行时事实必须按根规范的证据优先级核对，不能把 skill 文案当成高于源码的真相。

## 通用维护流程

所有发布、删除和草稿 merge 遵循同一安全骨架：

1. **解析目标**：明确是文章/项目/技能/工具/关于，是 draft 还是 live，slug/文件名是什么。
2. **读取权威状态**：先读 registry 或 live source，再检查文件系统；记录实际 import 变量、metadata 与路径。
3. **格式检查**：按 [Source Formats](./source-formats.md) 验证字段、分类、parser shape、HTML 资源和图标。
4. **完整预览**：列出将创建、移动、覆盖或删除的每个文件与 registry 记录，以及推断 metadata。
5. **确认**：发布、删除、覆盖、section replace 和会删除 draft 的 merge 必须得到明确确认。发现不一致时停止，不做“顺手修复”。
6. **最小实施**：只改该内容所属 touch points；正常数据驱动内容不改 page/card JSX。
7. **验证**：检查源/live/draft 状态、registry 引用、parser 输出、测试和 build。
8. **如实报告**：说明已改、未改、warning、失败和保留的 draft。

批量任务逐项处理，遇到第一个无法安全解决的问题就暂停，避免留下难以判断的半批次状态。

## 文章发布

输入：`articles-draft/<slug>.md`。

输出与同步点：

1. 根据正文从固定六类中选择/确认 category。
2. 把 Markdown 转换成自带品牌样式的完整 HTML。
3. 写入 `articles/<category>/<slug>.html`。
4. 在 `src/data/articles.js` 添加带分类子目录的 `.html?raw` import。
5. 添加完整 metadata，特别是必填 `category`。
6. **保留**原 `articles-draft/<slug>.md`，用于后续编辑/再版。

发布前全局检查 slug 是否已存在于任何 category；slug 跨分类仍必须唯一。用户明确指定 category 时尊重其意图，但仍校验属于固定集合。

正常发布不改 `Articles.jsx`、`ArticleCard.jsx`、`CategoryFilter.jsx`、`ArticleDetail.jsx` 或 `src/lib/articles.js`。

## 文章删除

以 `src/data/articles.js` 为起点定位：

- 实际 import 变量和 `articles/<category>/<slug>.html?raw` 路径。
- `slug` 对应 metadata 和 `category`。
- 实际 HTML 文件。

三者缺一或 category 不一致时停止并报告。确认后移除 import、metadata 和 live HTML。默认不删除 `articles-draft/<slug>.md`，因为 draft 是独立作者源。

## 项目发布

输入：`projects-draft/<slug>.html`。

正常流程：

1. 验证 HTML 形态、标题层级、相对图片、外链和自带样式。
2. 推断并让用户确认 `name / description / techStack / githubUrl / demoUrl / cover`。
3. 把 draft 移到 `projects/<slug>.html`，不做文章品牌模板转换。
4. 在 `src/data/projects.js` 添加 `.html?raw` import 与完整 metadata。
5. 检查 project detail iframe 和列表卡。

当前 `Html` 对完整文档和 fragment 都使用 iframe；不要沿用旧说明中“fragment 走 `dangerouslySetInnerHTML`”的分支。当前也没有 `ProjectHeader.jsx`；详情页只有浮动返回链接和 iframe。

正常发布不改 `Projects.jsx`、`ProjectCard.jsx`、`ProjectDetail.jsx` 或 `src/lib/projects.js`，除非用户要求改变所有项目的运行时合同。

## 项目删除

确认 live HTML、registry import 和 metadata 三处都存在并相互匹配，再展示删除计划并确认。删除后搜索 slug/文件名/import 变量残留并运行 build。不要根据 camelCase 规则猜 import 变量；读取文件中的实际名字。

## Skills / Tools / About 草稿合并

### 何时使用 draft workflow

只有请求明确引用 `content-draft/<name>.md` 时才使用 `update-*` merge。单条小改直接编辑对应 live source：

- `content/技能.md`
- `content/工具.md`
- `content/关于.md`

不要为了改一行创建无意义草稿或改 wrapper data 文件。

### Skills

默认按 category/item additive merge：

- draft 新 category 追加。
- 同 category 同名 skill 以 draft level 更新。
- draft 未提及的现有项保留；“未出现”不代表删除。
- level 必须是 `进阶 / 熟练 / 精通`。

merge 后删除被应用的 draft；删除或 hard replace 语义必须单独突出确认。

### Tools

同样按 category/item additive merge；同名工具以 draft icon/desc 更新，未提及项保留。写入前验证 Lucide icon export 和大小写。未知 icon 虽会 fallback 到 `Wrench`，但维护流程不能把明显 typo 静默发布。

### About

按 section replace，而不是逐 item additive merge：

- draft 提及的 preamble/联系方式/经历/座右铭整体替换 live section。
- 未提及 section 保留。
- draft 缺少旧联系方式或经历意味着删除，预览时必须明确列出。
- 未知 section 会被 parser 忽略；如要支持，先设计并确认 parser + page 变更。

## 修改本地 Skill 时的规则

`.claude/skills/*/SKILL.md` 是可执行维护说明，修改它时：

1. 先读 `CLAUDE.md`、当前 data/lib/page 源码和本规范。
2. 搜索 skill 中引用的每个文件、组件、字段和 sandbox 值是否仍存在。
3. 触发条件要能区分 article/project 和 inline edit/draft merge，模糊请求先澄清。
4. 破坏性步骤保留确认；不得因自动化方便跳过 inconsistent-state abort。
5. 验证命令使用项目真实脚本；不要写不存在的 lint/typecheck。
6. 更新内容合同后同步 create/delete 两个方向以及 README/CLAUDE 相关说明。
7. 不把宿主工具名称写进通用运行时规范；只在该项目已经标准化的 skill 边界内描述。

已知漂移示例：`create-project/SKILL.md` 曾引用 fragment DOM 注入和 `ProjectHeader.jsx`，与当前源码不符；delete 文案也可能残留“文章仍是 Markdown”。修 skill 时应以 `src/lib/html.jsx`、详情 page 和 `CLAUDE.md` 的 HTML 规则为准。

## 失败与部分状态

任一步骤失败后：

- 立即停止，不继续处理下一个目标。
- 列出已完成和未完成 touch points。
- 不自动 hard reset，不覆盖用户原有改动。
- 如果需要 rollback，针对刚创建/修改的已知文件设计精确回退，并再次确认破坏性操作。
- registry/file 不一致属于需要用户决策的修复，不应在删除流程中猜测处理。

## 验证清单

### Registry 内容

- [ ] source/live 文件存在于正确目录。
- [ ] raw import 路径、文件路径、slug/category 一致。
- [ ] metadata 字段齐全；import 变量有效且被 `content` 使用。
- [ ] 没有同 slug 重复条目或孤立文件。
- [ ] 正常内容变更没有不必要 JSX diff。

### Markdown 内容

- [ ] parser 可识别所有目标 section/item。
- [ ] 技能 level 合法，工具 icon 存在。
- [ ] About section replace 中的删除已明确确认。
- [ ] 已应用 draft 的保留/删除语义与用户确认一致。

### 项目命令

```bash
npm test
npm run build
```

若 test 存在任务前基线失败，比较失败集合并如实报告；build 是 source/registry/raw import 一致性的强制集成检查。

## 反模式

- 只改 HTML/Markdown 或只改 registry，留下另一侧不一致。
- 正常内容发布时给页面添加按 slug 的硬编码分支。
- 把文章 category 从目录名猜出后忽略 metadata/import 的冲突。
- 删除 live 内容时顺便删除独立 draft，未单独确认。
- draft merge 把“未提及”静默解释为删除。
- 因 parser/组件有 fallback 就发布明显非法 level/icon。
- 复制过时 `SKILL.md` 中不存在的组件、旧 renderer 或旧 sandbox 行为。
- 失败后继续批处理或用仓库级 reset 回退用户改动。
