# Technical Design — 前端瀑布流重构 + 删减页签 + AI 上传流程

## 1. Design objective

把仓库从「六 tab 导航式」重构为「单一瀑布流首页 + 统一详情路由」的极简结构，并沉淀 AI 命令上传流程文档。设计目标是：

- **路由收敛**：`/` 即首页；`/p/:slug` 即详情；旧路由全部 302 重定向，避免破坏外链。
- **数据统一**：通过 `Entry` 抽象，让 `EntryCard` / `EntryDetail` 不知道文章与项目的差别。
- **视觉极简**：保留 brand-* token，不引入新依赖，用 CSS columns + IntersectionObserver 完成瀑布流与微入场。
- **删除 3 tab**：彻底下线 skills/tools/about，包括解析器、内容文件和测试（既有 11 个失败测试不修复，但本任务改动的页面/解析器相关测试可以重写以反映新结构）。
- **AI 上传流程文档化**：写一份 `ai-upload-flow.md` 给未来的「Claude agent」作为操作清单。

## 2. Route topology

```
/                              → Home (瀑布流)
/p/:slug                       → EntryDetail (统一详情，iframe 100vh)
/articles                      → 302 /        (旧文章列表)
/articles/category/:cat        → 302 /        (旧分类筛选)
/articles/:slug                → 302 /p/:slug (旧文章详情)
/projects                      → 302 /        (旧项目列表)
/projects/:slug                → 302 /p/:slug (旧项目详情)
/skills                        → 302 /        (旧技能)
/tools                         → 302 /        (旧工具)
/about                         → 302 /        (旧关于)
*                              → NotFound (保留，但瀑布流下基本不会触发)
```

实现方式：在 `App.jsx` 内用 `<Route path="..." element={<Navigate to="..." replace />} />` 表达重定向。`replace` 保证浏览器历史栈干净。

`AppShell` 中的 `isFullBleedDetail` 改为 `/^\/p\/[^/]+/.test(location.pathname)`。其余正则全部删除。

## 3. Data model: Entry

```js
// 概念类型（仅文档说明，不直接 export 任何 TS 类型）
// Entry = ArticleEntry | ProjectEntry
//
// ArticleEntry:
//   { slug, title, excerpt, date, type: 'article',
//     category: 'ai'|'python'|'engineering'|'product'|'notes'|'resources',
//     tags: string[], cover: string|null, links: null, content: string }
//
// ProjectEntry:
//   { slug, title, excerpt, date: 'YYYY-MM-DD'|'1970-01-01',
//     type: 'project', category: null, tags: string[], cover: string|null,
//     links: { github?: string, demo?: string }|null, content: string }
```

约束：
- `category` 在 ProjectEntry 上始终为 `null`；在 ArticleEntry 上必须属于 `categories.js` 的 6 个 slug 之一（已有 `categorySlugSet` 校验）。
- `date` 为 ISO 字符串；项目若作者未给，统一回退 '1970-01-01'（仅用于排序）。
- `tags` 至少 1 个；项目原 `techStack` 整体迁移到这里。
- `cover` 为相对路径（CLAUDE.md 规则 3）。
- `links` 仅项目使用，UI 上以小图标按钮渲染（lucide-react 的 `Github` / `ExternalLink`）。

## 4. Module layout

新增 / 删除 / 改动：

| 路径 | 操作 | 说明 |
|---|---|---|
| `src/App.jsx` | 改 | 路由收敛 + `AppShell` 仅识别 `/p/:slug` |
| `src/pages/Home.jsx` | 改 | 实现瀑布流首页 |
| `src/pages/EntryDetail.jsx` | 新 | 统一详情页，转发到现有 `ArticleDetail` / `ProjectDetail` 的逻辑（复用 `src/lib/html.jsx` 的 `Html`） |
| `src/pages/ArticleDetail.jsx` | 删 | |
| `src/pages/ProjectDetail.jsx` | 删 | |
| `src/pages/Articles.jsx` | 删 | |
| `src/pages/Projects.jsx` | 删 | |
| `src/pages/Skills.jsx` | 删 | |
| `src/pages/Tools.jsx` | 删 | |
| `src/pages/About.jsx` | 删 | |
| `src/pages/NotFound.jsx` | 保留 | |
| `src/components/Navbar.jsx` | 删 | 首页 hero 自带品牌位，无需全局 Navbar；详情页是全屏 iframe，本就不渲染 Navbar |
| `src/components/Footer.jsx` | 删 | 同上 |
| `src/components/ArticleCard.jsx` | 删 | |
| `src/components/ProjectCard.jsx` | 删 | |
| `src/components/CategoryFilter.jsx` | 删 | 瀑布流首版不做筛选 |
| `src/components/PageTransition.jsx` | 删 | 改为瀑布流内部 IntersectionObserver 控制入场 |
| `src/components/EntryCard.jsx` | 新 | 统一卡片 |
| `src/components/Hero.jsx` | 新 | 顶部极简 hero，含 entry 总数与动态 tagline |
| `src/lib/articles.js` | 删 | 替换为 `src/lib/entries.js` |
| `src/lib/projects.js` | 删 | 同上 |
| `src/lib/entries.js` | 新 | `listEntries()` / `findEntryBySlug(type, slug)` / `entryCount()` |
| `src/lib/content.js` | 删 | 解析器全部失效 |
| `src/hooks/usePageTitle.js` | 保留 | 但调用方变化 |
| `src/hooks/useReveal.js` | 新 | IntersectionObserver 包装，返回 ref + `isVisible` |
| `src/data/skills.js` | 删 | |
| `src/data/tools.js` | 删 | |
| `src/data/articles.js` | 保留 | 数据源不变；仅在 `entries.js` 合并读取 |
| `src/data/projects.js` | 保留 | 数据源不变；项目元数据需补 `type: 'project'` 字段 |
| `src/data/categories.js` | 保留 | 6 个固定分类不变 |
| `content/技能.md` `content/工具.md` `content/关于.md` | 删 | |
| `tests/` | 改 | 适配新结构；旧有失败测试若引用被删模块，更新或删除之（保持 11 失败基线不扩大） |
| `.trellis/spec/content/ai-upload-flow.md` | 新 | AI 上传流程清单 |

