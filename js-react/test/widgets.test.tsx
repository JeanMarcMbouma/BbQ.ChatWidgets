import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../../test-fixtures/schema-first-lifecycle.json";
import {
  BUILT_IN_WIDGET_COMPONENTS,
  WidgetRenderer,
  WidgetProvider,
  WidgetRegistryService,
  FormValidationService,
  FormValidationListener,
  WidgetStreamStore,
  useWidgetStream,
  ReactSchemaFirstWidgetConsumer,
  type WidgetData,
  type WidgetStreamEvent,
  type WidgetManager,
} from "../src";

afterEach(cleanup);
const button: WidgetData = { type: "button", label: "Go", action: "go" };
const form: WidgetData = {
  type: "form",
  label: "Profile",
  action: "save",
  fields: [{ name: "name", label: "Name", type: "input", required: true }],
  actions: [
    { type: "submit", label: "Save" },
    { type: "cancel", label: "Cancel" },
  ],
};

describe("native widgets", () => {
  it.each(Object.keys(BUILT_IN_WIDGET_COMPONENTS))(
    "renders %s on the server without browser services",
    (type) => {
      const widget = {
        ...button,
        type,
        title: "Title",
        imageUrl: "/photo.png",
        options: ["A"],
        themes: ["light"],
        images: [{ imageUrl: "/photo.png", alt: "Photo" }],
        fields: form.fields,
      };
      expect(renderToString(<WidgetRenderer widgets={[widget]} />)).not.toBe(
        "",
      );
    },
  );
  it("emits button and field actions once in StrictMode", () => {
    const action = vi.fn();
    render(
      <StrictMode>
        <WidgetRenderer
          widgets={[
            button,
            { ...button, type: "input", label: "Name" },
            { ...button, type: "toggle", label: "Enabled" },
          ]}
          onWidgetAction={action}
        />
      </StrictMode>,
    );
    fireEvent.click(screen.getByText("Go"));
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Ada" },
    });
    fireEvent.click(screen.getByLabelText("Enabled"));
    expect(action.mock.calls).toEqual([
      ["go", {}],
      ["go", { value: "Ada" }],
      ["go", { checked: true }],
    ]);
  });
  it.each([
    ["dropdown", "A", { value: "A" }],
    ["datepicker", "2026-10-12", { date: "2026-10-12" }],
    ["themeswitcher", "dark", { theme: "dark" }],
    ["slider", "4", { value: 4 }],
  ])("dispatches %s payloads", (type, value, payload) => {
    const action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[
          {
            ...button,
            type,
            options: ["A"],
            themes: ["light", "dark"],
            min: 0,
            max: 10,
          },
        ]}
        onWidgetAction={action}
      />,
    );
    fireEvent.change(screen.getByLabelText("Go"), { target: { value } });
    expect(action).toHaveBeenCalledWith("go", payload);
  });
  it("dispatches file objects and multiselect arrays", () => {
    const action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[
          { ...button, type: "fileupload", label: "File" },
          {
            ...button,
            type: "multiselect",
            label: "Choices",
            options: ["A", "B"],
          },
        ]}
        onWidgetAction={action}
      />,
    );
    const file = new File(["ok"], "a.txt");
    fireEvent.change(screen.getByLabelText("File"), {
      target: { files: [file] },
    });
    const select = screen.getByLabelText("Choices") as HTMLSelectElement;
    select.options[1].selected = true;
    fireEvent.change(select);
    expect(action.mock.calls).toEqual([
      ["go", { file }],
      ["go", { items: ["B"] }],
    ]);
  });
  it("escapes labels and rejects script image URLs", () => {
    const html = renderToString(
      <WidgetRenderer
        widgets={[
          { ...button, label: "<script>bad()</script>" },
          { ...button, type: "image", imageUrl: "javascript:alert(1)" },
        ]}
      />,
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
  });
  it("treats inherited object property names as unsupported widget types", () => {
    expect(() =>
      renderToString(
        <WidgetRenderer widgets={[{ ...button, type: "constructor" }]} />,
      ),
    ).not.toThrow();
  });
  it("rejects oversized files before dispatch", () => {
    const action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[{ ...button, type: "fileupload", maxBytes: 1 }]}
        onWidgetAction={action}
      />,
    );
    fireEvent.change(screen.getByLabelText("Go"), {
      target: { files: [new File(["oversized"], "a.txt")] },
    });
    expect(action).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText("Go") as HTMLInputElement).validationMessage,
    ).toContain("1 bytes");
  });
});
describe("forms", () => {
  it("validates, reports through shared services, submits once and disables controls", () => {
    const action = vi.fn();
    const validation = new FormValidationService();
    const events = vi.fn();
    const unsubscribe = validation.subscribe(events);
    render(
      <WidgetProvider validation={validation}>
        <WidgetRenderer widgets={[form]} onWidgetAction={action} />
        <FormValidationListener formId="save" />
      </WidgetProvider>,
    );
    fireEvent.click(screen.getByText("Save"));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("required");
    expect(events.mock.calls[0][0].valid).toBe(false);
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Ada" },
    });
    fireEvent.click(screen.getByText("Save"));
    fireEvent.submit(screen.getByText("Save").closest("form")!);
    expect(action).toHaveBeenCalledExactlyOnceWith("save", { name: "Ada" });
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("Form is valid");
    unsubscribe();
  });
  it("isolates repeated action names and supports cancellation and defaults", () => {
    const action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[
          form,
          { ...form, fields: [{ ...form.fields![0], defaultValue: "Grace" }] },
        ]}
        onWidgetAction={action}
      />,
    );
    const inputs = screen.getAllByRole("textbox", {
      name: "Name",
    }) as HTMLInputElement[];
    expect(inputs[0].id).not.toBe(inputs[1].id);
    fireEvent.change(inputs[0], { target: { value: "Ada" } });
    fireEvent.click(screen.getAllByText("Save")[1]);
    fireEvent.click(screen.getAllByText("Cancel")[0]);
    expect(action.mock.calls).toEqual([
      ["save", { name: "Grace" }],
      ["save", { actionType: "cancel" }],
    ]);
  });
  it("supports custom form field components", () => {
    const action = vi.fn();
    render(
      <WidgetProvider
        fieldComponents={{
          input: (props) => (
            <input
              id={props.id}
              disabled={props.disabled}
              value={String(props.value)}
              onChange={(e) => props.onChange(e.target.value.toUpperCase())}
            />
          ),
        }}
      >
        <WidgetRenderer widgets={[form]} onWidgetAction={action} />
      </WidgetProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "ada" },
    });
    fireEvent.click(screen.getByText("Save"));
    expect(action).toHaveBeenCalledWith("save", { name: "ADA" });
  });
  it("enforces native email and numeric bounds", () => {
    const action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[
          {
            ...form,
            fields: [
              { name: "email", label: "Email", type: "email", required: true },
              {
                name: "age",
                label: "Age",
                type: "number",
                min: 18,
                required: true,
              },
            ],
          },
        ]}
        onWidgetAction={action}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Age" }), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByText("Save"));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
  it("emits local validation using the server instance ID and preserves reserved field names", () => {
    const validation = vi.fn(),
      action = vi.fn();
    render(
      <WidgetRenderer
        widgets={[
          {
            ...form,
            instanceId: "unique-form",
            fields: [
              {
                name: "__proto__",
                type: "input",
                label: "Safe name",
                required: true,
                defaultValue: "value",
              },
            ],
          },
        ]}
        onWidgetAction={action}
        onValidationState={validation}
      />,
    );
    fireEvent.click(screen.getByText("Save"));
    expect(validation).toHaveBeenCalledWith({
      formId: "unique-form",
      valid: true,
      errors: [],
    });
    expect(Object.hasOwn(action.mock.calls[0][1], "__proto__")).toBe(true);
    expect(action.mock.calls[0][1].__proto__).toBe("value");
  });
});
describe("custom renderers", () => {
  it("supports component and template overrides", () => {
    const registry = new WidgetRegistryService();
    const action = vi.fn();
    registry.registerComponent("button", (props) => (
      <button onClick={() => props.onWidgetAction?.("custom", {})}>
        Custom
      </button>
    ));
    registry.registerTemplate("template", (context) => (
      <button onClick={() => context.emitAction("template", 1)}>
        Template
      </button>
    ));
    render(
      <WidgetProvider registry={registry}>
        <WidgetRenderer
          widgets={[button, { ...button, type: "template" }]}
          onWidgetAction={action}
        />
      </WidgetProvider>,
    );
    fireEvent.click(screen.getByText("Custom"));
    fireEvent.click(screen.getByText("Template"));
    expect(action.mock.calls).toEqual([
      ["custom", {}],
      ["template", 1],
    ]);
    expect(registry.unregisterRenderer("button")).toBe(true);
    expect(registry.hasRenderer("button")).toBe(false);
  });
  it("cleans up HTML handlers and uses the latest callback", () => {
    const registry = new WidgetRegistryService();
    registry.registerHtml(
      "button",
      () => '<button data-widget-type="button" data-action="go">HTML</button>',
    );
    const first = vi.fn(),
      second = vi.fn();
    const tree = (action: typeof first) => (
      <StrictMode>
        <WidgetProvider registry={registry}>
          <WidgetRenderer widgets={[button]} onWidgetAction={action} />
        </WidgetProvider>
      </StrictMode>
    );
    const view = render(tree(first));
    fireEvent.click(screen.getByText("HTML"));
    view.rerender(tree(second));
    const element = screen.getByText("HTML");
    fireEvent.click(element);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    view.unmount();
    fireEvent.click(element);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
describe("stream reconciliation", () => {
  it("replays the cross-framework fixture without losing unrelated form state", () => {
    const resync = vi.fn();
    const store = new WidgetStreamStore(resync);
    store.consume(fixture.form as WidgetStreamEvent);
    function Stream() {
      return <WidgetRenderer widgets={useWidgetStream(store)} />;
    }
    render(<Stream />);
    const input = screen.getByRole("textbox", {
      name: "Name",
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Ada" } });
    for (const event of fixture.events)
      act(() => store.consume(event as WidgetStreamEvent));
    expect(resync).toHaveBeenCalledExactlyOnceWith("revision-gap");
    expect(screen.getByRole("textbox", { name: "Name" })).toBe(input);
    expect(input.value).toBe("Ada");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
  it("has the same manager lifecycle contract as Angular", () => {
    const manager = { updateWidget: vi.fn(), unmountWidget: vi.fn() };
    const resync = vi.fn();
    const consumer = new ReactSchemaFirstWidgetConsumer(
      manager as unknown as WidgetManager,
      undefined,
      resync,
    );
    for (const event of [fixture.form, ...fixture.events])
      consumer.consume(event as WidgetStreamEvent);
    expect(manager.updateWidget).toHaveBeenCalledTimes(4);
    expect(manager.updateWidget.mock.calls[0][2]).toBe("React");
    expect(manager.unmountWidget).toHaveBeenCalledTimes(1);
    expect(resync).toHaveBeenCalledWith("revision-gap");
  });
});
