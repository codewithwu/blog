# Design · 技能 / 工具 / 关于 三页签抽离到 content/ 目录

**Date**: 2026-06-03
**Status**: Approved
**Owner**: cooper

## 背景与目标

博客现有的「技能」「工具」「关于」三个页签的内容存在两处硬编码：

- 技能：`src/data/skills.js`（按 category 分组的数组，每项 `{ name, level: 0-100 }`）
- 工具：`src/data/tools.js`（按 category 分组的数组，每项 `{ name, icon, desc }`）
- 关于：`src/pages/About.jsx`（直接硬编码 timeline 数组、座右铭、简介、联系方式）

改起来分散、且与项目内已有的「文章 / 项目都从 markdown 源文件读取」的模式不一致（参见 `articles/`、`projects/` 目录的约定）。

**目标**：把这三个页签的内容统一抽离到项目根的 `content/` 目录下的三个 markdown 文件，让它们与 `articles/`、`projects/` 走同一套「源文件 + ?raw 导入」的模式。同时把技能等级从 0-100 数字改为「进阶 / 熟练 / 精通」三档，不再展示百分比。

## 非目标

- 不改 `articles/`、`projects/` 任何东西
- 不改路由或导航
- 不引入新依赖（不引入 `gray-matter` 等）
- 不改 Markdown 渲染器（继续复用 `src/lib/markdown.jsx`）

## 数据文件结构

### `content/技能.md`

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

**解析规则**：
- 每个 `## 标题` 是一个分类
- 分类下每行 `- 技能名: 等级` 是一个技能项
- `等级` 必须是 `进阶` / `熟练` / `精通` 之一，否则按 `进阶` 回退（容错）

### `content/工具.md`

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

**解析规则**：
- 每个 `## 标题` 是一个分类
- 每行格式 `- 名称 (图标名): 描述`
- `图标名` 是 `lucide-react` 的组件名，找不到时回退到 `Wrench`（沿用 `ToolCard` 已有行为）
- `描述` 可省略

### `content/关于.md`

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

**解析规则**（解析为对象后由 About 页面渲染）：

- 文件首段（`##` 之前） = 副标题 + 简介
- `## 联系方式` 段落 = 链接列表（识别 `GitHub` / `邮箱` 关键字映射到 `Github` / `Mail` 图标）
- `## 经历` 段落 = 时间轴
  - 每条 `- **年份** 标题 @ 副标题` 为主项
  - 紧跟其后的缩进段落为描述
- `## 座右铭` 段落 = blockquote

## 解析器实现

新增 `src/lib/content.js`，提供三个纯函数：

```js
parseSkills(mdString) -> [{ category, items: [{ name, level }] }]
parseTools(mdString)  -> [{ category, items: [{ name, icon, desc }] }]
parseAbout(mdString)  -> { tagline, intro, contacts: [{label, href, icon}], timeline: [{year, title, subtitle, desc}], motto }
```

实现思路：纯字符串处理（按 `## ` 切分章节、按 `\n- ` 切分条目、按 `:` / `(` / `)` 切分键值对）。**不引入** `gray-matter`、不引入任何 markdown AST 库。

## 技能展示方式

`src/components/SkillBar.jsx` 从「水平进度条」改为「一行布局：技能名 + 彩色等级徽章」：

```
React                                                  [精通]
TypeScript                                             [熟练]
Redis                                                  [进阶]
```

徽章颜色映射（遵循 brand-guidelines）：

| 等级 | Tailwind 类 | 品牌色 |
|------|-------------|--------|
| 精通 | `bg-brand-orange/15 text-brand-orange border-brand-orange/40` | 主点缀 |
| 熟练 | `bg-brand-blue/15 text-brand-blue border-brand-blue/40` | 副点缀 |
| 进阶 | `bg-brand-green/15 text-brand-green border-brand-green/40` | 第三点缀 |

## 文件改动清单