## 5. EntryCard 视觉契约

```text
┌──────────────────────────────────────────┐
│  [封面图 / 渐变占位]                       │
├──────────────────────────────────────────┤
│  📝 文章  ·  2026-06-15                    │  ← type 徽章 + date（项目隐藏）
│  Sirchmunk 深度解读                       │  ← title (Poppins, hover 转 brand-orange)
│  如果你做过 RAG，第一反应几乎都是……         │  ← excerpt line-clamp-3
│  [AI] [RAG] [检索] [Agent]                │  ← category chip（项目无） + tags
└──────────────────────────────────────────┘
```

约束：
- 卡片容器：`rounded-xl bg-brand-surface border border-brand-mid/10`（边框从 20% 降到 10%）。
- hover：`hover:-translate-y-0.5 hover:shadow-md hover:border-brand-mid/20`，过渡 250ms（从 300ms 略快）。
- 项目卡区别：左上角 type 徽章文字「🛠 项目」，底部条不显示 category chip，但显示 github/demo 图标按钮。
- 无 cover 时，封面区渐变保持现有 `from-brand-orange/30 via-brand-blue/20 to-brand-green/30`，中央显示标题首字母（沿用 ProjectCard 的兜底）。

## 6. CSS columns waterfall

直接用 Tailwind：

```html
<div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-6">
  {entries.map((e) => (
    <div key={e.slug} className="mb-6 break-inside-avoid">
      <EntryCard entry={e} />
    </div>
  ))}
</div>
```

关键点：
- `break-inside-avoid` 防止卡片被列断。
- `mb-6` 代替 `gap-6`（CSS columns 不支持 flex/grid gap）。
- 列宽：`columns-3` 默认每列宽度 ≈ `min(0, 1fr)`；在不同断点显式覆盖即可。

## 7. Hero 区

```text
┌────────────────────────────────────────────┐
│  极客熊猫                                    │
│  一个极简博客 · 7 篇内容                      │
│  持续记录 AI 与工程心得                       │
└────────────────────────────────────────────┘
```

实现：
- Hero 是普通 div，不 `position: sticky`，让用户自然往下滚到瀑布流。
- tagline 用一组候选文案，按 entry 数变化：
  - 0 → 「欢迎」
  - 1–3 → 「开始记录」
  - 4–10 → 「持续记录 AI 与工程心得」
  - >10 → 「保持好奇，持续输出」
- 切换动画：CSS `@keyframes` 淡入淡出，4–6s 循环；在标签切换瞬间用 `key={count}` 触发 React 重渲染（粗暴但足够）。

## 8. Micro-interactions

| 元素 | 动效 | 时长 |
|---|---|---|
| 卡片入场 | `opacity-0 translate-y-2 → opacity-100 translate-y-0` | 400ms ease-out，单次触发 |
| 卡片 hover | `-translate-y-0.5 + shadow-md` | 250ms ease-out |
| Hero tagline 切换 | `opacity-100 → opacity-0 → opacity-100` | 600ms × 2 |
| 详情页「← 返回」按钮 | 滚动到顶时透明度从 1 → 0.4，滚下回 1 | 200ms |

入场动效用 `useReveal` 包装：

```jsx
// src/hooks/useReveal.js
export function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible];
}
```

## 9. 详情页（统一）

`/p/:slug` 渲染逻辑：

