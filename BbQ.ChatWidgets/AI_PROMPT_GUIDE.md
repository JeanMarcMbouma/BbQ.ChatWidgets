## AI Prompt Guide for BbQ ChatWidgets

### How to Instruct AI Models to Generate Widgets

#### System Prompt Example
```
You are a helpful AI assistant that can generate interactive widgets to enhance user experience.

You have access to the following interactive widgets that you can embed in your responses:

1. **Button Widget** - For calling actions
   Format: <widget>{"type":"button","label":"ACTION_LABEL","action":"action_id"}</widget>
   Use when: You want the user to trigger an action (submit, delete, approve, etc.)

2. **Card Widget** - For displaying rich content
   Format: <widget>{"type":"card","label":"ACTION_LABEL","action":"action_id","title":"TITLE","description":"DESCRIPTION","imageUrl":"URL"}</widget>
   Use when: You need to show featured content, products, or items with descriptions

3. **Dropdown Widget** - For selecting from options
   Format: <widget>{"type":"dropdown","label":"LABEL","action":"action_id","options":["OPTION1","OPTION2","OPTION3"]}</widget>
   Use when: There are multiple predefined options to choose from

4. **Input Widget** - For text input
   Format: <widget>{"type":"input","label":"LABEL","action":"action_id","placeholder":"PLACEHOLDER","maxLength":100}</widget>
   Use when: You need the user to enter text (name, email, etc.)

5. **Slider Widget** - For numeric selection
   Format: <widget>{"type":"slider","label":"LABEL","action":"action_id","min":0,"max":100,"step":5,"default":50}</widget>
   Use when: You need a value selection from a range

6. **Toggle Widget** - For boolean selection
   Format: <widget>{"type":"toggle","label":"LABEL","action":"action_id","defaultValue":false}</widget>
   Use when: You need an on/off or yes/no selection

7. **FileUpload Widget** - For file uploads
   Format: <widget>{"type":"fileupload","label":"LABEL","action":"action_id","accept":".pdf,.docx","maxBytes":5000000}</widget>
   Use when: You need the user to upload a file

When generating widgets:
- Always provide clear, actionable labels
- Use descriptive action IDs (e.g., "delete_item", "save_changes")
- Ensure all JSON is valid and properly escaped
- Never nest widgets inside each other
- Keep widget text concise and action-oriented
- Always wrap widgets in <widget>...</widget> tags
```

---

### Conversation Flow Example

#### User Query
```
"I need to update my profile. Can you show me the options?"
```

#### Expected AI Response
```
I'll help you update your profile. Here are the main options:

1. Edit your basic information:
<widget>{"type":"button","label":"Edit Profile","action":"edit_profile"}</widget>

2. Change your preferences:
<widget>{"type":"dropdown","label":"Select Setting","action":"update_setting","options":["Privacy","Notifications","Theme","Language"]}</widget>

3. Update your avatar:
<widget>{"type":"fileupload","label":"Upload New Avatar","action":"upload_avatar","accept":".jpg,.png","maxBytes":2000000}</widget>

4. Set your availability:
<widget>{"type":"toggle","label":"Available for chat","action":"set_availability","defaultValue":true}</widget>

Which would you like to do first?
```

#### Parsed Result
```csharp
Content: "I'll help you update your profile. Here are the main options:\n\n1. Edit your basic information:\n\n2. Change your preferences:\n\n3. Update your avatar:\n\n4. Set your availability:\n\nWhich would you like to do first?"

Widgets: [
  ButtonWidget(label: "Edit Profile", action: "edit_profile"),
  DropdownWidget(label: "Select Setting", action: "update_setting", options: ["Privacy", "Notifications", "Theme", "Language"]),
  FileUploadWidget(label: "Upload New Avatar", action: "upload_avatar", accept: ".jpg,.png", maxBytes: 2000000),
  ToggleWidget(label: "Available for chat", action: "set_availability", defaultValue: true)
]
```

---

### Widget Selection Guide

#### Use **Button** when:
- User needs to trigger a single action
- Confirming an action (Submit, Delete, Approve)
- Navigating to another section
- Examples: "Submit Form", "Confirm Delete", "Send Email"

#### Use **Card** when:
- Showing featured items or products
- Displaying summary with image and description
- Promoting a specific item or feature
- Examples: Product cards, featured articles, recommended items

#### Use **Dropdown** when:
- Selecting from 3+ predefined options
- Filtering or sorting options
- Choosing from a category
- Examples: Priority selection, status change, filter options

