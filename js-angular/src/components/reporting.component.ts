import { AfterViewInit, Component, ElementRef, inject, OnDestroy } from '@angular/core';
import { mountReporting, type ReportingWidget } from '@bbq-chat/widgets';

/** Renders the shared reporting surface inside Angular's native widget host. */
@Component({
  selector: 'bbq-reporting-widget',
  standalone: true,
  template: '',
})
export class ReportingWidgetComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private unmount?: () => void;
  widget!: ReportingWidget;
  widgetAction?: (action: string, payload: unknown) => void;

  ngAfterViewInit(): void {
    this.unmount = mountReporting(this.host.nativeElement, this.widget,
      (action, payload) => this.widgetAction?.(action, payload));
  }

  ngOnDestroy(): void {
    this.unmount?.();
  }
}
