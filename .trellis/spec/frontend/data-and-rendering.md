# Data and Rendering

## 适用范围

修改 `src/data/`、`src/lib/`、列表/详情页的数据消费、内容 parser、文章分类或 `Html` iframe 时遵循本规范。作者源文件的具体格式见 [../content/source-formats.md](../content/source-formats.md)。

## 总体数据流

项目没有运行时 API。所有内容在构建时通过 ESM 或 Vite `?raw` 进入 bundle：

```text
作者源文件
  → src/data 注册或直接 raw import
    → src/lib 查询 / 解析 / 文档包装
      → src/pages 页面组合
        → src/components 展示
```

不要把这条同步链路改成 fetch 或异步缓存，除非产品明确要引入外部内容服务。

## 文章合同

```text
articles/<category>/<slug>.html
  → src/data/articles.js
  → src/lib/articles.js
  → Articles / ArticleCard / ArticleDetail
```

### Registry metadata

每条文章必须包含：

| 字段 | 运行时用途 |
|---|---|
| `slug` | `/articles/:slug` 查找键；全局唯一 |
| `title` | 卡片标题、页面标题、iframe title |
| `excerpt` | 列表摘要 |
| `date` | `listArticles` 按新到旧排序，格式应为 `YYYY-MM-DD` |
| `tags` | 卡片标签数组 |
| `cover` | 当前可为 `null`；不能省略既定字段 |
| `content` | `.html?raw` import 变量 |
| `category` | 分类筛选、badge、目录映射；必填 |

证据：`src/data/articles.js`、`src/lib/articles.js`、`src/components/ArticleCard.jsx`。

`src/data/categories.js` 是分类 slug、中文显示名和顺序的单一来源。固定顺序为 `ai / python / engineering / product / notes / resources`；不要在 ArticleCard、CategoryFilter 或页面标题中复制中文名。`listCategories()` 只返回当前有文章的分类并附加 `count`，保持声明顺序。

正常新增/删除文章只改源 HTML 与 registry；`Articles.jsx`、`ArticleCard.jsx`、`CategoryFilter.jsx` 和查询函数不应增加按文章硬编码分支。

## 项目合同

```text
projects/<slug>.html
  → src/data/projects.js
    ├→ Projects / ProjectCard（当前列表页直接消费 registry）
    └→ src/lib/projects.js → ProjectDetail
```

每条项目必须包含：`slug / name / description / techStack / githubUrl / demoUrl / cover / content`。

- `listProjects()` 返回 registry 的浅拷贝，不排序；展示顺序由 `src/data/projects.js` 数组顺序决定。
- `findProjectBySlug()` 返回匹配项或 `undefined`。
- `ProjectCard` 只有在 `content` 存在时才链接详情；`demoUrl` 是可选显示项。
- metadata 中的 `name` 同时用于页面标题和 iframe title。

正常注册后，`Projects.jsx` 和卡片/详情组件不需要按项目修改。

## Skills / Tools / About 数据

### Skills

`src/data/skills.js` 只做：

```text
content/技能.md?raw → parseSkills → export
```

`parseSkills` 返回 `[{ category, items: [{ name, level }] }]`，允许等级只有 `进阶 / 熟练 / 精通`；未知值归一为 `进阶`。内容修改只能落在 `content/技能.md`，不要把数组硬编码回 data 文件。

### Tools

`src/data/tools.js` 只做 `content/工具.md?raw → parseTools → export`。parser 返回 `name` 和可选 `icon`/`desc`；`ToolCard` 按字符串解析 Lucide icon，未知/缺失 icon 回退 `Wrench`。

### About

`About.jsx` 直接 raw import `content/关于.md` 并调用 `parseAbout`。返回形状是：

```js
{ tagline, intro, contacts, timeline, motto }
```

parser 的 section 和正则是数据合同。扩展 Markdown 形状时必须同时改 parser、页面/组件和对应 `tests/content.test.js`，不能只写一个页面永远读不到的新 section。

## 查询与 parser 规则

- `src/lib/articles.js`、`src/lib/projects.js` 的函数保持纯函数接口，方便直接单测。
- `src/lib/content.js` 是纯字符串 parser，不依赖 gray-matter 或运行时 DOM。
- parser 对未知输入存在“忽略”或 fallback 行为；新增格式前先决定是严格报错、忽略还是扩展返回形状，并把决定写进测试。
- 页面消费 parser 输出，不应二次解析原始 Markdown。
- data module 负责注册，lib 负责行为；页面不直接重写排序/过滤规则。当前 `Projects.jsx` 直接读 projects registry 是现有例外，新行为优先通过 `src/lib/projects.js` 保持可测。

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

改 sandbox 是安全/兼容合同变更，必须更新 `tests/html.test.jsx` 及两类详情页测试，并明确说明能力变化。

### 信任模型

`Html` 只用于仓库作者控制的 `articles/` 与 `projects/` HTML，不做事后消毒。不要将它复用于外部用户上传或远程抓取的 HTML。若输入信任边界改变，必须重新设计 sanitization、sandbox 和内容安全策略，不能只复用当前组件。

## 列表层与详情层的样式边界

- Articles/Projects 卡片属于主站导航层，使用编译后的 Tailwind `brand-*` 类。
- iframe 是独立 viewport，不继承 `src/index.css` 或 Tailwind bundle。
- 作者 HTML 内的 `text-brand-light` 等类不会生效；需要内联 `<style>`、自己的 stylesheet 或具体 CSS 值。
- React 的 detail page 不再渲染 metadata header；标题、日期、技术栈等正文展示由作者 HTML 自己负责。

## 反模式

- 在页面中手工复制 registry 数据或分类中文名。
- 新文章/项目只加文件，没有 raw import 或 metadata。
- 在 data 文件中解析 Markdown，或在多个页面各自实现 parser。
- 为 fragment 恢复宿主 DOM 注入，使作者 CSS/脚本污染主站。
- 给 sandbox 加 `allow-same-origin` 却不分析权限组合。
- 对仓库外不可信 HTML 使用当前 `Html`。
- 期待 iframe 继承主站字体/Tailwind，或在 React 侧事后“清洗”作者 HTML。

## 验证

- 查询/排序/分类：`tests/articles.test.js`、`tests/projects.test.js`。
- Markdown parser：`tests/content.test.js`，同时覆盖小 fixture 与真实 `content/*.md`。
- 文档包装/base/sandbox/title/class：`tests/html.test.jsx`。
- 详情路由：`tests/article-detail.test.jsx`、`tests/project-detail.test.jsx`。

```bash
npm test
npm run build
```

内容 registry 改动至少要让 build 成功，因为缺失 raw import、错误路径或语法错误会在构建阶段直接暴露。
