import { useId, useRef, useState } from "react";
import type { FormField } from "@bbq-chat/widgets";
import type {
  FormFieldProps,
  WidgetProps,
  CustomWidgetComponent,
} from "./types.js";
import { useWidgetServices } from "./services.js";

const aliases: Record<string, string> = {
  select: "dropdown",
  checkbox: "toggle",
  radio: "toggle",
  date: "datepicker",
  file: "fileupload",
};
function initial(field: FormField): unknown {
  return (
    field.defaultValue ??
    (field.type === "multiselect"
      ? []
      : ["toggle", "checkbox", "radio"].includes(field.type)
        ? false
        : field.type === "slider"
          ? (field.min ?? 0)
          : field.type === "themeswitcher"
            ? (field.themes?.[0] ?? "")
            : "")
  );
}
/** Shared native field implementation; applications can replace individual field types through WidgetProvider. */
export function NativeFormField({
  field,
  id,
  value,
  onChange,
  disabled,
  invalid,
}: FormFieldProps) {
  const type = Object.hasOwn(aliases, field.type)
    ? aliases[field.type]
    : field.type;
  const styleType = ["text", "email", "password", "number"].includes(type)
    ? "input"
    : type;
  const standaloneClasses: Record<string, string> = {
    fileupload: "file",
    themeswitcher: "theme-switcher-select",
    toggle: "toggle-input",
  };
  const className =
    field.appearance === "form"
      ? `bbq-form-${type === "dropdown" ? "select" : styleType}`
      : `bbq-${Object.hasOwn(standaloneClasses, styleType) ? standaloneClasses[styleType] : styleType}`;
  const common = {
    id,
    name: field.name,
    disabled,
    required: field.required,
    "aria-label":
      field.hideLabel || field.showLabel === false ? field.label : undefined,
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${id}-error` : undefined,
    className,
  };
  if (type === "textarea")
    return (
      <textarea
        {...common}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        rows={field.rows ?? 3}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  if (
    type === "dropdown" ||
    type === "multiselect" ||
    type === "themeswitcher"
  ) {
    const multiple = type === "multiselect";
    return (
      <select
        {...common}
        multiple={multiple}
        value={
          multiple
            ? Array.isArray(value)
              ? value.map(String)
              : []
            : String(value ?? "")
        }
        onChange={(e) =>
          onChange(
            multiple
              ? Array.from(e.target.selectedOptions, (o) => o.value)
              : e.target.value,
          )
        }
      >
        {!multiple && <option value="">Select…</option>}
        {(type === "themeswitcher"
          ? (field.themes ?? [])
          : (field.options ?? [])
        ).map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (type === "toggle")
    return (
      <input
        {...common}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  if (type === "fileupload")
    return (
      <input
        {...common}
        type="file"
        accept={field.accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.setCustomValidity(
            file && field.maxBytes && file.size > field.maxBytes
              ? `File exceeds ${field.maxBytes} bytes`
              : "",
          );
          if (e.target.reportValidity()) onChange(file ?? null);
        }}
      />
    );
  return (
    <input
      {...common}
      type={
        type === "slider"
          ? "range"
          : type === "datepicker"
            ? "date"
            : ["email", "password", "number"].includes(type)
              ? type
              : "text"
      }
      value={String(value ?? "")}
      placeholder={field.placeholder}
      maxLength={field.maxLength}
      min={field.minDate ?? field.min}
      max={field.maxDate ?? field.max}
      step={field.step}
      onChange={(e) =>
        onChange(
          type === "slider" || type === "number"
            ? e.target.value === ""
              ? ""
              : Number(e.target.value)
            : e.target.value,
        )
      }
    />
  );
}
function Control({ widget, onWidgetAction, disabled }: WidgetProps) {
  const id = useId();
  const field: FormField = { ...widget, name: widget.action, required: false };
  const [value, setValue] = useState(() => initial(field));
  return (
    <div
      className={`bbq-widget bbq-${widget.type}-container${widget.type === "toggle" ? " bbq-toggle" : ""}`}
      data-widget-type={widget.type}
    >
      {!widget.hideLabel && widget.showLabel !== false && (
        <label
          className={`bbq-${widget.type === "fileupload" ? "file" : widget.type}-label`}
          htmlFor={id}
        >
          {widget.label}
        </label>
      )}
      <NativeFormField
        field={field}
        id={id}
        value={value}
        disabled={Boolean(disabled)}
        invalid={false}
        onChange={(next) => {
          setValue(next);
          const key =
            (
              {
                toggle: "checked",
                multiselect: "items",
                datepicker: "date",
                themeswitcher: "theme",
                fileupload: "file",
              } as Record<string, string>
            )[widget.type] ?? "value";
          onWidgetAction?.(widget.action, { [key]: next });
        }}
      />
    </div>
  );
}
export const InputWidgetComponent = Control;
export const TextAreaWidgetComponent = Control;
export const DropdownWidgetComponent = Control;
export const SliderWidgetComponent = Control;
export const ToggleWidgetComponent = Control;
export const FileUploadWidgetComponent = Control;
export const ThemeSwitcherWidgetComponent = Control;
export const DatePickerWidgetComponent = Control;
export const MultiSelectWidgetComponent = Control;
export function ButtonWidgetComponent({
  widget,
  onWidgetAction,
  disabled,
}: WidgetProps) {
  return (
    <button
      type="button"
      className="bbq-button"
      disabled={disabled}
      onClick={() => onWidgetAction?.(widget.action, {})}
    >
      {widget.label}
    </button>
  );
}
function imageUrl(value?: string) {
  return value &&
    !/^(?:javascript|vbscript|data):/i.test(
      value.replace(/[\u0000-\u0020]/g, ""),
    )
    ? value
    : undefined;
}
export function ImageWidgetComponent({ widget }: WidgetProps) {
  return (
    <img
      className="bbq-image"
      src={imageUrl(widget.imageUrl)}
      alt={widget.alt ?? widget.label}
      width={widget.width}
      height={widget.height}
      loading="lazy"
    />
  );
}
export function CardWidgetComponent({
  widget,
  onWidgetAction,
  disabled,
}: WidgetProps) {
  return (
    <article className="bbq-widget bbq-card">
      {widget.imageUrl && (
        <img
          className="bbq-card-image"
          src={imageUrl(widget.imageUrl)}
          alt={widget.title ?? widget.label}
          loading="lazy"
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: 200,
            objectFit: "cover",
          }}
        />
      )}
      <h3 className="bbq-card-title">{widget.title}</h3>
      {widget.description && (
        <p className="bbq-card-description">{widget.description}</p>
      )}
      <ButtonWidgetComponent
        widget={widget}
        onWidgetAction={onWidgetAction}
        disabled={disabled}
      />
    </article>
  );
}
export function ImageCollectionWidgetComponent({
  widget,
  onWidgetAction,
  disabled,
}: WidgetProps) {
  return (
    <div className="bbq-widget bbq-image-collection" aria-label={widget.label}>
      <div className="bbq-image-collection-grid">
        {widget.images?.map((item, index) => {
          const image = (
            <ImageWidgetComponent
              widget={{ ...widget, ...item, type: "image" }}
            />
          );
          return item.action ? (
            <button
              className="bbq-image-collection-item"
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onWidgetAction?.(item.action!, {})}
            >
              {image}
            </button>
          ) : (
            <span className="bbq-image-collection-item" key={index}>
              {image}
            </span>
          );
        })}
      </div>
    </div>
  );
}
export function ProgressBarWidgetComponent({ widget }: WidgetProps) {
  const max = widget.max && widget.max > 0 ? widget.max : 100;
  const value = Math.min(max, Math.max(0, widget.value ?? 0));
  return (
    <label className="bbq-widget bbq-progress-bar">
      {widget.label}
      <progress className="bbq-progress-bar-element" value={value} max={max} />
      <span className="bbq-progress-bar-value" aria-live="polite">
        {Math.floor((value * 100) / max)}%
      </span>
    </label>
  );
}
export function FormWidgetComponent({
  widget,
  onWidgetAction,
  onValidationState,
  disabled,
}: WidgetProps) {
  const id = useId();
  const { validation, fieldComponents } = useWidgetServices();
  const fields = widget.fields ?? [];
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, initial(field)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  return (
    <form
      className="bbq-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled || submittedRef.current) return;
        const nextErrors: Record<string, string> = Object.create(null);
        for (const field of fields) {
          const value = values[field.name] ?? initial(field);
          if (
            field.required &&
            (value === "" ||
              value == null ||
              value === false ||
              (Array.isArray(value) && !value.length))
          )
            nextErrors[field.name] =
              field.validationHint ?? "This field is required";
        }
        for (const element of Array.from(event.currentTarget.elements)) {
          if (
            "validity" in element &&
            !(element as HTMLInputElement).validity.valid
          ) {
            const input = element as HTMLInputElement;
            nextErrors[input.name] ??= input.validationMessage;
          }
        }
        setErrors(nextErrors);
        const valid = Object.keys(nextErrors).length === 0;
        const validationEvent = {
          formId: widget.instanceId ?? widget.action,
          valid,
          errors: Object.entries(nextErrors).map(([field, reason]) => ({
            field,
            reason,
          })),
        };
        validation.emit(validationEvent);
        onValidationState?.(validationEvent);
        if (valid) {
          submittedRef.current = true;
          setSubmitted(true);
          onWidgetAction?.(
            widget.action,
            Object.fromEntries(
              fields.map((field) => [
                field.name,
                values[field.name] ?? initial(field),
              ]),
            ),
          );
        }
      }}
    >
      <h3 className="bbq-form-title">{widget.title ?? widget.label}</h3>
      {fields.map((field, index) => {
        const fieldId = `${id}-${index}`;
        const Component = Object.hasOwn(fieldComponents, field.type)
          ? fieldComponents[field.type]
          : NativeFormField;
        return (
          <div key={field.name} className="bbq-form-field">
            <label className="bbq-form-field-label" htmlFor={fieldId}>
              {field.label}
              {field.required && (
                <span className="bbq-form-required" aria-hidden="true">
                  {" "}
                  *
                </span>
              )}
            </label>
            <Component
              field={{ ...field, appearance: "form" }}
              id={fieldId}
              value={
                Object.hasOwn(values, field.name)
                  ? values[field.name]
                  : initial(field)
              }
              disabled={Boolean(disabled || submitted)}
              invalid={Boolean(
                Object.hasOwn(errors, field.name) && errors[field.name],
              )}
              onChange={(value) =>
                setValues((previous) => ({ ...previous, [field.name]: value }))
              }
            />
            {Object.hasOwn(errors, field.name) && errors[field.name] && (
              <span
                className="bbq-form-validation-message"
                role="alert"
                id={`${fieldId}-error`}
              >
                {errors[field.name]}
              </span>
            )}
          </div>
        );
      })}
      <div className="bbq-form-actions">
        {(widget.actions ?? [{ type: "submit", label: "Submit" }]).map(
          (action, index) => (
            <button
              key={index}
              className={`bbq-form-button bbq-form-${action.type}`}
              type={action.type === "submit" ? "submit" : "button"}
              disabled={disabled || submitted}
              onClick={
                action.type === "submit"
                  ? undefined
                  : () =>
                      onWidgetAction?.(widget.action, {
                        actionType: action.type,
                      })
              }
            >
              {action.label}
            </button>
          ),
        )}
      </div>
    </form>
  );
}
export const BUILT_IN_WIDGET_COMPONENTS: Readonly<
  Record<string, CustomWidgetComponent>
> = Object.freeze({
  button: ButtonWidgetComponent,
  card: CardWidgetComponent,
  input: InputWidgetComponent,
  textarea: TextAreaWidgetComponent,
  dropdown: DropdownWidgetComponent,
  slider: SliderWidgetComponent,
  toggle: ToggleWidgetComponent,
  fileupload: FileUploadWidgetComponent,
  themeswitcher: ThemeSwitcherWidgetComponent,
  datepicker: DatePickerWidgetComponent,
  multiselect: MultiSelectWidgetComponent,
  progressbar: ProgressBarWidgetComponent,
  form: FormWidgetComponent,
  image: ImageWidgetComponent,
  imagecollection: ImageCollectionWidgetComponent,
});
export class ReactWidgetRenderer {
  private readonly components: Map<string, CustomWidgetComponent>;
  constructor(components: Record<string, CustomWidgetComponent> = {}) {
    this.components = new Map(Object.entries(components));
  }
  getComponentType(type: string) {
    return (
      this.components.get(type) ??
      (Object.hasOwn(BUILT_IN_WIDGET_COMPONENTS, type)
        ? BUILT_IN_WIDGET_COMPONENTS[type]
        : undefined)
    );
  }
  registerComponent(type: string, component: CustomWidgetComponent) {
    this.components.set(type, component);
  }
}
export const reactWidgetRendererFactory = () => new ReactWidgetRenderer();
