# Widget Gallery

A visual showcase of all built-in widgets in BbQ.ChatWidgets. Each widget is designed to be AI-driven - the LLM decides when and how to use them based on conversation context.

## 🎯 Interactive Action Widgets

### ButtonWidget
**Purpose**: Single-click action with no input required

**Use when**: User needs to confirm, approve, retry, cancel, or trigger any immediate action

**Example**:
```xml
<widget type="button" label="Confirm Order" action="confirm_order" />
```

**Properties**:
- `label` (string) - Display text on the button
- `action` (string) - Action identifier to trigger on click

---

### CardWidget
**Purpose**: Display rich content with optional image and call-to-action

**Use when**: Showcasing products, articles, recommendations, or any content with a preview

**Example**:
```xml
<widget type="card" 
  title="Premium Plan" 
  description="Unlimited access to all features" 
  imageUrl="https://example.com/premium.png"
  label="Upgrade Now"
  action="upgrade_plan" />
```

**Properties**:
- `title` (string) - Card heading
- `description` (string, optional) - Supporting text
- `imageUrl` (string, optional) - Preview image URL
- `label` (string) - Button text
- `action` (string) - Action identifier for button click

---

## 📝 Form Container

### FormWidget
**Purpose**: Group multiple input widgets and submit them together

**Use when**: Collecting multiple pieces of information from the user

**Example**:
```xml
<widget type="form" 
  title="Contact Us" 
  submitLabel="Send Message" 
  action="submit_contact">
  <widget type="input" label="Name" name="userName" placeholder="Your name" />
  <widget type="textarea" label="Message" name="message" rows="4" />
  <widget type="toggle" label="Subscribe to newsletter" name="subscribe" />
</widget>
```

**Properties**:
- `title` (string) - Form heading
- `submitLabel` (string) - Text for submit button
- `action` (string) - Action identifier for form submission

**Important**: All input widgets (Input, TextArea, Dropdown, MultiSelect, Slider, Toggle, DatePicker, FileUpload) **must** be placed inside a FormWidget.

---

## 🔤 Input Widgets (Must be inside FormWidget)

### InputWidget
**Purpose**: Single-line text input

**Example**:
```xml
<widget type="input" label="Email" name="email" placeholder="you@example.com" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier for submission
- `placeholder` (string, optional) - Hint text
- `value` (string, optional) - Pre-filled value

---

### TextAreaWidget
**Purpose**: Multi-line text input for longer content

**Example**:
```xml
<widget type="textarea" label="Feedback" name="feedback" rows="5" placeholder="Tell us more..." />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `placeholder` (string, optional) - Hint text
- `rows` (number, optional) - Number of visible lines
- `value` (string, optional) - Pre-filled value

---

### DropdownWidget
**Purpose**: Select one option from a list

**Example**:
```xml
<widget type="dropdown" label="Country" name="country" options="USA,Canada,UK,Germany" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `options` (string) - Comma-separated list or JSON array
- `value` (string, optional) - Pre-selected value

---

### MultiSelectWidget
**Purpose**: Select multiple options from a list

**Example**:
```xml
<widget type="multiselect" label="Interests" name="interests" options="Sports,Music,Technology,Travel" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `options` (string) - Comma-separated list or JSON array
- `values` (array, optional) - Pre-selected values

---

### SliderWidget
**Purpose**: Select a numeric value within a range

**Example**:
```xml
<widget type="slider" label="Budget" name="budget" min="0" max="10000" step="100" value="5000" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `min` (number) - Minimum value
- `max` (number) - Maximum value
- `step` (number, optional) - Increment step
- `value` (number, optional) - Initial value

---

### ToggleWidget
**Purpose**: Boolean on/off switch

**Example**:
```xml
<widget type="toggle" label="Enable notifications" name="notifications" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `value` (boolean, optional) - Initial state (true/false)

---

### DatePickerWidget
**Purpose**: Select a date from a calendar

**Example**:
```xml
<widget type="datepicker" label="Appointment Date" name="appointmentDate" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `value` (string, optional) - Initial date (ISO format)

---

### FileUploadWidget
**Purpose**: Select and upload one or more files

**Example**:
```xml
<widget type="fileupload" label="Attach Documents" name="documents" accept=".pdf,.doc,.docx" />
```

**Properties**:
- `label` (string) - Field label
- `name` (string) - Field identifier
- `accept` (string, optional) - Allowed file types (e.g., ".pdf,.jpg,.png")
- `multiple` (boolean, optional) - Allow multiple file selection

---

## 📊 Informational Widgets

### ProgressBarWidget
**Purpose**: Show progress or completion status

**Use when**: Displaying upload progress, task completion, or any percentage-based status

**Example**:
```xml
<widget type="progressbar" label="Upload Progress" value="75" status="Uploading..." />
```

**Properties**:
- `label` (string) - Progress bar title
- `value` (number) - Progress percentage (0-100)
- `status` (string, optional) - Status message

---

### ImageWidget
**Purpose**: Display a single image

**Use when**: Showing a photo, diagram, chart, or any visual content

**Example**:
```xml
<widget type="image" label="Product Photo" imageUrl="https://example.com/product.jpg" />
```

**Properties**:
- `label` (string) - Image caption/alt text
- `imageUrl` (string) - URL of the image
- `action` (string, optional) - Action triggered when image is clicked

---

### ImageCollectionWidget
**Purpose**: Display multiple images in a gallery

**Use when**: Showing multiple photos, a carousel, or a collection of visual content

**Example**:
```xml
<widget type="imagecollection" label="Product Gallery">
  <images>
    [{"url":"https://example.com/img1.jpg","caption":"Front view"},
     {"url":"https://example.com/img2.jpg","caption":"Side view"}]
  </images>
</widget>
```

**Properties**:
- `label` (string) - Gallery title
- `images` (array) - Array of image objects with `url` and optional `caption`
- `action` (string, optional) - Action triggered when an image is clicked

---

### ThemeSwitcherWidget
**Purpose**: Let users change the UI theme (Light, Dark, Corporate, etc.)

**Use when**: Providing theme customization options

**Example**:
```xml
<widget type="themeswitcher" label="Choose your theme" />
```

**Properties**:
- `label` (string) - Widget heading

---

## 📖 Learn More

- **[Widget Types Reference](WIDGET_TYPES.md)** - Technical details for each widget
- **[Custom Widgets Guide](../guides/CUSTOM_WIDGETS.md)** - Build your own widgets
- **[Action Handlers](../guides/CUSTOM_ACTION_HANDLERS.md)** - Handle widget interactions
- **[Use Cases & Examples](../examples/USE_CASES.md)** - Real-world scenarios

## 🎨 Try It Out

Check out our live samples:
- [Console Sample](../../Sample/BbQ.ChatWidgets.Sample.Console/) - Command-line chat with widgets
- [React Sample](../../Sample/BbQ.ChatWidgets.Sample.React/) - Web UI with React
- [Angular Sample](../../Sample/BbQ.ChatWidgets.Sample.Angular/) - Angular app
- [Blazor Sample](../../Sample/BbQ.ChatWidgets.Sample.Blazor/) - Blazor Server app
