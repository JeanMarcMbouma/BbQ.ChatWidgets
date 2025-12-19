// Minimal JS helpers for the Blazor sample SSE demos.
// Uses EventSource for subscribe and fetch() for publish.

(function () {
  const state = {
    es: null,
  };

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  window.bbqBlazorSseWidgets = {
    ensure() {
      // no-op; exists for symmetry
    },

    connect(streamId) {
      if (state.es) {
        try { state.es.close(); } catch {}
        state.es = null;
      }

      const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
      const es = new EventSource(url);
      es.onmessage = (ev) => {
        const data = safeJsonParse(ev.data);
        if (!data) return;

        if (data.widgetId && data.html) {
          const selector = `[data-widget-id="${data.widgetId}"]`;
          const el = document.querySelector(selector);
          if (el) {
            el.innerHTML = data.html;
          }
        }
      };
      es.onerror = () => {
        // keep it simple for the sample; caller can reconnect
      };

      state.es = es;
    },

    disconnect() {
      if (!state.es) return;
      try { state.es.close(); } catch {}
      state.es = null;
    },

    async publishHtml(streamId, widgetId, html) {
      const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId, html })
      });
    }
  };
})();
