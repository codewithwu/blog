# Implementation Plan — 前端瀑布流重构 + 删减页签 + AI 上传流程

## Preconditions

- 当前任务保持 `planning`，直到用户审阅并批准本计划。
- 实施前加载 `trellis-before-dev`；实施后加载 `trellis-check`。
- 写代码前先 `git status` 与 `git stash` 现状，确保回退路径可用。
- 所有改动落地后跑 `npm test` 与 `npm run build`，对比既有基线。

## Ordered checklist

### 1. 现状冻结与基线

- [ ] `git status --short` 记录 dirty 状态（已知 `.claude/skills/*` 是未提交删除，本任务不动它们）。
- [ ] 跑 `npm test` 与 `npm run build`，记录既有 11 个失败测试名 + chunk warning 文案，作为后置对比基线。
- [ ] grep `content/` 引用，确认 `parseSkills` / `parseTools` / `parseAbout` 只在 `src/lib/content.js` 与对应 page 组件里被 import。

```bash
git status --short
rg -n "parseSkills|parseTools|parseAbout|content/技能|content/工具|content/关于" src tests
npm test 2>&1 | tee /tmp/baseline-test.log
npm run build 2>&1 | tee /tmp/baseline-build.log
```

### 2. 数据层：项目 metadata 字段统一

- [ ] 编辑 `src/data/projects.js`，把 `name` → `title`、`description` → `excerpt`、`techStack` → `tags`，新增 `type: 'project'`、`category: null`、`date: '1970-01-01'`（占位；后续若想填真实日期再补）、`links: { github, demo }`。
- [ ] 不动 `src/data/articles.js`（已带 `category` 与 `tags` 字段）。

### 3. 新建 lib 层统一入口

- [ ] 新建 `src/lib/entries.js`，导出：
  - `listEntries()`：合并 articles + projects，按 date 降序，返回 `Entry[]`。
  - `findEntryBySlug(slug)`：先查 articles 再查 projects，返回 `Entry | null`。
  - `entryCount()`：`listEntries().length`。
- [ ] 删除 `src/lib/articles.js` 与 `src/lib/projects.js`。
- [ ] 删除 `src/lib/content.js`。

### 4. 删除 3 个页签的页面 / 组件 / 数据

- [ ] 删除 `src/pages/Skills.jsx`、`Tools.jsx`、`About.jsx`、`Articles.jsx`、`Projects.jsx`、`ArticleDetail.jsx`、`ProjectDetail.jsx`。
- [ ] 删除 `src/components/SkillBar.jsx`、`ToolCard.jsx`、`TimelineItem.jsx`、`ArticleCard.jsx`、`ProjectCard.jsx`、`CategoryFilter.jsx`、`Navbar.jsx`、`Footer.jsx`、`PageTransition.jsx`。
- [ ] 删除 `src/data/skills.js`、`tools.js`。
- [ ] 删除 `content/技能.md`、`content/工具.md`、`content/关于.md`（先 git mv 到一个临时备份目录或确认不再需要）。

### 5. 新建统一页面与组件

- [ ] 新建 `src/components/EntryCard.jsx`：统一卡片视觉契约，详见 `design.md` §5。
- [ ] 新建 `src/components/Hero.jsx`：极简 hero，含 tagline 与 entry 总数。
- [ ] 新建 `src/pages/Home.jsx`：渲染 `<Hero />` + 瀑布流 `<EntryCard />` 列表。
- [ ] 新建 `src/pages/EntryDetail.jsx`：渲染 `<Html html={entry.content} title={entry.title} />` + 顶部「← 返回」按钮。
- [ ] 新建 `src/hooks/useReveal.js`：IntersectionObserver 包装。
- [ ] `src/pages/NotFound.jsx` 保留（fallback）。

### 6. 重写 `src/App.jsx`

- [ ] 路由表按 `design.md` §2 重写。
- [ ] `AppShell` 内只识别 `isFullBleedDetail = /^\/p\/[^/]+/.test(location.pathname)`；详情页隐藏 Navbar（已删）和 Footer（已删），改为渲染 EntryDetail 自带的「← 返回」按钮。
- [ ] 移除 `HelmetProvider` / `react-helmet-async` 的 import 若不再用；当前 main.jsx 仍包着，本任务不强行清理。

### 7. CSS / Tailwind 调整

- [ ] 检查 `src/index.css`：移除 `animate-fadeIn`（如果 PageTransition 是唯一使用者）；保留 Poppins / Lora 与 body 底色。
- [ ] Tailwind 不需改 config（columns 内置支持）。
- [ ] 必要时在 `src/index.css` 加 `@keyframes heroFade` 用于 hero tagline 切换。

