# UX 全面优化

## Goal

从用户体验角度对博客做一次系统性优化，**不破坏现有视觉语言与 Entry 模型契约**，覆盖 a11y 缺陷、性能感知、视觉粘合、体验加分、锦上添花五个层级。最终用户感知：

- 键盘 / 屏幕阅读器用户能顺畅穿过详情页（不再陷入 iframe）
- 瀑布流大列表下搜索不卡
- 视觉过渡更平滑，焦点与微动效更精致
- 长内容有滚顶 / 进度 / 阅读时间提示
- iframe 内同站链接不再跳 404

## Requirements

按优先级分三波交付，每波独立可验证。

### 第一波 P0 — a11y 关键修复 + 性能感知

1. **iframe 键盘焦点跳出机制**
   - 详情页 100vh iframe 必须不形成键盘焦点陷阱
   - 键盘用户：Esc 或首次 Tab 把焦点送回主站「← 返回」按钮
   - 屏幕阅读器：提供 skip-link「跳到主站导航」隐藏在首个焦点元素
   - 进入详情页时焦点先落在「← 返回」按钮（focus visible 状态可见），避免被 iframe 自动抢占

2. **搜索防抖（React 18 useDeferredValue）**
   - `query` 输入即更新 state，但 filteredEntries 计算走 deferred value
   - 视觉反馈：搜索框右侧可显示微 spinner（input 进行中时）
   - `entryCount ≤ 20` 时无明显效果（fallback 不显示 spinner）

3. **Hero 与 SearchBar 视觉粘合**
   - 极光背景从 Hero 渐隐到 SearchBar 玻璃态之间无突兀边界
   - SearchBar 顶部边缘加渐隐阴影，Hero 底部加 `mask-image` 渐变

4. **Google Fonts preconnect（首屏字体加载）**
   - `index.html` head 加 `<link rel="preconnect" href="https://fonts.googleapis.com">` + `https://fonts.gstatic.com` (crossorigin)
   - 把 `@import` 替换为 `<link rel="stylesheet">` 同步加载（避免 JS 解析后才发起字体请求）
   - 减轻 FOIT / 字体回落闪烁

5. **移动端触控目标 ≥ 44pt（a11y）**
   - 「← 返回」按钮移动端 `min-h-[44px] min-w-[44px]` + 更大 padding
   - SearchBar X 清除按钮 `min-h-[44px] min-w-[44px]`（触控目标放大）
   - type segmented control 按钮移动端 `min-h-[44px]`
   - 用 `[@media(max-width:640px)]:` 守卫，仅移动端放大

### 第二波 P1 — 体验加分

4. **滚回顶部按钮**
   - 瀑布流 > 1 屏（`window.scrollY > window.innerHeight`）后右下角出现
   - 同款玻璃态胶囊；点击 smooth scroll 到 0
   - 移动端不挡 PrevNextNav（404 / EntryDetail 都用得到，但本任务先在 Home 实现）

5. **键盘快捷键可见提示**
   - 首次进入 Home 短暂浮层 / 永久显示一行淡提示：`按 j/k 切换 · Enter 进入 · / 搜索`
   - 加 `?` 显示 cheat sheet 浮层（列出全部快捷键）
   - 用户主动关闭后存 localStorage（key: `coolpanda_kbd_hint_dismissed`）

6. **瀑布流卡片入场 stagger**
   - 首屏 N 张卡片同时入场（无延迟），后续滚动入场的卡片按 column 偏移
   - 视觉上「从左到右 / 从上到下」依次浮现，仍单次触发（不重复）

7. **未找到 entry 时的友好提示**
   - 详情页 `findEntryBySlug(slug)` 返回 undefined 时，**不立即 navigate**；先显示 toast「文章不存在 · 即将返回首页」300ms 后跳转
   - 或保留在 `/p/:slug` 显示内嵌 NotFound 提示 + 「返回首页」按钮
   - 决策倾向：内嵌 NotFound 卡片（与现有路由契约一致，不污染历史栈）

8. **iframe 内同站链接拦截**
   - 注入 JS：捕获 iframe 内所有 `<a>` click，拦截 href 为 `#/` `/` `#/p/xxx` `#/articles/xxx` 等 HashRouter 路径
   - 用 `window.parent.location.hash = newHref` 让 React Router 接管
   - 保留锚点（`<a href="#section">`）走 about:srcdoc

9. **Hero LAST_UPDATED 改为派生**
   - 当前硬编码 `const LAST_UPDATED = '2026-07-19'`（Hero.jsx:15）
   - 改为从 `listEntries()` 取最大 date（最新 entry 的 date），避免每次发新文章都要改常量
   - 找不到任何 entry 时显示「—」

11. **iframe shimmer 透明度调整**
   - 当前 shimmer `bg-brand-surface/40`（60% 透明）+ `animate-pulse`
   - 大文档（如 47KB `intimate-relationship-curve.html`）首帧前 body 紫蓝黑透过 iframe 渗出 → 视觉闪
   - 改为 `bg-brand-surface/85`（仅 15% 透明）+ 减少 `animate-pulse` 节奏；保留 4% 噪点

