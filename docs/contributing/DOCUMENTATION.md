# Documentation Standards

Guidelines for writing documentation for BbQ.ChatWidgets.

## Documentation Goals

- **Clear**: Easy to understand
- **Complete**: Covers all aspects
- **Accurate**: Reflects current code
- **Helpful**: Solves user problems

## File Organization

### Documentation Locations

```
docs/
??? README.md                 # Docs overview
??? GETTING_STARTED.md        # Quick start
??? ARCHITECTURE.md           # System design
??? guides/                   # How-to guides
??? examples/                 # Code examples
??? design/                   # Design decisions
??? api/                      # API reference
??? contributing/             # Contributor guides
```

### Naming Conventions

- Use UPPERCASE for main files: `GETTING_STARTED.md`
- Use UPPERCASE for section files: `README.md`
- Use descriptive names: `CUSTOM_WIDGETS.md`
- Avoid date/version in names

## Markdown Format

### Headers

```markdown
# H1 - Page Title (use once per page)

## H2 - Major Sections

### H3 - Subsections

#### H4 - Details
```

### Code Blocks

```markdown
Specify language for syntax highlighting:

?```csharp
public class MyClass { }
?```

?```javascript
const x = 1;
?```

?```bash
dotnet build
?```
```

### Lists

```markdown
Unordered list:
- Item 1
- Item 2
  - Nested item

Numbered list:
1. First
2. Second
3. Third
```

### Tables

```markdown
| Header 1 | Header 2 |
|---|---|
| Data 1 | Data 2 |
| Data 3 | Data 4 |
```

### Links

Use relative links (no `http://`):

```markdown
[Getting Started](../GETTING_STARTED.md)
[API Reference](../api/README.md)
[GitHub](https://github.com/user/repo)
```

### Emphasis

```markdown
*italic* or _italic_
**bold** or __bold__
~~strikethrough~~
`code`
```

## Document Structure

### Overview Pages (like INDEX.md)
```markdown
# Title

Brief intro (1-2 sentences).

## Quick Links
- [Link 1](path)
- [Link 2](path)

## Detailed Sections
Content...

---

**Back to:** [Parent](../path)
```

### Guide Pages (like INSTALLATION.md)
```markdown
# Title

## Overview
What you'll learn.

## Prerequisites
What you need first.

## Step 1: First Step
Instructions and code.

## Step 2: Second Step
Instructions and code.

## Troubleshooting
Common issues and solutions.

## Next Steps
- [Guide 1](link)
- [Guide 2](link)

---

**Back to:** [Guides](README.md)
```

### Example Pages
```markdown
# Example: Topic

Brief description.

## Setup
Prerequisites and dependencies.

## Code
Complete, working code.

## Explanation
What each part does.

## Try It
How to run and test.

## Next Steps
What to learn next.

---

**Back to:** [Examples](README.md)
```

### API Reference
```markdown
# ClassName

## Overview
What this class does.

## Properties
- `PropertyName` - Description

## Methods
### MethodName()
Description of what it does.

**Parameters:**
- `param1` - Description

**Returns:** Description

**Example:**
?```csharp
// Usage example
?```

## Related
- [Related Class](link)

---

**Back to:** [API Reference](README.md)
```

## Writing Guidelines

### Be Concise
```markdown
? Good: "Pass the thread ID to get conversation history."
? Wordy: "In order to retrieve the conversation history, you will need to pass the thread ID parameter."
```

### Use Active Voice
```markdown
? Good: "The service processes messages."
? Passive: "Messages are processed by the service."
```

### Explain Why, Not Just How
```markdown
? Good: "Limit context to 10 turns to reduce token costs."
? Just How: "Set context window to 10."
```

### Use Examples Liberally
```markdown
? Include code examples
? Show expected output
? Explain what each part does
? Avoid prose-only documentation
```

### Progressive Disclosure
```markdown
? Simple examples first
? Advanced examples later
? Link to deeper documentation
? Don't explain everything at once
```

## Code Examples

### Complete & Runnable
```csharp
// ? Good: Complete code that works
var chatClient = new ChatClient("gpt-4o-mini", apiKey)
    .AsIChatClient();
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient;
});

// ? Bad: Incomplete snippet
builder.Services.AddBbQChatWidgets(options =>
{
    options.ChatClientFactory = sp => chatClient; // chatClient undefined
});
```

### Annotated & Explained
```csharp
// Register the service
builder.Services.AddBbQChatWidgets(options =>
{
    // Provide the chat client
    options.ChatClientFactory = sp => chatClient;
});

// Map the API endpoints
app.MapBbQChatEndpoints();
```

### Expected Output
```markdown
## Expected Output

After running the code, you should see:

?```
User: Hello
Assistant: Hi! How can I help you today?
?```
```

## XML Comments (In Code)

Document all public members:

```csharp
/// <summary>
/// Gets or sets the label displayed to the user.
/// </summary>
public string Label { get; set; }

/// <summary>
/// Processes a user message and generates a response.
/// </summary>
/// <param name="message">The user's input message</param>
/// <param name="threadId">Optional thread ID for context</param>
/// <returns>A ChatTurn with the assistant's response</returns>
/// <exception cref="ArgumentNullException">When message is null</exception>
/// <remarks>
/// The method maintains conversation context using the thread ID.
/// If no thread ID is provided, a new conversation starts.
/// </remarks>
public async Task<ChatTurn> RespondAsync(
    string message,
    string? threadId)
```

## Documentation Quality Checklist

- [ ] All links are valid
- [ ] Code examples work
- [ ] Spelling and grammar correct
- [ ] Markdown is valid
- [ ] Headers are properly nested
- [ ] Relative paths used (not absolute)
- [ ] "Next Steps" included
- [ ] Related links included
- [ ] Examples have explanations
- [ ] All public API documented

## File Checklist Template

Add this to new doc files:

```markdown
## Quick Checklist

- [ ] Overview section present
- [ ] Examples include explanations
- [ ] Related documents linked
- [ ] Next steps provided
- [ ] Links are relative
- [ ] Code is complete
- [ ] Spelling/grammar checked
```

## Common Mistakes to Avoid

? **Outdated Information**
- Keep docs in sync with code
- Update examples when API changes
- Remove obsolete sections

? **Incomplete Examples**
- Always provide runnable code
- Show expected output
- Explain each part

? **Broken Links**
- Use relative paths
- Test links locally
- Update on refactoring

? **Missing Context**
- Assume readers are new
- Explain jargon
- Provide prerequisites

## Documentation Tools

### Testing Links
```bash
# Check markdown validity
npx markdownlint "docs/**/*.md"

# Check links
npx markdown-link-check "docs/**/*.md"
```

### Preview Locally
```bash
# With mkdocs (if configured)
mkdocs serve
```

## Related Documents

- **[CODE_STYLE.md](CODE_STYLE.md)** - Code style guidelines
- **[MANAGEMENT.md](../../MANAGEMENT.md)** - Documentation management

---

**Back to:** [Contributing Guides](README.md)
