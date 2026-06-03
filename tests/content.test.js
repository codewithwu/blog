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