12. **PrevNextNav 移动端遮挡 iframe 内容**
   - 当前浮条固定 `bottom-6`，窄屏垂直堆叠后高度 90-100px，遮挡 iframe 底部
   - 改造：在 EntryDetail iframe 容器加 `padding-bottom: 120px`（sm 以下），让最后内容不被浮条盖住

### 第三波 P2 — 锦上添花

13. **EntryCard 标签 chip 可点击 → 触发搜索**
    - tag chip 加 `onClick + stopPropagation`，回调 `setQuery(tag)` + 自动聚焦搜索框
    - Home 暴露 `onTagClick` prop 给 EntryCard
    - category chip 同款行为（点击 = 跳到该 category 的搜索？或仅触发 tag 文本搜索；本任务选后者，category 是 metadata 不做筛选）

14. **EntryCard fallback 渐变按 hash 决定方向**
    - 当前所有 fallback 都 `from-brand-accent/25 via-brand-primary/20 to-brand-glow/25`
    - 改为按 `entry.slug` hash 选 3-4 种预设渐变之一（如 紫蓝 / 蓝青 / 青紫 / 紫青）
    - 视觉去重 + 不引入新色板

15. **Entry 扩展 `readingTime` 可选字段**
    - metadata 新增 `readingTime: number`（单位：分钟，可选）
    - 卡片 date 旁显示 `· X 分钟阅读`（缺省不显示）
    - 不强制作者填；扩展字段向后兼容

16. **fallback 首字母国际化**
    - 当前 `entry.title.slice(0, 2).toUpperCase()` 对中文标题无意义（「亲密关系曲线」→ 「亲密」看起来像文案）
    - 检测标题首字符：
      - ASCII 字母 → 取首字母大写（与英文标题一致 monogram 效果）
      - 中文 / 其它 → 不显示字符，仅保留渐变 + 类型标签

17. **tags chip 数量上限 + 「+N」合并**
    - 当前 tag chip 不限数量，5+ tag 的卡片拉高高度破坏瀑布流对齐
    - 显示前 3 个 tag + 「+N」合并（如 `+2`）

18. **404 页列出最近 3 条 entry**
    - 当前 404 页只显示「返回首页」按钮，用户无内容线索
    - 在 404 页面加一段「最近发布」列表（前 3 条 entry 的 title + 链接）
    - 帮助输错 slug / 外链失效的用户找回内容

19. **瀑布流响应式断点细化**
    - 当前 `columns-1 sm:columns-2 lg:columns-3 2xl:columns-4` 在 640-1024 单列太宽、1024-1535 三列每张卡偏窄
    - 改为 `columns-1 md:columns-2 lg:columns-3 2xl:columns-4` 加中段

20. **暗 / 亮主题切换（保守实现）**
    - **不在本任务强交付**，列为「评估项」：调研后决定做 / 不做；做的话需要扩展 brand-* 色板 + body 硬编码色值同步 + 加主题 toggle 组件 + localStorage 持久化 + 重新校核所有组件颜色对比度。**当前不在 P2 范围内实施**

21. **详情页阅读进度条**
    - iframe `srcdoc` 模式下 document 跨域隔离，无法 ResizeObserver 监听内部 scrollHeight 变化
    - **不在本任务强交付**，列为「评估项」：需要 iframe 内显式 postMessage 上报 scroll position；项目 HTML 作者需主动埋点，违反「作者自由写 HTML」契约，列为不推荐。

## Acceptance Criteria

### 必须通过（P0 + P1 + 已选 P2）

