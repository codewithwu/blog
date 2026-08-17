# 执行计划：修复 /code-review 8 项 findings

## 顺序与依赖

```
[1] src/components/EntryCard.jsx        M3 useMergedRefs 去 useCallback  ← 最独立，无测试影响
[2] src/components/SearchBar.jsx        F3 X 按钮 focus 恢复              ← 一行改动
[3] src/pages/EntryDetail.jsx          F1 og:url 含 hash                 ← 一行改动
[4] src/pages/EntryDetail.jsx          F2 <Html key={slug}>               ← 一行改动
[5] src/pages/Home.jsx                 M1 TYPE_OPTIONS 解耦 + M2 deps   ← 同文件多处
[6] src/pages/Home.jsx                 F4 prevLengthRef 焦点恢复          ← 同文件
[7] src/index.css + 三组件             M4 .glass-pill 抽取                ← 视觉回归
[8] 测试新增                           AC-1/2/3/4                        ← 验证前 7 步
[9] 验证 npm test + npm run build
[10] 视觉回归（手测 hover 行为）
[11] 提交（一个 commit 或按 F/M 拆两个 commit）
```

顺序原则：
- M3 先做（最小改动、不影响任何测试）
- F3/F1/F2 单点修复先行（小步快跑）
- Home.jsx 多处改动（M1+M2+F4）集中到 step [5]+[6]
- M4 视觉重构放最后（不影响测试断言，但需目视）
- 测试新增放 step [8] 验证前面所有修复

---

## 步骤清单

### Step 1 — M3: useMergedRefs 去 useCallback

- [ ] 读 `src/components/EntryCard.jsx:45-54` useMergedRefs 实现
- [ ] 去掉 `useCallback(...)` 包裹，函数直接返回 arrow function
- [ ] 注释块重写为「不做稳定化、每次 render 重新 attach」的诚实说明
- [ ] 从 import 列表移除 `useCallback`（如不再被其他位置使用——核对 line 61 `go` 还在用 useCallback）
- [ ] 验证：`npm run build` 成功（无未使用 import warning）

### Step 2 — F3: SearchBar X 按钮恢复 focus

- [ ] 读 `src/components/SearchBar.jsx:87-100` X 按钮
- [ ] onClick 改为：
  ```jsx
  onClick={() => {
    setQuery('');
    inputRef.current?.focus();
  }}
  ```
- [ ] 注释行 15「让 input 保留焦点」保持（现在确实生效）
- [ ] 验证：`npm run test`（现有 home test 用例 `X 清除按钮在 query 非空时出现，点击清空并恢复全部卡片` 不变）

### Step 3 — F1: EntryDetail og:url 含 hash

- [ ] 读 `src/pages/EntryDetail.jsx:73`
- [ ] 改 `ogUrl = ${window.location.origin}${window.location.pathname}` 为 `${window.location.origin}${window.location.pathname}${window.location.hash}`
- [ ] 验证：现有 og meta 测试不变（仍断言 ogImage / og:type 等）

### Step 4 — F2: EntryDetail `<Html>` 加 key

- [ ] 读 `src/pages/EntryDetail.jsx:117`
- [ ] 改 `<Html html={entry.content} title={entry.title} />` 为 `<Html key={entry.slug} html={entry.content} title={entry.title} />`
- [ ] 验证：现有 EntryDetail 测试不变

### Step 5 — M1 + M2: Home.jsx 解耦 TYPE_OPTIONS + useEffect deps

- [ ] 读 `src/pages/Home.jsx:31-39` import + `49` useState + `78` filter + `104` useEffect
- [ ] import 加 `{ TYPE_OPTIONS }`：
  ```jsx
  import SearchBar, { TYPE_OPTIONS } from '../components/SearchBar.jsx';
  ```
- [ ] Home 外（模块顶层）加：
  ```jsx
  const DEFAULT_TYPE = TYPE_OPTIONS[0].value;
  ```
- [ ] `useState('all')` → `useState(DEFAULT_TYPE)`
- [ ] filter callback 内 `if (type !== 'all' && e.type !== type)` → `if (type !== DEFAULT_TYPE && e.type !== type)`
- [ ] `isFiltered` 计算 `type !== 'all'` → `type !== DEFAULT_TYPE`
- [ ] useEffect deps `[focusedIndex, filteredEntries]` → `[focusedIndex, filteredEntries.length]`
- [ ] 验证：现有 Home 测试不变（默认 type 仍是 'all'，filter 行为不变）

### Step 6 — F4: Home 焦点 0 → N 恢复

