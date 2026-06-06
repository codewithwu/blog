# 项目详情页全屏重设计 — 设计文档

**日期**: 2026-06-06
**状态**: 待审
**作用范围**: `/projects/:slug` 详情页；`src/lib/html.jsx` 组件；`src/App.jsx` Navbar 显隐

## 背景

`/projects/:slug` 当前结构是「返回链接 + ProjectHeader(标题/描述/技术栈/链接) + Html 组件」。

`Html` 组件按形态分流:完整 HTML 文档走 `<iframe srcDoc>`(`min-height: 80vh`),HTML 片段走 `dangerouslySetInnerHTML`(继承宿主页面的 Tailwind/品牌色)。

用户对当前形态不满意:**项目详情页只需要保留「返回项目列表」,其余按项目源 HTML 文档原样全屏展示**。现在 `ProjectHeader` 显示的元数据会跟 iframe 内部的 HTML 形成视觉重复;`80vh` 也不是真正的全屏;`brand-*` 继承对作者自定义字体/动效不友好。

## 目标

- `/projects/:slug` 页面**只剩两样东西**:固定定位的「← 返回项目列表」按钮 + 占据整个视口的 iframe
- iframe 高度 = 100vh(严格视口高度),`border-0`,无 `max-width` 限制,无内边距
- 全局 `<Navbar />` 在 `/projects/:slug` 路由下不渲染,把 viewport 完全让给 iframe
- `Html` 组件简化为**单一 iframe 路径**:HTML 片段也包成最小完整文档塞进 `srcDoc`,跟完整文档走同一条路
- `ProjectHeader.jsx` 不再被使用,删除

## 非目标

- 不改项目列表页 (`/projects`) — 卡片列表 + Navbar 不变
- 不改 `src/data/projects.js` 的字段结构 — `content` 仍然是 `?raw` 导入的 HTML 字符串
- 不改项目卡片 (`ProjectCard.jsx`) 的视觉
- 不动 `Footer`、`<PageTransition>` 包裹层等全局布局元素
- 不修改任何项目源 HTML 文件(`showcase.html` / `_sample.html`)的内部内容
- 不改路由结构(只是路由级联到 Navbar 显隐逻辑)

## 架构与数据流

```
URL: /projects/<slug>
  ↓ useParams()
ProjectDetail.jsx
  ├─ findProjectBySlug(slug) → project | undefined
  │   undefined → <Navigate to="/projects" replace />
  └─ 命中 → 渲染:
       ├─ 固定定位的 <Link to="/projects">← 返回项目列表</Link>
       └─ <Html html={project.content} />
              ↓
              src/lib/html.jsx (新):统一输出
                - 完整文档(以 <!doctype 或 <html 开头) → 直接 srcDoc={html}
                - HTML 片段(其他) → 包成最小文档 srcDoc={`<!doctype html><html>...<body>${html}</body></html>`}
                - <iframe className="w-full h-screen border-0" sandbox="allow-scripts allow-same-origin" />

App.jsx (改):
  - 用 useLocation() 读取当前 pathname
  - 当 pathname 匹配 /^\/projects\/[^/]+/ 时,跳过 <Navbar /> 渲染
  - 其余路由继续渲染 <Navbar /> + <main> + <Footer />,行为不变
```

## 文件改动

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/pages/ProjectDetail.jsx` | 改 | 移除 `import ProjectHeader`;改用返回按钮 + `<Html html={project.content} />`,无 ProjectHeader |
| `src/lib/html.jsx` | 改 | 删掉 `dangerouslySetInnerHTML` 分支;统一输出 iframe,内容走 `srcDoc`(完整文档直接用,片段包成最小文档) |
| `src/components/ProjectHeader.jsx` | 删 | 不再被任何地方引用 |
| `src/App.jsx` | 改 | 用 `useLocation` 在 `/projects/:slug` 路由下跳过 `<Navbar />` 渲染 |
| `CLAUDE.md` | 改 | 规则 11 描述更新:项目详情页统一为「iframe 100vh 全屏」,不再用 `brand-*` 继承路径 |

## Navbar 显隐逻辑

放在 `App.jsx` 而不是 `Navbar.jsx` 内部,避免 Navbar 知道「自己不该出现」的语义。

```jsx
const location = useLocation();
const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);