- [ ] AC-1：键盘用户在详情页按 Esc 立即把焦点送回「← 返回」按钮
- [ ] AC-2：详情页加载完成时，焦点落在「← 返回」按钮（带 focus-visible ring）
- [ ] AC-3：屏幕阅读器朗读「← 返回」按钮的 aria-label 为「返回首页」
- [ ] AC-4：跳过链接（skip-link）隐藏在首个 Tab 焦点，激活后跳到主站导航区
- [ ] AC-5：搜索输入连续 5 字符以上，每次 keystroke 不再触发 O(n) filter 计算（用 deferred value）
- [ ] AC-6：entryCount > 20 时搜索框右侧出现 1px 微 spinner
- [ ] AC-7：Hero 底部到 SearchBar 顶部视觉过渡平滑，无明显色块边界
- [ ] AC-8：index.html head 含 `<link rel="preconnect">` 给 Google Fonts；不再走 `@import` 间接加载
- [ ] AC-9：移动端 (< 640px) 「← 返回」按钮、X 清除按钮、segmented control 按钮触控目标 ≥ 44pt
- [ ] AC-10：Home 页 `window.scrollY > 100vh` 时，右下角出现「↑ 顶部」按钮；点击 smooth scroll 到 0
- [ ] AC-11：Home 页首次加载显示一行淡提示「按 j/k 切换 · Enter 进入 · / 搜索」；按 `?` 弹 cheat sheet
- [ ] AC-12：cheat sheet 用户主动关闭后，刷新不再显示；localStorage key `coolpanda_kbd_hint_dismissed` 持久化
- [ ] AC-13：瀑布流卡片入场 stagger 按 column 偏移（首屏 N 张同时入场；后续卡片按 i % 列数 延迟 30ms）
- [ ] AC-14：详情页 `findEntryBySlug` 返回 undefined 时，显示内嵌 NotFound 卡片 + 「返回首页」按钮；不污染 history 栈
- [ ] AC-15：iframe 内 `<a href="#/p/xxx">` 点击后，父页面 HashRouter 正确切换路由（不出现 404）
- [ ] AC-16：iframe 内 `<a href="#section">`（纯锚点）点击后，iframe 内部滚动到目标（不切换父路由）
- [ ] AC-17：Hero LAST_UPDATED 从 listEntries() 派生（最新 entry date）；找不到 entry 时显示「—」
- [ ] AC-18：iframe shimmer 透明度提到 bg-brand-surface/85（仅 15% 透明）；大文档首帧不再透过
- [ ] AC-19：移动端 EntryDetail iframe 容器 `padding-bottom: 120px`，让 PrevNextNav 不遮挡内容
- [ ] AC-20：EntryCard tag chip 点击后，Home setQuery(tag) + 搜索框自动 focus；不连带触发整卡 navigate
- [ ] AC-21：EntryCard fallback 渐变按 entry.slug hash 选 4 种预设之一；相同 slug 永远同色
- [ ] AC-22：entry.metadata 新增可选 `readingTime` 字段；UI 仅在字段存在时显示「X 分钟阅读」
- [ ] AC-23：中文标题 fallback 不显示首字符（仅渐变 + 类型标签）；英文标题 fallback 显示首字母大写
- [ ] AC-24：tag chip 显示前 3 个 + 「+N」合并；>3 tag 时显示「+N」徽章
- [ ] AC-25：404 页面列出最近 3 条 entry（title + 链接），帮助用户找回内容
- [ ] AC-26：瀑布流响应式断点改为 `columns-1 md:columns-2 lg:columns-3 2xl:columns-4`
- [ ] AC-27：所有改动完成后 `npm run test` 通过（无回归）
- [ ] AC-28：所有改动完成后 `npm run build` 成功；产物 `dist/index.html` 大小增长 < 8 KB
- [ ] AC-29：所有改动完成后 `npm run dev` 启动正常；本地 8 个核心场景手测通过（首页 / 搜索 / 键盘 j/k / 详情页 / 404 / 滚顶 / 快捷键提示 / 同站链接）

### 不在本任务范围

- ✗ 全局 Navbar / Footer（违反 CLAUDE.md 规则 4 设计契约）
- ✗ 分类筛选 chip（违反 CLAUDE.md 规则 4「分类仅作 metadata」）
- ✗ 把 iframe 改回非 iframe 渲染（破坏详情页视觉隔离）
- ✗ 品牌色板更换（CLAUDE.md 规则 6 单一来源约束）
- ✗ 暗 / 亮主题切换（P2-12 列为评估项，本任务不做）
- ✗ 详情页阅读进度条（P2-13 列为评估项，本任务不做）

## Constraints

- **保持 Entry 模型契约**（CLAUDE.md 规则 2）：现有字段不变，新增字段全部可选
- **保持 EntryCard / SearchBar / Hero / 返回按钮 / 浮条 视觉语言统一**：所有新增 UI 必须走 `brand-*` token + `glass-pill` / 玻璃态规范
- **保持 HashRouter**：不引入 BrowserRouter（CLAUDE.md 规则 1）
- **保持 `?raw` 导入路径**：不引入新打包方式
- **保持 iframe 隔离**：`sandbox="allow-scripts allow-popups allow-forms"` 不加 `allow-same-origin`（除非同站链接拦截功能必须；评估后可加但需明确文档化）
- **保持移动端 hover 守卫**：所有 hover 态包在 `[@media(hover:hover)]:` 下
- **保持 prefers-reduced-motion**：所有新动画遵守
- **保持品牌字体**：不加新字体 @import
- **不引入新运行时依赖**：所有功能用 React 18 内建 + 现有 lucide-react + react-router-dom + react-helmet-async 实现
- **代码必须有详细中文注释**（CLAUDE.md 规则 1-4）

## Out of Scope（明确不做）

- SEO 静态预渲染（vite-plugin-prerender；08-17 已记为已知限制）
- 暗 / 亮主题切换（评估项）
- 详情页阅读进度条（评估项）
- PWA / Service Worker
- 多语言 i18n
- 评论系统

## Notes

- 本次优化按三波独立交付，每波可单独 commit / revert
- 每波开始前会先 create child task + 写子 prd.md / implement.md
- 实施过程中走 trellis-before-dev / trellis-check 子代理
- 完成后 trellis-update-spec 把本次学习沉淀到 `.trellis/spec/`