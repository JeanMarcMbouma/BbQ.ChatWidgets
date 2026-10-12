import { Component, ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WidgetRendererComponent } from './widget-renderer.component';
import { WidgetRegistryService } from './widget-registry.service';
import { ButtonWidget } from '@bbq-chat/widgets';
import { describe, expect, it } from 'vitest';
import { ChatWidget } from '@bbq-chat/widgets';
import { isComponentRenderer, isHtmlRenderer } from './custom-widget-renderer.types';

@Component({ standalone: true, template: '<p>{{ widget.label }}</p>' })
class InjectedWidget {
  widget!: ChatWidget;
  constructor(readonly changes: ChangeDetectorRef) {}
}

describe('custom renderer classification', () => {
  it('recognizes components with required constructor dependencies', () => {
    expect(isComponentRenderer(InjectedWidget)).toBe(true);
    expect(isHtmlRenderer(InjectedWidget)).toBe(false);
  });
  it('keeps zero-argument HTML functions as HTML renderers', () => {
    function html() { return '<p>Custom widget</p>'; }
    expect(isComponentRenderer(html)).toBe(false);
    expect(isHtmlRenderer(html)).toBe(true);
  });
});

describe('mixed widget rendering', () => {
  it('renders an injected component after HTML without replacing the HTML widget', async () => {
    TestBed.configureTestingModule({ imports: [WidgetRendererComponent, InjectedWidget] });
    const registry = TestBed.inject(WidgetRegistryService);
    registry.registerRenderer('html-test', () => '<p>HTML first</p>');
    registry.registerRenderer('component-test', InjectedWidget);
    const fixture = TestBed.createComponent(WidgetRendererComponent);
    const html = new ButtonWidget('HTML first', 'html');
    const component = new ButtonWidget('Component second', 'component');
    Object.assign(html, { type: 'html-test' });
    Object.assign(component, { type: 'component-test' });
    fixture.componentRef.setInput('widgets', [html, component]);
    fixture.detectChanges();
    await fixture.whenStable();
    const hosts = fixture.nativeElement.querySelectorAll('.bbq-widgets-container > .bbq-widget');
    expect(hosts[0].textContent).toContain('HTML first');
    expect(hosts[1].textContent).toContain('Component second');
    fixture.destroy();
  });
});
