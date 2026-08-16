# 设计:统一处理代码审查发现的问题

## 1. 品牌色板映射表(暖 → 冷)

来源:`content/claude-code-taming-guide.html` 当前 CSS 变量 → 目标 `tailwind.config.js` 冷色板

| 角色 | 旧(暖色) | 新(冷色,brand.*) | 用途 |
|---|---|---|---|
| `--bg` | `#141413` | `#0a0e1f` (`brand.dark`) | body 背景 |
| `--surface` | `#1c1b1a` | `#14193a` (`brand.surface`) | 卡片/分隔块底 |
| `--accent` | `#d97757`(橙) | `#a78bfa`(`brand.accent` 紫) | 主强调(链接/标题) |
| `--accent-alt` | `#6a9bcc`(蓝) | `#5b8def`(`brand.primary` 电光蓝) | 副强调(highlight) |
| `--accent-grn` | `#788c5d`(绿) | `#4cc9f0`(`brand.glow` 青蓝) | 状态/成功提示 |
| `--text`(隐含) | `#faf9f5` | `#f8fafc`(`brand.light`) | 主文字 |
| `--mid`(隐含) | `#b0aea5` | `#94a3b8`(`brand.mid`) | 次级文字 |

**取舍说明:**
- 暖色的 `--accent-grn`(绿)在冷色板里没有对应物 → 改为 `brand.glow` 青蓝(视觉上仍是「冷调里能跳出来」的强调色)。若文章内绿仅用于「成功状态」,后续也可以再讨论是否引入 `brand.success`,但本任务不扩 brand.* 集合
- `--accent-alt` 暖色蓝 `#6a9bcc` 与新 `brand.primary` `#5b8def` 视觉接近,但新 `brand.primary` 偏电光蓝更鲜明;直接替换
- 暖色 `--surface` `#1c1b1a` 是接近黑色的灰;冷色对应 `#14193a` 偏紫蓝近黑,体感更厚重 — 文章若有 surface 上的边框分隔,可能要顺手把 `border` 改为 `#2a3158`(`brand.border`)以维持层级感

## 2. 字体映射

| 旧 | 新 | 用途 | Fallback |
|---|---|---|---|
| Poppins | Fraunces(italic / opsz:144 大光学尺寸,serif 转角戏剧化) | 标题 | Georgia, serif |
| Lora | IBM Plex Sans | 正文 | system-ui, sans-serif |
| Menlo / Courier / 等宽(若用) | JetBrains Mono | 代码 / 标签 / 时间戳 | ui-monospace, monospace |

**替换方式:** 文章顶部 `@import url('...&family=Poppins:...&family=Lora:...')` 整段替换为 `src/index.css` 的同款 `@import`:

```
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

> 注意:CLAUDE.md 规则 4 已说明「iframe 不继承主站样式」,所以文章必须自己 `@import`。本次改版直接复用主站的同款 URL,保证视觉一致。

## 3. Hero.jsx tagline 修复方案

**选定方案:选项 b(去掉空串分支)**

理由:
- 选项 a 需要新增「只有 count=2 时显示的」特殊文案,可读性差、且未来条目数变化又要再改
- 选项 b 简单直接:`count <= 3` 直接显示「持续记录 AI 与工程心得」,与 `count <= 10` 文案相同,但语义上 OK(2 篇也是「持续记录」中)

变更前后:

```js
// 改前
function pickTagline(count) {
  if (count <= 0) return '欢迎';
  if (count <= 3) return '';        // ← 删掉这一行
  if (count <= 10) return '持续记录 AI 与工程心得';
  return '保持好奇,持续输出';
}

// 改后
function pickTagline(count) {
  if (count <= 0) return '欢迎';
  if (count <= 10) return '持续记录 AI 与工程心得';
  return '保持好奇,持续输出';
}
```

副作用:`key={count}` 触发重挂载的 `heroFade` 动画逻辑不受影响。

## 4. EntryDetail.jsx 渲染顺序修复

**当前问题代码(src/pages/EntryDetail.jsx:22-30):**

```jsx
export default function EntryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const entry = findEntryBySlug(slug);
  usePageTitle(entry?.title || '未找到内容');   // ← 在 early return 之前

  if (!entry) {
    return <Navigate to="/" replace />;
  }
  // ...
}
```

**改后:**

```jsx
export default function EntryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const entry = findEntryBySlug(slug);

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  usePageTitle(entry.title);   // ← 移到 early return 之后
  // ...
}
```

**正确性论证:**
- React 规则:hooks 必须在 early return 之前调用(以保证调用顺序稳定)。但这里只有一个 `usePageTitle`,且 `entry` 不存在时直接 Navigate 返回,不会到 hook 调用行 → 违反了 hooks 必须在组件顶层调用的规则吗?
- **不会**:`if (!entry) return <Navigate />` 在 `usePageTitle` 之前 → React 看到组件返回了一个 React 元素 `<Navigate>`,根本不会执行到后面的 `usePageTitle` → hooks 调用次数在同一次渲染中是一致的(0 次)。这是合法的。
- 但**更好的模式**:用 `useEffect` 守护 `entry`,让 `usePageTitle` 一定被调用 → 不过本任务范围内不必这么重,直接顺序调整即可

**验证:** 访问 `/p/不存在的slug` 时,Home 组件 mount 时其 `usePageTitle` 同步执行,直接把 document.title 设为「极客熊猫 · 首页」,无中间态。

## 5. src/index.css 注释(不动实现)

在 `body { background-color: #0a0e1f; color: #f8fafc; }` 上方加注释:

```css
/* body 背景与文字色硬编码而非 @apply bg-brand-dark text-brand-light:
   防止 Tailwind 编译前 body 无样式闪烁(FOUC)。值与 brand.dark/brand.light
   一致,改色板需同步更新此处。CLAUDE.md 规则 6「单一来源 = tailwind.config.js」
   的例外仅此一处。 */
body {
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  background-color: #0a0e1f;
  color: #f8fafc;
  min-height: 100vh;
}
```

## 6. CLAUDE.md 改动

`规则 6. 品牌约定`整段重写:

- 删掉旧色表(8 行 hex)
- 改为新版 10 个 `brand.*` token(逐字对齐 tailwind.config.js)
- 字体段改为 Fraunces / IBM Plex Sans / JetBrains Mono,标注「与 src/index.css 的 @import 同源」
- 新增一句内容作者警告:iframe 内若需 brand-* 类,必须自补样式 / link 引入(规则 4 已有,这里 cross-reference)

## 7. 文件改动清单(5 个)

| 文件 | 改动量 | 风险 |
|---|---|---|
| `CLAUDE.md` | 规则 6 整段重写,~15 行 | 低(纯文档) |
| `src/index.css` | 加 6 行注释 | 极低 |
| `src/components/Hero.jsx` | 删 1 行 | 低 |
| `src/pages/EntryDetail.jsx` | 调换 1 行位置 | 极低 |
| `content/claude-code-taming-guide.html` | 顶部 `<style>` 重写 ~30 行 + `@import` 替换 | 中(改色平衡可能需微调) |

## 8. 兼容性 / 回滚

- 所有改动可独立 commit,需要回滚时可单文件 `git revert`
- 文章改色为纯样式调整,不影响 HTML 结构与文字;最坏情况下重置文件回到 commit `c7d2d07` 即可
- CLAUDE.md 改动只影响后续内容作者;已发布文章不受其影响(文章是 self-contained HTML)