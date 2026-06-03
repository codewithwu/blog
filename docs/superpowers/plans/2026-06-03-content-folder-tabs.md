# 技能 / 工具 / 关于 三页签抽离到 content/ 目录 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Skills / Tools / About 三个页签的内容从硬编码的 JS / JSX 抽离到 `content/` 目录的三个 markdown 文件，技能展示从「进度条 + 百分比」改为「等级徽章（进阶 / 熟练 / 精通）」。

**Architecture:** 仿照 `articles/`、`projects/` 已有的「源文件 + ?raw 导入」模式。新增 `src/lib/content.js` 提供三个纯函数 `parseSkills` / `parseTools` / `parseAbout`，把 markdown 文本解析成原页面所需的数据结构。`src/data/skills.js` 与 `src/data/tools.js` 退化为「import + parse + export」薄包装。`About.jsx` 改为消费 `parseAbout` 结果。技能展示组件 `SkillBar` 改为徽章样式。

**Tech Stack:** React 18 + Vite 5 + Tailwind CSS + vitest。不引入新依赖。

**关联设计文档:** `docs/superpowers/specs/2026-06-03-content-folder-tabs-design.md`

---

## 文件结构总览

**新增**：
- `content/技能.md` — 技能数据源（按 category 分组）
- `content/工具.md` — 工具数据源
- `content/关于.md` — 关于页内容源
- `src/lib/content.js` — 三个解析函数（parseSkills / parseTools / parseAbout）
- `tests/content.test.js` — 解析器单测

**修改**：
- `src/data/skills.js` — 改为薄包装
- `src/data/tools.js` — 改为薄包装
- `src/pages/About.jsx` — 改为消费 `parseAbout` 结果
- `src/components/SkillBar.jsx` — 从进度条改为等级徽章
- `CLAUDE.md` — 新增第 12 条 `content/` 目录规则
- `code_map.md` — 补充 `content/` 目录索引、解析器说明、新 `SkillBar` 样式

**最终保留**（不删文件，但内部内容大幅瘦身）：
- `src/data/skills.js`（≈5 行）
- `src/data/tools.js`（≈5 行）
- `src/pages/Skills.jsx`（结构基本不变）
- `src/pages/Tools.jsx`（结构基本不变）

---

## Task 1: 创建 content/ 三个 markdown 源文件

**Files:**
- Create: `content/技能.md`
- Create: `content/工具.md`
- Create: `content/关于.md`

- [ ] **Step 1: 创建 `content/技能.md`**

从 `src/data/skills.js`（旧数据）抽取并按设计的格式书写：

```markdown
## 前端
- React: 精通
- TypeScript: 熟练
- Tailwind CSS: 精通
- Vite: 熟练

## 后端
- Node.js: 熟练
- Express: 熟练

## 数据库
- PostgreSQL: 熟练
- Redis: 进阶

## 工具
- Git: 精通
- Docker: 熟练
- Vim: 进阶
```

等级映射规则（来自旧 `level: 0-100` → 新三档）：
- `>= 80` → 精通
- `60 ~ 79` → 熟练
- `< 60` → 进阶

按此规则映射旧数据：React 88→精通、TypeScript 75→熟练、Tailwind 82→精通、Vite 70→熟练、Node.js 72→熟练、Express 68→熟练、PostgreSQL 65→熟练、Redis 55→进阶、Git 85→精通、Docker 60→熟练、Vim 50→进阶。

- [ ] **Step 2: 创建 `content/工具.md`**

```markdown
## 编辑器
- VS Code (Code2): 日常主力编辑器
- Vim (Terminal): 终端里的编辑器

## 设计工具
- Figma (PenTool): 界面设计与原型

## 调试工具
- Chrome DevTools (Bug): 前端调试利器
- Postman (Send): API 调试

## 效率工具
- Raycast (Zap): 快捷启动与脚本
- Notion (BookOpen): 笔记与知识库
```

- [ ] **Step 3: 创建 `content/关于.md`**

