import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SsrWidgetRenderer,
  WidgetEventManager,
  ChatWidget,
} from '@bbq-chat/widgets';

/**
 * Angular component for rendering chat widgets
 * 
 * This component handles rendering of chat widgets using the BbQ ChatWidgets library.
 * It manages widget lifecycle, event handling, and cleanup.
 * 
 * @example
 * ```typescript
 * <bbq-widget-renderer 
 *   [widgets]="messageWidgets" 
 *   (widgetAction)="handleWidgetAction($event)">
 * </bbq-widget-renderer>
 * ```
 */
@Component({
  selector: 'bbq-widget-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #widgetContainer class="bbq-widgets-container" (click)="handleClick($event)">
      @for (widgetHtml of widgetHtmlList; track $index) {
        <div class="bbq-widget" [innerHTML]="widgetHtml"></div>
      }
    </div>
  `,
  styles: [
    `
      .bbq-widgets-container {
        margin-top: 0.5rem;
      }

      .bbq-widget {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class WidgetRendererComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  /**
   * Array of widgets to render
   */
  @Input() widgets: ChatWidget[] | null | undefined;

  /**
   * Emits when a widget action is triggered
   */
  @Output() widgetAction = new EventEmitter<{
    actionName: string;
    payload: any;
  }>();

  @ViewChild('widgetContainer', { static: false })
  containerRef!: ElementRef<HTMLDivElement>;

  widgetHtmlList: string[] = [];
  protected renderer = new SsrWidgetRenderer();
  protected eventManager?: WidgetEventManager;
  protected isViewInitialized = false;

  ngOnInit() {
    this.updateWidgetHtml();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['widgets']) {
      this.updateWidgetHtml();
    }
  }

  ngAfterViewInit() {
    this.isViewInitialized = true;
    this.setupEventHandlers();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  protected updateWidgetHtml() {
    if (!this.widgets || this.widgets.length === 0) {
      this.widgetHtmlList = [];
      return;
    }

    this.widgetHtmlList = this.widgets.map((widget) => {
      // Render all widgets using library renderer
      return this.renderer.renderWidget(widget);
    });

    // After view updates, reinitialize widgets only if view is already initialized
    if (this.isViewInitialized) {
      setTimeout(() => {
        this.setupEventHandlers();
      }, 0);
    }
  }

  private setupEventHandlers() {
    if (!this.containerRef?.nativeElement) return;

    // Cleanup old resources before setting up new ones
    this.cleanup();

    const container = this.containerRef.nativeElement;

    // Create a custom action handler that emits events
    const actionHandler = {
      handle: async (action: string, payload: any) => {
        this.widgetAction.emit({ actionName: action, payload });
      },
    };

    // Attach event handlers using WidgetEventManager
    this.eventManager = new WidgetEventManager(actionHandler);
    this.eventManager.attachHandlers(container);
  }

  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Only trigger actions on non-form buttons and clickable elements (cards)
    // Don't trigger on input elements or form buttons (let WidgetEventManager handle those)
    const button = target.tagName === 'BUTTON' ? target : target.closest('button');
    if (button && !button.closest('[data-widget-type="form"]')) {
      const actionName = button.getAttribute('data-action');
      if (actionName) {
        try {
          const payloadStr = button.getAttribute('data-payload');
          const payload = payloadStr ? JSON.parse(payloadStr) : {};
          this.widgetAction.emit({ actionName, payload });
        } catch (err) {
          console.error('Failed to parse widget action payload:', err);
        }
      }
    }
  }

  /**
   * Cleanup all resources including event listeners.
   */
  private cleanup() {
    // Cleanup event manager
    this.eventManager = undefined;
  }
}
