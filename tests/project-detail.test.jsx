// ProjectDetail 组件单测：详情页路由下渲染 iframe + 悬浮返回链接，
// 找不到 slug 时跳回 /projects。
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectDetail from '../src/pages/ProjectDetail.jsx';

function renderAt(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/projects" element={<div data-testid="list">list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProjectDetail', () => {
  it('renders an iframe for a valid slug', () => {
    const { container } = renderAt('/projects/_sample');
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
  });

  it('renders the iframe with fullscreen classes and proper sandbox', () => {
    const { container } = renderAt('/projects/_sample');
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
  });

  it('renders a floating back link to /projects', () => {
    const { container } = renderAt('/projects/_sample');
    const link = container.querySelector('a[href="/projects"]');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('返回项目列表');
  });

  it('positions the back link as fixed top-left', () => {
    const { container } = renderAt('/projects/_sample');
    const link = container.querySelector('a[href="/projects"]');
    expect(link.className).toMatch(/fixed/);
    expect(link.className).toMatch(/top-4/);
    expect(link.className).toMatch(/left-4/);
  });

  it('navigates to /projects when slug is not found', () => {
    const { container } = renderAt('/projects/non-existent-slug');
    // <Navigate> renders nothing; instead the list route is mounted
    const list = container.querySelector('[data-testid="list"]');
    expect(list).not.toBeNull();
  });
});
