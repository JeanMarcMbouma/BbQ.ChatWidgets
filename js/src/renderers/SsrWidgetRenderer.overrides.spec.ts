import { describe, it, expect } from 'vitest';
import { SsrWidgetRenderer } from './SsrWidgetRenderer';
import { ButtonWidget } from '../models/ChatWidget';

describe('SsrWidgetRenderer overrides', () => {
  it('uses custom per-type renderer when provided', () => {
    const renderer = new SsrWidgetRenderer({
      renderers: {
        button: (w) => `<button class="custom">OVERRIDE:${w.label}</button>`,
      },
    });

    const html = renderer.renderWidget(new ButtonWidget('Hello', 'act'));
    expect(html).toContain('OVERRIDE:Hello');
    expect(html).toContain('class="custom"');
    expect(html).not.toContain('bbq-button');
  });

  it('respects custom escape and generateId functions', () => {
    const renderer = new SsrWidgetRenderer({
      escape: (v) => (v ?? '').toUpperCase(),
      generateId: (a) => `CID-${a}`,
    });

    const html = renderer.renderWidget(new ButtonWidget('<b>', 'myAction'));
    // custom escape uppercases values (does not necessarily HTML-escape)
    expect(html).toContain('<B>');
    expect(html).toContain('data-action="MYACTION"');
    expect(html).toContain('data-widget-id="CID-myAction"');
  });
});
