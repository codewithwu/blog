# 极客熊猫项目规范

`.trellis/spec/` 记录本仓库**已经存在并被源码证明**的开发约定。它不是通用 React 教程，也不替代 `CLAUDE.md`；后者仍是强制约束的最高层入口。

## 项目边界

本仓库只有一个运行时包，是部署到 GitHub Pages 的 React/Vite 单页应用。开发工作分成两个真实边界：

| 边界 | 负责内容 | 入口 |
|---|---|---|
| Frontend | React 启动与路由、组件、品牌样式、静态数据消费、瀑布流与 iframe 详情渲染、测试与构建 | [frontend/index.md](./frontend/index.md) |
| Content | 文章/项目 HTML、数据注册、草稿发布、AI 命令上传与本地维护技能 | [content/index.md](./content/index.md) |

项目没有后端、数据库、API/service 层、全局状态库、TypeScript 类型层或多包工作区，不要为这些不存在的层添加规范。

## 证据优先级

写代码或维护规范时，如果说明互相冲突，按以下顺序判断：

1. `CLAUDE.md` 的强制规则。
2. 当前源码与配置，例如 `src/App.jsx`、`src/lib/html.jsx`、`vite.config.js`。
3. 与当前实现一致的测试；过时 fixture 不能反向定义产品行为。
4. `README.md`、`code_map.md` 和历史设计文档。
5. `.claude/skills/*/SKILL.md` 中仍与源码一致的维护步骤。

这一顺序很重要：项目本地 skill 和旧文档可能滞后。发现冲突时应先修正理解，再单独安排文档/测试同步，不能把旧描述复制进新实现。

## 开发前快速路由

- 改路由、页面布局、文件组织或页面标题：读 [frontend/architecture-and-routing.md](./frontend/architecture-and-routing.md)。
- 改 React 组件、Tailwind、交互、图标或可访问性：读 [frontend/component-and-style-guidelines.md](./frontend/component-and-style-guidelines.md)。
- 改 data/lib、文章或项目详情渲染：读 [frontend/data-and-rendering.md](./frontend/data-and-rendering.md)。
- 写测试、判断验证范围或报告失败：读 [frontend/testing-and-quality.md](./frontend/testing-and-quality.md)。
- 手工编辑文章或项目源文件：读 [content/source-formats.md](./content/source-formats.md)。
- 通过「把 m.md 整理后上传到网站」类命令执行 AI 上传：读 [content/ai-upload-flow.md](./content/ai-upload-flow.md)。
- 发布/删除内容、合并草稿或修改项目本地 skill：读 [content/maintenance-workflows.md](./content/maintenance-workflows.md)。

## 全局不变量

- GitHub Pages 使用 `HashRouter`；二级部署路径由 `vite.config.js` 的 `base: '/blog/'` 决定。
- JSX 文件必须用 `.jsx`；Markdown/HTML 作为字符串导入时必须带 `?raw`。
- 图片资源使用相对路径。
- 图标统一使用 `lucide-react`。
- 非显然逻辑使用清晰的中文注释，尤其是浏览器行为、数据合同和跨文件同步。
- 文章与项目详情统一为全屏 iframe（路由 `/p/:slug`）；主站 Tailwind 不会进入 iframe。
- 瀑布流首页 (`/`) 渲染 `Hero` + `EntryCard` 列表；不再有全局 Navbar / Footer。
- 修改用户已有文件前先读目标；删除、覆盖和发布类操作按对应维护流程确认并验证。

## 规范自身的完成检查

规范更新后至少检查：

```bash
find .trellis/spec -type f -print | sort
npm test
npm run build
```

人工确认没有模板残留、空章节或失效链接。测试或构建失败必须按实际输出报告，不能因为改动只涉及文档就省略或宣称成功。
