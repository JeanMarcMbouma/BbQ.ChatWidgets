# Widget Catalog

BbQ.ChatWidgets comes with a rich set of built-in widgets. This catalog describes each widget type, its properties, and how the LLM can use it.

## Interactive Widgets

### Button (`button`)
A simple clickable button that triggers a server-side action.
- **Properties**: `label` (text), `action` (action name), `payload` (optional JSON).
- **Example**: `<widget type="button" label="Confirm Order" action="confirm_order" />`

### Card (`card`)
A container for displaying structured information, often including an image and a title.
- **Properties**: `title`, `content`, `imageUrl`, `footer`.
- **Example**: `<widget type="card" title="Product A" content="A great product." imageUrl="https://example.com/img.png" />`

### Form (`form`)
A container that groups input-like widgets together. When the form is submitted, all input values are sent as a single payload to the specified action.
- **Properties**: `title`, `submitLabel`, `action`.
- **Example**: 
  ```xml
  <widget type="form" title="Contact Us" submitLabel="Send" action="submit_contact">
    <widget type="input" label="Name" name="userName" />
    <widget type="textarea" label="Message" name="userMessage" />
  </widget>
  ```

## Input Widgets (Must be inside a `form`)

### Input (`input`)
A single-line text input field.
- **Properties**: `label`, `name`, `placeholder`, `value`.

### TextArea (`textarea`)
A multi-line text input field for longer messages.
- **Properties**: `label`, `name`, `placeholder`, `rows`.

### Dropdown (`dropdown`)
A selectable list of options.
- **Properties**: `label`, `name`, `options` (comma-separated or JSON array).

### MultiSelect (`multiselect`)
Allows the user to select multiple options from a list.
- **Properties**: `label`, `name`, `options`.

### Slider (`slider`)
A numeric range selector.
- **Properties**: `label`, `name`, `min`, `max`, `step`.

### Toggle (`toggle`)
A boolean switch (on/off).
- **Properties**: `label`, `name`.

### DatePicker (`datepicker`)
A component for selecting a date.
- **Properties**: `label`, `name`.

### FileUpload (`fileupload`)
Allows the user to select and upload files.
- **Properties**: `label`, `name`, `accept` (file types).

## Informational Widgets

### ProgressBar (`progressbar`)
A visual indicator of progress or completion.
- **Properties**: `label`, `value` (0-100), `status`.
- **Example**: `<widget type="progressbar" label="Uploading..." value="45" />`

### ThemeSwitcher (`themeswitcher`)
Allows the user to switch between different UI themes (e.g., Light, Dark, Corporate).
- **Properties**: `label`.
- **Example**: `<widget type="themeswitcher" label="Choose your style" />`

## Usage Note

All input-like widgets (Input, TextArea, Dropdown, MultiSelect, Slider, Toggle, DatePicker, FileUpload) **must** be placed inside a `Form` widget to function correctly. The `Form` widget handles the collection and submission of their values.
