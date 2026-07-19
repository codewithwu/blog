# Source Formats

## 适用范围

手工创建、编辑或审查文章与项目内容时遵循本规范。AI 命令驱动上传（"把某个 .md 整理后上传到网站"）走 [AI Upload Flow](./ai-upload-flow.md)；批量/草稿合并与 registry 同步走 [Maintenance Workflows](./maintenance-workflows.md)。

> 瀑布流重构（2026-07）后：技能 / 工具 / 关于三个独立页签已永久下线，对应的 `content/*.md` 源、`src/lib/content.js` parser、以及 `parseSkills` / `parseTools` / `parseAbout` 已不存在。本规范不再覆盖它们。若要在文章或项目里复述同类信息，按文章 / 项目合同走。

## 文章源文件

### 路径与分类

已发布文章必须位于：

```text
content/<slug>.html
```

`<category>` 只能是 `src/data/categories.js` 声明的六个固定 slug：

| slug | 中文显示名 | 范围 |
|---|---|---|
| `ai` | AI | 模型、提示、RAG、智能体、AI 工具/产品与行业观察 |
| `python` | Python | Python 语言与生态 |
| `engineering` | 软件工程与开发实践 | 架构、部署、语言心得、DevOps |
| `product` | 产品与设计 | 产品、UX、交互、需求 |
| `notes` | 随笔与思考 | 读书、生活、反思 |
| `resources` | 资源整理 | 书单、工具、学习路线与清单 |

不能发明第七类。中文显示名与顺序只改 `src/data/categories.js`。文章 slug 在所有分类间全局唯一，详情路由统一为 `/p/:slug`（瀑布流重构后）。

### HTML 形态

文章 HTML 可以是完整文档或 fragment：

- 完整文档可包含 doctype、html/head/body、自定义字体、CSS 变量、内联 style/script。
- fragment 会由 `src/lib/html.jsx` 包成最小文档，但仍在 iframe 中运行。
- 两者都不继承主站 Tailwind 或 `src/index.css`；作者必须提供正文所需样式。
- 图片使用相对路径。考虑 `<base href="about:srcdoc">` 注入对相对 URL 的影响；需要特殊 base 时由完整文档自己声明。
- 外部链接建议 `target="_blank" rel="noreferrer"`，否则可能在 iframe 内替换正文。
- 不要在作者 HTML 里依赖宿主 cookie、localStorage 或 DOM；sandbox 没有 `allow-same-origin`。

由 `create-article` 生成的文章使用品牌模板；手写 HTML 可以自定义视觉，但必须自行保证可读、响应式和资源可用。

### 文章 registry

`src/data/articles.js` 必须同时包含：

```js
import example from '../../content/<slug>.html?raw';

{
  slug: 'example',
  title: '文章标题',
  excerpt: '列表摘要',
  date: '2026-07-19',
  tags: ['标签'],
  cover: null,
  content: example,
  category: 'ai',
  type: 'article',   // 瀑布流重构后必填，用于与项目区分
  links: null,        // 文章无外链占位
}
```

必填字段是 `slug / title / excerpt / date / tags / cover / content / category / type / links`。import 路径分类、metadata category 和实际目录必须一致。slug 与文件名一致；import 变量只需是有效且不冲突的 JavaScript 标识符，不要在删除/修复时凭 slug 重新猜变量名。

## 项目源文件

已发布项目位于：

```text
content/<slug>.html
```

同样支持完整文档或 fragment，统一走 `Html` iframe。项目详情允许自己的视觉标识；项目列表卡仍使用主站品牌样式。

`src/data/projects.js` 的注册形状（瀑布流重构后统一为 Entry 字段）：

```js
import exampleProject from '../../content/<slug>.html?raw';

{
  slug: 'example-project',
  title: 'Example Project',                  // 原 name 改名
  excerpt: '列表描述',                        // 原 description 改名
  date: '1970-01-01',                        // 项目若无显式日期，用 1970-01-01 占位
  tags: ['React', 'Vite'],                   // 原 techStack 改名
  cover: null,
  links: { github: 'https://github.com/...', demo: null },  // 替代 githubUrl/demoUrl
  content: exampleProject,
  type: 'project',                           // 必填，与文章区分
  category: null,                            // 项目不参与文章分类
}
```

字段 `slug / title / excerpt / date / tags / cover / links / content / type / category` 必须齐全。`src/lib/entries.js` 会按 `date` 降序再排，与声明顺序解耦。`EntryCard` 仅当 `links.github` 存在时渲染 GitHub 图标，`demo` 同理。

## 图片与资源

- 所有图片引用使用相对路径，避免第三方热链和部署 base 不一致。
- Vite 主站资源必须考虑 `/blog/` base；iframe 的 `about:srcdoc` base 规则不同，发布前实际点击/加载验证。
- 不要仅因为本地 dev server 能显示绝对 `/foo.png` 就认为 GitHub Pages 二级路径可用。

## 反模式

- 发布到 `content/<slug>.html`（articles-draft / projects-draft 仍按各自约定维护）；或把项目正文放进 data 字符串。
- 在固定六类之外创建文章目录。
- import 路径、metadata category 与实际文件目录不一致。
- 只修改 registry，不保留对应 HTML；或只加 HTML，不注册。
- 在 iframe HTML 中使用 `brand-*` 类却不提供 Tailwind/CSS。
- 重新引入 `content/{技能,工具,关于}.md` 或对应 parser / page 组件——它们已在瀑布流重构中永久下线。
- 把项目硬塞进文章分类（`category` 在项目上必须为 `null`）。
- 项目 metadata 漏掉 `type` / `links` / 改名后的 `title` / `excerpt` / `tags`。

## 验证

```bash
npm test
npm run build
```

同时检查：

- 源文件存在且路径与 registry 一致。
- raw import 以 `.html?raw` 或 `.md?raw` 结尾。
- 文章 category 属于 `categorySlugSet`。
- slug 无重复（articles 与 projects 之间）。
- 项目 `type === 'project'` 且 `category === null`。
- iframe 内图片、锚点和外链在真实页面可用。