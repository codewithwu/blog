# P0-1: EntryCard 改 <a href> 包裹整卡

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

根除 ui-ux-pro-max 诊断 A1：EntryCard 当前用 `<div role="link" tabIndex={0}>` 是 a11y Critical 反模式（guideline「Compact Control Semantics / Severity: Critical」）。改为 `<a href={'/p/'+slug}>` 包裹整张卡，结构上等价于一个超链接。

## Requirements

### 1. 外层改为 `<a>`

- `src/components/EntryCard.jsx:91-121` 的 `<div ref={mergedRef} role="link" tabIndex={0} onClick={go} onKeyDown={...}>` 改为：
  ```jsx
  <a ref={mergedRef} href={`/p/${entry.slug}`} className="...">
  ```
- 移除 `role="link"`（`<a>` 原生就是 link）
- 移除 `tabIndex={0}`（`<a href>` 原生 focusable）
- 移除 `onClick={go}` 与 `onKeyDown={...}`（`<a>` 原生处理 Enter 跳转 + 中键打开 + 复制链接）
- 保留 `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-glow`（`<a>` 的 focus-visible 走 Tailwind 工具类）

### 2. 内部按钮 preventDefault + stopPropagation

- tag chip `<button onClick={(e) => { e.stopPropagation(); onTagClick?.(t); }}>` —— 在 `<a>` 内必须 `e.preventDefault()` 阻止外层 `<a>` 跳转：
  ```jsx
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(t); }}
  ```
- category chip 同上
- 项目 GitHub 链接当前是 `<a target="_blank">` —— **HTML 规范禁止 `<a>` 嵌套 `<a>`**，需要改 `<button onClick={() => window.open(entry.links.github, '_blank', 'noopener,noreferrer')}>` + `[@media(max-width:640px)]:min-h-[44px]`（A6 跨范围共性）
- 项目 Demo 同上

### 3. tag/category chip 移动端触控目标 ≥ 44pt

- A6 跨范围共性问题：当前 chip 移动端无 `[@media(max-width:640px)]:min-h-[44px]` 守卫
- category chip + tag chip 都补：`[@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px]`

### 4. 测试更新

- `tests/entry-card.test.jsx` 现有断言「`role="link"`」「`tabIndex=0`」需改：
  - 断言 `card.tagName === 'A'`（不是 'DIV'）
  - 断言 `card.getAttribute('href') === '/p/<slug>'`
  - 断言：`card.getAttribute('role')` 为 null（不显式声明 role）
- 新断言：tag chip 点击不触发整卡 navigate（mock `navigate` 后 chip click → navigate 未被调用）
- 新断言：移动端（max-width:640px）tag chip computed style min-height ≥ 44px

## Acceptance Criteria

- [ ] **AC-1**：EntryCard 渲染 `<a href="/p/<slug>">` 而非 `<div role="link">`
- [ ] **AC-2**：卡片内 button（tag/category chip、GitHub/Demo）点击时不触发整卡 navigate（preventDefault + stopPropagation）
- [ ] **AC-3**：tag/category chip 移动端（<640px）触控目标 ≥ 44pt
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功；gzip JS 体积增长 < 0.5 KB

## 验证场景

- `npm run dev` + 首页：
  - 鼠标点击卡片任意空白区 → 跳转 /p/<slug>
  - 鼠标点击 tag chip → 只触发搜索，不跳转
  - 鼠标中键点击卡片 → 在新标签页打开 /p/<slug>（验证 `<a>` 原生行为）
  - 移动端模拟：tag chip 可点区域 ≥ 44x44 px

## 改动文件清单

修改：
- `src/components/EntryCard.jsx`
- `tests/entry-card.test.jsx`

新增：无

## Out of Scope

- ✗ 项目外链视觉风格统一（A5）—— 风格选择，延后
- ✗ EntryCard 项目卡片高度对齐（A8）—— 视觉微调

## Notes

- Home 的 `cardRefs.current[i]` 仍然有效（`<a>` 与 `<div>` 同样 focusable，ref 引用不变）
- 嵌套 `<a>` 改 `<button>` 后项目外链的"target=_blank"语义保持（通过 `window.open` 第二个参数）