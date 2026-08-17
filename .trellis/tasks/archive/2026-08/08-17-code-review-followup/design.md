# 设计：修复 /code-review 8 项 findings

## 1. og:url 表达式细节（F1）

### 现状
```js
const ogUrl = `${window.location.origin}${window.location.pathname}`;
```

HashRouter（`src/App.jsx:52`）下 `window.location` 形如：
- `origin = "https://cooper.github.io"`
- `pathname = "/blog/"`
- `hash = "#/p/sample-entry"`

当前 og:url = `https://cooper.github.io/blog/`（根）—— 永远错。

### 决策：用 pathname + hash 拼接

```js
const ogUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
```

`window.location.hash` 自带前导 `#`，直接拼接无需处理。无需 `encodeURIComponent`：
- `#` 在 URL 里是 fragment 分隔符，合法字符
- `/` 在 fragment 里也是合法字符
- 整段在 `<meta content="...">` 里作为属性值，浏览器会原样解析

### 验证
- AC-1 用 `expect(ogUrl).toMatch(/#\/p\/sample-entry$/)` 即可
- jsdom 下 `window.location` 默认是 `http://localhost/`；MemoryRouter initialEntries 不会改 `window.location.hash`（react-router 用 history API），所以测试需用 `jsdom` 配置或显式设置 `window.location.hash = '#/p/sample-entry'`

### 测试兼容性
jsdom 的 `window.location` 默认 host: `localhost:3000`（vitest 默认端口）。测试需要在 `renderAt` 之前：
```js
window.history.replaceState(null, '', '/#/p/sample-entry');
// 或直接设置 hash
```

但 hash 设置后 react-router 的 MemoryRouter 仍然用 `initialEntries` 控制路由状态，不会读 `window.location`。因此**测试要直接调 EntryDetail 的渲染结果断言 `window.location.hash`**：
- 简单做法：测试启动前先设 `window.location.hash = '#/p/sample-entry'`，renderAt 后断言 `ogUrl` 包含 `#/p/sample-entry`

### 影响：og:url 与 og:site_name 是两条独立 meta，不互相影响
改 ogUrl 不影响 ogImage / og:title / og:description。

---

## 2. iframe key 强制重建（F2）

### 决策：在 EntryDetail 调用处加 `key={entry.slug}`

```jsx
<Html key={entry.slug} html={entry.content} title={entry.title} />
```

### 行为论证
- `entry.slug` 变化时 React 把 `<Html>` 视为不同 element 类型实例 → unmount 旧 `<Html>` → 重新 mount 新 `<Html>`
- `<Html>` 内部 `useState(true)` 让 loading 初始 true → shimmer 重新出现
- onLoad + rAF 兜底链路不变；首次切换的 iframe onLoad 触发后 loading=false
- PrevNextNav 不需要 key，因为 prev/next prop 变化时组件本身只需更新 prop，不需重建（prev/next 是 EntryDetail 的 children，不参与重挂载）

### 副作用评估：是否有其他 key 加 slug 也需要的子组件？
- PrevNextNav：prev/next 变化时只需更新 link href，不需要重挂载
- 返回按钮：始终是同一按钮，不需要 key
- Helmet：title prop 变化即可

因此**只给 `<Html>` 加 key**。

### 测试验证
- 测试 1：渲染 `/p/sample-entry` → 拿到 iframe DOM node A
- 测试 2：再渲染 `/p/sample-entry-2`（mock registry 加一条）→ 拿到 iframe DOM node B
- 断言：A !== B（iframe 节点是 React 重建的）

可在测试里用 `vi.mock` 加两条 entry，切换路由断言。

### 已知行为：scroll 行为
路由切换时 react-router 默认滚动到顶部；key 切换不会额外干扰滚动。

---

## 3. SearchBar X 按钮恢复 focus（F3）

### 决策：onClick 内 setQuery 后 focus()

```jsx
<button
  type="button"
  onClick={() => {
    setQuery('');
    inputRef.current?.focus();
  }}
  ...
>
```

### 行为论证
- React 中 onClick 是异步事件，setState 异步生效，但 X 按钮 onClick 触发后：
  1. React 开始 reconciler：X 因 query 变空（条件渲染）被 unmount
  2. setQuery('') 排队，渲染后 query=''
  3. 当前 commit：input 还在 DOM 里（条件渲染在 input 之外），inputRef.current 仍指向 input
  4. 然后 inputRef.current.focus() 被调用 → input 重新获得焦点

- 时序关键：focus() 在 unmount 后仍有效，因为 input 没被卸载（仅 X 卸载）

### 验证
测试断言：
```js
fireEvent.click(clearBtn);
expect(document.activeElement).toBe(input);
```

