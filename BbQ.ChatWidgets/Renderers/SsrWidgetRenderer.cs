using BbQ.ChatWidgets.Abstractions;
using BbQ.ChatWidgets.Models;
using System.Web;

namespace BbQ.ChatWidgets.Renderers
{
    /// <summary>
    /// Server-side rendering (SSR) implementation of <see cref="IChatWidgetRenderer"/> 
    /// optimized for Angular and React hydration.
    /// </summary>
    /// <remarks>
    /// This renderer generates HTML suitable for SSR with Angular/React:
    /// 
    /// **Key Features:**
    /// - Generates valid semantic HTML that hydrates cleanly
    /// - Includes data attributes for framework event binding
    /// - Adds ARIA attributes for accessibility
    /// - Properly escapes all user-provided content
    /// - Framework-agnostic markup ready for client hydration
    /// 
    /// **Integration Pattern:**
    /// 1. Backend renders HTML with this renderer
    /// 2. HTML is sent to client in initial response
    /// 3. Angular/React hydrates the DOM without re-rendering
    /// 4. Event listeners attach to data attributes
    /// 
    /// **CSS Classes:**
    /// - `bbq-widget` — All widgets
    /// - `bbq-[type]` — Widget type (e.g., `bbq-button`, `bbq-card`)
    /// - `bbq-hydrated` — Added by client after hydration
    /// 
    /// **Data Attributes:**
    /// - `data-widget-id` — Unique widget identifier
    /// - `data-action` — Action to trigger on interaction
    /// - `data-widget-type` — Widget type for framework filtering
    /// </remarks>
    public sealed class SsrWidgetRenderer : IChatWidgetRenderer
    {
        /// <summary>
        /// Gets the framework name for this renderer.
        /// </summary>
        /// <value>Always returns "SSR" for server-side rendering.</value>
        public string Framework => "SSR";

        /// <summary>
        /// Renders a widget to SSR-compatible HTML markup.
        /// </summary>
        /// <remarks>
        /// The rendered HTML:
        /// - Is valid semantic HTML ready for initial page load
        /// - Includes data attributes for client framework binding
        /// - Escapes all user-provided content to prevent XSS
        /// - Works with React and Angular hydration
        /// - Does not include inline JavaScript
        /// </remarks>
        /// <param name="widget">The widget to render.</param>
        /// <returns>
        /// Safe, escaped HTML string ready for SSR.
        /// </returns>
        public string RenderWidget(ChatWidget widget) => widget switch
        {
            ButtonWidget btn => RenderButton(btn),
            CardWidget card => RenderCard(card),
            InputWidget input => RenderInput(input),
            DropdownWidget dd => RenderDropdown(dd),
            SliderWidget sl => RenderSlider(sl),
            ToggleWidget tg => RenderToggle(tg),
            FileUploadWidget fu => RenderFileUpload(fu),
            ThemeSwitcherWidget ts => RenderThemeSwitcher(ts),
            DatePickerWidget dp => RenderDatePicker(dp),
            MultiSelectWidget ms => RenderMultiSelect(ms),
            ProgressBarWidget pb => RenderProgressBar(pb),
            _ => RenderUnsupported(widget)
        };

        private static string RenderButton(ButtonWidget btn)
        {
            var action = Escape(btn.Action);
            var label = Escape(btn.Label);
            var id = GenerateId(btn.Action);

            return $@"<button 
                class=""bbq-widget bbq-button"" 
                data-widget-id=""{id}"" 
                data-widget-type=""button"" 
                data-action=""{action}"" 
                type=""button"">
                {label}
            </button>";
        }

        private static string RenderCard(CardWidget card)
        {
            var action = Escape(card.Action);
            var title = Escape(card.Title);
            var label = Escape(card.Label);
            var id = GenerateId(card.Action);

            var html = $@"<div 
                class=""bbq-widget bbq-card"" 
                data-widget-id=""{id}"" 
                data-widget-type=""card"" 
                data-action=""{action}"" 
                role=""article"">";

            html += $"<h3 class=\"bbq-card-title\">{title}</h3>";

            if (card.Description is not null)
            {
                var description = Escape(card.Description);
                html += $"<p class=\"bbq-card-description\">{description}</p>";
            }

            if (card.ImageUrl is not null)
            {
                var imageUrl = Escape(card.ImageUrl);
                var imageAlt = Escape(card.Title);
                html += $"<img class=\"bbq-card-image\" src=\"{imageUrl}\" alt=\"{imageAlt}\" loading=\"lazy\" />";
            }

            html += $@"<button 
                class=""bbq-card-action bbq-button"" 
                data-action=""{action}"" 
                type=""button"">
                {label}
            </button></div>";

            return html;
        }

