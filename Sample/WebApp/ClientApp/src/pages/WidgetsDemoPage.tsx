import { useState } from 'react';
import '../styles/WidgetsDemoPage.css';

interface WidgetsDemoPageProps {
  onBack: () => void;
}

interface WidgetSpec {
  name: string;
  description: string;
  type: string;
  example: Record<string, any>;
}

export function WidgetsDemoPage({ onBack }: WidgetsDemoPageProps) {
  const [selectedWidget, setSelectedWidget] = useState<WidgetSpec | null>(null);

  const WIDGETS: WidgetSpec[] = [
    {
      name: 'Button',
      description: 'Clickable button that triggers an action',
      type: 'button',
      example: { type: 'button', label: 'Click Me', action: 'submit' }
    },
    {
      name: 'Input',
      description: 'Single-line text input field',
      type: 'input',
      example: { type: 'input', label: 'Name', action: 'input_name', placeholder: 'Enter name' }
    },
    {
      name: 'TextArea',
      description: 'Multi-line text input field',
      type: 'textarea',
      example: { type: 'textarea', label: 'Message', action: 'textarea_message', rows: 4 }
    },
    {
      name: 'Dropdown',
      description: 'Single-select dropdown',
      type: 'dropdown',
      example: { type: 'dropdown', label: 'Select Option', action: 'select_option', options: ['Option 1', 'Option 2', 'Option 3'] }
    },
    {
      name: 'Slider',
      description: 'Numeric range slider',
      type: 'slider',
      example: { type: 'slider', label: 'Volume', action: 'set_volume', min: 0, max: 100, step: 1 }
    },
    {
      name: 'Toggle',
      description: 'Boolean on/off switch',
      type: 'toggle',
      example: { type: 'toggle', label: 'Enable Notifications', action: 'toggle_notifications', defaultValue: false }
    },
    {
      name: 'Card',
      description: 'Rich content card with image and action',
      type: 'card',
      example: {
        type: 'card',
        label: 'View Details',
        action: 'view_details',
        title: 'Product Name',
        description: 'This is a product description',
        imageUrl: 'https://via.placeholder.com/300x200'
      }
    },
    {
      name: 'DatePicker',
      description: 'Date selection input',
      type: 'datepicker',
      example: { type: 'datepicker', label: 'Select Date', action: 'select_date' }
    },
    {
      name: 'MultiSelect',
      description: 'Multiple-choice selection',
      type: 'multiselect',
      example: { type: 'multiselect', label: 'Select Items', action: 'multi_select', options: ['Item 1', 'Item 2', 'Item 3'] }
    },
    {
      name: 'FileUpload',
      description: 'File upload input',
      type: 'fileupload',
      example: { type: 'fileupload', label: 'Upload File', action: 'upload_file', accept: '.pdf,.doc' }
    },
    {
      name: 'ProgressBar',
      description: 'Progress indicator',
      type: 'progressbar',
      example: { type: 'progressbar', label: 'Download Progress', action: 'progress', value: 65, max: 100 }
    },
    {
      name: 'ThemeSwitcher',
      description: 'Theme selection dropdown',
      type: 'themeswitcher',
      example: { type: 'themeswitcher', label: 'Theme', action: 'set_theme', themes: ['Light', 'Dark', 'Auto'] }
    },
    {
      name: 'Form',
      description: 'Complex form with multiple fields',
      type: 'form',
      example: {
        type: 'form',
        label: 'Submit Form',
        action: 'submit_form',
        title: 'User Registration',
        fields: [
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'password', label: 'Password', type: 'password', required: true }
        ],
        actions: [
          { type: 'submit', label: 'Submit' },
          { type: 'cancel', label: 'Cancel' }
        ]
      }
    }
  ];

  return (
    <div className="page widgets-demo-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🧩 Widgets Demo</h1>
        <p className="subtitle">Explore all 13+ available widgets</p>
      </div>

      <div className="widgets-container">
        <div className="widgets-grid">
          {WIDGETS.map((widget, i) => (
            <div
              key={i}
              className={`widget-card ${selectedWidget?.type === widget.type ? 'selected' : ''}`}
              onClick={() => setSelectedWidget(widget)}
            >
              <div className="widget-icon">
                {widget.type === 'button' && '??'}
                {widget.type === 'input' && '??'}
                {widget.type === 'textarea' && '??'}
                {widget.type === 'dropdown' && '??'}
                {widget.type === 'slider' && '???'}
                {widget.type === 'toggle' && '??'}
                {widget.type === 'card' && '??'}
                {widget.type === 'datepicker' && '??'}
                {widget.type === 'multiselect' && '?'}
                {widget.type === 'fileupload' && '??'}
                {widget.type === 'progressbar' && '??'}
                {widget.type === 'themeswitcher' && '??'}
                {widget.type === 'form' && '??'}
              </div>
              <h3>{widget.name}</h3>
              <p>{widget.description}</p>
            </div>
          ))}
        </div>

        <div className="widget-details">
          {selectedWidget ? (
            <div className="details-content">
              <h2>{selectedWidget.name}</h2>
              <p className="description">{selectedWidget.description}</p>
              
              <div className="json-example">
                <h3>JSON Example</h3>
                <pre>{JSON.stringify(selectedWidget.example, null, 2)}</pre>
              </div>

              <div className="widget-features">
                <h3>Features</h3>
                <ul>
                  <li>? Server-side rendering compatible</li>
                  <li>? Full accessibility support</li>
                  <li>? Mobile responsive</li>
                  <li>? Event-driven actions</li>
                  <li>? XSS-safe HTML escaping</li>
                </ul>
              </div>

              <div className="usage-info">
                <h3>How to Use</h3>
                <p>
                  Request a message from the AI that includes this widget, or manually craft 
                  a response containing the JSON structure above.
                </p>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>?? Select a widget to see details</p>
            </div>
          )}
        </div>
      </div>

      <div className="scenario-info">
        <h3>Widget System Overview</h3>
        <p>
          <strong>13+ Interactive Widgets</strong> provide rich user interactions within the chat interface.
          All widgets are:
        </p>
        <ul>
          <li>? Type-safe (defined as TypeScript interfaces)</li>
          <li>? Server-rendered (SSR compatible)</li>
          <li>? Action-driven (trigger API calls)</li>
          <li>? Composable (combine multiple widgets)</li>
          <li>? Extensible (create custom widgets)</li>
        </ul>

        <div className="widget-categories">
          <h4>Widget Categories</h4>
          <div className="categories-grid">
            <div className="category">
              <h5>?? Input Widgets</h5>
              <ul>
                <li>Input (text)</li>
                <li>TextArea (multi-line)</li>
                <li>DatePicker (date)</li>
                <li>FileUpload (files)</li>
              </ul>
            </div>
            <div className="category">
              <h5>?? Selection Widgets</h5>
              <ul>
                <li>Button (single action)</li>
                <li>Dropdown (single select)</li>
                <li>MultiSelect (multi select)</li>
                <li>Toggle (boolean)</li>
              </ul>
            </div>
            <div className="category">
              <h5>?? Display Widgets</h5>
              <ul>
                <li>Card (rich content)</li>
                <li>ProgressBar (progress)</li>
                <li>ThemeSwitcher (themes)</li>
                <li>Slider (range)</li>
              </ul>
            </div>
            <div className="category">
              <h5>?? Complex Widgets</h5>
              <ul>
                <li>Form (multiple fields)</li>
                <li>ECharts (charts)</li>
                <li>Custom (extensible)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WidgetsDemoPage;
