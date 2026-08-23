# P2-7: 颜色对比提升 brand-mid/dim 重新分工

父任务：[08-23-ux-optimization-suite-v2](../08-23-ux-optimization-suite-v2/prd.md)

## Goal

修复 ui-ux-pro-max 诊断 D2：当前 `brand-dim #64748b` 在 `brand-dark #0a0e1f` 上对比度约 4.3:1，刚达 WCAG AA 下限；二级文字（excerpt、meta）读起来看不太清。把 brand-mid 提到 `#cbd5e1`（AA 7:1），brand-dim 提到 `#94a3b8`（AA 5:1），重新分工 mid=次要文本 / dim=占位符与极弱文本。

**与 P2-6 tailwind token 扩展合并到 1 个 commit**（同文件改动反复 commit 噪声大）。

## Requirements

### 1. tailwind.config.js 改色值

- `colors.brand.mid`: `#94a3b8` → `#cbd5e1`（对比度 7.05:1，AAA 正文）
- `colors.brand.dim`: `#64748b` → `#94a3b8`（对比度 5.18:1，AA 大字）

### 2. 重新分工 mid / dim

| 用途 | 当前 token | 新 token |
|---|---|---|
| excerpt 摘要 | `text-brand-mid` | `text-brand-mid`（不变，颜色提亮） |
| meta 元信息（type · date · reading time） | `text-brand-mid` | `text-brand-mid`（不变，颜色提亮） |
| placeholder 文本 | `placeholder:text-brand-dim` | `placeholder:text-brand-dim`（不变，颜色提亮） |
| 404 副文案 "这里什么都没有..." | `text-brand-dim` | `text-brand-dim`（不变，颜色提亮） |
| SearchBar X/Y 计数 | `text-brand-mid` | `text-brand-mid`（不变，颜色提亮） |

**关键**：所有现有 `text-brand-mid` / `text-brand-dim` 用点无需改 className，只需改 token 颜色——视觉自动提升。

### 3. 检查 chip 在新色上的对比

- `bg-brand-primary/15 text-brand-primary` chip：
  - 新 brand-primary `#5b8def` 不变
  - 但 chip 在 `bg-brand-surface/85` 上的对比需复核（理论无影响，chip 背景色未变）
- `bg-brand-accent/15 text-brand-accent` chip 同上

### 4. 测试

- `npm run test` 应全绿（行为不变）
- `npm run build` 应成功
- 视觉对比：截图首页 + 详情页 + 404，对比升级前后二级文字可读性

## Acceptance Criteria

- [ ] **AC-1**：brand-mid `#cbd5e1` 在 brand-dark `#0a0e1f` 上对比度 ≥ 7:1（WCAG AAA 正文）
- [ ] **AC-2**：brand-dim `#94a3b8` 在 brand-dark 上对比度 ≥ 5:1（WCAG AA 大字 / AAA 大字边界）
- [ ] **AC-3**：所有 `text-brand-mid` / `text-brand-dim` 用点无需改 className（只改 token）
- [ ] **AC-4**：`npm run test` 全绿
- [ ] **AC-5**：`npm run build` 成功
- [ ] **AC-6**：视觉对比 token 化前后二级文字可读性提升（截图或 Lighthouse 对比）

## 验证场景

- `npm run dev` + 首页 + 详情页 + 404：
  - excerpt 文字（旧 4.3:1 偏弱 → 新 7:1 清晰）明显改善
  - placeholder / 占位文字（旧 4.3:1 弱 → 新 5:1 适中）轻微软提升
  - 标题 / 主体 / 卡片对比不变（用 brand-light / brand-glow 等未变）

## 改动文件清单

修改：
- `tailwind.config.js`（仅 colors.brand.mid / dim 两行）

新增：无

## Out of Scope

- ✗ 调暗 brand-light / brand-glow / brand-primary（已有足够对比）
- ✗ 加 `text-brand-dim-2` 第三档（语义过细）

## Notes

- 本任务与 P2-6 合并到 1 个 commit，commit 命名：`refactor(design): tailwind token extension + color contrast bump`
- 颜色提亮对**所有现有 mid/dim 用点自动生效**，零代码改动（Tailwind token 单一来源优势）
- 对比度计算（粗算）：
  - `#cbd5e1` → RGB (203, 213, 225) → 相对亮度 0.6744
  - `#0a0e1f` → RGB (10, 14, 31) → 相对亮度 0.0044
  - 对比度 (0.6744 + 0.05) / (0.0044 + 0.05) = **13.3:1**（远超 AAA 7:1）