注：jsdom 中 React 的 commit 是同步的，fireEvent.click 后的渲染会立刻反映；focus() 调用后 activeElement 立刻是 input。

### 不影响其他
- Esc 清空 query 路径（line 70-74）不在 input 之外触发，不需要 focus 恢复（input 本身就在焦点上）
- 不影响 segmented control 的 onClick（它们不涉及 input）

---

## 4. Home 焦点 0 → N 恢复（F4）

### 决策：用 prevLengthRef 跟踪上一帧长度

```jsx
const prevLengthRef = useRef(0);
const lastFocusedRef = useRef(0);

useEffect(() => {
  const prevLength = prevLengthRef.current;
  const currentLength = filteredEntries.length;
  prevLengthRef.current = currentLength;

  if (currentLength === 0) return;

  const clamped = Math.min(focusedIndex, currentLength - 1);
  if (clamped !== focusedIndex) {
    setFocusedIndex(clamped);
    return; // 下次 render 再执行 focus()
  }

  // 触发条件：
  //   - focusedIndex 真正变化（lastFocusedRef 守卫）
  //   - 或 length 由 0 转为正（焦点丢失后恢复）
  const isFirstRestoreAfterEmpty = prevLength === 0 && lastFocusedRef.current === focusedIndex;
  if (lastFocusedRef.current !== focusedIndex || isFirstRestoreAfterEmpty) {
    lastFocusedRef.current = focusedIndex;
    cardRefs.current[focusedIndex]?.focus({ preventScroll: true });
  }
}, [focusedIndex, filteredEntries.length]);
```

### 行为论证
- prevLengthRef 在 effect 起始读 → 更新 → 用于下次 effect 比较
- 当用户输入字符过滤到 0：currentLength=0 → effect 早返（lastFocusedRef 保持上一帧）→ 下次 effect 时 prevLength=0
- 当用户清空字符过滤恢复：currentLength>0, prevLength=0 → isFirstRestoreAfterEmpty=true → 强制 focus()
- 用户按 j/k 时 focusedIndex 变化 → lastFocusedRef 守卫路径正常生效
- 用户在搜索框输入时：currentLength 不变（focusedIndex 也没变），effect 重跑但 lastFocusedRef === focusedIndex 且 prevLength > 0 → 不抢焦点 ✓
- 用户切 type 过滤到 0 再切回：与搜索场景等价 → 同款修复

### 关键 invariant：focusedIndex state 在 length=0 时不变
- 当前 effect 在 length=0 时早返，setFocusedIndex 不被调用
- 但 React 卸载卡片时 cardRefs.current[i] 会被 React 设为 null（ref callback cleanup）
- 当 length 恢复 N 时，Home render 把卡片再次挂载，ref callback 被调，把 cardRefs.current[i] 设为新 DOM 节点
- 此时调用 `.focus()` 是有效的 ✓

### 验证
测试断言：
```js
fireEvent.change(input, { target: { value: 'xyz不存在' } }); // 过滤到 0
fireEvent.change(input, { target: { value: '' } }); // 清空
// 期望：焦点自动恢复到 focusedIndex=0 对应的卡片
expect(document.activeElement).toBe(cardDiv);
```

---

## 5. Home type 默认值与判断来自 TYPE_OPTIONS（M1）

### 决策：import TYPE_OPTIONS

```jsx
import SearchBar, { TYPE_OPTIONS } from '../components/SearchBar.jsx';

// 顶部常量（在 Home 函数外，避免每次 render 重新算）
const DEFAULT_TYPE = TYPE_OPTIONS[0].value;

// Home 函数内
const [type, setType] = useState(DEFAULT_TYPE);
const isFiltered = query.trim().length > 0 || type !== DEFAULT_TYPE;
```

filter callback（line 78）：
```jsx
if (type !== DEFAULT_TYPE && e.type !== type) return false;
```

### 注意：TYPE_OPTIONS[0].value 是模块级常量
- 不需要 useMemo 缓存
- SearchBar 内 `TYPE_OPTIONS` 是 `export const`，module 初始化时定义一次

### 测试兼容性
- TYPE_OPTIONS[0].value 是 'all'（与原 useState('all') 完全等价）
- 现有 test fixture 不受影响

---

## 6. useEffect deps 收敛（M2）

### 决策：deps 改为 `[focusedIndex, filteredEntries.length]`

```jsx
useEffect(() => {
  // ...
}, [focusedIndex, filteredEntries.length]);
```

### 行为论证
- effect 内只用 `filteredEntries.length`（早返与 clamp 计算）+ `cardRefs.current[focusedIndex]`（focus 操作用下标，与 filteredEntries 同步）
- 不需要 `filteredEntries` 数组引用本身
- 减少 effect 重跑次数：每次 render 因 `entries.filter(...)` 新数组触发 effect → 现改为只在 length 变化或 focusedIndex 变化时触发

