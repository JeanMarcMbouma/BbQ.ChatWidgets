// SSE clock demo helpers.

(function () {
  const state = {
    es: null,
    dotNetRef: null,
  };

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  window.bbqBlazorSseClock = {
    ensure() {
      // no-op
    },

    setDotNetRef(ref) {
      state.dotNetRef = ref;
    },

    connect(streamId) {
      if (state.es) {
        try { state.es.close(); } catch {}
        state.es = null;
      }

      const url = `/api/chat/widgets/streams/${encodeURIComponent(streamId)}/events`;
      const es = new EventSource(url);
      es.onmessage = async (ev) => {
        const data = safeJsonParse(ev.data);
        if (!data) return;

        if (data.widgetId === 'clock' && state.dotNetRef) {
          const timeIso = data.time ? String(data.time) : null;
          const timeLocal = data.timeLocal ? String(data.timeLocal) : null;
          try {
            await state.dotNetRef.invokeMethodAsync('OnClockEvent', timeIso, timeLocal);
          } catch {
            // ignore
          }
        }
      };
      es.onerror = () => {
        // ignore
      };

      state.es = es;
    },

    disconnect() {
      if (!state.es) return;
      try { state.es.close(); } catch {}
      state.es = null;
    },

    async startClock(streamId) {
      const url = `/sample/clock/${encodeURIComponent(streamId)}/start`;
      await fetch(url, { method: 'POST' });
    },

    async stopClock(streamId) {
      const url = `/sample/clock/${encodeURIComponent(streamId)}/stop`;
      await fetch(url, { method: 'POST' });
    }
  };
})();
