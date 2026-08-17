// PrevNextNav：详情页底部「上一篇 / 下一篇」浮条。
//
// 设计目标（见 .trellis/tasks/08-16-detail-prev-next-nav/prd.md）：
//   - 用户在瀑布流看完一篇后，无需返回首页即可翻下一篇。
//   - 视觉风格与 EntryDetail 左上角「← 返回」按钮完全一致（同款玻璃态胶囊）
//     —— 用户视线从顶部移到底部时风格不断裂。
//
// 视觉规格（与 EntryDetail 返回按钮 / NotFound 返回按钮同款）：
//   - 容器：bg-brand-surface/60 + backdrop-blur-md（玻璃感）
//           border border-brand-primary/40（紫蓝边）
//           shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]（紫蓝微光）
//   - 按钮：text-brand-light → hover:text-brand-glow + 紫光增强
//   - 字体：JetBrains Mono（font-mono，与返回按钮同款工程感）
//
// 定位：
//   - fixed bottom-6 left-1/2 -translate-x-1/2 → 视口底部居中
//   - z-50 → 与左上角「← 返回」同档，互不遮挡（DOM 顺序保证返回按钮在上层）
//   - 浮条在父页 DOM，**不进入 iframe**；iframe 内滚动与浮条互不影响
//
// 边界处理：
//   - prev === null（首篇）：左按钮 disabled + opacity-40 cursor-not-allowed pointer-events-none
//   - next === null（末篇）：右按钮同理
//   - 两者都 null（理论上不会出现 —— 至少有一篇 → 至少有一边有邻居）
//     防御性 return null，组件直接不渲染
//
// 响应式：
//   - 桌面（≥ sm）：flex 横向排列，左右按钮并排
//   - 移动（< sm）：flex-col 垂直堆叠 + max-w-[calc(100vw-2rem)] 防爆框
//   - 标题始终 truncate（max-w 限制单按钮宽度），长标题自动省略
//
// 路由切换：
//   - 用 Link 而非 navigate() 调用：保留 react-router 的 prefetch / scroll restore 等能力
//   - EntryDetail 重新渲染时浮条随之更新（同组件实例，因为 entry 来自父组件传值；
//     详情页只是 entry prop 换了 → PrevNextNav prev/next prop 也换）
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 单按钮内部结构：图标 + 截断标题 + max-width 防爆框。
// 抽出来是因为左 / 右两按钮结构对称，避免在 JSX 里写两份。
//
// props:
//   - to:       string|null   跳转 slug（null 时按钮 disabled）
//   - title:    string|null   邻居标题（null 时显示「无」类占位；实际由调用方保证非 null）
//   - position: 'left'|'right' 决定图标在左还是右
//
// hover 行为：边框变 glow/70 + 紫光增强 + 文字变 glow（与返回按钮 hover 同款）
function NavButton({ to, title, position }) {
  const isLeft = position === 'left';
  // 通用样式：复用 .glass-pill（src/index.css @layer components 定义）；
  // 额外追加 hover:text-brand-glow，因为 prev/next 标题是用户需要主动选择的入口
  // （不像「← 返回」是单一固定动作），hover 文字变色让用户清楚"这个是会被点击的"
  const baseClass =
    'glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono ' +
    '[@media(hover:hover)]:hover:text-brand-glow';

  // 标题截断：max-w 控制单按钮宽度，避免「上一篇很长的标题」撑爆整个浮条
  // truncate = overflow-hidden + text-ellipsis + whitespace-nowrap
  const titleClass = 'max-w-[10rem] truncate';

  // 禁用态：首篇 / 末篇时对应方向
  // 用 <button disabled> 而非 <a>：保留键盘 tab focus 流，但点击无反应
  if (!to || !title) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={
          baseClass +
          ' opacity-40 cursor-not-allowed pointer-events-none'
        }
      >
        {isLeft && <ChevronLeft size={14} aria-hidden />}
        <span className={titleClass}>{isLeft ? '已是首篇' : '已是末篇'}</span>
        {!isLeft && <ChevronRight size={14} aria-hidden />}
      </button>
    );
  }

  return (
    <Link
      to={`/p/${to}`}
      className={baseClass}
      // aria-label 让 screen reader 朗读完整语义（标题本身也朗读，但加 label 更明确）
      aria-label={isLeft ? `上一篇：${title}` : `下一篇：${title}`}
    >
      {isLeft && <ChevronLeft size={14} aria-hidden />}
      <span className={titleClass}>{title}</span>
      {!isLeft && <ChevronRight size={14} aria-hidden />}
    </Link>
  );
}

// PrevNextNav：详情页底部浮条入口组件。
//
// props:
//   - prev: Entry|null   上一篇（date 更早）邻居；首篇时为 null
//   - next: Entry|null   下一篇（date 更新）邻居；末篇时为 null
//
// 防御性：两者都 null 时直接 return null（极端情况：库只剩 1 篇）
// 实际场景里至少有一边有邻居；一边为 null 是常态（首/末篇）。
export default function PrevNextNav({ prev, next }) {
  // 极端情况：只有当前 entry 一篇 → 没有邻居 → 不渲染浮条
  // 否则浮条会出现「两个 disabled 按钮」的丑陋空状态
  if (!prev && !next) return null;

  return (
    // 浮条容器：fixed bottom-6 居中 + 玻璃态胶囊（同款返回按钮）
    // flex flex-col → 小屏垂直堆叠（sm:flex-row 横排）
    // max-w 限制防移动端爆框；gap 控制两按钮间距
    <nav
      aria-label="上一篇 / 下一篇导航"
      // 关键：z-50 与左上角返回按钮同档，DOM 顺序保证返回按钮在上层
      // 视觉上互不重叠：返回按钮在 top-4 left-4，本浮条在 bottom-6 left-1/2
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 flex flex-col sm:flex-row gap-2
                 px-2 py-2 rounded-md
                 bg-brand-surface/60 backdrop-blur-md
                 border border-brand-primary/40
                 shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
                 max-w-[calc(100vw-2rem)]"
    >
      {/* 左按钮：prev（日期更早） */}
      <NavButton
        to={prev?.slug ?? null}
        title={prev?.title ?? null}
        position="left"
      />
      {/* 右按钮：next（日期更新） */}
      <NavButton
        to={next?.slug ?? null}
        title={next?.title ?? null}
        position="right"
      />
    </nav>
  );
}