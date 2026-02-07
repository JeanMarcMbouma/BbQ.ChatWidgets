# Widget Gallery

A visual showcase of all built-in widgets in BbQ.ChatWidgets. Each widget is designed to be AI-driven - the LLM decides when and how to use them based on conversation context.

## 🎯 Interactive Action Widgets

### ButtonWidget
**Purpose**: Single-click action with no input required

**Use when**: User needs to confirm, approve, retry, cancel, or trigger any immediate action

**Example**:
```xml
<widget>
{
  "type": "button",
  "label": "Confirm Order",
  "action": "confirm_order"
}
</widget>
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
<widget>
{
  "type": "card",
  "title": "Premium Plan",
  "description": "Unlimited access to all features",
  "imageUrl": "https://example.com/premium.png",
  "label": "Upgrade Now",
  "action": "upgrade_plan"
}
</widget>
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
<widget>
{
  "type": "form",
  "title": "Contact Us",
  "action": "submit_contact",
  "fields": [
    {
      "name": "userName",
      "label": "Name",
      "type": "input",
      "required": true,
      "validationHint": "Your full name"
    },
    {
      "name": "message",
      "label": "Message",
      "type": "textarea",
      "required": true,
      "rows": 4
    },
    {
      "name": "subscribe",
      "label": "Subscribe to newsletter",
      "type": "toggle",
      "required": false
    }
  ],
  "actions": [
    {"type": "submit", "label": "Send Message"},
    {"type": "cancel", "label": "Cancel"}
  ]
}
</widget>
```

**Properties**:
- `title` (string) - Form heading
- `action` (string) - Action identifier for form submission
- `fields` (array) - Array of form field definitions
- `actions` (array) - Form actions (must include submit and cancel)

**Important**: All input widgets (Input, TextArea, Dropdown, MultiSelect, Slider, Toggle, DatePicker, FileUpload) **must** be placed inside a FormWidget.

---

## 🔤 Input Widgets (Must be inside FormWidget)

### InputWidget
**Purpose**: Single-line text input

**Example** (as form field):
```xml
{
  "name": "email",
  "label": "Email",
  "type": "input",
  "required": true,
  "placeholder": "you@example.com"
}
```

**Properties**:
- `name` (string) - Field identifier for submission
- `label` (string) - Field label
- `type` (string) - Must be "input"
- `required` (boolean) - Whether field is required
- `placeholder` (string, optional) - Hint text
- `validationHint` (string, optional) - Validation message

---

### TextAreaWidget
**Purpose**: Multi-line text input for longer content