```markdown
后端工程师 / Agent开发 / Vibe Coding / 终身学习者

喜欢写干净的代码，热爱开源。业余时间折腾个人项目、写博客、跑马拉松。

## 联系方式
- GitHub: https://github.com/codewithwu
- 邮箱: codewithwu@gmail.com

## 经历
- **2024 – 今** 高级前端工程师 @ 某科技公司
  负责内部 SaaS 平台架构与性能优化。
- **2021 – 2024** 前端工程师 @ 某创业公司
  从 0 到 1 搭建 B 端产品。
- **2017 – 2021** 计算机科学学士 @ 某大学
  主修软件工程。

## 座右铭
> "Stay hungry, stay foolish."
```

- [ ] **Step 4: 提交**

```bash
git add content/
git commit -m "Add content/ markdown sources for Skills/Tools/About tabs"
```

---

## Task 2: TDD 实现 parseSkills 解析函数

**Files:**
- Create: `tests/content.test.js`
- Create: `src/lib/content.js`

- [ ] **Step 1: 写失败的测试**

在 `tests/content.test.js` 写入（整个文件）：

```js
// content 解析器的单元测试
import { describe, it, expect } from 'vitest';
import { parseSkills, parseTools, parseAbout } from '../src/lib/content.js';

describe('parseSkills', () => {
  it('空输入返回空数组', () => {
    expect(parseSkills('')).toEqual([]);
  });

  it('解析单个分类下的多条技能', () => {
    const md = `## 前端
- React: 精通
- TypeScript: 熟练`;
    expect(parseSkills(md)).toEqual([
      { category: '前端', items: [
        { name: 'React', level: '精通' },
        { name: 'TypeScript', level: '熟练' },
      ]},
    ]);
  });

  it('解析多个分类', () => {
    const md = `## 前端
- React: 精通

## 后端
- Node.js: 熟练`;
    expect(parseSkills(md)).toEqual([
      { category: '前端', items: [{ name: 'React', level: '精通' }] },
      { category: '后端', items: [{ name: 'Node.js', level: '熟练' }] },
    ]);
  });

  it('未知等级回退为 进阶', () => {
    const md = `## 工具
- Vim: 大师`;
    expect(parseSkills(md)).toEqual([
      { category: '工具', items: [{ name: 'Vim', level: '进阶' }] },
    ]);
  });

  it('忽略不属于任何分类的孤立条目', () => {
    const md = `- React: 精通
## 前端
- TypeScript: 熟练`;
    expect(parseSkills(md)).toEqual([
      { category: '前端', items: [{ name: 'TypeScript', level: '熟练' }] },
    ]);
  });

  it('实际 content/技能.md 能正确解析出 11 条技能', async () => {
    // 这个测试保证 content 文件与解析器契约一致
    const mod = await import('../content/技能.md?raw');
    const groups = parseSkills(mod.default);
    const total = groups.reduce((s, g) => s + g.items.length, 0);
    expect(total).toBe(11);
  });
});
```

- [ ] **Step 2: 创建 `src/lib/content.js`（仅占位让测试失败）**

```js
// content 解析器：把 content/*.md 文本解析为页面所需的数据结构
// 不引入 gray-matter 等依赖，纯字符串处理

export function parseSkills(_md) {
  throw new Error('parseSkills not implemented');
}

export function parseTools(_md) {
  throw new Error('parseTools not implemented');
}

export function parseAbout(_md) {
  throw new Error('parseAbout not implemented');
}
```

- [ ] **Step 3: 运行测试，验证失败**

```bash
npm run test -- tests/content.test.js
```

Expected: `parseSkills` 相关测试失败（`Error: parseSkills not implemented`）。其它两个 parseTools/parseAbout 因为本任务还没写测试，不会出现在本次运行中（如果 vitest 配置收集了全测试，看到一堆失败也属正常，仅关注 parseSkills 部分即可）。

- [ ] **Step 4: 实现 parseSkills**

把 `src/lib/content.js` 替换为：

