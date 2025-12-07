# Documentation Management Guide

This guide explains how to manage, update, and maintain the consolidated BbQ.ChatWidgets documentation.

## — Documentation Locations

### Primary Location
```
Repository Root
— docs/          — ALL DOCUMENTATION HERE
```

### Source Code Documentation
```
BbQ.ChatWidgets/
— Models/
   — ChatWidget.cs          — XML comments
   — ChatTurn.cs            — XML comments
   — ...
— Services/
   — ChatWidgetService.cs   — XML comments
   — ...
— ...                        — All files have XML comments
```

## — Documentation Workflow

### When Adding a New Feature

1. **Write XML Comments** in source code
   ```csharp
   /// <summary>
   /// Brief description of what this does.
   /// </summary>
   /// <remarks>
   /// Detailed explanation...
   /// </remarks>
   /// <param name="parameter">Description</param>
   /// <returns>Description</returns>
   public async Task<Result> MyNewMethod(string parameter)
   {
       // Implementation
   }
   ```

2. **Add Guide if Needed**
   - User-facing feature? ? Add to `docs/guides/`
   - Design decision? ? Add to `docs/design/`
   - API reference? ? Add to `docs/api/`

3. **Update Index Files**
   - `docs/INDEX.md` - Add link if major feature
   - Section README.md - Add to appropriate section

4. **Update FEATURES.md**
   - If it's a public-facing feature

### When Fixing Bugs

1. **Check XML Comments** - Are they still accurate?
2. **Update Examples** - If bug affected usage
3. **Update Guides** - If workarounds are no longer needed

### When Making Breaking Changes

1. **Update Migration Guide**
   - Add to `docs/guides/MIGRATION.md` (create if needed)
   - Show before/after code

2. **Update Examples**
   - Ensure all examples work with new code

3. **Update API Reference**
   - Document parameter changes
   - Document return value changes

4. **Announce in CHANGELOG**
   - Add to `docs/CHANGELOG.md` (create if needed)

## — File Structure Guide

### Creating New Documentation

#### Guides (How-to documents)
**Location**: `docs/guides/TOPIC.md`
**Format**:
```markdown
# Topic Title

Brief introduction (1-2 sentences).

## Overview
What is this guide about?

## Prerequisites
What users need before starting.

## Step-by-Step
1. First step
2. Second step
3. Third step

## Common Issues
Problems and solutions.

## Next Steps
What to read next.
```

#### Design Decisions (Architecture documents)
**Location**: `docs/design/TOPIC.md`
**Format**:
```markdown
# Design Decision: Topic

## Problem
What problem does this solve?

## Solution
How we solved it.

## Rationale
Why we chose this approach.

## Trade-offs
What did we give up?

## Examples
Code examples showing the design.

## Related
Links to related documentation.
```

#### Examples (Code examples)
**Location**: `docs/examples/TOPIC.md`
**Format**:
```markdown
# Example: Topic

Brief description.

## Setup
What you need to run this.

## Code
Full working code example.

## Explanation
What each part does.

## Try It
How to test it.

## Next
What to learn next.
```

#### API Reference (Detailed API docs)
**Location**: `docs/api/category/ClassName.md`
**Format**:
```markdown
# ClassName

## Overview
What is this class?

## Usage
Common usage patterns.

## Constructors
Available constructors.

## Methods
Method: `MethodName()`
- Purpose
- Parameters
- Returns
- Exceptions
- Example

## Properties
Property: `PropertyName`
- Purpose
- Type
- Default value

## Events
Events if applicable.

## Examples
Complete working examples.
```

## — Cross-Reference Style

Use relative links:
```markdown
[See Configuration Guide](../guides/CONFIGURATION.md)
[Check ChatWidgetService](../api/services/ChatWidgetService.md)
[Read Architecture](../ARCHITECTURE.md)
```

Use code references:
```markdown
[ChatWidget class](../api/models/ChatWidget.md)
[RespondAsync method](../api/services/ChatWidgetService.md#respondAsync)
```

## — XML Comment Standards

### Class-Level Comments
```csharp
/// <summary>
/// Describes what the class does (1 line).
/// </summary>
/// <remarks>
/// Detailed explanation of:
/// - How it works
/// - When to use it
/// - Integration points
/// - Threading behavior if relevant
/// </remarks>
public class MyClass
{
}
```

### Method-Level Comments
```csharp
/// <summary>
/// Describes what the method does (1 line).
/// </summary>
/// <remarks>
/// Details about:
/// - Implementation behavior
/// - Performance characteristics
/// - Side effects
/// </remarks>
/// <param name="param1">Description of parameter</param>
/// <param name="param2">Description of parameter</param>
/// <returns>Description of return value</returns>
/// <exception cref="ArgumentNullException">When param is null</exception>
/// <example>
/// <code>
/// var result = await MyMethod(param1, param2);
/// </code>
/// </example>
public async Task<Result> MyMethod(string param1, string param2)
{
}
```

