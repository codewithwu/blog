# 内容架构收敛：扁平 content/ 统一目录

## Goal

清理 3 个旧内容（1 篇文章 + 2 个项目），将 articles/ + projects/ 目录合并为统一扁平的
content/<slug>.html；同步更新 CLAUDE.md 规则 3/4/5；src/data/{articles,projects}.js
改空数组；src/components/Hero.jsx 去掉"开始记录"四字。最后提交到 main。

## Requirements

### 必须完成

1. **删除旧内容源文件**（3 个）：
   - `articles/ai/sirchmunk-deep-dive.html`
   - `projects/articles.html`
   - `projects/claude-task-monitor.html`

2. **删除目录**：
   - `articles/`（含 `ai/`、`engineering/`、`notes/` 三个空子目录）
   - `projects/`
   - 创建 `content/`（首次存在，为后续新内容的统一存放处）

3. **更新数据文件**：
   - `src/data/articles.js` → 数组清空为 `[]`；移除所有 `import ... from '...articles/...?raw'`
   - `src/data/projects.js` → 数组清空为 `[]`；移除所有 `import ... from '...projects/...?raw'`

4. **更新 Hero 组件**：
   - `src/components/Hero.jsx` 中 tagline 的 `count <= 3` 分支返回值由 `'开始记录'` 改为
     空串 `''`（字面对应"去掉这四个字"；该档位 tagline 不再展示该四字）

5. **更新文档**：`CLAUDE.md` 三处：
   - 规则 3「(a) 源文件位置」改为 `content/<slug>.html`，统一文章与项目
   - 规则 3「(b) ?raw 导入」示例改为 `import xxx from '../../content/<slug>.html?raw';`
   - 规则 4 列表页脚注移除 `articles/<category>/` 目录命名表述
   - 规则 5「新增文章」约束指向新规则 3，去除 `articles/<category>/` 子目录表述

### 约束

- **保留不动**：`CLAUDE.md` 规则 4 中 URL 重定向层（`/articles`、`/projects` →
  `/` 的 302 映射）——那是 `App.jsx` 的 URL 路由，不是文件系统路径
- **保留不动**：`content/` 后不会被自动建任何子目录——纯扁平结构
- **不引入新依赖**——纯文件 IO + 文本编辑

## Acceptance Criteria

- [ ] `articles/` 与 `projects/` 目录已从 working tree 移除（git status 不显示）
- [ ] `content/` 目录已创建（待首次新内容落地；当前可为空）
- [ ] `src/data/articles.js` 中 `articles` 数组 = `[]`，无 `import ... .html?raw` 语句
- [ ] `src/data/projects.js` 中 `projects` 数组 = `[]`，无 `import ... .html?raw` 语句
- [ ] `src/components/Hero.jsx` 全文件不再含字样「开始记录」
- [ ] `CLAUDE.md` 中除规则 4 的 URL 重定向层外，不再含 `articles/` 或 `projects/`
      作为文件系统路径的引用
- [ ] `npm run build` 通过（无 import / 构建错误）
- [ ] 所有变更以一个或合理数量的 commit 落到 `main`

## Notes

- 实施路径中所有改动已与用户对齐：
  - 3 个旧内容删除（不可逆，已完成）；
  - 扁平 `content/<slug>.html` 结构（用户从三选项中确认）；
  - 「开始记录」改为空串（最小改动，不动 `count <= 0` 分支的「欢迎」）。
- 任务规模属"轻量"——PRD-only；无 `design.md` / `implement.md`。
- 完成后 `task.py archive` 即可。
