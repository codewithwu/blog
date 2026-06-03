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

describe('parseAbout', () => {
  it('空输入返回空对象', () => {
    const r = parseAbout('');
    expect(r).toEqual({
      tagline: '', intro: '', contacts: [], timeline: [], motto: '',
    });
  });

  it('解析首段为 tagline + intro', () => {
    const md = `后端工程师 / 终身学习者

喜欢写代码。`;
    const r = parseAbout(md);
    expect(r.tagline).toBe('后端工程师 / 终身学习者');
    expect(r.intro).toBe('喜欢写代码。');
  });

  it('解析联系方式：识别 GitHub / 邮箱关键字映射图标', () => {
    const md = `## 联系方式
- GitHub: https://github.com/foo
- 邮箱: foo@bar.com
- 个人网站: https://foo.com`;
    const r = parseAbout(md);
    expect(r.contacts).toEqual([
      { label: 'GitHub', href: 'https://github.com/foo', icon: 'Github' },
      { label: '邮箱',   href: 'foo@bar.com',            icon: 'Mail'   },
      { label: '个人网站', href: 'https://foo.com',     icon: null     },
    ]);
  });

  it('解析时间轴：title / subtitle / desc', () => {
    const md = `## 经历
- **2024 – 今** 高级工程师 @ ACME
  负责核心系统。
- **2020 – 2024** 工程师 @ Foo
  从 0 到 1。`;
    const r = parseAbout(md);
    expect(r.timeline).toEqual([
      { year: '2024 – 今', title: '高级工程师', subtitle: 'ACME', desc: '负责核心系统。' },
      { year: '2020 – 2024', title: '工程师', subtitle: 'Foo', desc: '从 0 到 1。' },
    ]);
  });

  it('解析座右铭：去掉 blockquote 前缀', () => {
    const md = `## 座右铭
> "Stay hungry, stay foolish."`;
    const r = parseAbout(md);
    expect(r.motto).toBe('"Stay hungry, stay foolish."');
  });

  it('实际 content/关于.md 能解析出 3 条时间轴、2 个联系方式、1 句座右铭', async () => {
    const mod = await import('../content/关于.md?raw');
    const r = parseAbout(mod.default);
    expect(r.timeline.length).toBe(3);
    expect(r.contacts.length).toBe(2);
    expect(r.motto.length).toBeGreaterThan(0);
  });
});
