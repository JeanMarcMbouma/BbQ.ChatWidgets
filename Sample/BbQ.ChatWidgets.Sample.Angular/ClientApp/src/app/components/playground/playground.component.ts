import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { WidgetManager } from '@bbq-chat/widgets';
import { EXAMPLES, PlaygroundExample } from './examples';

@Component({
  selector: 'app-playground', standalone: true,
  template: `
    <section class="playground" id="playground" aria-labelledby="playground-title">
      <div class="section-heading"><div><p class="eyebrow">TRY IT YOURSELF</p><h2 id="playground-title">A conversation with a next step.</h2></div><span class="demo-badge">Local demo · no API key</span></div>
      <div class="playground-layout">
        <div class="example-list" aria-label="Choose a use case">
          @for (example of examples; track example.id) {
            <button [attr.aria-pressed]="selected.id === example.id" (click)="select(example)"><span>{{ example.category }}</span><strong>{{ example.title }}</strong><span aria-hidden="true">↗</span></button>
          }
          <p>Real widgets. Sample responses.<br />Nothing is sent or saved.</p>
        </div>
        <div class="conversation-preview">
          <div class="preview-heading"><span><span class="status-dot"></span> Interactive preview</span><button (click)="select(selected)">Reset</button></div>
          <div class="preview-user">{{ selected.prompt }}</div>
          <div class="preview-assistant"><span class="assistant-mark" aria-hidden="true">B</span><div><p>{{ selected.reply }}</p><div #container class="preview-widgets"></div></div></div>
          <div role="status" class="action-result" [class.visible]="result()">{{ result() || 'Interact with a widget to see its action result.' }}</div>
          <div class="preview-toolbar"><button [attr.aria-expanded]="showJson" (click)="showJson = !showJson">{{ showJson ? 'Hide' : 'View' }} widget JSON</button><button (click)="copyJson()">Copy JSON</button><span role="status">{{ copyStatus }}</span></div>
          @if (showJson) { <pre class="widget-json"><code>{{ json }}</code></pre> }
        </div>
      </div>
    </section>
  `
})
export class PlaygroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  examples = EXAMPLES;
  selected = EXAMPLES[0];
  result = signal('');
  showJson = false;
  copyStatus = '';
  private manager?: WidgetManager;
  get json() { return JSON.stringify(this.selected.widgets.map(widget => widget.toObject()), null, 2); }
  ngAfterViewInit() { this.render(); }
  select(example: PlaygroundExample) { this.selected = example; this.result.set(''); this.copyStatus = ''; this.render(); }
  private render() {
    const element = this.container.nativeElement;
    this.manager?.detachHandlers(element);
    this.manager = new WidgetManager({ container: element, actionHandler: {
      handle: async (action, payload: Record<string, unknown>) => { this.result.set(this.selected.result(action, payload)); }
    }});
    this.manager.renderInto(element, this.selected.widgets);
  }
  async copyJson() {
    try { await navigator.clipboard.writeText(this.json); this.copyStatus = 'Copied widget JSON'; }
    catch { this.showJson = true; this.copyStatus = 'Select the JSON below to copy it.'; }
  }
  ngOnDestroy() { this.manager?.detachHandlers(this.container.nativeElement); }
}
