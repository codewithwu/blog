// Html 组件单测：完整文档与 HTML 片段都走 iframe srcDoc
// 片段会被包成最小文档 <!doctype html><html>...<body>...</body></html>
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Html from '../src/lib/html.jsx';

describe('Html component', () => {
  it('renders an iframe for a full HTML document', () => {
    const doc = '<!doctype html><html><body><p>hello</p></body></html>';
    const { container } = render(<Html html={doc} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe.getAttribute('srcDoc')).toBe(doc);
  });

  it('wraps an HTML fragment in a minimal document for srcDoc', () => {
    const fragment = '<section><p>片段内容</p></section>';
    const { container } = render(<Html html={fragment} />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcDoc');
    expect(srcDoc).toContain('<!doctype html>');
    expect(srcDoc).toContain('<body>');
    expect(srcDoc).toContain('片段内容');
  });

  it('applies fullscreen classes to the iframe', () => {
    const { container } = render(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.className).toMatch(/w-full/);
    expect(iframe.className).toMatch(/h-screen/);
    expect(iframe.className).toMatch(/border-0/);
  });

  it('uses a sandbox that allows scripts, popups, and forms (no same-origin)', () => {
    const { container } = render(<Html html="<p>x</p>" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups allow-forms');
  });

  it('uses the title prop when provided', () => {
    const { container } = render(<Html html="<p>x</p>" title="My Project" />);
    const iframe = container.querySelector('iframe');
    expect(iframe.getAttribute('title')).toBe('My Project');
  });
});
