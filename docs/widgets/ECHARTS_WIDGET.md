This widget documentation has been consolidated into the new documentation structure.

See `docs/guides/` for examples and guidance on custom widgets.
# ECharts Widget (concise)

Overview: The server-side renderer outputs an inert container element that holds chart data and an action identifier. The client (React) initializes the ECharts instance at runtime.

Server contract:
- Emit a container element with `data-chart-data` (an escaped JSON string) and `data-action` (widget action id).
- Do not initialize the chart on the server — the client is responsible for mounting.

Client initialization (React):
1. On mount (useEffect), select the container by id.
2. Read `container.getAttribute('data-chart-data')`, `JSON.parse` it.
3. Call `echarts.init(container).setOption(parsedJson)`.
4. Wire interactions to call the widget action endpoint (e.g., POST `/api/chat/action`) with the payload.

Notes:
- Ensure the server escapes JSON placed into attributes to avoid injection.
- See `Sample/WebApp/ClientApp/src/widgets/echartsRenderer.ts` for the renderer implementation.
