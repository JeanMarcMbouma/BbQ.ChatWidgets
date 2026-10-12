import { useEffect, useRef, useState } from "react";
import { WidgetManager } from "@bbq-chat/widgets";
import { EXAMPLES } from "./examples";

export function Playground() {
  const [selected, setSelected] = useState(EXAMPLES[0]);
  const [result, setResult] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [reset, setReset] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const json = JSON.stringify(
    selected.widgets.map((widget) => widget.toObject()),
    null,
    2,
  );

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const manager = new WidgetManager({
      container: element,
      actionHandler: {
        handle: async (action, payload: Record<string, unknown>) =>
          setResult(selected.result(action, payload)),
      },
    });
    manager.renderInto(element, selected.widgets);
    return () => manager.detachHandlers(element);
  }, [selected, reset]);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("Copied widget JSON");
    } catch {
      setShowJson(true);
      setCopyStatus("Select the JSON below to copy it.");
    }
  }

  return (
    <section
      className="playground"
      id="playground"
      aria-labelledby="playground-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">TRY IT YOURSELF</p>
          <h2 id="playground-title">A conversation with a next step.</h2>
        </div>
        <span className="demo-badge">Local demo · no API key</span>
      </div>
      <div className="playground-layout">
        <div className="example-list" aria-label="Choose a use case">
          {EXAMPLES.map((example) => (
            <button
              key={example.id}
              aria-pressed={selected.id === example.id}
              onClick={() => {
                setSelected(example);
                setResult("");
                setCopyStatus("");
              }}
            >
              <span>{example.category}</span>
              <strong>{example.title}</strong>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
          <p>
            Real widgets. Sample responses.
            <br />
            Nothing is sent or saved.
          </p>
        </div>
        <div className="conversation-preview">
          <div className="preview-heading">
            <span>
              <span className="status-dot" /> Interactive preview
            </span>
            <button
              onClick={() => {
                setResult("");
                setReset((value) => value + 1);
              }}
            >
              Reset
            </button>
          </div>
          <div className="preview-user">{selected.prompt}</div>
          <div className="preview-assistant">
            <span className="assistant-mark" aria-hidden="true">
              B
            </span>
            <div>
              <p>{selected.reply}</p>
              <div ref={container} className="preview-widgets" />
            </div>
          </div>
          <div
            role="status"
            className={result ? "action-result visible" : "action-result"}
          >
            {result || "Interact with a widget to see its action result."}
          </div>
          <div className="preview-toolbar">
            <button
              aria-expanded={showJson}
              onClick={() => setShowJson((value) => !value)}
            >
              {showJson ? "Hide" : "View"} widget JSON
            </button>
            <button onClick={copyJson}>Copy JSON</button>
            <span role="status">{copyStatus}</span>
          </div>
          {showJson && (
            <pre className="widget-json">
              <code>{json}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