```js
// content 解析器：把 content/*.md 文本解析为页面所需的数据结构
// 不引入 gray-matter 等依赖，纯字符串处理
//
// 文件约定：
//   ## category    → 一个分组
//   - name: level  → 一条技能（level ∈ {进阶, 熟练, 精通}，未知回退 进阶）
//   # / 空行 / 其他 → 忽略

const SKILL_LEVELS = ['进阶', '熟练', '精通'];

function normalizeLevel(raw) {
  return SKILL_LEVELS.includes(raw) ? raw : '进阶';
}

export function parseSkills(md) {
  if (!md) return [];
  const groups = [];
  let current = null;

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    if (line.startsWith('## ')) {
      const category = line.slice(3).trim();
      current = { category, items: [] };
      groups.push(current);
      continue;
    }

    if (line.startsWith('- ') && current) {
      const body = line.slice(2).trim();
      const colonIdx = body.indexOf(':');
      if (colonIdx === -1) continue;
      const name = body.slice(0, colonIdx).trim();
      const level = normalizeLevel(body.slice(colonIdx + 1).trim());
      if (name) current.items.push({ name, level });
    }
  }

  return groups;
}

export function parseTools(_md) {
  throw new Error('parseTools not implemented');
}

export function parseAbout(_md) {
  throw new Error('parseAbout not implemented');
}
```

- [ ] **Step 5: 运行测试，验证 parseSkills 全部通过**

```bash
npm run test -- tests/content.test.js
```

Expected: `parseSkills` 的所有 it 通过。`parseTools not implemented` / `parseAbout not implemented` 报错属正常（下一步会实现）。

- [ ] **Step 6: 提交**

```bash
git add tests/content.test.js src/lib/content.js
git commit -m "Add parseSkills function with TDD coverage"
```

---

## Task 3: TDD 实现 parseTools 解析函数

**Files:**
- Modify: `src/lib/content.js`
- Modify: `tests/content.test.js`

- [ ] **Step 1: 在 `tests/content.test.js` 追加 parseTools 测试**

在文件末尾追加：

```js
describe('parseTools', () => {
  it('空输入返回空数组', () => {
    expect(parseTools('')).toEqual([]);
  });

  it('解析带 (图标) 与描述的条目', () => {
    const md = `## 编辑器
- VS Code (Code2): 日常主力编辑器`;
    expect(parseTools(md)).toEqual([
      { category: '编辑器', items: [
        { name: 'VS Code', icon: 'Code2', desc: '日常主力编辑器' },
      ]},
    ]);
  });

  it('解析不带 (图标) 的条目（icon 缺省）', () => {
    const md = `## 设计
- Figma: 设计工具`;
    expect(parseTools(md)).toEqual([
      { category: '设计', items: [{ name: 'Figma', desc: '设计工具' }] },
    ]);
  });

  it('描述可省略', () => {
    const md = `## 编辑器
- Vim (Terminal)`;
    expect(parseTools(md)).toEqual([
      { category: '编辑器', items: [{ name: 'Vim', icon: 'Terminal' }] },
    ]);
  });

  it('解析多个分类', () => {
    const md = `## 编辑器
- VS Code (Code2): 日常主力

## 效率工具
- Raycast (Zap): 快捷启动`;
    expect(parseTools(md)).toEqual([
      { category: '编辑器', items: [{ name: 'VS Code', icon: 'Code2', desc: '日常主力' }] },
      { category: '效率工具', items: [{ name: 'Raycast', icon: 'Zap', desc: '快捷启动' }] },
    ]);
  });

  it('实际 content/工具.md 能正确解析出 7 条工具', async () => {
    const mod = await import('../content/工具.md?raw');
    const groups = parseTools(mod.default);
    const total = groups.reduce((s, g) => s + g.items.length, 0);
    expect(total).toBe(7);
  });
});
```

- [ ] **Step 2: 运行测试，验证 parseTools 部分失败**

```bash
npm run test -- tests/content.test.js
```

Expected: `parseTools` 的 it 全部失败（`Error: parseTools not implemented`）。

- [ ] **Step 3: 实现 parseTools**

把 `src/lib/content.js` 中的 `export function parseTools` 替换为：

```js
export function parseTools(md) {
  if (!md) return [];
  const groups = [];
  let current = null;

  for (const rawLine of md.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    if (line.startsWith('## ')) {
      const category = line.slice(3).trim();
      current = { category, items: [] };
      groups.push(current);
      continue;
    }

    if (line.startsWith('- ') && current) {
      const body = line.slice(2).trim();
      // 拆分 name/icon 与 desc：以第一个 ':' 切
      const colonIdx = body.indexOf(':');
      let namePart, desc;
      if (colonIdx === -1) {
        namePart = body;
        desc = '';
      } else {
        namePart = body.slice(0, colonIdx).trim();
        desc = body.slice(colonIdx + 1).trim();
      }

      // 提取 name 末尾括号里的 icon
      const m = namePart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      const item = {};
      if (m) {
        item.name = m[1].trim();
        item.icon = m[2].trim();
      } else {
        item.name = namePart;
      }
      if (desc) item.desc = desc;
      if (item.name) current.items.push(item);
    }
  }

  return groups;
}
```

