using Xunit;
using BbQ.ChatWidgets.Models;
using System.Text.Json;

namespace BbQ.ChatWidgets.Tests.Models;

/// <summary>
/// Tests for FormField extensibility to support any registered widget type.
/// </summary>
public class FormFieldExtensibilityTests
{
    [Fact]
    public void FormField_CanDeserializeToInputWidget()
    {
        // Arrange
        var json = """
            {
                "name": "email",
                "label": "Email Address",
                "type": "input",
                "required": true,
                "validationHint": "Enter a valid email",
                "placeholder": "user@example.com",
                "maxLength": 100
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("email", field.Name);
        Assert.Equal("Email Address", field.Label);
        Assert.Equal("input", field.Type);
        Assert.True(field.Required);
        Assert.Equal("Enter a valid email", field.ValidationHint);
        
        Assert.NotNull(widget);
        Assert.IsType<InputWidget>(widget);
        var inputWidget = (InputWidget)widget;
        Assert.Equal("user@example.com", inputWidget.Placeholder);
        Assert.Equal(100, inputWidget.MaxLength);
    }

    [Fact]
    public void FormField_CanDeserializeToDropdownWidget()
    {
        // Arrange
        var json = """
            {
                "name": "size",
                "label": "Select Size",
                "type": "dropdown",
                "required": true,
                "options": ["Small", "Medium", "Large", "X-Large"]
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("size", field.Name);
        Assert.Equal("Select Size", field.Label);
        Assert.Equal("dropdown", field.Type);
        Assert.True(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<DropdownWidget>(widget);
        var dropdownWidget = (DropdownWidget)widget;
        Assert.Equal(4, dropdownWidget.Options.Count);
        Assert.Contains("Medium", dropdownWidget.Options);
    }

    [Fact]
    public void FormField_CanDeserializeToSliderWidget()
    {
        // Arrange
        var json = """
            {
                "name": "volume",
                "label": "Volume Level",
                "type": "slider",
                "required": false,
                "min": 0,
                "max": 100,
                "step": 5,
                "default": 50
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("volume", field.Name);
        Assert.Equal("Volume Level", field.Label);
        Assert.Equal("slider", field.Type);
        Assert.False(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<SliderWidget>(widget);
        var sliderWidget = (SliderWidget)widget;
        Assert.Equal(0, sliderWidget.Min);
        Assert.Equal(100, sliderWidget.Max);
        Assert.Equal(5, sliderWidget.Step);
        Assert.Equal(50, sliderWidget.Default);
    }

    [Fact]
    public void FormField_CanDeserializeToToggleWidget()
    {
        // Arrange
        var json = """
            {
                "name": "notifications",
                "label": "Enable Notifications",
                "type": "toggle",
                "required": false,
                "defaultValue": true
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("notifications", field.Name);
        Assert.Equal("Enable Notifications", field.Label);
        Assert.Equal("toggle", field.Type);
        Assert.False(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<ToggleWidget>(widget);
        var toggleWidget = (ToggleWidget)widget;
        Assert.True(toggleWidget.DefaultValue);
    }

    [Fact]
    public void FormField_CanDeserializeToDatePickerWidget()
    {
        // Arrange
        var json = """
            {
                "name": "birthdate",
                "label": "Date of Birth",
                "type": "datepicker",
                "required": true,
                "validationHint": "Must be at least 18 years old",
                "minDate": "1900-01-01",
                "maxDate": "2006-12-31"
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("birthdate", field.Name);
        Assert.Equal("Date of Birth", field.Label);
        Assert.Equal("datepicker", field.Type);
        Assert.True(field.Required);
        Assert.Equal("Must be at least 18 years old", field.ValidationHint);
        
        Assert.NotNull(widget);
        Assert.IsType<DatePickerWidget>(widget);
        var datePickerWidget = (DatePickerWidget)widget;
        Assert.Equal("1900-01-01", datePickerWidget.MinDate);
        Assert.Equal("2006-12-31", datePickerWidget.MaxDate);
    }

    [Fact]
    public void FormField_CanDeserializeToFileUploadWidget()
    {
        // Arrange
        var json = """
            {
                "name": "resume",
                "label": "Upload Resume",
                "type": "fileupload",
                "required": true,
                "accept": ".pdf,.doc,.docx",
                "maxBytes": 5000000
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("resume", field.Name);
        Assert.Equal("Upload Resume", field.Label);
        Assert.Equal("fileupload", field.Type);
        Assert.True(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<FileUploadWidget>(widget);
        var fileUploadWidget = (FileUploadWidget)widget;
        Assert.Equal(".pdf,.doc,.docx", fileUploadWidget.Accept);
        Assert.Equal(5000000, fileUploadWidget.MaxBytes);
    }

    [Fact]
    public void FormField_CanDeserializeToMultiSelectWidget()
    {
        // Arrange
        var json = """
            {
                "name": "interests",
                "label": "Select Your Interests",
                "type": "multiselect",
                "required": false,
                "options": ["Sports", "Music", "Art", "Technology", "Travel"]
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("interests", field.Name);
        Assert.Equal("Select Your Interests", field.Label);
        Assert.Equal("multiselect", field.Type);
        Assert.False(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<MultiSelectWidget>(widget);
        var multiSelectWidget = (MultiSelectWidget)widget;
        Assert.Equal(5, multiSelectWidget.Options.Count);
        Assert.Contains("Technology", multiSelectWidget.Options);
    }

    [Fact]
    public void FormField_CanDeserializeToTextAreaWidget()
    {
        // Arrange
        var json = """
            {
                "name": "description",
                "label": "Description",
                "type": "textarea",
                "required": true,
                "placeholder": "Enter your description here...",
                "maxLength": 500,
                "rows": 5
            }
            """;

        // Act
        var field = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);
        var widget = field?.ToWidget();

        // Assert
        Assert.NotNull(field);
        Assert.Equal("description", field.Name);
        Assert.Equal("Description", field.Label);
        Assert.Equal("textarea", field.Type);
        Assert.True(field.Required);
        
        Assert.NotNull(widget);
        Assert.IsType<TextAreaWidget>(widget);
        var textAreaWidget = (TextAreaWidget)widget;
        Assert.Equal("Enter your description here...", textAreaWidget.Placeholder);
        Assert.Equal(500, textAreaWidget.MaxLength);
        Assert.Equal(5, textAreaWidget.Rows);
    }

    [Fact]
    public void FormField_PreservesExtensionDataDuringSerialization()
    {
        // Arrange
        var field = new FormField("test", "Test Field", "input", true, "Test hint");
        field.ExtensionData = new Dictionary<string, JsonElement>
        {
            ["customProp"] = JsonDocument.Parse("\"customValue\"").RootElement,
            ["numericProp"] = JsonDocument.Parse("42").RootElement
        };

        // Act
        var json = JsonSerializer.Serialize(field, Serialization.Default);
        var deserialized = JsonSerializer.Deserialize<FormField>(json, Serialization.Default);

        // Assert
        Assert.NotNull(deserialized);
        Assert.NotNull(deserialized.ExtensionData);
        Assert.Equal(2, deserialized.ExtensionData.Count);
        Assert.True(deserialized.ExtensionData.ContainsKey("customProp"));
        Assert.True(deserialized.ExtensionData.ContainsKey("numericProp"));
    }

    [Fact]
    public void FormWidget_WithExtensibleFields_SerializesAndDeserializes()
    {
        // Arrange
        var json = """
            {
                "type": "form",
                "title": "User Profile",
                "action": "save_profile",
                "fields": [
                    {
                        "name": "username",
                        "label": "Username",
                        "type": "input",
                        "required": true,
                        "maxLength": 50
                    },
                    {
                        "name": "age",
                        "label": "Age",
                        "type": "slider",
                        "required": false,
                        "min": 18,
                        "max": 100,
                        "step": 1,
                        "default": 25
                    },
                    {
                        "name": "newsletter",
                        "label": "Subscribe to Newsletter",
                        "type": "toggle",
                        "required": false,
                        "defaultValue": false
                    }
                ],
                "actions": [
                    {"type": "submit", "label": "Save"},
                    {"type": "cancel", "label": "Cancel"}
                ]
            }
            """;

        // Act
        var formWidget = JsonSerializer.Deserialize<FormWidget>(json, Serialization.Default);

        // Assert
        Assert.NotNull(formWidget);
        Assert.Equal("User Profile", formWidget.Title);
        Assert.Equal(3, formWidget.Fields.Count);

        // Verify first field (input)
        var field1 = formWidget.Fields[0];
        Assert.Equal("username", field1.Name);
        Assert.Equal("input", field1.Type);
        Assert.True(field1.Required);
        var widget1 = field1.ToWidget();
        Assert.IsType<InputWidget>(widget1);

        // Verify second field (slider)
        var field2 = formWidget.Fields[1];
        Assert.Equal("age", field2.Name);
        Assert.Equal("slider", field2.Type);
        Assert.False(field2.Required);
        var widget2 = field2.ToWidget();
        Assert.IsType<SliderWidget>(widget2);
        Assert.Equal(18, ((SliderWidget)widget2).Min);

        // Verify third field (toggle)
        var field3 = formWidget.Fields[2];
        Assert.Equal("newsletter", field3.Name);
        Assert.Equal("toggle", field3.Type);
        Assert.False(field3.Required);
        var widget3 = field3.ToWidget();
        Assert.IsType<ToggleWidget>(widget3);
        Assert.False(((ToggleWidget)widget3).DefaultValue);
    }
}