        private static string RenderInput(InputWidget input)
        {
            var label = Escape(input.Label);
            var action = Escape(input.Action);
            var id = GenerateId(input.Action);
            var inputId = $"{id}-input";

            var html = $@"<div class=""bbq-widget bbq-input"" data-widget-id=""{id}"" data-widget-type=""input"">";
            html += $"<label class=\"bbq-input-label\" for=\"{inputId}\">{label}</label>";

            var placeholder = input.Placeholder is not null ? $" placeholder=\"{Escape(input.Placeholder)}\"" : "";
            var maxLength = input.MaxLength is not null ? $" maxlength=\"{input.MaxLength}\"" : "";

            html += $@"<input 
                type=""text"" 
                id=""{inputId}"" 
                class=""bbq-input-field"" 
                data-action=""{action}""{placeholder}{maxLength} 
                aria-labelledby=""{inputId}"" />";
            html += "</div>";

            return html;
        }

        private static string RenderDropdown(DropdownWidget dd)
        {
            var label = Escape(dd.Label);
            var action = Escape(dd.Action);
            var id = GenerateId(dd.Action);
            var selectId = $"{id}-select";

            var html = $@"<div class=""bbq-widget bbq-dropdown"" data-widget-id=""{id}"" data-widget-type=""dropdown"">";
            html += $"<label class=\"bbq-dropdown-label\" for=\"{selectId}\">{label}</label>";
            html += $@"<select 
                id=""{selectId}"" 
                class=""bbq-dropdown-select"" 
                data-action=""{action}"" 
                aria-labelledby=""{selectId}"">";

            foreach (var option in dd.Options)
            {
                var escapedOption = Escape(option);
                html += $"<option value=\"{escapedOption}\">{escapedOption}</option>";
            }

            html += "</select></div>";

            return html;
        }

        private static string RenderSlider(SliderWidget sl)
        {
            var label = Escape(sl.Label);
            var action = Escape(sl.Action);
            var id = GenerateId(sl.Action);
            var sliderId = $"{id}-slider";

            var html = $@"<div class=""bbq-widget bbq-slider"" data-widget-id=""{id}"" data-widget-type=""slider"">";
            html += $"<label class=\"bbq-slider-label\" for=\"{sliderId}\">{label}</label>";

            var defaultValue = sl.Default ?? sl.Min;

            html += $@"<input 
                type=""range"" 
                id=""{sliderId}"" 
                class=""bbq-slider-input"" 
                min=""{sl.Min}"" 
                max=""{sl.Max}"" 
                step=""{sl.Step}"" 
                value=""{defaultValue}"" 
                data-action=""{action}"" 
                aria-label=""{label}"" />";

            html += $"<span class=\"bbq-slider-value\" aria-live=\"polite\">{defaultValue}</span>";
            html += "</div>";

            return html;
        }

        private static string RenderToggle(ToggleWidget tg)
        {
            var label = Escape(tg.Label);
            var action = Escape(tg.Action);
            var id = GenerateId(tg.Action);
            var checkboxId = $"{id}-checkbox";
            var @checked = tg.DefaultValue ? " checked" : "";

            var html = $@"<div class=""bbq-widget bbq-toggle"" data-widget-id=""{id}"" data-widget-type=""toggle"">";
            html += $@"<label class=""bbq-toggle-label"" for=""{checkboxId}"">";
            html += $@"<input 
                type=""checkbox"" 
                id=""{checkboxId}"" 
                class=""bbq-toggle-input"" 
                data-action=""{action}""{@checked} 
                aria-label=""{label}"" />";
            html += $"<span class=\"bbq-toggle-text\">{label}</span>";
            html += "</label></div>";

            return html;
            }

        private static string RenderFileUpload(FileUploadWidget fu)
        {
            var label = Escape(fu.Label);
            var action = Escape(fu.Action);
            var id = GenerateId(fu.Action);
            var inputId = $"{id}-file";

            var html = $@"<div class=""bbq-widget bbq-file-upload"" data-widget-id=""{id}"" data-widget-type=""fileupload"">";
            html += $"<label class=\"bbq-file-label\" for=\"{inputId}\">{label}</label>";

            var accept = fu.Accept is not null ? $" accept=\"{Escape(fu.Accept)}\"" : "";
            var maxBytes = fu.MaxBytes is not null ? $" data-max-bytes=\"{fu.MaxBytes}\"" : "";

            html += $@"<input 
                type=""file"" 
                id=""{inputId}"" 
                class=""bbq-file-input"" 
                data-action=""{action}""{accept}{maxBytes} 
                aria-labelledby=""{inputId}"" />";
            html += "</div>";

            return html;
        }

