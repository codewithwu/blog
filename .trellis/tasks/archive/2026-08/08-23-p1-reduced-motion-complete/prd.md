# P1-4: prefers-reduced-motion 补全

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

修复 ui-ux-pro-max 诊断 A6：当前 `prefers-reduced-motion: reduce` 媒体查询只关了 aurora-drift / heroFade / hover transform，但瀑布流入场 stagger 的 `transitionDelay` + `useReveal` 的 `transition-opacity` 未关。index.css 加暴力兜底 + Home 的 revealDelay 计算按 matchMedia 强制 0。

## Requirements

### 1. index.css 暴力兜底

- `src/index.css:104-115` 的 `@media (prefers-reduced-motion: reduce)` 块扩展为：
  ```css
  @media (prefers-reduced-motion: reduce) {
    /* 现有：禁用装饰动画 + hover 发光位移 */
    .animate-heroFade,
    .animate-aurora-drift,
    .animate-aurora-drift-slow {
      animation: none !important;
    }
    .group:hover {
      transform: none !important;
      box-shadow: none !important;
    }
    /* 新增：暴力兜底所有 transition（覆盖 waterfall stagger + useReveal + hover） */
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }
  ```

### 2. Home 的 revealDelay 双保险

- `src/pages/Home.jsx:262-272` 的瀑布流入场延迟计算：
  ```jsx
  // 在 render 顶部加：
  const reduceMotion = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // 修改 revealDelay 计算：
  const revealDelay = reduceMotion ? 0 : (isFirstScreen ? 0 : columnIndex * 30);
  ```
- 注：jsdom 无 `window.matchMedia`，已用 `typeof === 'function'` 守卫

### 3. 测试更新

- `tests/home.test.jsx`：
  - 新断言：在 jsdom 模拟 `matchMedia('(prefers-reduced-motion: reduce)').matches === true` 后，瀑布流首屏卡片 transitionDelay 仍为 0ms
  - 新断言：模拟 reduce-motion false 时，首屏外卡片 transitionDelay === columnIndex * 30ms（保留原行为）

## Acceptance Criteria

- [ ] **AC-1**：prefers-reduced-motion: reduce 时瀑布流入场 stagger 立即生效（无 transitionDelay 等待）
- [ ] **AC-2**：prefers-reduced-motion: reduce 时 useReveal 的 transition-opacity 不再闪（duration 强制 0.01ms）
- [ ] **AC-3**：prefers-reduced-motion: reduce 时 aurora-drift / heroFade 完全停（原有行为保留）
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功；gzip CSS 增长 < 0.5 KB

## 验证场景

- DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`
- 刷新瀑布流首页：所有卡片立即可见，无 stagger 入场
- 滚动页面：useReveal 触发但 transition-opacity 几乎瞬时（0.01ms）
- 极光：完全停止漂移

## 改动文件清单

修改：
- `src/index.css`
- `src/pages/Home.jsx`
- `tests/home.test.jsx`

新增：无

## Out of Scope

- ✗ 字体 preload（D5）—— 锦上添花
- ✗ `:not([data-no-reduced])` 限定（避免 universal selector）—— design.md §2.4 取舍，本期优先简单可靠

## Notes

- universal selector `*` 在 reduced-motion 媒体查询分支内，影响性能可接受（仅启用 reduce-motion 用户的特定分支）
- 双保险策略：CSS 兜底 + JS 计算保证即使某条路径 CSS 没生效（如第三方工具类），JS 也强制 0