**Example** (as form field):
```xml
{
  "name": "feedback",
  "label": "Feedback",
  "type": "textarea",
  "required": true,
  "rows": 5,
  "placeholder": "Tell us more..."
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "textarea"
- `required` (boolean) - Whether field is required
- `placeholder` (string, optional) - Hint text
- `rows` (number, optional) - Number of visible lines

---

### DropdownWidget
**Purpose**: Select one option from a list

**Example** (as form field):
```xml
{
  "name": "country",
  "label": "Country",
  "type": "dropdown",
  "required": true,
  "options": ["USA", "Canada", "UK", "Germany"]
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "dropdown"
- `required` (boolean) - Whether field is required
- `options` (array) - Array of option strings

---

### MultiSelectWidget
**Purpose**: Select multiple options from a list

**Example** (as form field):
```xml
{
  "name": "interests",
  "label": "Interests",
  "type": "multiselect",
  "required": false,
  "options": ["Sports", "Music", "Technology", "Travel"]
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "multiselect"
- `required` (boolean) - Whether field is required
- `options` (array) - Array of option strings

---

### SliderWidget
**Purpose**: Select a numeric value within a range

**Example** (as form field):
```xml
{
  "name": "budget",
  "label": "Budget",
  "type": "slider",
  "required": true,
  "min": 0,
  "max": 10000,
  "step": 100,
  "value": 5000
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "slider"
- `required` (boolean) - Whether field is required
- `min` (number) - Minimum value
- `max` (number) - Maximum value
- `step` (number, optional) - Increment step
- `value` (number, optional) - Initial value

---

### ToggleWidget
**Purpose**: Boolean on/off switch

**Example** (as form field):
```xml
{
  "name": "notifications",
  "label": "Enable notifications",
  "type": "toggle",
  "required": false
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "toggle"
- `required` (boolean) - Whether field is required

---

### DatePickerWidget
**Purpose**: Select a date from a calendar

**Example** (as form field):
```xml
{
  "name": "appointmentDate",
  "label": "Appointment Date",
  "type": "datepicker",
  "required": true,
  "minDate": "2024-01-01",
  "maxDate": "2024-12-31"
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "datepicker"
- `required` (boolean) - Whether field is required
- `minDate` (string, optional) - Minimum date (YYYY-MM-DD)
- `maxDate` (string, optional) - Maximum date (YYYY-MM-DD)

---

### FileUploadWidget
**Purpose**: Select and upload one or more files

**Example** (as form field):
```xml
{
  "name": "documents",
  "label": "Attach Documents",
  "type": "fileupload",
  "required": false,
  "accept": ".pdf,.doc,.docx"
}
```

**Properties**:
- `name` (string) - Field identifier
- `label` (string) - Field label
- `type` (string) - Must be "fileupload"
- `required` (boolean) - Whether field is required
- `accept` (string, optional) - Allowed file types (e.g., ".pdf,.jpg,.png")
- `multiple` (boolean, optional) - Allow multiple file selection

---

## 📊 Informational Widgets

### ProgressBarWidget
**Purpose**: Show progress or completion status

**Use when**: Displaying upload progress, task completion, or any percentage-based status

**Example**:
```xml
<widget>
{
  "type": "progressbar",
  "label": "Upload Progress",
  "action": "upload_status",
  "value": 75,
  "status": "Uploading..."
}
</widget>
```

**Properties**:
- `label` (string) - Progress bar title
- `action` (string) - Action identifier
- `value` (number) - Progress percentage (0-100)
- `status` (string, optional) - Status message

---

### ImageWidget
**Purpose**: Display a single image

**Use when**: Showing a photo, diagram, chart, or any visual content

**Example**:
```xml
<widget>
{
  "type": "image",
  "label": "Product Photo",
  "action": "view_image",
  "imageUrl": "https://example.com/product.jpg"
}
</widget>
```

**Properties**:
- `label` (string) - Image caption/alt text
- `action` (string) - Action identifier
- `imageUrl` (string) - URL of the image

---

### ImageCollectionWidget
**Purpose**: Display multiple images in a gallery

**Use when**: Showing multiple photos, a carousel, or a collection of visual content

**Example**:
```xml
<widget>
{
  "type": "imagecollection",
  "label": "Product Gallery",
  "action": "view_gallery",
  "images": [
    {
      "imageUrl": "https://example.com/img1.jpg",
      "alt": "Front view"
    },
    {
      "imageUrl": "https://example.com/img2.jpg",
      "alt": "Side view"
    }
  ]
}
</widget>
```

**Properties**:
- `label` (string) - Gallery title
- `action` (string) - Action identifier
- `images` (array) - Array of ImageItem objects with `imageUrl` and optional `alt`

---

### ThemeSwitcherWidget
**Purpose**: Let users change the UI theme (Light, Dark, Corporate, etc.)

**Use when**: Providing theme customization options

**Example**:
```xml
<widget>
{
  "type": "themeswitcher",
  "label": "Choose your theme",
  "action": "change_theme",
  "themes": ["light", "dark", "system"]
}
</widget>
```

**Properties**:
- `label` (string) - Widget heading
- `action` (string) - Action identifier
- `themes` (array) - Array of theme names (e.g., ["light", "dark", "system"])

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
