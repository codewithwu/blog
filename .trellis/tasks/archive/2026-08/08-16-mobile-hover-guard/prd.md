# 移动端 hover 守卫

## Goal

触屏设备（无 hover 能力的设备）禁用卡片 hover 抬升 + GitHub / Demo 链接 hover 颜色，避免 tap 后残留 hover 状态。Tailwind 3.4+ 原生支持 `[@media(hover:hover)]:` arbitrary variant，无需新依赖。

## Background

- `src/components/EntryCard.jsx:46-50` 整卡 `hover:-translate-y-0.5 hover:border-brand-primary/50 hover:shadow-[...]` —— 触屏 tap 后会残留（iOS Safari 尤其严重）
- `src/components/EntryCard.jsx:121, 132` GitHub / Demo 链接 `hover:text-brand-glow` —— 触屏同样残留
- `src/components/Hero.jsx` / `src/pages/EntryDetail.jsx` 也有 hover 态，但触屏影响较轻（Hero 不 sticky，返回按钮焦点态不依赖 hover）

## Requirements

### 改造 `EntryCard.jsx`

把以下类名改为带 `[@media(hover:hover)]:` 前缀：

- `hover:-translate-y-0.5` → `[@media(hover:hover)]:-translate-y-0.5`
- `hover:border-brand-primary/50` → `[@media(hover:hover)]:border-brand-primary/50`
- `hover:shadow-[0_0_0_1px_rgba(91,141,239,0.4),0_8px_32px_-8px_rgba(167,139,250,0.35)]` → `[@media(hover:hover)]:shadow-[...]`
- `group-hover:text-brand-glow` → `[@media(hover:hover)]:group-hover:text-brand-glow`（h3 title，EntryCard.jsx:90-91）
- `hover:text-brand-glow`（GitHub / Demo 链接）→ `[@media(hover:hover)]:text-brand-glow`

### 验证范围

- 检查其他组件是否也有触屏残留风险：
  - `src/components/Hero.jsx`：站名 hover 不影响布局（无 translate），可不动
  - `src/pages/EntryDetail.jsx`：返回按钮 hover 是颜色 + shadow 切换，触屏残留明显，建议同样加 `[@media(hover:hover)]:` 前缀
  - `src/pages/NotFound.jsx`：返回首页按钮同上，建议同样处理
- 范围限定：本期只动 `EntryCard.jsx`，若验证发现 EntryDetail / NotFound 也痛则一并改

### 焦点态保留

- `focus-visible:ring-2 focus-visible:ring-brand-glow` **不动**——键盘 focus 是核心 a11y，触屏不影响

## Acceptance Criteria

- [ ] `EntryCard.jsx` 所有 `hover:*` 类名前缀加 `[@media(hover:hover)]:`
- [ ] Chrome devtools 切换到 iPhone / iPad 模拟器，整卡不再有 hover 抬升；GitHub 链接不再变色
- [ ] 桌面端（鼠标 hover）行为不变：抬升 / 边框 / shadow / 文字变色都生效
- [ ] 键盘 focus 行为不变：focus ring 始终显示
- [ ] 触屏 tap 后不再残留 hover 视觉态（之前需二次 tap 才消失）
- [ ] 不引入新 npm 依赖；纯 Tailwind arbitrary variants
- [ ] `npm run test` 通过
- [ ] `npm run build` 通过

## Out of Scope

- 整站 `@media (hover: hover)` 全局 CSS 重写——本期只在 EntryCard 层面处理
- iOS Safari `-webkit-tap-highlight-color` 自定义：与 hover 残留不同问题，独立考虑
- 触屏专属交互（long press 弹出菜单等）：本期不做

## Technical Notes

- Tailwind arbitrary variants 语法：`[@media(hover:hover)]:<utility>` 在 v3.1+ 支持
- 不需要 `@layer` 或自定义 plugin
- 不修改 CLAUDE.md / design.md

## Risks

- **Tailwind JIT 编译 arbitrary variant** 偶尔有 edge case（特殊字符未转义）；hover:hover 双重冒号需要 bracket 包住
- **Firefox Android 行为**：firefox android 现在 hover:none 正确判定，但旧版本可能仍按 hover 处理。这是 marginal 风险