**新增**：
- `content/技能.md`
- `content/工具.md`
- `content/关于.md`
- `src/lib/content.js`（含解析函数）
- `tests/content.test.js`（解析函数单测）

**修改**：
- `src/data/skills.js` → 改为 `import skillMd from '../../content/技能.md?raw'` 后调用 `parseSkills` 导出
- `src/data/tools.js` → 同上
- `src/pages/About.jsx` → 改为 `import aboutMd from '../../content/关于.md?raw'` 后调用 `parseAbout`，渲染逻辑保持
- `src/pages/Skills.jsx` → 数据源不变（仍是 `src/data/skills.js`），但因 `SkillBar` 改动需重新渲染
- `src/components/SkillBar.jsx` → 改为徽章样式
- `CLAUDE.md` → 补充 `content/` 目录规则（仿 `articles/` 条目）
- `code_map.md` → 补充 `content/` 目录索引 + 解析器说明

**删除**（迁移完成后）：
- 旧的 `src/data/skills.js` 数组定义
- 旧的 `src/data/tools.js` 数组定义
- 旧的 `src/pages/About.jsx` 中硬编码的 `timeline` 数组、座右铭、简介、联系方式 JSX（保留外层结构与 usePageTitle）

> 注：删除/迁移的具体边界在实施计划中明确（哪些行变 import、哪些行变函数调用、哪些行变渲染数据）。

## CLAUDE.md 补充条款

仿照现有第 10、11 条，新增第 12 条：

> 12. 技能 / 工具 / 关于页签源文件存放在项目根目录的 `content/` 文件夹下；每修改一个页签内容，直接编辑 `content/<名称>.md` 即可（前端代码通过 `src/lib/content.js` 解析）。不要在 `src/data/*.js` 或 `src/pages/About.jsx` 里硬编码这三页签的内容。技能等级只能是 `进阶` / `熟练` / `精通` 三档之一。

## 错误处理与边界

- markdown 解析时遇到未知等级 → 回退到 `进阶`，不抛错
- 工具的 `icon` 字段在 `lucide-react` 找不到时 → 回退到 `Wrench`（沿用 `ToolCard` 已有行为）
- 联系方式链接未识别为 `GitHub` / `邮箱` 关键字 → 仍渲染为通用链接（不带图标）
- 解析失败时（如文件缺失）→ 在浏览器控制台告警并渲染空状态（不崩页）

## 验收标准

- [ ] `content/技能.md` 至少包含现有 `src/data/skills.js` 的所有技能条目
- [ ] `content/工具.md` 至少包含现有 `src/data/tools.js` 的所有工具条目
- [ ] `content/关于.md` 包含现有 About 页面所有可读内容（副标题、简介、联系方式、3 条时间轴、座右铭）
- [ ] `/skills` 页面显示徽章样式，不再有进度条与百分比
- [ ] `/tools` 页面行为与改造前一致
- [ ] `/about` 页面行为与改造前一致
- [ ] `npm run test` 全绿（新增 `content.test.js` 覆盖三个解析函数）
- [ ] `npm run build` 无报错
- [ ] `src/data/skills.js`、`src/data/tools.js` 旧数组内容已删除（文件可能保留为只导出的入口）
- [ ] `CLAUDE.md` 第 12 条已加入
- [ ] `code_map.md` 已更新

## 风险与权衡

- **解析器的脆弱性**：纯字符串解析对格式变化敏感（如多空格、Tab、CRLF）。**缓解**：在解析函数里做容错（trim、忽略空行、空 category 跳过）；单测覆盖常见变体。
- **改 markdown 文件 vs 改 JS 的开发体验变化**：从编辑 JS 数组变为编辑 markdown。**权衡**：markdown 体验更轻、阅读更友好，与项目内其他内容页风格统一。
- **等级从数字变文字后失去精度**：不能像以前那样区分 `level: 73` 和 `level: 78`。**权衡**：用户明确不要百分比，三档是简化。