### Property Comments
```csharp
/// <summary>
/// Gets or sets the property (1 line).
/// </summary>
/// <remarks>
/// Additional details about the property.
/// Default value: xyz
/// </remarks>
public string MyProperty { get; set; }
```

## — Quality Checklist

Before committing documentation changes:

### Structure
- [ ] Markdown is valid
- [ ] Links are relative (not absolute)
- [ ] Headers are properly nested (h1, h2, h3)
- [ ] Code blocks have language specified

### Content
- [ ] Spelling and grammar checked
- [ ] Examples tested and working
- [ ] All code examples have explanations
- [ ] References to code are accurate

### Navigation
- [ ] Related links are included
- [ ] Cross-references are updated
- [ ] "Next steps" section included
- [ ] No orphaned pages

### XML Comments
- [ ] All public classes documented
- [ ] All public methods documented
- [ ] All public properties documented
- [ ] Example code is correct
- [ ] Links use proper `<see cref=""/>` syntax

## — Maintenance Tasks

### Weekly
- Fix broken links (check in PRs)
- Update examples to latest code
- Respond to documentation issues

### Monthly
- Review outdated guides
- Update statistics
- Check for inconsistencies

### Per Release
- Update version numbers
- Update changelog
- Verify all examples still work
- Review new features documentation

### Quarterly
- Full documentation review
- Check for gaps
- Update architecture diagrams
- Reorganize if needed

## — Monitoring Documentation Health

### Automated Checks
Add to CI/CD:
```yaml
# Check markdown syntax
- run: npx markdown-lint docs/**/*.md

# Check links
- run: npx markdown-link-check docs/**/*.md

# Check code examples compile
- run: dotnet build-example-docs
```

### Manual Checks
- [ ] Can new users follow getting started?
- [ ] Do all links work?
- [ ] Are examples accurate?
- [ ] Is formatting consistent?
- [ ] Is terminology consistent?

## — Documentation Metrics

Track:
- Number of documentation pages
- Number of code examples
- Documentation coverage (%)
- Average page length
- User feedback/issues

## — Contributing Documentation

### For Maintainers
1. Create feature branch: `docs/topic-name`
2. Write/update documentation
3. Test all links
4. Submit PR with clear description
5. Wait for review before merging

### For Community
1. Fork repository
2. Create branch: `docs/your-topic`
3. Add/update documentation
4. Test all links and examples
5. Submit PR with description
6. Be ready to revise based on feedback

## — Documentation Deployment

### Local Preview
```bash
# Install mkdocs if needed
pip install mkdocs mkdocs-material

# Run local server
mkdocs serve

# View at http://localhost:8000
```

### GitHub Pages
- Automatically published from `/docs`
- Configure in repository settings
- URL: `https://username.github.io/bbq-chatwidgets`

### Publishing to Other Platforms
- DocFX for .NET ecosystem
- Sphinx for Python ecosystem
- Jekyll for GitHub Pages

## — Common Tasks

### "How do I add a new guide?"
1. Create `docs/guides/TOPIC.md`
2. Copy template from above
3. Fill in content
4. Add link to `docs/guides/README.md`
5. Add link to `docs/INDEX.md` if major

### "How do I fix a broken link?"
1. Find broken link
2. Update relative path
3. Test locally
4. Commit with message: `docs: fix broken link to TOPIC`

### "How do I update an example?"
1. Update the example code
2. Verify it works
3. Update explanation if needed
4. Commit with message: `docs: update TOPIC example`

### "How do I document a new method?"
1. Add XML comments to method in source
2. If user-facing, add to appropriate guide
3. If significant API addition, update API reference
4. Update example if needed

### "How do I deprecate documentation?"
1. Mark as deprecated in content
2. Link to replacement
3. Keep for 2-3 releases
4. Remove after migration period

## — Getting Help

- **Questions?** Open GitHub issue with label `documentation`
- **Want to help?** See `docs/contributing/DOCUMENTATION.md`
- **Found an error?** Submit PR with fix
- **Have suggestions?** Open GitHub discussion

## — Related Documents

- `docs/INDEX.md` - Documentation overview
- `docs/contributing/DOCUMENTATION.md` - Documentation standards
- `.github/CONTRIBUTING.md` - General contribution guidelines
- `README.md` - Project README

---

**Remember**: Good documentation is as important as good code!

Last Updated: 2024
