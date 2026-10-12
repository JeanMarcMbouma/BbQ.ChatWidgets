import { Component, Input } from '@angular/core';
import { ChatMessage } from '../models/chat.models';

@Component({
  selector: 'app-widget-generation-notice',
  standalone: true,
  template: `
    @if (outcome && outcome.status !== 'emitted') {
      <aside role="status">
        @switch (outcome.status) {
          @case ('not_called') { <p>No widget was generated: the model did not invoke the widget tool. Check provider tool-choice support and function invocation middleware.</p> }
          @case ('rejected') { <p>The widget was rejected by validation and was not displayed.</p> }
          @default { <p>The model chose a text-only response; no widget was generated.</p> }
        }
        @for (item of outcome.diagnostics; track $index) {
          <p><code>{{item.code}}</code> at <code>{{item.path}}</code>: {{item.message}}</p>
        }
      </aside>
    }
  `,
  styles: [`aside { margin-top: 12px; padding: 12px; border: 1px solid #dce3dd; border-radius: 8px; background: #f7f8f2; color: #182820; font-size: 14px; }`]
})
export class WidgetGenerationNoticeComponent {
  @Input() outcome?: ChatMessage['widgetGeneration'];
}
