// 工具数据：icon 字段是 lucide-react 组件名，运行时动态 import
export default [
  {
    category: '编辑器',
    items: [
      { name: 'VS Code', icon: 'Code2', desc: '日常主力编辑器' },
      { name: 'Vim', icon: 'Terminal', desc: '终端里的编辑器' }
    ]
  },
  {
    category: '设计工具',
    items: [
      { name: 'Figma', icon: 'PenTool', desc: '界面设计与原型' }
    ]
  },
  {
    category: '调试工具',
    items: [
      { name: 'Chrome DevTools', icon: 'Bug', desc: '前端调试利器' },
      { name: 'Postman', icon: 'Send', desc: 'API 调试' }
    ]
  },
  {
    category: '效率工具',
    items: [
      { name: 'Raycast', icon: 'Zap', desc: '快捷启动与脚本' },
      { name: 'Notion', icon: 'BookOpen', desc: '笔记与知识库' }
    ]
  }
];
