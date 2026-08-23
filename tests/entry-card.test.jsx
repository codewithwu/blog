// EntryCard 单测：验证 P0-1 改造（父任务 08-23-ux-optimization-suite）
//   - 整卡 <a href> 而非 <div role="link">
//   - 内部 button preventDefault 阻断冒泡
//   - tag/category chip 移动端 44pt 触控目标
//   - 项目外链改 <button> + window.open
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EntryCard from '../src/components/EntryCard.jsx';

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <EntryCard
        entry={props.entry ?? defaultEntry}
        isFocused={props.isFocused}
        revealDelay={props.revealDelay ?? 0}
        onTagClick={props.onTagClick}
      />
    </MemoryRouter>
  );
}

const defaultEntry = {
  slug: 'demo-article',
  title: 'Demo Article',
  excerpt: 'A demo article',
  date: '2026-01-01',
  type: 'article',
  category: 'ai',
  tags: ['tag1', 'tag2', 'tag3'],
  cover: null,
  links: null,
  content: '',
};

describe('EntryCard P0-1 改造', () => {
  it('AC-1：整卡渲染为 <a href="/p/<slug>"> 而非 <div role="link">', () => {
    const { container } = renderCard();
    const card = container.querySelector('a[href="/p/demo-article"]');
    expect(card).not.toBeNull();
    expect(card.tagName).toBe('A');
    // 不显式声明 role（<a> 原生就是 link）
    expect(card.getAttribute('role')).toBeNull();
    // 不需要 tabIndex（<a href> 原生 focusable）
    expect(card.getAttribute('tabindex')).toBeNull();
  });

  it('AC-1：aria-label 明确语义（"阅读文章：<title>" / "查看项目：<title>"）', () => {
    const { container } = renderCard({ entry: { ...defaultEntry, type: 'article' } });
    expect(container.querySelector('a').getAttribute('aria-label')).toBe('阅读文章：Demo Article');

    const { container: c2 } = renderCard({
      entry: { ...defaultEntry, slug: 'demo-project', type: 'project', category: null },
    });
    expect(c2.querySelector('a').getAttribute('aria-label')).toBe('查看项目：Demo Article');
  });

  it('AC-1：forwardRef 暴露 DOM 引用（<a> 与 <div> 同样接受 ref）', () => {
    const { createRef } = require('react');
    const ref = createRef();
    render(
      <MemoryRouter>
        <EntryCard entry={defaultEntry} ref={ref} />
      </MemoryRouter>
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName.toLowerCase()).toBe('a');
    expect(ref.current.getAttribute('href')).toBe('/p/demo-article');
  });

  it('AC-2：tag chip 点击不触发整卡 navigate（preventDefault 生效）', () => {
    const onTagClick = vi.fn();
    const { container } = renderCard({ onTagClick });
    const tagBtn = container.querySelector('button.text-brand-primary');
    expect(tagBtn).not.toBeNull();
    // 创建并触发 click 事件，断言 preventDefault 被调用
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true });
    tagBtn.dispatchEvent(clickEvt);
    expect(clickEvt.defaultPrevented).toBe(true);
    expect(onTagClick).toHaveBeenCalledWith('tag1');
  });

  it('AC-2：category chip 点击也走 preventDefault + onTagClick', () => {
    const onTagClick = vi.fn();
    const { container } = renderCard({ onTagClick });
    const catBtn = container.querySelector('button.text-brand-accent');
    expect(catBtn).not.toBeNull();
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true });
    catBtn.dispatchEvent(clickEvt);
    expect(clickEvt.defaultPrevented).toBe(true);
    expect(onTagClick).toHaveBeenCalledWith('AI'); // category=ai → 中文名 "AI"
  });

  it('AC-2：项目 GitHub 外链改 <button> + window.open（不再 <a> 嵌套 <a>）', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const projectEntry = {
      ...defaultEntry,
      slug: 'demo-project',
      type: 'project',
      category: null,
      links: { github: 'https://github.com/example/repo', demo: 'https://demo.example.com' },
    };
    const { container } = renderCard({ entry: projectEntry });

    const ghBtn = container.querySelector('button[aria-label^="GitHub："]');
    expect(ghBtn).not.toBeNull();
    expect(ghBtn.tagName).toBe('BUTTON');

    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true });
    ghBtn.dispatchEvent(clickEvt);
    expect(clickEvt.defaultPrevented).toBe(true);
    expect(openSpy).toHaveBeenCalledWith('https://github.com/example/repo', '_blank', 'noopener,noreferrer');
  });

  it('AC-3：tag/category chip 移动端触控目标 ≥ 44pt（min-h/min-w utility）', () => {
    const { container } = renderCard();
    const tagBtn = container.querySelector('button.text-brand-primary');
    const catBtn = container.querySelector('button.text-brand-accent');
    // className 含 [@media(max-width:640px)]:min-h-[44px] 守卫
    expect(tagBtn.className).toMatch(/min-h-\[44px\]/);
    expect(tagBtn.className).toMatch(/min-w-\[44px\]/);
    expect(catBtn.className).toMatch(/min-h-\[44px\]/);
    expect(catBtn.className).toMatch(/min-w-\[44px\]/);
  });

  it('AC-3：项目 GitHub/Demo 外链按钮移动端触控目标 ≥ 44pt', () => {
    const projectEntry = {
      ...defaultEntry,
      slug: 'demo-project',
      type: 'project',
      category: null,
      links: { github: 'https://github.com/example/repo' },
    };
    const { container } = renderCard({ entry: projectEntry });
    const ghBtn = container.querySelector('button[aria-label^="GitHub："]');
    expect(ghBtn.className).toMatch(/min-h-\[44px\]/);
    expect(ghBtn.className).toMatch(/min-w-\[44px\]/);
  });

  it('AC-1：focused 卡片视觉保留（isFocused ring 与 <a> focus-visible 共存）', () => {
    const { container } = renderCard({ isFocused: true });
    const card = container.querySelector('a[href^="/p/"]');
    const cls = card.className;
    // isFocused 时强制 ring-2 ring-brand-glow（j/k 焦点视觉保证）
    expect(cls).toMatch(/ring-2/);
    expect(cls).toMatch(/ring-brand-glow/);
    // 同时保留 focus-visible:ring-*（Tab/鼠标聚焦）
    expect(cls).toMatch(/focus-visible:ring/);
  });
});