return (
  <HashRouter>
    {!isProjectDetail && <Navbar />}
    <main className={isProjectDetail ? '' : 'max-w-5xl mx-auto px-6 py-8'}>
      <PageTransition>
        <Routes>...</Routes>
      </PageTransition>
    </main>
    <Footer />  {/* Footer 在项目详情页也保留,但放底部 */}
  </HashRouter>
);
```

注:Footer 在 `100vh` iframe 之后会被推出首屏,用户得滚动才能看到 — 这跟「全屏 iframe」一致,接受。如果用户想要彻底沉浸式,Foo­ter 也可一并隐藏,但本次不在范围内。

## 组件边界

- **`ProjectDetail.jsx`**: 单职责,只读 `slug` → 查 `project` → 渲染返回按钮 + `<Html>`。不直接 import `Html` 之外的视觉组件
- **`src/lib/html.jsx`**: 单职责,接收 `html` 字符串 → 输出 `<iframe srcDoc className="w-full h-screen border-0">`。**不**做 HTML 清洗(作者对自己写的内容负责)
- **`App.jsx`**: 全局布局 + 路由级 Navbar 显隐决策

## 错误处理

- `findProjectBySlug` 未命中 → 沿用现有 `<Navigate to="/projects" replace />`,行为不变
- `project.content` 为空字符串 → iframe `srcDoc=""` 渲染空白页;不报错但视觉上是白屏。如果想改进,加 fallback:`{!project.content ? <div className="p-8 text-brand-mid">该项目暂无内容</div> : <Html html={project.content} />}`
- iframe sandbox 抛错 → `<script>` 失败时,iframe 静默不执行,主页面不崩
- `useLocation` 在路由切换时同步更新,Navbar 显隐不会出现闪烁(HashRouter 切换是同步的)

## 测试

启动 `npm run dev`,人工浏览器实测:

1. `/projects`:Navbar 正常显示,卡片网格不变 — 回归
2. `/projects/showcase`:
   - Navbar **不显示**
   - iframe 占满整个视口(从屏幕顶端到底端)
   - 左上角悬浮「← 返回项目列表」按钮,半透明,鼠标悬停加深
   - 点击按钮跳回 `/projects`
   - showcase.html 内部的墨韵设计、视差/reveal 动效按源文件呈现
3. `/projects/_sample`:
   - 同样 Navbar 隐、iframe 100vh、悬浮按钮
   - _sample.html 里的 `text-brand-light` / `text-brand-orange` 等 brand 类**不生效**(独立 iframe 没引入 Tailwind),这是预期行为 — 文档里写明
4. `/projects/unknown-slug`:跳回 `/projects`,行为不变
5. 路由切换:从 `/articles` 切到 `/articles/:slug` → Navbar 正常出现;切到 `/projects/showcase` → Navbar 消失;切回 `/projects` → Navbar 恢复
6. 浏览器后退/前进按钮:Navbar 显隐同步变化
7. `npm run build` 成功
8. `npm test` 全通过

## 验证清单

- [x] `ProjectDetail.jsx` 不再 import `ProjectHeader`
- [x] `ProjectHeader.jsx` 文件已删除
- [x] `src/lib/html.jsx` 只剩单一 iframe 输出,无 `dangerouslySetInnerHTML`
- [x] `App.jsx` 在 `/projects/:slug` 下跳过 Navbar
- [ ] `showcase.html` 在详情页按源文件渲染(墨韵、动效都生效) — **需用户人眼验证**
- [x] `_sample.html` 走片段包装路径,iframe 100vh
- [ ] 悬浮返回按钮位置正确、可点 — **需用户人眼验证**
- [x] `npm run build` 成功,无新增控制台错误
- [x] `npm test` 全通过
- [x] `CLAUDE.md` 规则 11 已更新

## 实施记录

- 2026-06-06: 完成 Task 1–8
- [x] `npm run build` 成功(已确认)
- [x] `npm test` 全部通过(38/38,含新增 `tests/html.test.jsx` 5 个 it)
- [x] `/projects/showcase` 与 `/projects/_sample` 走全屏 iframe 路径(代码层 + 编译层已确认)
- [x] `/projects/<unknown-slug>` 跳回 `/projects`(行为未变)
- [x] 路由切换时 `App.jsx` 的 `isProjectDetail` 正则判定正确(`/projects/<slug>` 命中,`/projects` 不命中)
- [x] 文章页 markdown 渲染未受影响(38 个单测覆盖含 `articles.test.js`)
- [ ] 详情页悬浮返回按钮 + 100vh iframe + Navbar 隐藏的**视觉确认**需用户在浏览器实测(WebFetch 不支持 hash URL,自动化层未做端到端浏览器渲染验证)

## 文档同步

`CLAUDE.md` 规则 11 需要从「项目详情页(`/projects/:slug` 的正文)按原样呈现作者写的 HTML — 色值/字体/排版/动效/脚本都由源文件决定,无需套用全站 `brand-*` 品牌色规范」简化/对齐为新的「全屏 iframe」表述,删除「HTML 片段可继承宿主样式」那部分暗示(因为现在所有项目都走 iframe)。