### 8. 测试套件

- [ ] grep `tests/`，列出所有引用被删模块的测试文件，逐个改写：
  - 删除 `tests/pages/Skills.test.jsx` 等已删除 page 的测试。
  - 删除依赖 `parseSkills` / `parseTools` / `parseAbout` 的测试。
  - 新增 `tests/lib/entries.test.js`：`listEntries` 合并 + 排序 + 类型断言；`findEntryBySlug` 命中与 miss。
  - 新增 `tests/pages/Home.test.jsx`：渲染 `<Hero />` 与 entry 数量。
  - 新增 `tests/pages/EntryDetail.test.jsx`：iframe srcDoc / sandbox / 「← 返回」按钮。
- [ ] 保持「既有 11 个失败测试不扩大」：跑 `npm test`，diff 与基线日志，新失败数应 ≤ 0。

### 9. AI 上传流程文档

- [ ] 新建 `.trellis/spec/content/ai-upload-flow.md`，按 `design.md` §10 写六步清单 + HTML 模板骨架 + 注意事项。
- [ ] 在 `.trellis/spec/content/index.md` 加链接入口（若该 index 已存在）；若不存在则新建。

### 10. 验证

```bash
# 路由重定向抽样
npm run build
npx vite preview --port 4173 &
SERVER_PID=$!
sleep 2
for path in / /articles /projects /skills /tools /about /articles/sirchmunk-deep-dive /projects/articles /p/sirchmunk-deep-dive /p/articles /notfound-route; do
  echo "=== $path ==="
  curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://localhost:4173$path"
done
kill $SERVER_PID

# 测试
npm test

# 构建
npm run build

# 视觉抽检（手测）
# - 打开 / 应看到 hero + 瀑布流
# - 滚到瀑布流，卡片渐入
# - 点任意卡片跳 /p/:slug，看到全屏 iframe + 返回按钮
# - 访问旧 /articles、/skills 等应跳到 /
```

### 11. 自检 acceptance criteria

- [ ] 逐条勾验 `prd.md` 的 Acceptance Criteria，每条标 ✅ / ❌。
- [ ] 列出剩余已知问题（11 个失败测试、任何视觉不一致等）。

### 12. 提交

- [ ] `git add` 仅本任务范围内的文件（**不要** add `.claude/skills/*` 或其它未提交 dirty 文件）。
- [ ] `git commit -m "refactor(frontend): 瀑布流首页 + 合并文章项目 + 删除三个页签"`。
- [ ] 不自动 push。

## Risky areas

1. **删除 `content/*.md` 与 `src/lib/content.js`** 是破坏性操作——若有 PR / issue 引用这些内容，需要事先在 commit message 标注。
2. **`src/data/projects.js` 字段改名**：影响 `ProjectDetail.jsx` / `ProjectCard.jsx` 的访问——这些组件会被删除，但要确认没有别处依赖原字段名（如 `code_map.md`）。
3. **CSS columns 顺序**：列填充顺序与 grid 不同；如果作者介意按 date 严格排序时的视觉顺序（先列填满再下一列），可能需要切换为 grid + `masonry` 包，但本设计接受现状。
4. **测试套件调整**：旧测试可能 import 路径很复杂，删除前要 grep 全仓确认。
5. **路由 `/p/:slug`** 是新的，可能与未来 SEO 期望冲突——本仓库纯前端 + HashRouter，SEO 期望本就低，可接受。

## Completion criteria before finish

- [ ] PRD 全部 Acceptance Criteria 勾验完成。
- [ ] `npm test` 失败数 ≤ 基线 11。
- [ ] `npm run build` 成功；chunk warning 不新增。
- [ ] `git status` 中只有本任务范围内的新增 / 删除 / 改动。
- [ ] `.trellis/spec/content/ai-upload-flow.md` 存在并被 index 引用。
- [ ] 用户收到清晰的成功项 + 剩余风险清单。

## 估算工作量

- 数据层 + lib 层：30 min
- 删除旧 page / component / data：15 min
- 新建 EntryCard / Hero / Home / EntryDetail / useReveal：60 min
- 路由重写 App.jsx：15 min
- 测试改写：60 min
- AI 文档：20 min
- 验证 + 反复：30 min

合计约 4 小时实际编码时间；建议拆分 2–3 个提交节奏：
1. 数据层 + 删除旧文件 + App.jsx 重写（功能跑通，旧 tab 全部下线）
2. 新组件 + 视觉打磨 + 微动效
3. 测试改写 + AI 文档 + 最终验证