        private static string RenderThemeSwitcher(ThemeSwitcherWidget ts)
        {
            var label = Escape(ts.Label);
            var action = Escape(ts.Action);
            var id = GenerateId(ts.Action);
            var selectId = $"{id}-select";

            var html = $@"<div class=""bbq-widget bbq-theme-switcher"" data-widget-id=""{id}"" data-widget-type=""themeswitcher"">";
            html += $"<label class=\"bbq-theme-switcher-label\" for=\"{selectId}\">{label}</label>";
            html += $@"<select 
                id=""{selectId}"" 
                class=""bbq-theme-switcher-select"" 
                data-action=""{action}"" 
                aria-labelledby=""{selectId}"">";

            foreach (var theme in ts.Themes)
            {
                var escapedTheme = Escape(theme);
                html += $"<option value=\"{escapedTheme}\">{escapedTheme}</option>";
            }

            html += "</select></div>";

            return html;
        }

        private static string RenderDatePicker(DatePickerWidget dp)
        {
            var label = Escape(dp.Label);
            var action = Escape(dp.Action);
            var id = GenerateId(dp.Action);
            var inputId = $"{id}-date";

            var html = $@"<div class=""bbq-widget bbq-date-picker"" data-widget-id=""{id}"" data-widget-type=""datepicker"">";
            html += $"<label class=\"bbq-date-picker-label\" for=\"{inputId}\">{label}</label>";

            var minDate = dp.MinDate is not null ? $" min=\"{Escape(dp.MinDate)}\"" : "";
            var maxDate = dp.MaxDate is not null ? $" max=\"{Escape(dp.MaxDate)}\"" : "";

            html += $@"<input 
                type=""date"" 
                id=""{inputId}"" 
                class=""bbq-date-picker-input"" 
                data-action=""{action}""{minDate}{maxDate} 
                aria-labelledby=""{inputId}"" />";

            html += "</div>";

            return html;
        }

        private static string RenderMultiSelect(MultiSelectWidget ms)
        {
            var label = Escape(ms.Label);
            var action = Escape(ms.Action);
            var id = GenerateId(ms.Action);
            var selectId = $"{id}-select";

            var html = $@"<div class=""bbq-widget bbq-multi-select"" data-widget-id=""{id}"" data-widget-type=""multiselect"">";
            html += $"<label class=\"bbq-multi-select-label\" for=\"{selectId}\">{label}</label>";
            html += $@"<select 
                id=""{selectId}"" 
                class=""bbq-multi-select-select"" 
                data-action=""{action}"" 
                multiple 
                aria-labelledby=""{selectId}"">";

            foreach (var option in ms.Options)
            {
                var escapedOption = Escape(option);
                html += $"<option value=\"{escapedOption}\">{escapedOption}</option>";
            }

            html += "</select></div>";

            return html;
        }

        private static string RenderProgressBar(ProgressBarWidget pb)
        {
            var label = Escape(pb.Label);
            var action = Escape(pb.Action);
            var id = GenerateId(pb.Action);
            var percentage = pb.Max > 0 ? (pb.Value * 100) / pb.Max : 0;

            var html = $@"<div class=""bbq-widget bbq-progress-bar"" data-widget-id=""{id}"" data-widget-type=""progressbar"">";
            html += $"<label class=\"bbq-progress-bar-label\" for=\"{id}-progress\">{label}</label>";
            html += $@"<progress 
                id=""{id}-progress"" 
                class=""bbq-progress-bar-element"" 
                value=""{pb.Value}"" 
                max=""{pb.Max}"" 
                data-action=""{action}"" 
                aria-label=""{label}"" 
                aria-valuenow=""{pb.Value}"" 
                aria-valuemin=""0"" 
                aria-valuemax=""{pb.Max}"">
                {percentage}%
            </progress>";
            html += $"<span class=\"bbq-progress-bar-value\" aria-live=\"polite\">{percentage}%</span>";
            html += "</div>";

            return html;
        }

        private static string RenderUnsupported(ChatWidget widget)
        {
            var type = Escape(widget.Type);
            return $"<div class=\"bbq-widget bbq-unsupported\" role=\"alert\">Unsupported widget type: {type}</div>";
        }

        /// <summary>
        /// Escapes HTML content to prevent XSS attacks.
        /// </summary>
        private static string Escape(string? value) => value is null ? "" : HttpUtility.HtmlEncode(value);

        /// <summary>
        /// Generates a unique ID from an action string.
        /// </summary>
        private static string GenerateId(string action)
        {
            return $"bbq-{Escape(action).Replace(" ", "-").ToLowerInvariant()}";
        }
    }
}