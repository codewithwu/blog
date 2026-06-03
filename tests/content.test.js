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
    const mod = await import('../content/技能.md?raw');
    const groups = parseSkills(mod.default);
    const total = groups.reduce((s, g) => s + g.items.length, 0);
    expect(total).toBe(11);
  });
});

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
