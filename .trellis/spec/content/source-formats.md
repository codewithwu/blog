# Source Formats

## 适用范围

手工创建、编辑或审查文章、项目、技能、工具和关于内容时遵循本规范。通过本地 skill 执行批量/草稿流程时，还要读取 [Maintenance Workflows](./maintenance-workflows.md)。

## 文章源文件

### 路径与分类

已发布文章必须位于：

```text
articles/<category>/<slug>.html
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

不能发明第七类。中文显示名与顺序只改 `src/data/categories.js`。文章 slug 在所有分类间全局唯一，因为详情路由只有 `/articles/:slug`。

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
import example from '../../articles/ai/example.html?raw';

{
  slug: 'example',
  title: '文章标题',
  excerpt: '列表摘要',
  date: '2026-07-19',
  tags: ['标签'],
  cover: null,
  content: example,
  category: 'ai',
}
```

必填字段是 `slug / title / excerpt / date / tags / cover / content / category`。import 路径分类、metadata category 和实际目录必须一致。slug 与文件名一致；import 变量只需是有效且不冲突的 JavaScript 标识符，不要在删除/修复时凭 slug 重新猜变量名。

## 项目源文件

已发布项目位于：

```text
projects/<slug>.html
```

同样支持完整文档或 fragment，统一走 `Html` iframe。项目详情允许自己的视觉标识；项目列表卡仍使用主站品牌样式。

`src/data/projects.js` 的注册形状：

```js
import exampleProject from '../../projects/example-project.html?raw';

{
  slug: 'example-project',
  name: 'Example Project',
  description: '列表描述',
  techStack: ['React', 'Vite'],
  githubUrl: 'https://github.com/...',
  demoUrl: null,
  cover: null,
  content: exampleProject,
}
```

字段 `slug / name / description / techStack / githubUrl / demoUrl / cover / content` 必须齐全。数组顺序就是项目列表顺序。`ProjectCard` 当前无条件渲染 GitHub 链接，因此普通项目应提供有效 `githubUrl`；若产品要允许缺失，先修改组件合同和测试。

## 技能页 Markdown

单一来源：`content/技能.md`。格式：

```markdown
## 前端
- React: 精通
- TypeScript: 熟练
```

- `## ` 开始一个 category。
- category 之后的 `- name: level` 形成条目。
- level 只能是 `进阶 / 熟练 / 精通`。
- 未知 level 会被 parser 静默归一为 `进阶`；维护流程应在写入前阻止/确认，而不是依赖 fallback。
- 没有冒号的条目会被忽略。
- 同组重名会导致 React key 重复，应在源文件中去重。

修改内容不要编辑 `src/data/skills.js`；它只是 raw import + `parseSkills` wrapper。

## 工具页 Markdown

单一来源：`content/工具.md`。推荐格式：

```markdown
## 编辑器
- VS Code (Code2): 日常主力编辑器
```

parser 支持：

- `## category`。
- `- name (icon): desc`。
- icon 或 desc 可省略；没有 icon/未知 icon 时卡片回退为 Lucide `Wrench`。
- `:` 只按第一个分隔，工具名本身不应包含冒号。
- icon 是 `lucide-react` 的大小写敏感 PascalCase export；写入前验证。
- parser 不支持 URL、tags、level 等额外字段。要扩展必须同步 `parseTools`、`ToolCard`/`Tools` 和测试。

修改内容不要编辑 `src/data/tools.js`。

## 关于页 Markdown

单一来源：`content/关于.md`。

### Preamble

首个 `##` 之前：

- 第一条非空行 → `tagline`。
- 后续非空行 → `intro`，以换行连接。

### 联系方式

```markdown
## 联系方式
- GitHub: https://github.com/codewithwu
- 邮箱: codewithwu@gmail.com
```

按第一个冒号拆 label/href。只有精确 label `GitHub` 和 `邮箱` 会映射现有 Lucide 图标；其他 label 仍可显示文字链接，但无 icon。新增图标映射时同步 `parseAbout` 与 `About.jsx`。

### 经历

```markdown
## 经历
- **2023.06 – 今** Agent 核心工程师 @ 某 AI 机器人公司
  描述内容。
```

header 必须匹配 `- **year** title @ subtitle`，`@` 两侧保留空格。随后带缩进且不以 `-` 开头的行组成 desc。格式不匹配的 header 会被忽略。

### 座右铭

```markdown
## 座右铭
> "Engineers don't write code. They dissolve problems."
```

非空行会去掉可选 `>` 并以空格连接。其他未知 `##` section 当前 parser 不消费；不要添加后假设页面会自动显示。

关于页正文不能硬编码进 `src/pages/About.jsx`。当前显示名“极客熊猫”和 avatar 文字“极客”确实仍是页面结构的一部分；若要内容化，需先设计 parser 合同。

## 图片与资源

- 所有图片引用使用相对路径，避免第三方热链和部署 base 不一致。
- Vite 主站资源必须考虑 `/blog/` base；iframe 的 `about:srcdoc` base 规则不同，发布前实际点击/加载验证。
- 不要仅因为本地 dev server 能显示绝对 `/foo.png` 就认为 GitHub Pages 二级路径可用。

## 反模式

- 发布 `.md` 到 `articles/` 或把项目正文放进 data 字符串。
- 在固定六类之外创建文章目录。
- import 路径、metadata category 与实际文件目录不一致。
- 只修改 registry，不保留对应 HTML；或只加 HTML，不注册。
- 在 `src/data/skills.js`、`src/data/tools.js`、`About.jsx` 硬编码个人内容。
- 在 iframe HTML 中使用 `brand-*` 类却不提供 Tailwind/CSS。
- 增加 parser 不支持的 Markdown section/字段却不改 parser 和页面。

## 验证

```bash
npm test
npm run build
```

同时检查：

- 源文件存在且路径与 registry 一致。
- raw import 以 `.html?raw` 或 `.md?raw` 结尾。
- 文章 category 属于 `categorySlugSet`。
- slug 无重复。
- Markdown 经 parser 后条目/section 没有被静默丢弃。
- iframe 内图片、锚点和外链在真实页面可用。
