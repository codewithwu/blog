# Testing and Quality

## 适用范围

所有产品代码、内容 registry、parser、路由和 iframe 改动都要按本规范选择验证范围。规范/文档改动也必须至少执行结构检查，并如实报告现有项目命令结果。

## 现有工具链

- Test runner：Vitest 1，命令 `npm test`（即 `vitest run`）。
- DOM environment：jsdom，由 `vite.config.js` 的 `test.environment` 配置。
- React render：`@testing-library/react`。
- Router 测试：`MemoryRouter` + `Routes` + `Route`。
- Production validation：`npm run build`（Vite build）。
- CI deploy：`.github/workflows/deploy.yml` 使用 Node 20、`npm ci`、`npm run build`。

项目当前没有 `lint`、`typecheck`、coverage 或 e2e 脚本。不要在报告里声称运行了不存在的检查，也不要把临时 `npx` 命令当成项目门槛。

## 测试文件职责

| 文件 | 应覆盖的合同 |
|---|---|
| `tests/entries.test.js` | `listEntries` 合并与 date 降序、`findEntryBySlug` 命中/未命中、`entryCount`、Entry 字段完整性 |
| `tests/registry.test.js` | 生产 registry 的字段完整性、文章 category 合法性、articles 与 projects 之间 slug 唯一性 |
| `tests/html.test.jsx` | 完整文档/fragment 包装、base 注入、iframe class/title/sandbox |
| `tests/home.test.jsx` | `Home` 渲染 Hero、entry 计数、瀑布流 columns classes 与 EntryCard 列表 |
| `tests/entry-detail.test.jsx` | 有效 entry 渲染全屏 iframe、悬浮返回按钮、找不到 slug 时 redirect |

新增测试应放进最接近合同的现有文件。只有出现新的独立模块时才新建测试文件。

## 测试写法

### 纯查询与 parser

直接输入最小字符串/数组形状，断言完整返回值：

- 空输入。
- 一个和多个分组。
- 非法或未知值的 ignore/fallback。
- 边界格式（缺冒号、缺 icon、严格 timeline header 等）。
- 至少一个真实 `content/*.md?raw` 集成断言，防止内容源与 parser 漂移。

不要只断言 `length > 0`；关键 metadata 和顺序应有明确断言。但真实内容数量会随正常内容更新变化，内容变更时必须同步这类精确数量断言。

### Registry 隔离

需要稳定 fixture 时用 `vi.mock` 提供测试 registry，如 `tests/entry-detail.test.jsx`。mock 必须在动态 import 被测页面前声明，且字段形状完整匹配生产 metadata。

不要依赖已经删除的 `_sample` 或历史文章 slug。若测试故意使用生产 registry，选择当前真实条目并在内容变更任务中同步更新。

### Router 行为

使用 `MemoryRouter initialEntries` 和最小 route 表：

- 有效 slug 渲染目标 DOM（Home 的瀑布流或 EntryDetail 的 iframe）。
- 无效 slug 使用 `<Navigate replace>` 后渲染对应 fallback route fixture。
- 旧路由 `/articles`、`/projects`、`/skills`、`/tools`、`/about` 重定向到 `/`；`/articles/:slug` 与 `/projects/:slug` 重定向到 `/p/:slug`。
- 查询 DOM 合同，如 iframe、返回按钮 href、class 和文字，不测试 React Router 内部实现。

### Iframe

`srcDoc` 会在 `Html` 中注入 base；不要再断言完整文档字符串绝对等于原输入。应分别断言：

- 原正文仍存在。
- fragment 已包装 doctype/head/body。
- `<base href="about:srcdoc">` 恰当存在，已有 base 不重复。
- sandbox 精确为 `allow-scripts allow-popups allow-forms`。
- 不包含 `allow-same-origin`。
- class 和 title 符合合同。

`tests/html.test.jsx > renders an iframe for a full HTML document` 当前因直接断言 `srcDoc === doc` 而失败，是已知基线漂移；任何修复必须按本规范"fragment 已包装 + base 已注入"两条分别断言。

## 改动到验证范围的映射

| 改动 | 最低验证 |
|---|---|
| 路由/App.jsx | Router 测试（Home / EntryDetail / 重定向）+ 全量 `npm test` + build |
| 组件交互/可访问性 | Testing Library DOM/键盘断言 + build + 手工响应式检查 |
| `src/lib/entries.js` | `tests/entries.test.js` + 全量 test |
| `src/lib/html.jsx` / `EntryDetail` | `tests/html.test.jsx` + `tests/entry-detail.test.jsx` + build |
| `src/data/articles.js` / `projects.js` 或 HTML 源 | `tests/registry.test.js` 完整性检查 + test + build |
| Tailwind/Vite/deploy | build；部署行为改变时审查 workflow 与 base |
| `.trellis/spec/` | 文件/链接/占位扫描 + test/build 基线比较 |

## 当前基线（2026-07-19）

瀑布流重构后的基线：

- `npm run build` 成功；JS bundle 从重构前 1098 kB 降到 352 kB；Vite chunk-size warning 已消失。
- `npm test` 有 1 个失败：`tests/html.test.jsx > renders an iframe for a full HTML document`，断言期望原始文档（不含 `<base>` 注入），与 `src/lib/html.jsx` 的实际行为（注入 `<base href=”about:srcdoc”>` 修复锚点）不符。这是基线漂移，**不是本任务新增**——它在 spec bootstrap 前的 11 个失败里就是其中之一，其他 10 个失败在重构中被随之删除的旧 test 文件承担。

因此后续任务的质量判断必须比较”是否新增失败”，不能把既有 1 个失败归因于本任务；同时也不能宣称测试全绿。修复这条测试时应更新断言或移除本节。

## Build 质量

`npm run build` 是 raw import、JSX/ESM 语法、Vite base 和 Tailwind 生成的主要集成门槛。

- 构建错误必须修复后才能完成产品改动。
- bundle size warning 目前是已知 warning，不等同于失败；若功能显著增大 bundle，应说明增量并评估 dynamic import，而不是盲目提高 warning limit。
- GitHub Pages 只在 CI build 后部署；本地 dev 成功不能替代生产 build。

## 代码审查清单

- 变更是否放在正确层：page/component/data/lib/content。
- 是否复用现有 query/parser/Html/usePageTitle，而非复制逻辑。
- 路由、Hero / EntryCard / EntryDetail 是否按合同同步。
- metadata、raw import 和源文件是否成套。
- iframe sandbox/base/title/fullscreen 是否保持。
- icon 是否来自 lucide-react；样式是否使用品牌 token。
- 自定义交互是否有 keyboard/focus/aria 支持。
- 测试 fixture 是否仍对应当前生产形状。
- 注释是否解释非显然原因，而不是重复语法。
- 失败、warning 和跳过的检查是否如实报告。

## 反模式

- 为了让测试绿而删除有意义断言，或让源码倒退到过时 fixture。
- 只跑单个测试就声称全量验证完成。
- 因为改动看似“仅数据/文档”而跳过 build。
- 使用 snapshot 覆盖复杂 iframe/route 行为，导致合同变化难以阅读。
- mock 缺少生产必填字段，测试通过但真实页面失败。
- 把 warning 描述成 success，或把既有失败伪报为本次引入。

## 常用命令

```bash
npm test
npm run build

# 聚焦单文件时可传给 Vitest；完成前仍需回到全量
npx vitest run tests/html.test.jsx
```
