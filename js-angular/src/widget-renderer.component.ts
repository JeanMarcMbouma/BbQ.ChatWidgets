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
  ComponentRef,
  EmbeddedViewRef,
  TemplateRef,
  inject,
  Injector,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SsrWidgetRenderer,
  WidgetEventManager,
  ChatWidget,
} from '@bbq-chat/widgets';
import { WidgetRegistryService } from './widget-registry.service';
import {
  WidgetTemplateContext,
  isHtmlRenderer,
  isComponentRenderer,
  isTemplateRenderer,
} from './custom-widget-renderer.types';

/**
 * Angular component for rendering chat widgets
 * 
 * This component handles rendering of chat widgets using the BbQ ChatWidgets library.
 * It manages widget lifecycle, event handling, and cleanup. 
 * 
 * Supports three types of custom widget renderers:
 * 1. HTML function renderers (return HTML strings)
 * 2. Angular Component renderers (render as dynamic components)
 * 3. Angular TemplateRef renderers (render as embedded views)
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
      @for (item of widgetItems; track item.index) {
        @if (item.isHtml) {
          <div class="bbq-widget" [innerHTML]="item.html"></div>
        } @else {
          <div class="bbq-widget" #dynamicWidget></div>
        }
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
    payload: unknown;
  }>();

  @ViewChild('widgetContainer', { static: false })
  containerRef!: ElementRef<HTMLDivElement>;

  protected widgetItems: Array<{
    index: number;
    widget: ChatWidget;
    isHtml: boolean;
    html?: string;
  }> = [];
  
  protected renderer = new SsrWidgetRenderer();
  protected eventManager?: WidgetEventManager;
  protected isViewInitialized = false;
  protected widgetRegistry: WidgetRegistryService;
  protected injector: Injector;
  protected environmentInjector: EnvironmentInjector;
  protected dynamicComponents: Array<ComponentRef<any>> = [];
  protected dynamicViews: Array<EmbeddedViewRef<WidgetTemplateContext>> = [];

  constructor() {
    this.widgetRegistry = inject(WidgetRegistryService);
    this.injector = inject(Injector);
    this.environmentInjector = inject(EnvironmentInjector);
  }

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
    // Render dynamic components/templates after view init
    this.renderDynamicWidgets();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  /**
   * Base implementation for updating the rendered HTML for the current widgets.
   *
   * Subclasses may override this method to customize how widgets are rendered
   * (for example, to inject additional markup or perform preprocessing).
   *
   * Since this is the base implementation, overriding implementations are not
   * required to call `super.updateWidgetHtml()`.
   */
  protected updateWidgetHtml() {
    if (!this.widgets || this.widgets.length === 0) {
      this.widgetItems = [];
      return;
    }

    this.widgetItems = this.widgets.map((widget, index) => {
      const customRenderer = this.widgetRegistry.getRenderer(widget.type);
      
      // Check template renderer first (most specific)
      if (customRenderer && isTemplateRenderer(customRenderer)) {
        return {
          index,
          widget,
          isHtml: false,
        };
      }
      
      // Check component renderer second
      if (customRenderer && isComponentRenderer(customRenderer)) {
        return {
          index,
          widget,
          isHtml: false,
        };
      }
      
      // Check HTML function renderer last (most general, matches any function)
      if (customRenderer && isHtmlRenderer(customRenderer)) {
        return {
          index,
          widget,
          isHtml: true,
          html: customRenderer(widget),
        };
      }
      
      // Default: render using the BbQ library renderer
      return {
        index,
        widget,
        isHtml: true,
        html: this.renderer.renderWidget(widget),
      };
    });

    // After view updates, reinitialize widgets only if view is already initialized
    if (this.isViewInitialized) {
      setTimeout(() => {
        this.setupEventHandlers();
        this.renderDynamicWidgets();
      }, 0);
    }
  }

  /**
   * Render dynamic components and templates for custom widgets
   */
  protected renderDynamicWidgets() {
    if (!this.containerRef?.nativeElement) return;
    
    // Use microtask to ensure Angular has completed change detection
    Promise.resolve().then(() => {
      if (!this.containerRef?.nativeElement) return;
      
      // Clean up existing dynamic components and views
      this.cleanupDynamicWidgets();

      const container = this.containerRef.nativeElement;
      // Query all widget divs without the data-rendered filter
      const dynamicWidgetDivs = Array.from(
        container.querySelectorAll('.bbq-widget')
      ) as HTMLElement[];
      
      let dynamicIndex = 0;
      this.widgetItems.forEach((item) => {
        if (!item.isHtml) {
          const customRenderer = this.widgetRegistry.getRenderer(item.widget.type);
          
          if (!customRenderer) return;
          
          const targetDiv = dynamicWidgetDivs[dynamicIndex];
          if (!targetDiv) return;
          
          // Clear the div content before rendering
          targetDiv.innerHTML = '';
          
          if (isComponentRenderer(customRenderer)) {
            this.renderComponent(customRenderer, item.widget, targetDiv);
          } else if (isTemplateRenderer(customRenderer)) {
            this.renderTemplate(customRenderer, item.widget, targetDiv);
          }
          
          dynamicIndex++;
        }
      });
    });
  }

  /**
   * Render an Angular component for a custom widget
   * 
   * Note: This method safely assigns properties to component instances
   * by checking for property existence at runtime. This approach is necessary
   * because we cannot statically verify that all components implement
   * the CustomWidgetComponent interface.
   */
  protected renderComponent(
    componentType: any,
    widget: ChatWidget,
    targetElement: HTMLElement
  ) {
    // Create the component using Angular's createComponent API
    const componentRef = createComponent(componentType, {
      environmentInjector: this.environmentInjector,
      elementInjector: this.injector,
    });
    
    // Safely set component inputs if they exist
    const instance = componentRef.instance;
    if (instance && typeof instance === 'object') {
      // Set widget property if it exists in the prototype chain
      if ('widget' in instance) {
        (instance as any).widget = widget;
      }
      
      // Set widgetAction callback if it exists in the prototype chain
      if ('widgetAction' in instance) {
        (instance as any).widgetAction = (actionName: string, payload: unknown) => {
          this.widgetAction.emit({ actionName, payload });
        };
      }
    }
    
    // Attach the component's host view to the target element
    targetElement.appendChild(componentRef.location.nativeElement);
    
    // Store reference for cleanup
    this.dynamicComponents.push(componentRef);
    
    // Trigger change detection (use optional chaining for safety)
    componentRef.changeDetectorRef?.detectChanges();
  }

  /**
   * Render an Angular template for a custom widget
   */
  protected renderTemplate(
    templateRef: TemplateRef<WidgetTemplateContext>,
    widget: ChatWidget,
    targetElement: HTMLElement
  ) {
    const context: WidgetTemplateContext = {
      $implicit: widget,
      widget: widget,
      emitAction: (actionName: string, payload: unknown) => {
        this.widgetAction.emit({ actionName, payload });
      },
    };
    
    const viewRef = templateRef.createEmbeddedView(context);
    
    // Attach the view's DOM nodes to the target element
    viewRef.rootNodes.forEach((node: Node) => {
      targetElement.appendChild(node);
    });
    
    // Store reference for cleanup
    this.dynamicViews.push(viewRef);
    
    // Trigger change detection
    viewRef.detectChanges();
  }

  /**
   * Cleanup dynamic components and views
   */
  protected cleanupDynamicWidgets() {
    this.dynamicComponents.forEach((componentRef) => {
      componentRef.destroy();
    });
    this.dynamicComponents = [];
    
    this.dynamicViews.forEach((viewRef) => {
      viewRef.destroy();
    });
    this.dynamicViews = [];
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
    // Cleanup dynamic widgets first
    this.cleanupDynamicWidgets();
    
    // Cleanup event manager
    this.eventManager = undefined;
  }
}