1. `findEntryBySlug(slug)` 拿到 entry（含 `type`）。
2. 直接渲染 `<Html html={entry.content} title={entry.title} />`。
3. 顶部固定按钮 `<button className="fixed top-4 left-4 z-50 ...back-btn">← 返回</button>`，`onClick={() => navigate('/')}`。

注：现有 `ArticleDetail.jsx` / `ProjectDetail.jsx` 内对 `Html` 的用法基本一致，合并到 `EntryDetail.jsx` 后无需新增 HTML 工具。

## 10. AI 上传流程文档

`.trellis/spec/content/ai-upload-flow.md` 必含六步：

1. 读源文件并解析 frontmatter / 标题 / 段落。
2. 与作者一次确认：type、category（若文章）、slug、title、excerpt、tags、date。
3. 把 Markdown 整理为自包含 HTML：内联 `<style>`，字体/颜色/暗背景匹配 brand token，避免依赖主站 Tailwind 编译产物。
4. 落盘：`articles/<category>/<slug>.html` 或 `projects/<slug>.html`。
5. 在 `src/data/articles.js` 或 `src/data/projects.js` 加 `?raw` import + metadata 记录（含 type 字段）。
6. 自检：跑 `npm test` 与 `npm run build`，确认无新增失败。

文档要写明：
- HTML 模板最小骨架（`<!doctype>` + `<html>` + `<head>` + `<body>`）；
- 6 个固定分类与中文显示名映射（指向 `src/data/categories.js`）；
- slug 全局唯一规则；
- iframe 内 `brand-*` 类不生效，作者必须自带样式（继承 CLAUDE.md 规则 10f）；
- 失败重做与回滚（git revert）的指引。

## 11. 数据迁移影响

- `src/data/articles.js` 已有的 `sirchmunk-deep-dive` 仍可工作；type 字段不需要加（lib 层默认从该文件读到的都是 article）。
- `src/data/projects.js` 的两条记录 (`articles.html`、`claude-task-monitor.html`) 需要：
  - 字段统一：`name` → `title`，`description` → `excerpt`，`techStack` → `tags`，新增 `type: 'project'`、`category: null`、`date`（若未提供则 '1970-01-01'）；
  - `cover` 若原本缺失，留 null；
  - `links: { github: project.githubUrl, demo: project.demoUrl }`。
- 删除 `content/{技能,工具,关于}.md` 与对应解析器 → 不会引发运行时错误（前提是 `App.jsx` 不再 import 它们）。

## 12. Trade-offs

- **CSS columns vs 真 masonry 库**：选择前者，避免 bundle 膨胀。代价是列内顺序按列填（不像 grid 严格按行），但瀑布流的视觉重点是「参差」而非「严格顺序」，可接受。
- **保留两个 data 文件 vs 合并成一个**：保留两个，导入路径不变，git diff 更小；合并后文件名变成 `entries.js`，且现有 spec 也提到「文章与项目分文件」（参见 `content/maintenance-workflows.md` 草案）。代价是 `entries.js` 需要做轻度合并。
- **不做筛选 UI**：首页是瀑布流，一次看全部；category 过滤后续再考虑，避免首版 UI 复杂度爆炸。
- **删除 Navbar / Footer**：全局导航已无意义（只有「返回」按钮就够了），底部版权保留到 hero 文案或干脆移除；本设计选择直接删除 Footer（极简到极致）。
- **不动 11 个失败测试**：诚实报告基线，不让本任务「显得全绿」。

## 13. Compatibility & rollback

- 旧路由全部 302 到 `/`，外链不破；GitHub Pages 部署的 `dist/` 重生后立即生效。
- 内容源文件（articles/, projects/, content/）删除 `content/*` 是破坏性操作，必须在 commit message 中标注，并在 `prd.md` 风险一节说明。
- 回滚策略：`git revert` 即可恢复全部源码与内容；`.trellis/spec/content/ai-upload-flow.md` 是文档，回滚删除即可。
- 部署到 `codewithwu.github.io/blog` 的 base 路径不变；HashRouter 模式不变。

## 14. Risky areas

1. **`content/*` 删除**前应 grep 全仓确认无别处引用（应当已无引用，但需要验证）。
2. **测试套件**：现有测试可能 import 被删的 page / lib 函数。需要逐个 grep `tests/` 目录，对引用被删模块的测试做删除或改写。本任务不修复 11 个旧失败，但可以避免「多挂」失败。
3. **CSS columns 在 Safari / Firefox** 的 `break-inside-avoid` 已稳定，但若用户有缩放或打印需求可能有问题——非关键场景，不阻塞。
4. **首页大量 entry 时 IntersectionObserver 的开销**：单页 < 100 个 entry 无压力；若超过，考虑加虚拟滚动（首版不做）。