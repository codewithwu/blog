# Implementation Plan — 刷新 Trellis 项目规范

## Preconditions

- 当前任务保持 `planning`，直到用户审阅并批准本计划。
- 实施前加载 `trellis-before-dev`；实施后加载 `trellis-check`。
- 所有写入限制在 `.trellis/spec/` 和当前任务记录；不触碰产品代码、内容或用户已有的其他未提交文件。

## Ordered checklist

### 1. Freeze the evidence map

- [ ] 以 `CLAUDE.md`、当前源码/配置、测试、README/code_map、已跟踪项目 skills 的优先级整理最终规则。
- [ ] 对已发现冲突采用当前源码：fragment 也走 iframe、详情页无 `ProjectHeader`、文章 live source 是 HTML、sandbox 不含 `allow-same-origin`。
- [ ] 记录当前基线：`npm run build` 成功且有 chunk warning；`npm test` 11 个失败，属于任务前已存在的漂移。

### 2. Replace the frontend templates

- [ ] 重写 `.trellis/spec/frontend/index.md`，列出四份最终规范及使用场景。
- [ ] 新建 `frontend/architecture-and-routing.md`。
- [ ] 新建 `frontend/component-and-style-guidelines.md`。
- [ ] 新建 `frontend/data-and-rendering.md`。
- [ ] 新建 `frontend/testing-and-quality.md`。
- [ ] 删除不再适用的旧模板文件：
  - `directory-structure.md`
  - `component-guidelines.md`
  - `hook-guidelines.md`
  - `state-management.md`
  - `quality-guidelines.md`
  - `type-safety.md`

**Review gate:** frontend index 只链接存在文件；每份文档至少包含适用场景、本地规则、证据路径、反模式、验证方法。

### 3. Add the content maintenance specs

- [ ] 新建 `.trellis/spec/content/index.md`。
- [ ] 新建 `content/source-formats.md`，覆盖文章、项目和三个 Markdown 页签的精确输入合同。
- [ ] 新建 `content/maintenance-workflows.md`，覆盖 tracked local skills、跨文件同步、确认与验证规则。
- [ ] 明确区分运行时合同、作者格式和维护流程，避免与 frontend 文档重复。

**Review gate:** 内容注册规则与 `CLAUDE.md` 规则 10-12、`src/data/*`、`src/lib/content.js` 一致；技能说明中的已知过时内容不能进入规范。

### 4. Remove irrelevant guides and add root navigation

- [ ] 删除 `.trellis/spec/guides/` 下三个旧文件。
- [ ] 新建 `.trellis/spec/index.md`，只列 `frontend/` 与 `content/` 两个真实边界，并解释证据优先级。
- [ ] 检查所有相对链接和文件职责描述。

**Rollback point:** 如果 content/frontend 边界产生大量重复，合并到更少文件后再更新索引；不要保留空壳文件。

### 5. Verify the rewritten specs

运行以下检查：

```bash
# 最终文件集合
find .trellis/spec -type f -print | sort

# 模板与占位内容；预期无输出
rg -n -i 'To be filled|TBD|TODO: fill|placeholder|fill in each file|Replace with your actual' .trellis/spec

# 上游/无关规则残留；人工判断命中是否合理
rg -n 'Trellis CLI|packages/cli|event log|API ↔ Service|Database|Python Literal|ProjectHeader|dangerouslySetInnerHTML|allow-same-origin' .trellis/spec

# Markdown 相对链接存在性和 index 一致性
python3 - <<'PY'
from pathlib import Path
import re
root = Path('.trellis/spec')
errors = []
for path in root.rglob('*.md'):
    text = path.read_text(encoding='utf-8')
    for target in re.findall(r'\[[^\]]+\]\(([^)]+\.md(?:#[^)]+)?)\)', text):
        rel = target.split('#', 1)[0]
        if rel and not (path.parent / rel).resolve().exists():
            errors.append(f'{path}: missing {target}')
if errors:
    raise SystemExit('\n'.join(errors))
print('markdown links: ok')
PY

# 确认未修改产品代码/内容
git status --short -- .trellis/spec src articles projects content
```

### 6. Run project-level validation and report baseline honestly

```bash
npm test
npm run build
```

- [ ] 对比规划阶段基线；规范-only 修改不应新增产品测试失败。
- [ ] 构建应继续成功；chunk warning 如仍存在，按基线 warning 报告。
- [ ] 若测试仍是同一批 11 个失败，明确标为既有测试漂移，不把任务伪报为全绿。

### 7. Final review

- [ ] 从根 `index.md` 逐项打开所有文档，检查术语一致性。
- [ ] 所有关键规则至少带一个真实路径；避免大段复制源码或 CLAUDE.md。
- [ ] PRD acceptance criteria 逐项勾验并记录结果。
- [ ] 运行 Trellis 规范更新/检查步骤，准备用户验收；不自动 commit。

## Risky areas

- 删除旧 spec 文件时只能定位 `.trellis/spec/`，不得删除 `.trellis/scripts/`、tasks、workspace 或用户未提交的 `.claude/` 内容。
- `code_map.md` 和 tracked skills 有已知漂移，不能作为高于源码的权威。
- 当前测试不绿；验证结果必须做前后基线比较，而不是只看退出码。

## Completion criteria before finish

- 最终 spec tree 与 `design.md` 一致，或变更已在设计中同步说明。
- 无模板占位、无无关上游 Trellis 规则、无断链、无索引漂移。
- 产品代码和内容未修改。
- 用户收到完整的成功项、失败项和未处理基线问题清单。
