# 示例项目

这是一个**示例项目**，用来演示项目页与详情页的工作流。

- 项目数据存放在 `src/data/projects.js`
- Markdown 源文件存放在 `projects/` 目录
- 详情页路由：`/projects/:slug`

## 代码块示例

```js
import Markdown from '../lib/markdown.jsx';

<Markdown>{project.content}</Markdown>
```

> 这个示例项目可以随时删除，只要同时移除 `data/projects.js` 里对应的条目即可。