- [ ] **Step 4: 运行测试，验证 parseTools 全部通过**

```bash
npm run test -- tests/content.test.js
```

Expected: `parseSkills` + `parseTools` 的所有 it 通过。`parseAbout not implemented` 报错属正常。

- [ ] **Step 5: 提交**

```bash
git add tests/content.test.js src/lib/content.js
git commit -m "Add parseTools function with TDD coverage"
```

---

## Task 4: TDD 实现 parseAbout 解析函数

**Files:**
- Modify: `src/lib/content.js`
- Modify: `tests/content.test.js`

- [ ] **Step 1: 在 `tests/content.test.js` 追加 parseAbout 测试**

在文件末尾追加：

```js
describe('parseAbout', () => {
  it('空输入返回空对象', () => {
    const r = parseAbout('');
    expect(r).toEqual({
      tagline: '', intro: '', contacts: [], timeline: [], motto: '',
    });
  });

  it('解析首段为 tagline + intro', () => {
    const md = `后端工程师 / 终身学习者

喜欢写代码。`;
    const r = parseAbout(md);
    expect(r.tagline).toBe('后端工程师 / 终身学习者');
    expect(r.intro).toBe('喜欢写代码。');
  });

  it('解析联系方式：识别 GitHub / 邮箱关键字映射图标', () => {
    const md = `## 联系方式
