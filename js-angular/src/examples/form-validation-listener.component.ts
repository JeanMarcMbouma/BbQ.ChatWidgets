import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormValidationService, FormValidationEvent } from '../services/form-validation.service';
import { ANGULAR_WIDGET_RENDERER, angularWidgetRendererFactory } from '../widget-di.tokens';

@Component({
  selector: 'bbq-form-validation-listener',
  standalone: true,
  imports: [JsonPipe],
  providers: [
    { provide: ANGULAR_WIDGET_RENDERER, useFactory: angularWidgetRendererFactory },
  ],
  template: `
    <div class="bbq-validation-listener">
      @if (lastEvent) {
        <div>
          <strong>Last validation (formId: {{ lastEvent.formId }})</strong>
          <pre>{{ lastEvent | json }}</pre>
        </div>
      } @else {
        <small>No validation events yet.</small>
      }
    </div>
  `,
})
export class FormValidationListenerComponent implements OnInit, OnDestroy {
  @Input() formId?: string;
  lastEvent?: FormValidationEvent | null = null;
  private sub?: Subscription;

  constructor(private svc: FormValidationService) {}

  ngOnInit() {
    this.sub = this.svc.validation$.subscribe(ev => {
      if (!this.formId || ev.formId === this.formId) {
        this.lastEvent = ev;
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