### 验证
- 不需要新增测试
- 行为不变：focusedIndex 与 length 决定何时 focus，effect 内不读 entries 字段

---

## 7. useMergedRefs 移除假稳定的 useCallback（M3）

### 决策：选项 B——去掉 useCallback，注释改写

```jsx
// 合并多个 ref 到同一个 DOM 节点：
//   - 内层 ref（useReveal）：用于 IntersectionObserver
//   - 外层 ref（Home）：用于键盘快捷键 focus({ preventScroll: true })
// 不做 ref callback 稳定化：refs 是 rest spread 每次 render 都是新数组，
// useCallback(fn, refs) 实际不会复用函数。这里也无需稳定——
//   - Home 用 ref={(el) => cardRefs.current[i] = el} 是 callback ref，每次 render
//     也是新函数，React 本来就处理 callback ref 替换
//   - useReveal 内部 callback ref 同理，每次 render 也是新函数
// 因此每次 render 让 React 重新 attach 一次 ref callback 是预期行为，与
// React ref 语义一致，且不引入虚假稳定化的代码气味。
function useMergedRefs(...refs) {
  return (el) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(el);
      else ref.current = el;
    });
  };
}
```

### 行为论证
- 去掉 useCallback 后，每次 render useMergedRefs 返回新函数
- Home 传的 callback ref 每次 render 也是新函数
- useReveal 内部 callback ref 每次 render 也是新函数（这是它本来就有的）
- 因此 React 看到的 ref callback 每次都是新的 → 卸载旧 ref(null) + 装载新 ref(el)
- 卸载顺序：Home callback 先 cleanup → useReveal callback 再 cleanup；装载反过来
- 最终 cardRefs.current[i] 指向最新 el（中间短暂 null 不影响，因为 useEffect 不在 mount 期间同步跑）

### 验证
- 不需要新增测试
- 现有 keyboard-shortcuts 测试覆盖 Home 的 focus 行为

---

## 8. .glass-pill CSS 类抽取（M4）

### 决策：用 `@layer components` + 嵌套 `@media (hover: hover)`

Tailwind 3.4+ 支持 `@apply` 在嵌套 `@media` 内，但 arbitrary variant 在 `@apply` 内的支持不稳定。决策：

- **基础部分**（无 hover）：用 `@apply`（稳定）
- **hover 部分**：用原生 CSS（不用 `@apply`，避免 arbitrary variant 在嵌套规则内的不稳定）

### 实现

```css
/* 在 src/index.css @tailwind utilities 后、现有 @media (prefers-reduced-motion) 前 */

@layer components {
  /* 玻璃态胶囊：详情页返回按钮 / 404 返回链接 / 详情页底部浮条
     三处共用的样式 + hover 反馈（与品牌色一致）；
     复用 .glass-pill 后组件 className 简写为 'glass-pill' */
  .glass-pill {
    @apply bg-brand-surface/60 text-brand-light border border-brand-primary/40
           backdrop-blur-md shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
           transition-all duration-200;
  }
  /* hover 部分用原生 CSS（不用 @apply arbitrary variant，避开 Tailwind 编译陷阱） */
  @media (hover: hover) {
    .glass-pill:hover {
      background-color: rgb(30 35 72 / 0.7);   /* brand.surface-2/70 */
      border-color: rgb(76 201 240 / 0.7);     /* brand.glow/70 */
      box-shadow: 0 0 18px -2px rgb(76 201 240 / 0.55);
    }
  }
}
```

### PrevNextNav 扩展：含 hover:text-brand-glow

```css
@layer components {
  .glass-pill {
    @apply bg-brand-surface/60 text-brand-light border border-brand-primary/40
           backdrop-blur-md shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
           transition-all duration-200;
  }
  @media (hover: hover) {
    .glass-pill:hover {
      background-color: rgb(30 35 72 / 0.7);
      border-color: rgb(76 201 240 / 0.7);
      box-shadow: 0 0 18px -2px rgb(76 201 240 / 0.55);
    }
    /* PrevNextNav 链接额外 hover 文字变色 */
    .glass-pill.glass-pill--link:hover {
      color: rgb(76 201 240);  /* brand.glow */
    }
  }
}
```

或者更简单：PrevNextNav 在 className 里额外加一行 `[@media(hover:hover)]:hover:text-brand-glow`，因为只有一处。

**最终决策**：保留 PrevNextNav 自己的 hover:text，不把它纳入 .glass-pill（变体类化会增加复杂度且仅一处使用）。`.glass-pill` 只管「边框 + 背景 + shadow」三件套。

### 组件 className 改写

