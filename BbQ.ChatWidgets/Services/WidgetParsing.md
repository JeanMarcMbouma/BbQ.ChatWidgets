/// <summary>
/// BbQ ChatWidgets - Widget Hint Parsing and Tool Generation
/// 
/// This document describes how widgets are parsed from AI model output and made available to models.
/// </summary>

/*
 * WIDGET HINT PARSING
 * ===================
 * 
 * The DefaultWidgetHintParser processes AI model output to extract embedded widget definitions.
 * 
 * Format:
 * -------
 * AI models should embed widgets in the following format:
 * 
 *     <widget>{"type":"button","label":"Click Me","action":"submit"}</widget>
 * 
 * Example Model Output:
 * ---------------------
 * "Here's a helpful action you can take:
 *  <widget>{"type":"button","label":"Submit Form","action":"submit"}</widget>
 *  
 *  Or select from options:
 *  <widget>{"type":"dropdown","label":"Choose an option","action":"select","options":["Option A","Option B","Option C"]}</widget>"
 * 
 * Parsing Result:
 * ---------------
 * Content: "Here's a helpful action you can take:\n\nOr select from options:"
 * Widgets: [ButtonWidget, DropdownWidget]
 * 
 * 
 * SUPPORTED WIDGETS
 * =================
 * 
 * 1. ButtonWidget
 *    - Purpose: Simple action trigger
 *    - Example: <widget>{"type":"button","label":"Send","action":"send"}</widget>
 *    - Properties: Label, Action
 * 
 * 2. CardWidget
 *    - Purpose: Display rich content (title, description, image, action)
 *    - Example: <widget>{"type":"card","label":"View More","action":"view","title":"Featured","description":"Check this out","imageUrl":"https://..."}</widget>
 *    - Properties: Label, Action, Title, Description (optional), ImageUrl (optional)
 * 
 * 3. InputWidget
 *    - Purpose: Collect text input from user
 *    - Example: <widget>{"type":"input","label":"Enter name","action":"input","placeholder":"Your name","maxLength":50}</widget>
 *    - Properties: Label, Action, Placeholder (optional), MaxLength (optional)
 * 
 * 4. DropdownWidget
 *    - Purpose: Selection from predefined options
 *    - Example: <widget>{"type":"dropdown","label":"Select size","action":"size","options":["Small","Medium","Large"]}</widget>
 *    - Properties: Label, Action, Options (list of strings)
 * 
 * 5. SliderWidget
 *    - Purpose: Numeric range selection
 *    - Example: <widget>{"type":"slider","label":"Volume","action":"volume","min":0,"max":100,"step":5,"default":50}</widget>
 *    - Properties: Label, Action, Min, Max, Step, Default (optional)
 * 
 * 6. ToggleWidget
 *    - Purpose: Boolean on/off control
 *    - Example: <widget>{"type":"toggle","label":"Dark Mode","action":"darkmode","defaultValue":false}</widget>
 *    - Properties: Label, Action, DefaultValue
 * 
 * 7. FileUploadWidget
 *    - Purpose: File upload input
 *    - Example: <widget>{"type":"fileupload","label":"Upload document","action":"upload","accept":".pdf,.docx","maxBytes":5000000}</widget>
 *    - Properties: Label, Action, Accept (optional), MaxBytes (optional)
 * 
 * 
 * WIDGET TOOL GENERATION
 * ======================
 * 
 * The DefaultWidgetToolsProvider automatically creates AITool instances for each widget type.
 * These tools are passed to the chat client via ChatOptions.Tools, allowing AI models to
 * understand the structure and properties of available widgets.
 * 
 * Each tool includes:
 * - Name: The widget type (e.g., "button", "card", "dropdown")
 * - Description: Human-readable description of the widget
 * - Schema: JSON schema describing the widget's parameters
 * 
 * Usage in ChatWidgetService:
 * ---------------------------
 * var chatOptions = new ChatOptions
 * {
 *     Tools = [.. _toolsProvider.GetTools()],  // All available widget tools
 *     ToolMode = ChatToolMode.Auto,
 *     AllowMultipleToolCalls = true
 * };
 * 
 * 
 * ERROR HANDLING
 * ==============
 * 
 * - Malformed JSON in widget markers is silently skipped
 * - Invalid widget types are ignored
 * - Empty or whitespace-only markers are skipped
 * - Null input throws ArgumentNullException
 * 
 * 
 * PERFORMANCE CONSIDERATIONS
 * ==========================
 * 
 * - DefaultWidgetHintParser: Stateless, can be reused across requests
 * - DefaultWidgetToolsProvider: Tools are cached after first access (O(1) subsequent calls)
 * - Regex is compiled once as a static field for efficiency
 * - JSON deserialization uses cached Serialization.Default options
 */
