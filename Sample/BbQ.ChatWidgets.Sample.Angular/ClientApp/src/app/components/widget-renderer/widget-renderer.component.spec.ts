import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetRendererComponent } from './widget-renderer.component';

describe('WidgetRendererComponent', () => {
  let component: WidgetRendererComponent;
  let fixture: ComponentFixture<WidgetRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetRendererComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetRendererComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty container when no widgets provided', () => {
    component.widgets = null;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.widgets-container');
    expect(container).toBeTruthy();
    expect(container?.children.length).toBe(0);
  });

  it('should render empty container for empty widgets array', () => {
    component.widgets = [];
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.widgets-container');
    expect(container).toBeTruthy();
    expect(container?.children.length).toBe(0);
  });

  it('should emit widget action event', (done) => {
    component.widgetAction.subscribe((event) => {
      expect(event.actionName).toBe('test_action');
      expect(event.payload).toEqual({ test: 'data' });
      done();
    });

    // Simulate emitting the event
    component.widgetAction.emit({ actionName: 'test_action', payload: { test: 'data' } });
  });
});
