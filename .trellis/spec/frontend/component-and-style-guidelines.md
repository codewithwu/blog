# Component and Style Guidelines

## 适用范围

新增或修改 `src/components/`、`src/pages/` 的展示结构、Tailwind 类、交互、图标、响应式布局和可访问性时遵循本规范。文章/项目 iframe 内部样式不属于主站组件层，见 [Data and Rendering](./data-and-rendering.md)。

## 组件形状

项目统一使用函数组件和 ESM 默认导出：

```jsx
export default function ToolCard({ tool }) {
  const Icon = Icons[tool.icon] || Icons.Wrench;
  return <div>{/* presentation */}</div>;
}
```

证据：`src/components/ToolCard.jsx`、`src/components/SkillBar.jsx`、`src/pages/Tools.jsx`。

- 在函数签名中解构简单 props；复杂派生值在 JSX 前计算。
- 页面负责组合 data/lib 结果；卡片负责单条展示，不在卡片里查询全局 registry，除非该组件确实拥有显示名映射职责（如 `ArticleCard` 读取分类显示名）。
- 列表渲染使用稳定领域键：文章/项目用 `slug`，分类用 `category`，条目用唯一 `name`。不要用数组 index 掩盖重复数据。
- 条件内容用清晰的提前返回或短路渲染；找不到路由实体时由详情页 `<Navigate replace>` 处理。

## 复用与组合

复用真实重复，而不是为一个调用点提前抽象：

- 文章和项目详情共同使用 `src/lib/html.jsx`，因此 iframe 行为只能在 `Html` 中修改。
- 各路由页面共同使用 `usePageTitle`。
- 重复的卡片/条目视觉放在 `src/components/`；页面只负责 grid 和 section。
- 相似但合同不同的 ArticleCard/ProjectCard 不强行合并：前者有嵌套分类链接和键盘导航，后者有外链与可选 content。

新增工具函数前先搜索 `src/lib/`；新增视觉单元前先搜索 `src/components/`。只有重复出现或具有独立行为合同的结构才提取。

## 主站品牌系统

视觉修改必须同时遵循项目 `brand-guidelines`、`tailwind.config.js` 和 `src/index.css`。

### 颜色 token

| Tailwind token | 色值 | 用途 |
|---|---|---|
| `brand-dark` | `#141413` | 页面深色背景 |
| `brand-surface` | `#1c1b1a` | 卡片、引用和次级表面 |
| `brand-light` | `#faf9f5` | 主文字 |
| `brand-mid` | `#b0aea5` | 次要文字、低对比边框 |
| `brand-gray` | `#e8e6dc` | 浅色辅助背景 |
| `brand-orange` | `#d97757` | 主强调、active、主要操作 |
| `brand-blue` | `#6a9bcc` | 链接、次级强调 |
| `brand-green` | `#788c5d` | 第三强调、状态/标签 |

主站 JSX 使用 `brand-*` 类，不在同一个组件里散落同义 hex。调整品牌色时以 `tailwind.config.js` 为单一入口，并检查 `src/index.css` 是否存在对应硬编码。

### 字体

- 标题：Poppins，回退 Arial。
- 正文：Lora，回退 Georgia。
- 字体在 `src/index.css` 全局导入和设置；组件通常不重复指定 font-family。

### 组件视觉语法

现有组件重复使用：

- `rounded-xl bg-brand-surface border border-brand-mid/20` 作为卡片基底。
- `hover:-translate-y-1 hover:shadow-lg` + accent border 作为可点击卡片反馈。
- `transition-all duration-300` 或 `transition-colors`，不添加夸张/长时动画。
- 页面 grid 从移动单列逐级到 `md`/`lg` 多列，例如项目 `md:grid-cols-2 lg:grid-cols-3`。
- 标题层级保持 `h1` 页面标题、`h2` 分组、`h3` 卡片标题。

改动时匹配邻近组件的 spacing 和 comment density，不创建另一套 design token。

## 图标

- 统一从 `lucide-react` 引入，不混用 FontAwesome、emoji 图标包或自绘 icon component。
- 固定图标使用命名 import，例如 `Github`, `ExternalLink`, `Mail`。
- 工具数据的 icon 是字符串；`ToolCard` 使用 `Icons[tool.icon] || Icons.Wrench` 动态解析。新增 icon 名应先确认 lucide-react 实际导出并保持 PascalCase。
- 图标尺寸通常由组件显式设置（如 `size={16}`/`size={20}`），不要依赖不透明的全局 CSS。

## 交互与可访问性

沿用源码已有模式：

- 导航和内部跳转用 `Link`/`NavLink`，active 状态使用 `aria-current`。
- 外部链接使用 `target="_blank" rel="noreferrer"`。
- iframe 必须有由 metadata 提供的可读 `title`。
- 自定义可点击容器必须同时支持键盘和焦点视觉。`ArticleCard.jsx` 使用 `role="link"`、`tabIndex={0}`、Enter 处理和 `focus-visible` ring。
- 原生 `<a>`/`<button>` 能表达语义时优先使用原生元素。若容器内还需要嵌套 Link（ArticleCard 的分类 chip），才采用经过测试的自定义容器模式。
- 点击嵌套外链时要阻止触发外层卡片导航；当前 `ProjectCard` 使用 `stopPropagation`，修改其结构时要用交互测试验证。
- 文字与背景使用现有高对比 token；次要文字 `brand-mid` 不用于关键操作。

## 数据容错显示

组件仅在现有合同明确要求时 fallback：

- Tool icon 未识别 → `Wrench`。
- Skill level 未识别 → “进阶”的绿色样式（parser 通常已先归一化）。
- Article category 显示名未找到 → 回退 slug，但数据完整性测试应防止这种状态。
- Project 没有 `content` → 静态卡，不链接到不存在的详情。

不要用大量 optional chaining 静默吞掉必填 metadata；必填字段缺失应在内容注册/测试阶段暴露。

## 注释与可维护性

项目要求详细中文注释。应说明：

- 为什么选择特殊 DOM 结构（如可点击容器内嵌 Link）。
- fallback 的业务原因。
- Tailwind/iframe 边界或浏览器限制。
- 多处看似重复但不能合并的交互差异。

避免把 className 每个 token 翻译成注释。长 className 可按布局/颜色/交互分行，保持现有文件风格。

## 反模式

- 在主站组件中新增未注册的颜色体系或直接复制文章 iframe 的内联 CSS。
- 在 iframe 作者 HTML 中假设 `brand-*` Tailwind 类会生效。
- 混用图标库、用字符串 emoji 替代 Lucide 图标。
- 用数组 index 作动态列表 key。
- 只有 mouse click，没有 keyboard/focus 状态。
- 把 data 查找、Markdown 解析或 document wrapping 塞进展示组件。
- 为减少两三行 JSX 而创建难以命名、只使用一次的“万能组件”。

## 验证

组件行为优先使用 `@testing-library/react` 观察 DOM，而不是测试实现细节：

- 断言链接目标、aria 属性、iframe title/sandbox/class。
- 用 `MemoryRouter` 包裹依赖 Router 的组件。
- 视觉改动至少运行 `npm run build`，并在真实响应式视口检查 mobile/tablet/desktop。
- 交互改动覆盖鼠标与键盘路径。