#### Use **Input** when:
- Collecting text data (name, email, message)
- Search functionality
- Short form data entry
- Examples: "Enter your name", "Search items", "Add comment"

#### Use **Slider** when:
- Selecting a value from a range
- Adjusting numeric settings
- Rating on a scale
- Examples: Volume control, price range, confidence level

#### Use **Toggle** when:
- Boolean choice (yes/no, on/off)
- Simple feature enable/disable
- One-click settings
- Examples: "Enable notifications", "Dark mode", "Show advanced options"

#### Use **FileUpload** when:
- User needs to attach/upload files
- Document submission
- Image upload
- Examples: "Upload resume", "Submit document", "Choose profile picture"

---

### Common Patterns

#### Confirmation Dialog
```
Are you sure you want to delete this item?

<widget>{"type":"button","label":"Yes, Delete","action":"confirm_delete"}</widget>
<widget>{"type":"button","label":"Cancel","action":"cancel"}</widget>
```

#### Multi-Step Form
```
Step 1 of 3: Enter your name
<widget>{"type":"input","label":"Name","action":"enter_name","placeholder":"Full name"}</widget>

Step 2: Select your role
<widget>{"type":"dropdown","label":"Role","action":"select_role","options":["Admin","Editor","Viewer"]}</widget>

Step 3: Set permissions
<widget>{"type":"toggle","label":"Can edit content","action":"set_edit_permission","defaultValue":false}</widget>
```

#### Settings Configuration
```
Adjust your preferences:

Volume: <widget>{"type":"slider","label":"Volume","action":"set_volume","min":0,"max":100,"step":10,"default":50}</widget>

Notifications: <widget>{"type":"toggle","label":"Enable notifications","action":"toggle_notifications","defaultValue":true}</widget>

Theme: <widget>{"type":"dropdown","label":"Theme","action":"select_theme","options":["Light","Dark","Auto"]}</widget>
```

#### Content Selection
```
Here are some featured items:

<widget>{"type":"card","label":"View Details","action":"view_item_1","title":"Item 1","description":"Great product","imageUrl":"https://..."}</widget>

<widget>{"type":"card","label":"View Details","action":"view_item_2","title":"Item 2","description":"Popular choice","imageUrl":"https://..."}</widget>

<widget>{"type":"card","label":"View Details","action":"view_item_3","title":"Item 3","description":"New release","imageUrl":"https://..."}</widget>
```

---

### JSON Formatting Best Practices

? **DO**:
```json
{"type":"button","label":"Click Me","action":"click"}
```

? **DON'T**:
```json
{
  "type": "button",
  "label": "Click Me",
  "action": "click"
}
```

- Keep JSON on single line (easier parsing)
- Use double quotes for all strings
- Include only necessary properties (omit optional ones if not used)
- Ensure all JSON is valid and properly escaped

---

### Action ID Naming Convention

Use clear, descriptive action IDs:
- ? `submit_form`, `delete_item`, `approve_request`, `edit_profile`
- ? `action1`, `do_it`, `click_me`, `btn`

Action IDs should:
- Be lowercase with underscores
- Describe what happens when clicked
- Be unique within a conversation turn
- Be meaningful to your action handler

---

### Error Prevention

**Invalid Widget Examples** (will be skipped):
```
? Missing quotes: {type: button, label: Click, action: click}
? Missing type: <widget>{"label":"Click","action":"click"}</widget>
? Wrong type: <widget>{"type":"card","label":"View","action":"view"}</widget> (without title)
? Malformed JSON: <widget>{"type":"button","label":"Click"action":"click"}</widget>
```

**Valid Widget Examples** (will be parsed):
```
? <widget>{"type":"button","label":"Submit","action":"submit"}</widget>
? <widget>{"type":"dropdown","label":"Select","action":"select","options":["A","B"]}</widget>
? <widget>{"type":"input","label":"Name","action":"name"}</widget>
```

---

### Testing Widget Generation

To test if your AI is generating valid widgets:

1. Check the parser output has widgets in the response
2. Verify each widget has `type`, `label`, and `action`
3. Ensure JSON is properly formatted
4. Validate that widget data matches the widget type schema
5. Test action handlers receive correct action IDs

---

### Performance Tips

1. **Limit widgets per response**: 3-7 widgets optimal, avoid 20+
2. **Use appropriate widget types**: Dropdown > multiple buttons for many options
3. **Keep labels short**: Improves UX and reduces data transfer
4. **Reuse action IDs**: When same action can be triggered multiple ways
5. **Cache tool schemas**: Tools are cached, no performance penalty for reuse
