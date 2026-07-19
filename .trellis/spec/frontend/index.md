# Frontend 规范索引

本目录覆盖 `src/`、Vite/Tailwind 配置、前端测试和 GitHub Pages 运行约束。项目是 JavaScript React SPA；不存在需要单列的 TypeScript、服务端状态或全局 store 规范。

## 规范列表

| 规范 | 何时阅读 |
|---|---|
| [Architecture and Routing](./architecture-and-routing.md) | 新增/修改路由、页面、布局、Hook、目录或导入时 |
| [Component and Style Guidelines](./component-and-style-guidelines.md) | 新建组件、调整交互、品牌视觉、图标、响应式或可访问性时 |
| [Data and Rendering](./data-and-rendering.md) | 修改 `src/data/`、`src/lib/`、内容 parser、列表/详情数据流或 iframe 时 |
| [Testing and Quality](./testing-and-quality.md) | 写测试、选择验证命令、审查变更或处理失败时 |

内容源本身的格式与发布流程属于 [../content/index.md](../content/index.md)。

## Pre-Development Checklist

1. 先读 `CLAUDE.md`，尤其是路由、文件后缀、图标、HTML 详情页和内容分类规则。
2. 根据改动读取上表中对应的具体规范，不要只读本索引。
3. 搜索现有同类页面、组件、parser 或测试，复用当前结构。
4. 明确数据是否来自 URL、静态 registry、`content/*.md` 或 iframe HTML；不要引入不存在的服务端状态假设。
5. 涉及视觉样式时使用项目 `brand-guidelines`，并对照 `tailwind.config.js` 与 `src/index.css`。
6. 涉及文章/项目/个人内容时，同时读取 content 规范，确认源文件和注册点。

## Frontend 不变量

- `src/main.jsx` 只负责挂载与 provider；`src/App.jsx` 负责路由和路由级布局。
- 页面放在 `src/pages/*.jsx`，复用展示单元放在 `src/components/*.jsx`，纯查询/parser 放在 `src/lib/*.js`。
- 页面标题统一通过 `src/hooks/usePageTitle.js` 设置。
- 列表页使用主站 `brand-*` 风格；文章/项目正文在隔离 iframe 中自带样式。
- 正常内容注册是数据变更，不需要在页面或卡片里硬编码条目。
- 项目没有 lint、typecheck 脚本；可靠的现有门槛是 `npm test` 与 `npm run build`，详见质量规范。
