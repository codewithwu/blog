// AuroraBackdrop：极光装饰层（不依赖任何运行时数据，纯展示单元）。
//
// 设计意图（见 design.md §2.1 / implement.md §2）：
//   - 给 Home Hero 提供极光漂移背景；给 NotFound 提供全屏极光。
//   - 三层 radial-gradient 圆斑（紫 / 蓝 / 青）叠 mix-blend-mode: screen，
//     形成"深海中的光"质感；不阻塞鼠标交互（pointer-events: none）。
//   - 两个 intensity 决定尺寸 / 漂移节奏：'hero' 限 Hero 容器 + 30s 漂移，
//     'fullscreen' 覆盖视口 + 60s 漂移（更慢，404 戏剧化）。
//
// P0 改造（父任务 08-18-ux-optimization-suite P0-8）：
//   - 'hero' intensity 下给外层容器加 mask-image：底部 30% 渐隐到透明
//     让极光在 Hero 底部淡出，平滑过渡到下方 SearchBar 玻璃态
//     （不再「极光全亮 → SearchBar 玻璃态」突变）
//   - 'fullscreen' 不加 mask：404 页极光戏剧化保留到底
export default function AuroraBackdrop({ intensity = 'hero' }) {
  const isFull = intensity === 'fullscreen';

  // 外层容器：'fullscreen' 走 fixed inset-0，'hero' 走 absolute inset-0 让父容器定位。
  // 装饰层永远在内容之下、噪点之上；aria-hidden 防止被 AT 朗读。
  // hero 模式额外加 mask-image：底部 30% 渐隐（08-18 P0-8 视觉粘合）
  const outer = isFull
    ? 'aurora-bg pointer-events-none fixed inset-0 -z-10'
    : `aurora-bg pointer-events-none absolute inset-0 -z-10
       [mask-image:linear-gradient(to_bottom,black_75%,transparent)]
       [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent)]`;

  // 漂移节奏：fullscreen 更慢（60s），hero 30s；两种都用 ease-in-out alternate 形成呼吸。
  const driftClass = isFull ? 'animate-aurora-drift-slow' : 'animate-aurora-drift';

  // 三层圆斑：通过 translate / scale / opacity 复合，避开 layout 与 paint。
  // 颜色取自 design.md D-2：accent #a78bfa / primary #5b8def / glow #4cc9f0。
  return (
    <div className={outer} aria-hidden="true">
      <div
        className={`absolute -top-24 -left-24 h-[60vmin] w-[60vmin] rounded-full
                    opacity-30 mix-blend-screen blur-3xl ${driftClass}`}
        style={{
          background:
            'radial-gradient(circle at center, rgba(167,139,250,0.6), rgba(167,139,250,0) 65%)',
        }}
      />
      <div
        className={`absolute top-1/3 right-[-15%] h-[55vmin] w-[55vmin] rounded-full
                    opacity-25 mix-blend-screen blur-3xl ${driftClass}`}
        style={{
          background:
            'radial-gradient(circle at center, rgba(91,141,239,0.55), rgba(91,141,239,0) 65%)',
          animationDelay: '-10s',
        }}
      />
      <div
        className={`absolute bottom-[-20%] left-1/4 h-[50vmin] w-[50vmin] rounded-full
                    opacity-25 mix-blend-screen blur-3xl ${driftClass}`}
        style={{
          background:
            'radial-gradient(circle at center, rgba(76,201,240,0.55), rgba(76,201,240,0) 65%)',
          animationDelay: '-20s',
        }}
      />
    </div>
  );
}