- [ ] 读 `src/pages/Home.jsx:64-104`
- [ ] 在 `lastFocusedRef` 旁加 `const prevLengthRef = useRef(0);`
- [ ] 改 useEffect：
  ```jsx
  useEffect(() => {
    const prevLength = prevLengthRef.current;
    const currentLength = filteredEntries.length;
    prevLengthRef.current = currentLength;

    if (currentLength === 0) return;

    const clamped = Math.min(focusedIndex, currentLength - 1);
    if (clamped !== focusedIndex) {
      setFocusedIndex(clamped);
      return;
    }

    const isFirstRestoreAfterEmpty = prevLength === 0 && lastFocusedRef.current === focusedIndex;
    if (lastFocusedRef.current !== focusedIndex || isFirstRestoreAfterEmpty) {
      lastFocusedRef.current = focusedIndex;
      cardRefs.current[focusedIndex]?.focus({ preventScroll: true });
    }
  }, [focusedIndex, filteredEntries.length]);
  ```
- [ ] 验证：现有 keyboard-shortcuts 测试不变（focus-steal 行为不倒退）

### Step 7 — M4: 玻璃态 .glass-pill 抽取

- [ ] 读 `src/index.css:74-85`（prefers-reduced-motion 块之前）
- [ ] 在 `@media (prefers-reduced-motion: reduce)` 前新增 @layer components：
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
    }
  }
  ```
- [ ] `src/pages/EntryDetail.jsx:104-114` 返回按钮 className 简化为：
  ```jsx
  className="glass-pill fixed top-4 left-4 z-50 inline-flex items-center
             px-3 py-1.5 rounded-md text-sm font-mono"
  ```
- [ ] `src/components/PrevNextNav.jsx:54-60` NavButton baseClass 简化为：
  ```js
  const baseClass = 'glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono';
  // PrevNextNav 自己的 hover:text-brand-glow 保留：
  // className={`${baseClass} [@media(hover:hover)]:hover:text-brand-glow`}
  ```
- [ ] `src/pages/NotFound.jsx:54-62` 返回链接 className 简化为：
  ```jsx
  className="glass-pill inline-block mt-10 px-6 py-2 rounded-md text-sm font-mono"
  ```
- [ ] 验证：`npm run build` 成功（Tailwind 生成 .glass-pill 类）

### Step 8 — 新增测试（AC-1/2/3/4）

- [ ] `tests/entry-detail.test.jsx`：
  - 测试 `og:url 含 #/p/<slug>`：
    ```js
    it('注入 og:url 含当前 entry 的 hash 路径（HashRouter）', async () => {
      window.history.replaceState(null, '', '/#/p/sample-entry');
      await renderAt('/p/sample-entry');
      await waitFor(() => {
        const ogUrl = document.head.querySelector('meta[property="og:url"]');
        expect(ogUrl?.getAttribute('content')).toMatch(/#\/p\/sample-entry$/);
      });
      window.history.replaceState(null, '', '/'); // 清理
    });
    ```
  - 测试「切换 slug 后 iframe 被重建」（需要 mock 两条 entry）：
    ```js
    // 在文件顶部 mock articles.js 加第二条 entry
    // 然后测试 renderAt('/p/entry-a') → 拿 iframe A
    // renderAt('/p/entry-b') → 拿 iframe B
    // 断言 A !== B
    ```
- [ ] `tests/home.test.jsx`：
  - 测试「X 清除按钮后 input 保持焦点」：
    ```js
    it('点击 X 清除按钮后 input 仍持有焦点', () => {
      const { container } = renderHome();
      const input = container.querySelector('input[type="search"]');
      fireEvent.change(input, { target: { value: 'xyz' } });
      const clearBtn = container.querySelector('button[aria-label="清除搜索"]');
      fireEvent.click(clearBtn);
      expect(document.activeElement).toBe(input);
    });
    ```
  - 测试「过滤 0 → N 自动恢复卡片焦点」：
    ```js
    it('过滤到 0 → 清空 → 焦点自动回到第一张卡片', async () => {
      const { container } = renderHome();
      const input = container.querySelector('input[type="search"]');
      // 过滤到 0
      fireEvent.change(input, { target: { value: 'xyz不存在' } });
      // 清空恢复
      fireEvent.change(input, { target: { value: '' } });
      // 等 effect 跑完
      await act(async () => {});
      // 焦点应在第一张卡片（focusedIndex=0）
      const firstCard = container.querySelector('[role="link"]');
      expect(document.activeElement).toBe(firstCard);
    });
    ```

### Step 9 — 验证

- [ ] `npm run test`
  - 期望：失败数 ≤ 1（已知基线 `tests/html.test.jsx > renders an iframe for a full HTML document` 失败）
  - 不能新增失败