- GitHub: https://github.com/foo
- 邮箱: foo@bar.com
- 个人网站: https://foo.com`;
    const r = parseAbout(md);
    expect(r.contacts).toEqual([
      { label: 'GitHub', href: 'https://github.com/foo', icon: 'Github' },
      { label: '邮箱',   href: 'foo@bar.com',            icon: 'Mail'   },
      { label: '个人网站', href: 'https://foo.com',     icon: null     },
    ]);
  });

  it('解析时间轴：title / subtitle / desc', () => {
    const md = `## 经历
- **2024 – 今** 高级工程师 @ ACME
  负责核心系统。
- **2020 – 2024** 工程师 @ Foo
  从 0 到 1。`;
    const r = parseAbout(md);
    expect(r.timeline).toEqual([
      { year: '2024 – 今', title: '高级工程师', subtitle: 'ACME', desc: '负责核心系统。' },
      { year: '2020 – 2024', title: '工程师', subtitle: 'Foo', desc: '从 0 到 1。' },
    ]);
  });

  it('解析座右铭：去掉 blockquote 前缀', () => {
    const md = `## 座右铭
> "Stay hungry, stay foolish."`;
    const r = parseAbout(md);
    expect(r.motto).toBe('"Stay hungry, stay foolish."');
  });

  it('实际 content/关于.md 能解析出 3 条时间轴、2 个联系方式、1 句座右铭', async () => {
    const mod = await import('../content/关于.md?raw');
    const r = parseAbout(mod.default);
    expect(r.timeline.length).toBe(3);
    expect(r.contacts.length).toBe(2);
    expect(r.motto.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 运行测试，验证 parseAbout 部分失败**

```bash
npm run test -- tests/content.test.js
```

Expected: `parseAbout` 的 it 全部失败（`Error: parseAbout not implemented`）。

- [ ] **Step 3: 实现 parseAbout**

把 `src/lib/content.js` 中的 `export function parseAbout` 替换为：

```js
export function parseAbout(md) {
  const empty = { tagline: '', intro: '', contacts: [], timeline: [], motto: '' };
  if (!md) return empty;

  // 按 ## 切分章节，未带 ## 的内容归到 __preamble
  const sections = { __preamble: [] };
  let current = '__preamble';
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      sections[current] = sections[current] || [];
    } else {
      sections[current].push(line);
    }
  }

  // Preamble：第一非空行 = tagline，其余 = intro
  const preambleText = sections.__preamble.join('\n').trim();
  const preambleLines = preambleText.split('\n').map(l => l.trim()).filter(Boolean);
  const tagline = preambleLines[0] || '';
  const intro = preambleLines.slice(1).join('\n').trim();

  // 联系方式
  const contacts = [];
  for (const raw of sections['联系方式'] || []) {
    const line = raw.trim();
    if (!line.startsWith('- ')) continue;
    const body = line.slice(2);
    const colonIdx = body.indexOf(':');
    if (colonIdx === -1) continue;
    const label = body.slice(0, colonIdx).trim();
    const href = body.slice(colonIdx + 1).trim();
    let icon = null;
    if (label === 'GitHub') icon = 'Github';
    else if (label === '邮箱') icon = 'Mail';
    contacts.push({ label, href, icon });
  }

  // 经历（时间轴）
  const timeline = [];
  const expLines = sections['经历'] || [];
  let i = 0;
  while (i < expLines.length) {
    const line = expLines[i];
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s+(.+?)\s+@\s+(.+?)\s*$/);
    if (m) {
      const [, year, title, subtitle] = m;
      // 紧跟其后的缩进非 '-' 行视为 desc
      const descLines = [];
      let j = i + 1;
      while (j < expLines.length) {
        const next = expLines[j];
        if (next.match(/^\s+\S/) && !next.match(/^-\s/)) {
          descLines.push(next.trim());
          j++;
        } else {
          break;
        }
      }
      timeline.push({ year, title, subtitle, desc: descLines.join('\n').trim() });
      i = j;
    } else {
      i++;
    }
  }

  // 座右铭
  const motto = (sections['座右铭'] || [])
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^>\s*/, ''))
    .join(' ')
    .trim();

  return { tagline, intro, contacts, timeline, motto };
}
```

- [ ] **Step 4: 运行测试，验证全部通过**

```bash
npm run test -- tests/content.test.js
```

Expected: 三个 describe 块的所有 it 通过。

- [ ] **Step 5: 提交**

```bash
git add tests/content.test.js src/lib/content.js
git commit -m "Add parseAbout function with TDD coverage"
```

---

## Task 5: 把 src/data/skills.js 改为薄包装

**Files:**
- Modify: `src/data/skills.js`（整文件重写）

- [ ] **Step 1: 替换为薄包装**

把 `src/data/skills.js` 整文件替换为：

```js
// 技能数据：源文件 content/技能.md，运行时通过 parseSkills 解析
// 修改内容请改 content/技能.md，不要改这里
import skillMd from '../../content/技能.md?raw';
import { parseSkills } from '../lib/content.js';

export default parseSkills(skillMd);
```

- [ ] **Step 2: 跑构建，验证 import 路径正确**

```bash
npm run build
```

Expected: 构建无报错。若 `?raw` 解析或路径有错，Vite 会立刻抛错。

- [ ] **Step 3: 提交**

```bash
git add src/data/skills.js
git commit -m "Refactor src/data/skills.js to thin wrapper over content/技能.md"
```

---

## Task 6: 把 src/data/tools.js 改为薄包装

**Files:**
- Modify: `src/data/tools.js`（整文件重写）

- [ ] **Step 1: 替换为薄包装**

把 `src/data/tools.js` 整文件替换为：

```js
// 工具数据：源文件 content/工具.md，运行时通过 parseTools 解析
// 修改内容请改 content/工具.md，不要改这里
import toolMd from '../../content/工具.md?raw';
import { parseTools } from '../lib/content.js';

export default parseTools(toolMd);
```

- [ ] **Step 2: 跑构建，验证 import 路径正确**

```bash
npm run build
```

Expected: 构建无报错。

- [ ] **Step 3: 提交**

```bash
git add src/data/tools.js
git commit -m "Refactor src/data/tools.js to thin wrapper over content/工具.md"
```

---

## Task 7: 把 src/pages/About.jsx 改为消费 parseAbout 结果

**Files:**
- Modify: `src/pages/About.jsx`（整文件重写）

- [ ] **Step 1: 替换 About.jsx**

把 `src/pages/About.jsx` 整文件替换为：

```jsx
// 关于页：内容源 content/关于.md，运行时通过 parseAbout 解析
// 修改内容请改 content/关于.md
import { Github, Mail } from 'lucide-react';
import TimelineItem from '../components/TimelineItem.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import aboutMd from '../../content/关于.md?raw';
import { parseAbout } from '../lib/content.js';

const { tagline, intro, contacts, timeline, motto } = parseAbout(aboutMd);

// 联系方式图标映射：解析出的 icon 字符串（'Github' / 'Mail' / null）→ 实际组件
const ICON_MAP = { Github, Mail };

export default function About() {
  usePageTitle('关于');
  return (
    <section className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue
                        flex items-center justify-center text-2xl font-bold text-brand-light">
          极客
        </div>
        <div>
          <h1 className="text-3xl font-bold text-brand-light">极客熊猫</h1>
          {tagline && <p className="mt-1 text-brand-orange">{tagline}</p>}
          {intro   && <p className="mt-4 text-brand-light/80 leading-relaxed">{intro}</p>}
          {contacts.length > 0 && (
            <div className="mt-4 flex gap-3 flex-wrap">
              {contacts.map((c) => {
                const Icon = ICON_MAP[c.icon];
                return (
                  <a key={c.label} href={c.href}
                     target={c.href.startsWith('http') ? '_blank' : undefined}
                     rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                     className="inline-flex items-center gap-1 text-sm text-brand-blue hover:text-brand-orange">
                    {Icon && <Icon size={16} />} {c.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {timeline.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl font-semibold text-brand-light">经历</h2>
          <ul className="mt-6">
            {timeline.map((t) => (
              <TimelineItem key={t.year} {...t} />
            ))}
          </ul>
        </>
      )}

      {motto && (
        <blockquote className="mt-12 p-6 rounded-xl border-l-4 border-brand-orange bg-brand-surface
                               text-brand-light/80 italic">
          {motto}
        </blockquote>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 跑构建，验证 import 路径正确**

```bash
npm run build
```

Expected: 构建无报错。

- [ ] **Step 3: 提交**

```bash
git add src/pages/About.jsx
git commit -m "Refactor About.jsx to consume parseAbout output"
```

---

## Task 8: 把 SkillBar 改为等级徽章样式

**Files:**
- Modify: `src/components/SkillBar.jsx`（整文件重写）

- [ ] **Step 1: 替换 SkillBar.jsx**

把 `src/components/SkillBar.jsx` 整文件替换为：

```jsx
// 技能条目：技能名 + 等级徽章（一行布局）
// 等级颜色按 brand-guidelines：精通=橙、熟练=蓝、进阶=绿
const LEVEL_STYLES = {
  精通: 'bg-brand-orange/15 text-brand-orange border-brand-orange/40',
  熟练: 'bg-brand-blue/15   text-brand-blue   border-brand-blue/40',
  进阶: 'bg-brand-green/15  text-brand-green  border-brand-green/40',
};

export default function SkillBar({ name, level }) {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES['进阶'];
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-brand-light">{name}</span>
      <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full
                       text-xs font-medium border ${style}`}>
        {level}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: 跑构建**

```bash
npm run build
```

Expected: 构建无报错。

- [ ] **Step 3: 提交**

```bash
git add src/components/SkillBar.jsx
git commit -m "Convert SkillBar from progress bar to tier badge (进阶/熟练/精通)"
```

---

## Task 9: 更新 CLAUDE.md，新增第 12 条

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 在文件末尾追加第 12 条**

在 `CLAUDE.md` 末尾追加：

```markdown
12. 技能 / 工具 / 关于页签的源文件存放在项目根目录的 `content/` 文件夹下（`content/技能.md`、`content/工具.md`、`content/关于.md`），由 `src/lib/content.js` 解析后供页面消费。修改这三页签的内容必须直接编辑对应的 .md 文件，不要在 `src/data/skills.js`、`src/data/tools.js`、`src/pages/About.jsx` 里硬编码内容。技能等级只能是 `进阶` / `熟练` / `精通` 三档之一。
```

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "Document content/ folder convention in CLAUDE.md (rule 12)"
```

---

## Task 10: 更新 code_map.md

**Files:**
- Modify: `code_map.md`

- [ ] **Step 1: 更新 §4 数据层表格**

在 §4「数据层（改这里就能改网站）」的 `src/data/skills.js` / `src/data/tools.js` 两条目里，补充 markdown 源文件位置。改为：

```markdown
| `src/data/skills.js` | `[{ category, items: [{ name, level }] }]`（level ∈ 进阶/熟练/精通） | 1) 编辑 `content/技能.md`（源文件）；2) `src/data/skills.js` 自动通过 `parseSkills` 解析；3) 不要在 `skills.js` 内直接写数据数组 |
| `src/data/tools.js`  | `[{ category, items: [{ name, icon, desc }] }]` | 1) 编辑 `content/工具.md`；2) `src/data/tools.js` 自动通过 `parseTools` 解析 |
```

- [ ] **Step 2: 更新 §2 目录树**

在 §2 目录树里 `articles/` / `articles-draft/` / `projects/` / `projects-draft/` 区块后，补充：

```
├── content/                       # Skills/Tools/About 三个页签的 Markdown 源文件
│   ├── 技能.md
│   ├── 工具.md
│   └── 关于.md
```

并在 `src/lib/` 区块里把 `articles.js` 改写为：

```
│   ├── lib/
│   │   ├── articles.js             # 文章查询工具：listArticles / findArticleBySlug
│   │   ├── content.js              # 解析 content/*.md：parseSkills / parseTools / parseAbout
│   │   └── markdown.jsx            # 统一 Markdown 渲染组件（GFM + 代码高亮 + prose 样式）
```

`src/components/` 区块里 `SkillBar.jsx` 一行的注释改为：

```
│   │   ├── SkillBar.jsx            # 技能条目（技能名 + 等级徽章，level ∈ 进阶/熟练/精通）
```

- [ ] **Step 3: 更新 §6 常用任务速查**

把「改技能 / 工具」条目改为：

```markdown
| **改技能 / 工具 / 关于内容** | 编辑 `content/技能.md`、`content/工具.md`、`content/关于.md`（不要改 src/data/*.js 或 About.jsx） |
```

把「改关于页经历/座右铭」条目删除（合并到上一条）。

- [ ] **Step 4: 提交**

```bash
git add code_map.md
git commit -m "Update code_map.md with content/ folder, content.js parser, new SkillBar"
```

---

## Task 11: 全量验证

- [ ] **Step 1: 跑所有单元测试**

```bash
npm run test
```

Expected: 全部测试通过（包括 `articles.test.js`、`projects.test.js`、`content.test.js`）。

- [ ] **Step 2: 跑构建**

```bash
npm run build
```

Expected: 构建无错、无 warning。

- [ ] **Step 3: 启动 dev server，人工核对三个页面**

```bash
npm run dev
```

人工检查清单：
- [ ] `/skills` 显示徽章（橙/蓝/绿对应 精通/熟练/进阶），**没有**进度条与百分比
- [ ] `/skills` 数据条目数 = 11（与原数据一致）
- [ ] `/tools` 工具卡片图标、名称、描述与改造前一致，共 8 条
- [ ] `/about` 头像 / tagline / 简介 / 联系方式（GitHub + 邮箱） / 3 条时间轴 / 座右铭 全部正确渲染

若发现与改造前不一致，回到对应 Task 修复（最常见是 `parseAbout` 时间轴年份 / desc 切分边界，可加测试 case 后修复）。

- [ ] **Step 4: 提交（若有最终修复）**

```bash
git add -A
git commit -m "Final fixes after manual verification of three tabs"
```

（如 Step 3 全部通过、无需修改，可跳过本步。）

---

## 完成标准

- [ ] `content/技能.md`、`content/工具.md`、`content/关于.md` 三个文件存在
- [ ] `src/lib/content.js` 三个解析函数 + 完整单测
- [ ] `src/data/skills.js`、`src/data/tools.js` 退化为薄包装（内部不含数据数组）
- [ ] `src/pages/About.jsx` 不含硬编码 timeline / 联系方式 / 座右铭
- [ ] `src/components/SkillBar.jsx` 改为徽章样式
- [ ] `CLAUDE.md` 第 12 条已加入
- [ ] `code_map.md` 已更新 §2 / §4 / §6
- [ ] `npm run test` 与 `npm run build` 全绿
- [ ] 三个页签人工验证通过
