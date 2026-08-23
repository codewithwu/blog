# P1-3: EntryDetail 内嵌 404 复用 NotFound 视觉

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

修复 ui-ux-pro-max 诊断 B4：EntryDetail 的内嵌 404（slug 不存在）当前是裸 div + 小 404 标题 + BackButton，与 NotFound 满极光 + 巨大渐变 404 数字 + 副文案的体验分裂。引入 AuroraBackdrop 与 NotFound 同款视觉，保留 `/p/:slug` 路由不 navigate。

## Requirements

### 1. 改造内嵌 404 视觉

- `src/pages/EntryDetail.jsx:58-71` 的 `if (!entry) return ...` 块改为：
  ```jsx
  if (!entry) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AuroraBackdrop intensity="fullscreen" />
        <div className="relative z-10 text-center px-6 max-w-md w-full">
          <h1
            className="font-serif italic text-[12rem] md:text-[16rem] leading-none tracking-tighter
                       bg-gradient-to-br from-brand-accent via-brand-primary to-brand-glow
                       bg-clip-text text-transparent
                       drop-shadow-[0_0_32px_rgba(91,141,239,0.35)]"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            404
          </h1>
          <p className="mt-4 text-lg text-brand-accent font-mono">文章不存在或已被移除</p>
          <p className="mt-2 text-sm text-brand-dim font-mono">/p/{slug}</p>
          <BackButton to="/" className="mt-10 px-6 py-2" ref={backButtonRef}>
            返回首页
          </BackButton>
        </div>
      </div>
    );
  }
  ```

### 2. 引入 AuroraBackdrop

- `src/pages/EntryDetail.jsx` 加 `import AuroraBackdrop from '../components/AuroraBackdrop.jsx';`

### 3. 复用 useFocusBackOnMount

- `backButtonRef` 已在 useFocusBackOnMount 调用中（src/pages/EntryDetail.jsx:50 + 76）
- 把 `ref={backButtonRef}` 加到内嵌 404 的 `<BackButton>` 上，确保 mount 后焦点送到 BackButton

### 4. 测试更新

- `tests/entry-detail.test.jsx`：
  - 现有断言「内嵌 404 显示 404」需细化：现在测试应断言 `<h1>` 文本 "404" + 父容器有 `aurora-bg` class（AuroraBackdrop 渲染标记）
  - 或断言：内嵌 404 的 `<div>` 包含 AuroraBackdrop 子节点

## Acceptance Criteria

- [ ] **AC-1**：EntryDetail 找不到 entry 时显示 AuroraBackdrop + 巨大渐变 404 数字（与 NotFound 视觉对齐）
- [ ] **AC-2**：内嵌 404 仍保留 `/p/:slug` 路由（URL 不变；不 navigate 到 /）
- [ ] **AC-3**：内嵌 404 mount 后 BackButton 获得焦点（ref 复用）
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功；gzip JS 体积增长 < 0.3 KB

## 验证场景

- `npm run dev` + 访问 `/p/不存在-slug`
- 视觉：满极光（与 `/不存在路径` 触发 NotFound 一致）
- 路由：URL 仍是 `/p/不存在-slug`，点击 BackButton → 跳到 `/`

## 改动文件清单

修改：
- `src/pages/EntryDetail.jsx`
- `tests/entry-detail.test.jsx`

新增：无

## Out of Scope

- ✗ NotFound 文案加引导小字（C6）—— 文案任务
- ✗ NotFound skip-link（P0-2 单独任务）
- ✗ 抽象 NotFound 组件（避免引入"最近发布"列表副作用）—— design.md §2.3 取舍

## Notes

- **不抽 NotFound 组件**：内嵌 404 不需要"最近发布"列表（listEntries().slice(0, 3) 的额外开销）；复制粘贴视觉模板比强行抽象更稳
- 视觉与 NotFound 对齐，但文案不同（内嵌 404 文案 "文章不存在或已被移除" + 显示当前 slug 路径，便于调试）
- AuroraBackdrop 的 `intensity="fullscreen"` 让极光 60s 漂移（与 NotFound 同款），与 iframe 详情页的 30s 节奏（Hero）形成层次差异