- [ ] `npm run build`
  - 期望：成功，无 TS / Tailwind 编译错误
  - 验证 `dist/assets/*.css` 中含 `.glass-pill` 类

### Step 10 — 视觉回归

- [ ] `npm run dev` 启动
- [ ] 浏览器开 `/p/sample-entry`：
  - 鼠标悬停左上角「← 返回」按钮 → 边框变 glow/70、紫光增强（与改前一致）
- [ ] 浏览器开 `/p/sample-entry`：
  - 鼠标悬停底部「上一篇/下一篇」按钮 → 边框变 glow/70、紫光增强、文字变 glow
- [ ] 浏览器开 `/404-not-found`：
  - 鼠标悬停「返回首页」链接 → 边框变 glow/70、紫光增强
- [ ] 任一项不一致 → 检查 .glass-pill CSS 输出或回滚对应组件

### Step 11 — 提交

- [ ] `git status` 确认改动文件清单（≈ 7 src + 2 test）
- [ ] `git diff --stat` 改动量符合预期
- [ ] 建议 commit message：
  ```
  fix(src): address 8 code-review findings

  Functional bugs:
  - EntryDetail og:url now includes hash (HashRouter compatibility)
  - <Html key={entry.slug}> forces iframe remount + srcDoc reset on
    navigation; shimmer re-triggers correctly.
  - SearchBar X clear button now restores focus to input.
  - Home focus: filtering 0→N now restores card focus via
    prevLengthRef tracking (previously only j/k could rescue it).

  Maintainability:
  - Home now imports TYPE_OPTIONS and uses DEFAULT_TYPE instead of
    three hardcoded literals.
  - Home useEffect deps collapse to [focusedIndex, filteredEntries.length].
  - EntryCard useMergedRefs drops the misleading useCallback; comment
    documents the per-render ref re-attach.
  - Glass-pill styling (3 places) consolidated into a single .glass-pill
    @layer component; hover utility no longer triplicated.

  Tests: +4 new assertions (og:url hash, focus after X click, focus
  restore after empty filter, iframe remount across slug changes).
  ```
- [ ] 单 commit 或按 F/M 拆两个 commit（看 diff 大小，倾向一个 commit 因改动相关）
- [ ] `git log -1 --stat` 复核改动文件清单

---

## 验证命令

```bash
# 单测
npm run test

# 构建
npm run build

# 静态检查
grep -n "'all'" src/pages/Home.jsx             # 期望: 0 命中
grep -n "useCallback" src/components/EntryCard.jsx  # 期望: 仅 EntryCard.jsx:61 go 处保留
grep -n "glass-pill" src/index.css src/components/PrevNextNav.jsx src/pages/EntryDetail.jsx src/pages/NotFound.jsx
# 期望: src/index.css 有 @apply glass-pill 三组件引用

# dev（视觉回归）
npm run dev
# 浏览器:
#   http://localhost:5173/p/sample-entry  → 鼠标悬停左上和底部浮条
#   http://localhost:5173/404-not-found   → 鼠标悬停返回首页链接
```

---

## 审查门（Review Gates）

- [ ] PRD 中所有 AC 命中
- [ ] grep 检查 0 命中旧魔法字符串（Home.jsx `'all'` 字面量）
- [ ] 视觉回归 3 个 URL hover 行为全过
- [ ] `npm test` 失败数 ≤ 基线（已知 1 个）
- [ ] `npm run build` 成功，dist CSS 含 `.glass-pill`

---

## 回滚点

- 单步失败 → 单独 `git checkout HEAD -- <file>` 回到改前
- M4 .glass-pill 编译失败 → `git checkout HEAD -- src/index.css src/components/PrevNextNav.jsx src/pages/EntryDetail.jsx src/pages/NotFound.jsx`
- 整体回滚 → `git reset --hard HEAD~1`（commit 尚未 push 时）

---

## 风险点

- **Step 8 AC-2 测试**：需要 mock 两条 entry；mock 在测试文件顶部生效，但 import 顺序影响 — vi.mock hoisted 后 await import 仍然安全；如有问题用 beforeEach mock
- **Step 8 AC-4 测试**：jsdom 不模拟真实 focus 行为？jsdom 是支持 HTMLElement.focus()，activeElement 立刻更新；唯一需注意 useEffect 异步跑，测试用 `await act(async () => {})` flush
- **Step 7 .glass-pill CSS**：Tailwind 3.4 的 `@apply` 在嵌套 `@media` 内可能 emit「@apply cannot be used with ...」——已用原生 CSS 写 hover 部分避免此风险