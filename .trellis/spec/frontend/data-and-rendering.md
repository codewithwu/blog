# Data and Rendering

## 适用范围

修改 `src/data/`、`src/lib/`、列表/详情页的数据消费、内容 parser、文章分类或 `Html` iframe 时遵循本规范。作者源文件的具体格式见 [../content/source-formats.md](../content/source-formats.md)；AI 命令驱动的内容上传走 [../content/ai-upload-flow.md](../content/ai-upload-flow.md)。

> 瀑布流重构（2026-07）后：技能 / 工具 / 关于的 `parseSkills` / `parseTools` / `parseAbout` 与对应页面 / `src/data/skills.js` / `src/data/tools.js` / `src/lib/content.js` 全部下线。本文不再覆盖它们。

## 总体数据流

项目没有运行时 API。所有内容在构建时通过 ESM 或 Vite `?raw` 进入 bundle：

```text
作者源文件
  → src/data 注册或直接 raw import
    → src/lib 统一查询（articles + projects → Entry）
      → src/pages 页面组合
        → src/components 展示
```

不要把这条同步链路改成 fetch 或异步缓存，除非产品明确要引入外部内容服务。

## Entry 合同（文章 + 项目统一）

```text
articles/<category>/<slug>.html     projects/<slug>.html
  → src/data/articles.js              → src/data/projects.js
    → src/lib/entries.js（统一查询层）
      → Home / EntryCard
      → EntryDetail（统一详情页 /p/:slug）
```

### Entry 字段

| 字段 | 文章必填 | 项目必填 | 用途 |
|---|---|---|---|
| `slug` | ✓ | ✓ | `/p/:slug` 查找键；articles 与 projects 之间全局唯一 |
| `title` | ✓ | ✓ | 卡片标题、页面标题、iframe title（原项目字段 `name` 已改） |
| `excerpt` | ✓ | ✓ | 列表摘要（原项目字段 `description` 已改） |
| `date` | ✓ | ✓ | `listEntries` 按新到旧排序；项目无日期回退 `'1970-01-01'` |
| `tags` | ✓ | ✓ | 卡片标签数组（原项目字段 `techStack` 已改） |
| `cover` | ✓ | ✓ | 当前可为 `null`；不能省略字段 |
| `content` | ✓ | ✓ | `.html?raw` import 变量 |
| `type` | ✓ (`'article'`) | ✓ (`'project'`) | 区分卡片视觉与图标 |
| `category` | ✓（固定六类之一） | `null` | 仅文章参与分类筛选 / chip |
| `links` | `null` | `{ github?, demo? } \| null` | 仅项目渲染 GitHub / Demo 图标 |

### lib 接口

`src/lib/entries.js` 暴露三个纯函数：

- `listEntries()`：合并 articles + projects，按 `date` 降序返回 `Entry[]`。
- `findEntryBySlug(slug)`：在 articles 与 projects 中查找，单条匹配返回 `Entry | null`。
- `entryCount()`：`listEntries().length` 的便捷封装。

页面只调用 lib 层；不要在 page 或 card 里直接 import `src/data/*`。

## 文章合同细节

```text
articles/<category>/<slug>.html
  → src/data/articles.js
    → src/lib/entries.js（统一查询）
      → Home / EntryCard / EntryDetail
```

- 文章 category 必须是 `src/data/categories.js` 声明的六个固定 slug 之一；中文显示名与顺序只在 `categories.js` 维护，不要在 EntryCard / Home / EntryDetail 中复制。
- 文章 `type` 必须是 `'article'`；`category` 不能为 `null`；`links` 必须为 `null`。
- 文章 raw import 路径必须带分类子目录，例如 `../../articles/ai/slug.html?raw`。

## 项目合同细节

```text
projects/<slug>.html
  → src/data/projects.js
    → src/lib/entries.js（统一查询）
      → Home / EntryCard / EntryDetail
```

- 项目 `type` 必须是 `'project'`；`category` 必须为 `null`。
- 项目原字段 `name` / `description` / `techStack` / `githubUrl` / `demoUrl` 已统一为 `title` / `excerpt` / `tags` / `links.{github,demo}`；不要在 data 文件里保留旧字段。
- 项目 `date` 若作者未提供，写 `'1970-01-01'`（仅用于排序，UI 不显示）。
- 数组顺序不再决定展示顺序；`listEntries` 按 `date` 降序再排。
- `EntryCard` 仅当 `links.github` / `links.demo` 存在时渲染对应图标。

