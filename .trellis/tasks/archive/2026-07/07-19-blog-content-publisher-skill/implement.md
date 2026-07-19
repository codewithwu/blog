# Implementation Plan: blog-content-publisher skill

## Goal

把 `prd.md`/`design.md` 落地成技能、评测、真实发布，并通过端到端验证。整个过程不复现已下线功能，不新增依赖，不自动 commit/push。

## 执行顺序

### 1. 任务与上下文准备（已完成部分）

- [x] `task.py create` 建立任务目录 `.trellis/tasks/07-19-blog-content-publisher-skill`。
- [x] 写 `prd.md`。
- [x] 写 `design.md`。
- [x] 写 `implement.md`（本文）。
- [ ] 配置上下文 manifest（`implement.jsonl` / `check.jsonl`）。
- [ ] `task.py validate` 校验配置。
- [ ] 人工审阅后 `task.py start`。

### 2. 记录基线

在产品文件修改前跑：

```bash
npm test
npm run build
```

记录真实失败集合与构建状态；写作到任务笔记。已知预期基线：`tests/html.test.jsx` 完整文档 `srcDoc` 绝对相等断言与 `<base>` 注入冲突导致的 1 个既有失败。如果实际基线不同，以实际输出为准。

### 3. 创建技能

1. 写 `.claude/skills/blog-content-publisher/SKILL.md`：
   - frontmatter：`name: blog-content-publisher`、覆盖中英触发表达的 `description`、显式排除负例。
   - 权威来源、一次确认、Markdown 流、HTML 流、批量策略、原子一致性。
   - 引用 `references/markdown-template.html`。
2. 写 `.claude/skills/blog-content-publisher/references/markdown-template.html`：
   - 品牌色 CSS 变量、Poppins/Lora 字体兜底、响应式 `max-width:720px`、h1/h2/h3/p/pre/code/table/blockquote/a 样式、外链 `target="_blank" rel="noreferrer"`。
3. 写 `.claude/skills/blog-content-publisher/evals/evals.json`：
   - “将 `2026-06-10-agent-tool-all-at-once.md` 上传到网站”。
   - “将 `亲密关系曲线.html` 上传到网站”。
   - 一个负例（近似但不应走发布，如“总结这个文件的内容”）。

### 4. 评测并完善技能

1. 同一轮并行 spawn with-skill 与 without-skill 基线，输出进 sibling `*-workspace/iteration-1/eval-*/{with_skill,without_skill}/outputs/`。
2. 按官方流程写 `eval_metadata.json`、评分脚本/判定、`grading.json`、聚合 benchmark、`eval-viewer/generate_review.py`。
3. 据反馈迭代技能、重跑，直到触发边界与行为通过。

### 5. 真实发布两个测试文件

在一次 consolidated metadata 确认下：

#### `2026-06-10-agent-tool-all-at-once.md`

- `slug`: `agent-tool-all-at-once`
- `title`: `智能体应该一次性把所有工具都给它吗？`
- `excerpt`: “工具过多会膨胀上下文、降低选择准确率并增加成本，应按场景动态筛选、路由或检索工具。”
- `date`: `2026-06-10`
- `type`: `article`
- `category`: `ai`
- `tags`: `['LangChain','Agent','Tool','设计模式']`
- `cover`: `null`
- `links`: `null`
- 输出：`content/agent-tool-all-at-once.html`

#### `亲密关系曲线.html`

- `slug`: `intimate-relationship-curve`
- `title`: `亲密关系曲线`
- `excerpt`: “以星图般曲线描绘亲密关系从相识、心动、冲突到理解与并肩同行的十一阶段。”
- `date`: `2026-07-19`
- `type`: `article`
- `category`: `notes`
- `tags`: `['亲密关系','随笔','可视化']`
- `cover`: `null`
- `links`: `null`
- 输出：`content/intimate-relationship-curve.html`（与输入逐字节一致）

把两个 `?raw` import 与两条完整记录加入 `src/data/articles.js`；保留根目录输入文件不删。

### 6. 端到端验证

自动验证：

- 官方 skill 快速校验通过。
- 评测断言与 benchmark 通过。
- `npx vitest run tests/registry.test.js` 通过。
- `npm test` 失败集合不超基线；`npm run build` 成功。
- `cmp -s 亲密关系曲线.html content/intimate-relationship-curve.html`。

真实页面（项目 run/verify 能力）：

- `/`：两张新卡片、分类/日期/摘要/标签、排序正确。
- `/p/agent-tool-all-at-once`：响应式文章、Markdown 结构完整、无 frontmatter、返回按钮回 `/`。
- `/p/intimate-relationship-curve`：保留 CSS/SVG/动画/tooltip；sandbox 不含 `allow-same-origin`。
- 桌面/移动可读；Google Fonts 不可用时兜底可用。

### 7. Diff 与收尾

- 期望 diff 仅含：技能源/eval、两个 `content/*.html`、`src/data/articles.js`、Trellis 任务产物。
- 不含无关 JSX、依赖、部署、lockfile。
- 完成 Trellis 检查；不 commit、不 push。

## Validation Commands

```bash
npx vitest run tests/registry.test.js
npm test
npm run build
cmp -s 亲密关系曲线.html content/intimate-relationship-curve.html
```

## Review Gates

- 技能 frontmatter 与执行合同在实现前经人工审阅。
- 真实发布前须一次性 consolidated metadata 确认。
- 每个阶段都比对任务前测试/build 基线。

## Rollback Points / 回滚策略

- **单条发布回滚**：精确移除该 Entry 的 `content/<slug>.html`、`?raw` import、metadata 记录；不仓库级 reset。
- **覆盖保护**：已存在的 `content/<slug>.html` 或来源变化时，必须重新确认。
- **失败部分状态**：停止 → 报告 completed/incomplete → 精确回退本次已知改动。
- **评测产物隔离**：workspace 与产品代码物理隔离，不会因评测失败污染仓库。
- 由于不 commit、不 push，任何时刻都可用“删除刚新增的已知文件 + registry 行”的方式完整回退。