#### EntryDetail.jsx（line 99-114）
原：
```jsx
className="fixed top-4 left-4 z-50 inline-flex items-center
           px-3 py-1.5 rounded-md text-sm font-mono
           bg-brand-surface/60 text-brand-light
           border border-brand-primary/40
           backdrop-blur-md
           shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
           [@media(hover:hover)]:hover:bg-brand-surface-2/70
           [@media(hover:hover)]:hover:border-brand-glow/70
           [@media(hover:hover)]:hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]
           transition-all duration-200"
```

新：
```jsx
className="glass-pill fixed top-4 left-4 z-50 inline-flex items-center
           px-3 py-1.5 rounded-md text-sm font-mono"
```

#### PrevNextNav.jsx（NavButton）
原 baseClass 多行；
新：`'glass-pill ' + (position 决定追加 utility)`，inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono

#### NotFound.jsx（line 54-62）
原：
```jsx
className="inline-block mt-10 px-6 py-2 rounded-md text-sm font-mono
           bg-brand-surface/60 text-brand-light
           border border-brand-primary/40
           backdrop-blur-md
           shadow-[0_0_12px_-2px_rgba(91,141,239,0.45)]
           [@media(hover:hover)]:hover:bg-brand-surface-2/70
           [@media(hover:hover)]:hover:border-brand-glow/70
           [@media(hover:hover)]:hover:shadow-[0_0_18px_-2px_rgba(76,201,240,0.55)]
           transition-all duration-200"
```

新：
```jsx
className="glass-pill inline-block mt-10 px-6 py-2 rounded-md text-sm font-mono"
```

### 验证
- npm run build 验证 Tailwind 编译通过（glass-pill 类被生成）
- 浏览器目视：三个组件 hover 行为不变
- 测试无断言 hover utility 字符串，所以无回归

### 兼容性
- 现有 prefers-reduced-motion 复位 `.group:hover { transform: none !important; box-shadow: none !important; }`（src/index.css:81-84）不影响 .glass-pill
- 当前没有专门样式保护 .glass-pill 在 reduced-motion 下禁用 hover — 三处原本也没有，未来如需可加 `@media (prefers-reduced-motion: reduce) { .glass-pill:hover { box-shadow: none } }`，但**本次范围外**

---

## 9. 文件改动清单（8 项 → 7 文件）

| 文件 | 改动 | 风险 |
|---|---|---|
| `src/pages/EntryDetail.jsx` | F1 改 ogUrl 表达式 + F2 给 `<Html>` 加 key | 低 |
| `src/components/SearchBar.jsx` | F3 onClick 增 focus() | 低 |
| `src/pages/Home.jsx` | F4 prevLengthRef + 触发条件改 + M1 TYPE_OPTIONS import + M2 deps 收敛 | 中（多改动同文件） |
| `src/components/EntryCard.jsx` | M3 useMergedRefs 去 useCallback + 注释改写 | 极低 |
| `src/index.css` | M4 新增 @layer components .glass-pill | 低 |
| `src/components/PrevNextNav.jsx` | M4 NavButton baseClass 简化为 glass-pill | 低 |
| `src/pages/NotFound.jsx` | M4 简化为 glass-pill | 低 |
| `tests/entry-detail.test.jsx` | AC-1 ogUrl 含 hash 测试 + AC-2 切换 slug iframe 重建测试 | 低 |
| `tests/home.test.jsx` | AC-3 + AC-4 focus 行为测试 | 低 |
| `tests/html.test.jsx` | 无需新增（key 行为是 EntryDetail 层） | — |

总计 10 个文件（含 2 个测试文件）。

---

## 10. 兼容性 / 回滚

- 全部改动可独立按 commit 顺序回滚（按 M1/M2/F4/F3/F2/F1/M3/M4 顺序反向 revert）
- og:url 改动只在客户端对真实用户有效（已知 SPA + Helmet 限制，spec data-and-rendering.md 已说明）
- `.glass-pill` 抽取：若 Tailwind 编译后行为不符预期，最简回滚是 `git checkout HEAD -- src/index.css src/components/PrevNextNav.jsx src/pages/EntryDetail.jsx src/pages/NotFound.jsx` 回到原始 utility 字符串
- useMergedRefs 改动是功能不变，只是诚实化注释
- 测试 fixture 不动（不增 mock 数据）

---

## 11. 不在设计内但顺手做的小事

- 给 `tests/entry-detail.test.jsx` 加 `afterEach` 清 window.history（避免 hash 测试污染）
- 在 `src/components/SearchBar.jsx` 导出 `DEFAULT_TYPE` 也行（避免 Home 内 `TYPE_OPTIONS[0].value` 两次出现）；评估：仅一处使用，引入新 export 收益小，**不做**