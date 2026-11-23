/** Widget extensions may supply arbitrary payloads. Keep the established callback and JSON types compatible. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- widget-specific payloads are defined by the host
export type WidgetPayload = any;
