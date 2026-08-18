// BackButton：详情页 / NotFound 共用的「返回」玻璃态胶囊。
//
// 抽出动机（父任务 08-18-ux-optimization-suite P0-1）：
//   - EntryDetail 与 NotFound 原本各自内联一段玻璃态按钮（EntryDetail.jsx:104-113
//     与 NotFound.jsx:51-57），className / ariaLabel / 文案 / 行为完全一致
//   - 抽出后单一来源，新增 P0「详情页 mount 焦点」和 P1「内嵌 404」只需改一处
//
// API：
//   - to:        string         react-router Link 的 to（必填）
//   - ariaLabel: string          屏幕阅读器朗读（默认「返回首页」）
//   - children:  ReactNode      按钮内文本（默认「← 返回」）
//   - className: string         追加样式（外边距 / padding / 字号）
//   - ref:       forwardRef     父组件持有 DOM 引用（EntryDetail 用它做 mount focus）
//
// 焦点机制：
//   - forwardRef 暴露原生 <a> DOM 引用，父组件可调用 .focus({ preventScroll: true })
//   - EntryDetail 的 useFocusBackOnMount 在 mount 后下一帧调它
//   - 移动端触控目标 ≥ 44pt（mobile UX 最低标准，详情见 src/index.css @media 守卫
//     与 [@media(max-width:640px)]:min-h/min-w utility）
//
// a11y：
//   - aria-label 默认「返回首页」，覆盖默认文本「← 返回」（避免屏幕阅读器把
//     箭头符号读出来）
//   - 焦点态走浏览器原生 outline（玻璃态不需要额外 focus-visible:ring）
//
// 实现细节：
//   - 用 react-router Link 而非裸 <a>，保留 SPA 路由能力（无整页刷新）
//   - id="back-button" 让 skip-link（EntryDetail.jsx 即将新增）能锚定到此元素
//   - glass-pill class 在 src/index.css @layer components 定义，含 hover 发光效果
//     并包在 @media (hover: hover) 守卫内（避免触屏 tap 残留 hover 态）
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const BackButton = forwardRef(function BackButton(
  { to, ariaLabel = '返回首页', children = '← 返回', className = '' },
  ref,
) {
  // 基础类：glass-pill（玻璃态胶囊 + 紫蓝边 + hover 紫光增强）
  // + 默认桌面紧凑样式 + 移动端触控目标 ≥ 44pt
  // + 居左 / 字小 / 等宽字体（与原 EntryDetail 内联实现 1:1 等价）
  const baseClass =
    'glass-pill inline-flex items-center ' +
    'px-3 py-1.5 rounded-md text-sm font-mono ' +
    // 移动端（< 640px）放大触控目标到 ≥ 44pt，符合 WCAG 2.5.5 / Apple HIG
    '[@media(max-width:640px)]:min-h-[44px] [@media(max-width:640px)]:min-w-[44px] ' +
    '[@media(max-width:640px)]:px-4 [@media(max-width:640px)]:py-2 ' +
    className;

  return (
    <Link ref={ref} to={to} aria-label={ariaLabel} id="back-button" className={baseClass}>
      {children}
    </Link>
  );
});

export default BackButton;