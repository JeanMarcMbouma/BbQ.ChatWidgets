import { describe, it, expect } from 'vitest';
import { AngularWidgetRenderer } from './renderers/AngularWidgetRenderer';
import { ButtonWidgetComponent } from './components/button.component';
import { InputWidgetComponent } from './components/input.component';
import { CardWidgetComponent } from './components/card.component';

describe('AngularWidgetRenderer', () => {
  it('should create an instance', () => {
    const renderer = new AngularWidgetRenderer();
    expect(renderer).toBeTruthy();
    expect(renderer.framework).toBe('Angular');
  });

  it('should register components', () => {
    const renderer = new AngularWidgetRenderer();
    renderer.registerComponent('button', ButtonWidgetComponent);
    
    const mockWidget = {
      type: 'button',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const componentType = renderer.getComponentType(mockWidget);
    expect(componentType).toBe(ButtonWidgetComponent);
  });

  it('should register multiple components at once', () => {
    const renderer = new AngularWidgetRenderer();
    renderer.registerComponents({
      button: ButtonWidgetComponent,
      input: InputWidgetComponent
    });
    
    const mockButtonWidget = {
      type: 'button',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const mockInputWidget = {
      type: 'input',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    expect(renderer.getComponentType(mockButtonWidget)).toBe(ButtonWidgetComponent);
    expect(renderer.getComponentType(mockInputWidget)).toBe(InputWidgetComponent);
  });

  it('should return null for unregistered widget types', () => {
    const renderer = new AngularWidgetRenderer();
    
    const mockWidget = {
      type: 'unknown',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const componentType = renderer.getComponentType(mockWidget);
    expect(componentType).toBeNull();
  });

  it('should respect custom overrides from constructor', () => {
    const customComponent = ButtonWidgetComponent; // Use as a stand-in for custom component
    const renderer = new AngularWidgetRenderer({
      components: {
        button: customComponent
      }
    });
    
    const mockWidget = {
      type: 'button',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const componentType = renderer.getComponentType(mockWidget);
    expect(componentType).toBe(customComponent);
  });

  it('should prioritize constructor overrides over registered components', () => {
    const constructorComponent = CardWidgetComponent;
    const registeredComponent = ButtonWidgetComponent;
    
    const renderer = new AngularWidgetRenderer({
      components: {
        button: constructorComponent
      }
    });
    
    // Register a different component
    renderer.registerComponent('button', registeredComponent);
    
    const mockWidget = {
      type: 'button',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    // Constructor override should take precedence
    const componentType = renderer.getComponentType(mockWidget);
    expect(componentType).toBe(constructorComponent);
  });

  it('should register built-in components', () => {
    const renderer = new AngularWidgetRenderer();
    
    const builtInComponents = {
      button: ButtonWidgetComponent,
      input: InputWidgetComponent,
      card: CardWidgetComponent
    };
    
    renderer.registerBuiltInComponents(builtInComponents);
    
    const mockButtonWidget = {
      type: 'button',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const mockInputWidget = {
      type: 'input',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    const mockCardWidget = {
      type: 'card',
      label: 'Test',
      action: 'test_action',
      toJson: () => '{}',
      toObject: () => ({})
    };
    
    expect(renderer.getComponentType(mockButtonWidget)).toBe(ButtonWidgetComponent);
    expect(renderer.getComponentType(mockInputWidget)).toBe(InputWidgetComponent);
    expect(renderer.getComponentType(mockCardWidget)).toBe(CardWidgetComponent);
  });
});
