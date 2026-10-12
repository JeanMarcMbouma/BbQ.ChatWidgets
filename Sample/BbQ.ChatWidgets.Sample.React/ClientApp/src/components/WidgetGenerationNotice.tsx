import type { ChatMessage } from '../types';

export function WidgetGenerationNotice({ outcome }: { outcome?: ChatMessage['widgetGeneration'] }) {
  if (!outcome || outcome.status === 'emitted') return null;
  const message = outcome.status === 'not_called'
    ? 'No widget was generated: the model did not invoke the widget tool. Check provider tool-choice support and function invocation middleware.'
    : outcome.status === 'rejected'
      ? 'The widget was rejected by validation and was not displayed.'
      : 'The model chose a text-only response; no widget was generated.';
  return <aside className="widget-generation-notice" role="status">
    <p>{message}</p>
    {outcome.diagnostics?.map((item, index) => <p key={index}><code>{item.code}</code> at <code>{item.path}</code>: {item.message}</p>)}
  </aside>;
}