正常注册后，`Home.jsx` / `EntryCard.jsx` / `EntryDetail.jsx` 不需要按文章 / 项目硬编码分支。

## 查询与 parser 规则

- `src/lib/entries.js` 是纯函数接口，便于直接单测。
- data module 负责注册，lib 负责行为；页面不直接重写排序/过滤规则。
- 当前 `Home.jsx` 通过 `listEntries()` 拿到全量瀑布流；筛选按需后续扩展，不要在 EntryCard 内做全局查询。

## 统一 HTML iframe 合同

`src/lib/html.jsx` 是文章和项目详情的唯一正文渲染入口。

### 文档归一化

- trimmed 内容以 `<!doctype`、`<html>` 或 `<html ` 开头 → 视为完整文档。
- 其他内容 → 视为 HTML fragment，包装成带 charset/viewport 的最小完整文档。
- 两种形态最终都进入 `<iframe srcDoc>`；当前实现**没有** fragment 的 `dangerouslySetInnerHTML` 分支。

### Base 注入

如果文档没有 `<base>`，`Html` 向 `<head>` 注入：

```html
<base href="about:srcdoc">
```

这是为了防止 Chromium 把 `href="#section"` 按父页面 baseURI 解析并把 iframe 导向 React Router 404。没有 `<head>` 时在文档开头兜底插入。已有 `<base>` 必须保留，不要重复注入。

该 base 也意味着普通相对 URL 会相对 `about:srcdoc` 解析。作者 HTML 如果依赖资产路径，必须在源文档中设计可工作的路径或提供自己的 base；不要在 React 详情页事后改写作者 DOM。

### Iframe 属性

合同固定为：

```jsx
<iframe
  srcDoc={srcDoc}
  title={title}
  className="w-full h-screen border-0"
  sandbox="allow-scripts allow-popups allow-forms"
/>
```

- `allow-scripts`：允许作者脚本。
- `allow-popups`：允许 `target="_blank"`。
- `allow-forms`：允许表单。
- 不加入 `allow-same-origin`，避免提升作者文档访问宿主 origin 能力。

改 sandbox 是安全/兼容合同变更，必须更新 `tests/html.test.jsx` 与详情页测试，并明确说明能力变化。

### 信任模型

`Html` 只用于仓库作者控制的 `articles/` 与 `projects/` HTML，不做事后消毒。不要将它复用于外部用户上传或远程抓取的 HTML。若输入信任边界改变，必须重新设计 sanitization、sandbox 和内容安全策略，不能只复用当前组件。

## 列表层与详情层的样式边界

- 瀑布流首页的 `EntryCard` 属于主站导航层，使用编译后的 Tailwind `brand-*` 类。
- iframe 是独立 viewport，不继承 `src/index.css` 或 Tailwind bundle。
- 作者 HTML 内的 `text-brand-light` 等类不会生效；需要内联 `<style>`、自己的 stylesheet 或具体 CSS 值。
- 详情页（`EntryDetail`）不渲染 metadata header；标题、日期、技术栈等正文展示由作者 HTML 自己负责。

## 反模式

- 在页面中手工复制 registry 数据或分类中文名。
- 新文章/项目只加文件，没有 raw import 或 metadata。
- 在 data 文件中解析 Markdown，或在多个页面各自实现 parser。
- 项目 metadata 漏写 `type: 'project'` 或保留旧字段 `name` / `description` / `techStack` / `githubUrl` / `demoUrl`。
- 给 sandbox 加 `allow-same-origin` 却不分析权限组合。
- 对仓库外不可信 HTML 使用当前 `Html`。
- 期待 iframe 继承主站字体/Tailwind，或在 React 侧事后"清洗"作者 HTML。
- 重新引入 `parseSkills` / `parseTools` / `parseAbout` 或对应的 `content/{技能,工具,关于}.md` 源。

## 验证

- `tests/entries.test.js`、`tests/registry.test.js`：合并、排序、查找、字段完整性。
- `tests/html.test.jsx`：完整文档/fragment 包装、base 注入、iframe class/title/sandbox。
- `tests/entry-detail.test.jsx`：iframe + 返回按钮 + 不存在 slug 时 redirect。
- `tests/home.test.jsx`：瀑布流 + Hero + entry 计数渲染。

```bash
npm test
npm run build
```

内容 registry 改动至少要让 build 成功，因为缺失 raw import、错误路径或语法错误会在构建阶段直接暴露。